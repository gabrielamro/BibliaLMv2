import type { ChurchService, PrayerRequest, SavedStudy } from '../types';
import { churchManagementService, type UserCultoAssignment } from './churchManagementService';
import { cultoPlusService } from './cultoPlusService';
import { dbService } from './supabase';

export type KingdomPathStudy = Pick<SavedStudy, 'id' | 'title' | 'description' | 'coverUrl' | 'updatedAt' | 'createdAt'>;

export type KingdomPathData = {
  nextService: ChurchService | null;
  prayerInvitation: PrayerRequest | null;
  savedStudy: KingdomPathStudy | null;
  scaleInvitation: UserCultoAssignment | null;
  hasPartialFailure: boolean;
};

const EMPTY_PATH: KingdomPathData = {
  nextService: null,
  prayerInvitation: null,
  savedStudy: null,
  scaleInvitation: null,
  hasPartialFailure: false,
};

const fulfilled = <T,>(result: PromiseSettledResult<T>, fallback: T): T => (
  result.status === 'fulfilled' ? result.value : fallback
);

const studyTimestamp = (study: KingdomPathStudy) => new Date(study.updatedAt || study.createdAt || 0).getTime();

export const kingdomPathService = {
  load: async ({ userId, churchId }: { userId?: string | null; churchId?: string | null }): Promise<KingdomPathData> => {
    if (!userId) return EMPTY_PATH;

    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 45);

    const results = await Promise.allSettled([
      churchId
        ? cultoPlusService.getServicesByChurchRange(churchId, {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            status: ['published', 'checkin_open', 'live', 'in_progress'],
            limit: 4,
          })
        : Promise.resolve([] as ChurchService[]),
      churchId
        ? churchManagementService.listUserCultoAssignments(churchId, userId, 12)
        : Promise.resolve([] as UserCultoAssignment[]),
      churchId
        ? dbService.getLatestCommunityPrayer(churchId)
        : Promise.resolve(null),
      dbService.getAll(userId, 'studies'),
      dbService.getAll(userId, 'public_studies'),
    ] as const);

    const services = fulfilled(results[0], [] as ChurchService[]);
    const assignments = fulfilled(results[1], [] as UserCultoAssignment[]);
    const prayerInvitation = fulfilled(results[2], null as PrayerRequest | null);
    const privateStudies = fulfilled(results[3], [] as SavedStudy[]);
    const publicStudies = fulfilled(results[4], [] as SavedStudy[]);
    const studies = [...privateStudies, ...publicStudies]
      .filter((study, index, items) => items.findIndex((candidate) => candidate.id === study.id) === index)
      .sort((a, b) => studyTimestamp(b) - studyTimestamp(a));
    const pendingScale = assignments.find((item) => item.assignment.status === 'pending');
    const acceptedScale = assignments.find((item) => item.assignment.status === 'accepted');

    return {
      nextService: services[0] ?? null,
      prayerInvitation,
      savedStudy: studies[0] ?? null,
      scaleInvitation: pendingScale ?? acceptedScale ?? null,
      hasPartialFailure: results.some((result) => result.status === 'rejected'),
    };
  },
};
