import { churchManagementService, type UserChurchMembership, type UserCultoAssignment } from './churchManagementService';
import type { ChurchFormSubmission, ChurchServiceTeam } from '../types';

export type PersonalScaleGroup = 'pending' | 'upcoming' | 'history';
export type PersonalScaleFilter = 'all' | PersonalScaleGroup;

export type PersonalScalesSnapshot = {
  membership: UserChurchMembership | null;
  assignments: UserCultoAssignment[];
  teams: ChurchServiceTeam[];
  volunteerRequests: ChurchFormSubmission[];
};

const ASSIGNMENT_LIMIT = 48;
const VOLUNTEER_REQUEST_LIMIT = 30;

/**
 * Uma escala continua sendo "próxima" por algumas horas depois do início para que
 * quem está servindo naquele momento não perca a referência do compromisso.
 */
const RECENT_TOLERANCE_MS = 12 * 60 * 60 * 1000;

const GROUP_ORDER: Record<PersonalScaleGroup, number> = { pending: 0, upcoming: 1, history: 2 };

export const getPersonalScaleDate = (item: UserCultoAssignment): string =>
  item.assignment.startsAt || item.service?.startsAt || item.assignment.createdAt;

const getPersonalScaleTime = (item: UserCultoAssignment): number => {
  const time = new Date(getPersonalScaleDate(item)).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
};

export const getPersonalScaleGroup = (item: UserCultoAssignment, reference = Date.now()): PersonalScaleGroup => {
  if (item.assignment.status === 'pending') return 'pending';
  const time = getPersonalScaleTime(item);
  if (!Number.isFinite(time)) return 'upcoming';
  return time >= reference - RECENT_TOLERANCE_MS ? 'upcoming' : 'history';
};

/**
 * Ordenação da página: convites pendentes primeiro, próximas escalas por
 * proximidade e histórico por data decrescente.
 */
export const sortPersonalScales = (items: UserCultoAssignment[], reference = Date.now()): UserCultoAssignment[] =>
  [...items].sort((a, b) => {
    const groupA = getPersonalScaleGroup(a, reference);
    const groupB = getPersonalScaleGroup(b, reference);
    if (groupA !== groupB) return GROUP_ORDER[groupA] - GROUP_ORDER[groupB];
    const timeA = getPersonalScaleTime(a);
    const timeB = getPersonalScaleTime(b);
    if (timeA === timeB) return 0;
    return groupA === 'history' ? timeB - timeA : timeA - timeB;
  });

export const groupPersonalScales = (
  items: UserCultoAssignment[],
  reference = Date.now(),
): Record<PersonalScaleGroup, UserCultoAssignment[]> => {
  const grouped: Record<PersonalScaleGroup, UserCultoAssignment[]> = { pending: [], upcoming: [], history: [] };
  for (const item of sortPersonalScales(items, reference)) {
    grouped[getPersonalScaleGroup(item, reference)].push(item);
  }
  return grouped;
};

export const filterPersonalScales = (
  items: UserCultoAssignment[],
  filter: PersonalScaleFilter,
  reference = Date.now(),
): UserCultoAssignment[] => {
  const sorted = sortPersonalScales(items, reference);
  if (filter === 'all') return sorted;
  return sorted.filter((item) => getPersonalScaleGroup(item, reference) === filter);
};

export const replacePersonalScale = (
  items: UserCultoAssignment[],
  updated: UserCultoAssignment,
): UserCultoAssignment[] => items.map((item) => (item.assignment.id === updated.assignment.id ? updated : item));

export const personalScalesService = {
  /**
   * Carregador dedicado da operação pessoal de escalas. A página de escalas não
   * deve carregar journals/check-ins e a página de memória não deve carregar escalas.
   */
  loadPersonalScales: async (
    userId: string,
    fallbackMembership?: UserChurchMembership | null,
  ): Promise<PersonalScalesSnapshot> => {
    const empty: PersonalScalesSnapshot = { membership: null, assignments: [], teams: [], volunteerRequests: [] };
    if (!userId) return empty;

    const persistedMembership = await churchManagementService.getUserChurchMembership(userId);
    const membership = persistedMembership ?? fallbackMembership ?? null;
    const churchId = membership?.churchId;

    const [assignments, teams, submissions] = await Promise.all([
      churchId ? churchManagementService.listUserCultoAssignments(churchId, userId, ASSIGNMENT_LIMIT) : Promise.resolve([]),
      churchId ? churchManagementService.listUserTeams(churchId, userId) : Promise.resolve([]),
      churchManagementService.listMemberSubmissions(userId, { limit: VOLUNTEER_REQUEST_LIMIT }),
    ]);

    return {
      membership,
      assignments,
      teams,
      volunteerRequests: submissions.filter((submission) => submission.formType === 'volunteer'),
    };
  },
};
