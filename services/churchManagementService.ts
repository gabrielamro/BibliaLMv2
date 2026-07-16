import { supabase } from './supabase';
import { formatSupabaseError } from '../utils/supabaseErrors';
import { churchNotificationService } from './churchNotificationService';
import { cultoPlusService } from './cultoPlusService';
import { getNotificationStatePatch, getQrSubmissionRouting } from '../utils/churchManagementRules';
import {
  ChurchAssignment,
  ChurchAssignmentStatus,
  ChurchFormSubmission,
  ChurchGroup,
  ChurchManagementNotification,
  ChurchManagerAlert,
  ChurchManagementSettings,
  ChurchManagementStatus,
  ChurchManagementSummary,
  ChurchMemberRole,
  ChurchOperationalRole,
  ChurchQrForm,
  ChurchQrFormField,
  ChurchQrFormStatus,
  ChurchQrFormType,
  ChurchRoleScopeType,
  ChurchService,
  ChurchParticipationLog,
  ChurchParticipationStatus,
  ChurchServiceTeam,
  ChurchServiceInvite,
  ChurchServiceInviteStatus,
  ChurchServiceScaleSlot,
  ChurchScaleSlotStatus,
  ServicePrayerRequest,
  ServiceScheduleAssignment,
  ChurchSubmissionPriority,
  ChurchSubmissionStatus,
  ChurchTeamFunction,
  ChurchTeamFunctionStatus,
  ChurchVolunteerBadge,
  UserProfile,
} from '../types';
import { buildChurchManagerAlerts } from '../utils/churchManagerAlerts';

type PageOptions = {
  limit?: number;
  offset?: number;
};

type ListSubmissionsOptions = PageOptions & {
  status?: ChurchSubmissionStatus;
  assignedTo?: string;
  submitterUserId?: string;
};

type ListAssignmentsOptions = PageOptions & {
  status?: ChurchAssignmentStatus;
  assigneeUserId?: string;
  teamId?: string;
  scopeType?: ChurchRoleScopeType;
  scopeId?: string;
};

export type ChurchCultoOperationalItem = {
  service: ChurchService;
  checkinsCount: number;
  prayersCount: number;
  schedulesCount: number;
  pendingSchedulesCount: number;
  schedules: ServiceScheduleAssignment[];
  assignments: ChurchAssignment[];
};

export type ChurchGroupOperationalItem = {
  group: ChurchGroup;
  pendingInvitesCount: number;
};

export type ChurchCultoSyncResult = {
  servicesChecked: number;
  assignmentsCreated: number;
  assignmentsUpdated: number;
  submissionsCreated: number;
  submissionsUpdated: number;
};

export type ChurchTeamParticipant = {
  userId: string;
  displayName: string;
  photoURL?: string | null;
  role?: ChurchOperationalRole | 'team_leader';
};

export type ChurchTeamServiceApprovalResult = {
  teamAssignment: ChurchAssignment;
  memberAssignments: ChurchAssignment[];
  schedulesCreated: number;
  participantsNotified: number;
};

export type UserCultoAssignment = {
  assignment: ChurchAssignment;
  service: ChurchService | null;
  team: ChurchServiceTeam | null;
};

export type ChurchGroupFollowUpResult = {
  groupsChecked: number;
  pendingInvites: number;
  notificationsCreated: number;
};

const now = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const makeToken = (title: string) =>
  `${title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${Math.random().toString(36).slice(2, 8)}`;
const createOperationalNotification = churchNotificationService.createOperationalNotification;
const ASSIGNMENT_SELECT = 'id, church_id, team_id, title, description, assignee_user_id, leader_user_id, scope_type, scope_id, status, requires_acceptance, starts_at, ends_at, public_feedback, created_by, source_type, source_id, accepted_at, declined_at, created_at, updated_at';

const buildTeamServiceSourceId = (serviceId: string, teamId: string) => `culto_team:${serviceId}:${teamId}`;
const buildTeamMemberServiceSourceId = (serviceId: string, teamId: string, ministryId: string, userId: string) =>
  `culto_team_member:${serviceId}:${teamId}:${ministryId}:${userId}`;

const parseTeamServiceSourceId = (sourceId?: string | null) => {
  const match = sourceId?.match(/^culto_team:([^:]+):([0-9a-f-]+)$/i);
  return match ? { serviceId: match[1], teamId: match[2] } : null;
};

const parseTeamMemberServiceSourceId = (sourceId?: string | null) => {
  const match = sourceId?.match(/^culto_team_member:([^:]+):([0-9a-f-]+):([^:]+):([0-9a-f-]+)$/i);
  return match ? { serviceId: match[1], teamId: match[2], ministryId: match[3], userId: match[4] } : null;
};

const getCultoAssignmentServiceId = (assignment: ChurchAssignment) => {
  if (assignment.scopeType === 'service' && assignment.scopeId) return assignment.scopeId;
  if (assignment.sourceType === 'gestao_culto_team') return parseTeamServiceSourceId(assignment.sourceId)?.serviceId ?? null;
  if (assignment.sourceType === 'gestao_culto_member') return parseTeamMemberServiceSourceId(assignment.sourceId)?.serviceId ?? null;
  return null;
};

const getAssignmentWindow = (assignment: Pick<ChurchAssignment, 'startsAt' | 'endsAt'>) => {
  if (!assignment.startsAt) return null;
  const start = new Date(assignment.startsAt).getTime();
  if (!Number.isFinite(start)) return null;
  const end = assignment.endsAt ? new Date(assignment.endsAt).getTime() : start + (2 * 60 * 60 * 1000);
  return { start, end: Number.isFinite(end) ? end : start + (2 * 60 * 60 * 1000) };
};

const assignmentWindowsOverlap = (a: Pick<ChurchAssignment, 'startsAt' | 'endsAt'>, b: Pick<ChurchAssignment, 'startsAt' | 'endsAt'>) => {
  const first = getAssignmentWindow(a);
  const second = getAssignmentWindow(b);
  if (!first || !second) return false;
  return first.start < second.end && second.start < first.end;
};

const findAcceptedAssignmentConflict = async (assignment: ChurchAssignment, userId: string) => {
  if (!assignment.startsAt) return null;
  const { data, error } = await supabase
    .from('church_assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('church_id', assignment.churchId)
    .eq('assignee_user_id', userId)
    .eq('status', 'accepted')
    .neq('id', assignment.id);
  if (error) throw error;
  return (data ?? []).map(mapAssignment).find((item) => assignmentWindowsOverlap(assignment, item)) ?? null;
};

const isMissingChurchManagementSchema = (error: any) => {
  const message = formatSupabaseError(error).toLowerCase();
  return (
    error?.code === 'PGRST205' ||
    error?.code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('church_member_roles') ||
    message.includes('church_service_teams') ||
    message.includes('church_assignments') ||
    message.includes('church_team_functions') ||
    message.includes('church_service_scale_slots') ||
    message.includes('church_service_invites') ||
    message.includes('church_participation_logs') ||
    message.includes('church_qr_forms') ||
    message.includes('church_form_submissions') ||
    message.includes('source_type') ||
    message.includes('source_id') ||
    message.includes('church_management_notifications') ||
    message.includes('church_management_settings') ||
    message.includes('church_analytics_snapshots') ||
    message.includes('church_volunteer_badges') ||
    message.includes('church_services') ||
    message.includes('service_ministries') ||
    message.includes('service_ministry_members') ||
    message.includes('service_schedule_assignments') ||
    message.includes('group_access_invites') ||
    message.includes('cells') ||
    message.includes('failed to fetch') ||
    message.includes('fetch failed') ||
    message.includes('getaddrinfo')
  );
};

const rangeQuery = <T extends { range: (from: number, to: number) => T; limit: (count: number) => T }>(
  query: T,
  options?: PageOptions
) => {
  if (typeof options?.offset === 'number') {
    const limit = options.limit ?? 25;
    return query.range(options.offset, options.offset + limit - 1);
  }
  return query.limit(options?.limit ?? 25);
};

const mapRole = (row: any): ChurchMemberRole => ({
  id: row.id,
  churchId: row.church_id,
  userId: row.user_id,
  role: row.role,
  scopeType: row.scope_type,
  scopeId: row.scope_id,
  status: row.status,
  grantedBy: row.granted_by,
  grantedAt: row.granted_at,
  revokedAt: row.revoked_at,
  meta: row.meta ?? {},
});

const mapTeam = (row: any): ChurchServiceTeam => ({
  id: row.id,
  churchId: row.church_id,
  name: row.name,
  slug: row.slug,
  area: row.area,
  description: row.description ?? '',
  leaderId: row.leader_id,
  status: row.status,
  capacity: row.capacity,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapTeamFunction = (row: any): ChurchTeamFunction => ({
  id: row.id,
  churchId: row.church_id,
  teamId: row.team_id,
  name: row.name,
  description: row.description ?? '',
  requiredCount: Number(row.required_count ?? 0),
  profileHint: row.profile_hint ?? '',
  status: row.status as ChurchTeamFunctionStatus,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapScaleSlot = (row: any): ChurchServiceScaleSlot => ({
  id: row.id,
  churchId: row.church_id,
  serviceId: row.service_id,
  teamId: row.team_id,
  functionId: row.function_id,
  functionName: row.function_name,
  requiredCount: Number(row.required_count ?? 0),
  assignedCount: Number(row.assigned_count ?? 0),
  status: row.status as ChurchScaleSlotStatus,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapServiceInvite = (row: any): ChurchServiceInvite => ({
  id: row.id,
  churchId: row.church_id,
  serviceId: row.service_id,
  teamId: row.team_id,
  slotId: row.slot_id,
  assignmentId: row.assignment_id,
  userId: row.user_id,
  role: row.role ?? '',
  status: row.status as ChurchServiceInviteStatus,
  responseNote: row.response_note ?? '',
  sentAt: row.sent_at,
  respondedAt: row.responded_at,
  expiresAt: row.expires_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapParticipationLog = (row: any): ChurchParticipationLog => ({
  id: row.id,
  churchId: row.church_id,
  serviceId: row.service_id,
  teamId: row.team_id,
  assignmentId: row.assignment_id,
  inviteId: row.invite_id,
  userId: row.user_id,
  status: row.status as ChurchParticipationStatus,
  role: row.role ?? '',
  notes: row.notes ?? '',
  recordedBy: row.recorded_by,
  recordedAt: row.recorded_at,
  createdAt: row.created_at,
});

const mapGroup = (row: any): ChurchGroup => ({
  id: row.id,
  churchId: row.church_id,
  parentGroupId: row.parent_group_id ?? undefined,
  name: row.name,
  slug: row.slug ?? row.name,
  privacy: row.privacy === 'private' ? 'private' : 'public',
  stats: {
    memberCount: Number(row.member_count ?? row.stats?.memberCount ?? 0),
    totalMana: Number(row.total_mana ?? row.stats?.totalMana ?? 0),
  },
  leaderName: row.leader_name ?? undefined,
  leaderUid: row.leader_id ?? row.leader_uid ?? undefined,
  createdBy: row.created_by ?? '',
  createdAt: row.created_at,
});

const mapAssignment = (row: any): ChurchAssignment => ({
  id: row.id,
  churchId: row.church_id,
  teamId: row.team_id,
  title: row.title,
  description: row.description ?? '',
  assigneeUserId: row.assignee_user_id,
  leaderUserId: row.leader_user_id,
  scopeType: row.scope_type,
  scopeId: row.scope_id,
  status: row.status,
  requiresAcceptance: Boolean(row.requires_acceptance),
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  publicFeedback: row.public_feedback ?? '',
  createdBy: row.created_by,
  sourceType: row.source_type,
  sourceId: row.source_id,
  acceptedAt: row.accepted_at,
  declinedAt: row.declined_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapQrForm = (row: any): ChurchQrForm => ({
  id: row.id,
  churchId: row.church_id,
  token: row.token,
  title: row.title,
  formType: row.form_type,
  description: row.description ?? '',
  fields: Array.isArray(row.fields) ? row.fields : [],
  destination: row.destination ?? 'inbox',
  privacyText: row.privacy_text ?? '',
  confirmationText: row.confirmation_text ?? '',
  allowAnonymous: Boolean(row.allow_anonymous),
  status: row.status,
  scansCount: row.scans_count ?? 0,
  submissionsCount: row.submissions_count ?? 0,
  expiresAt: row.expires_at,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapSubmission = (row: any): ChurchFormSubmission => ({
  id: row.id,
  churchId: row.church_id,
  formId: row.form_id,
  formType: row.form_type,
  submitterUserId: row.submitter_user_id,
  submitterName: row.submitter_name,
  submitterContact: row.submitter_contact,
  payload: row.payload ?? {},
  status: row.status,
  publicStatus: row.public_status,
  priority: row.priority,
  assignedTo: row.assigned_to,
  isSensitive: Boolean(row.is_sensitive),
  publicFeedback: row.public_feedback ?? '',
  internalSummary: row.internal_summary ?? '',
  nextAction: row.next_action ?? '',
  sourceType: row.source_type,
  sourceId: row.source_id,
  closedAt: row.closed_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const mapNotification = (row: any): ChurchManagementNotification => ({
  id: row.id,
  churchId: row.church_id,
  userId: row.user_id,
  audienceRole: row.audience_role,
  title: row.title,
  message: row.message,
  eventType: row.event_type,
  severity: row.severity,
  channel: row.channel,
  link: row.link,
  dedupeKey: row.dedupe_key,
  readAt: row.read_at,
  dismissedAt: row.dismissed_at,
  createdAt: row.created_at,
});

const mapBadge = (row: any): ChurchVolunteerBadge => ({
  id: row.id,
  churchId: row.church_id,
  userId: row.user_id,
  badgeKey: row.badge_key,
  title: row.title,
  description: row.description ?? '',
  manaAmount: row.mana_amount ?? 0,
  visibility: row.visibility,
  sourceType: row.source_type,
  sourceId: row.source_id,
  awardedBy: row.awarded_by,
  awardedAt: row.awarded_at,
  meta: row.meta ?? {},
});

const findAssignmentBySource = async (churchId: string, sourceId: string): Promise<ChurchAssignment | null> => {
  const { data, error } = await supabase
    .from('church_assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('church_id', churchId)
    .eq('source_type', 'culto_plus_schedule')
    .eq('source_id', sourceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAssignment(data) : null;
};

const findAssignmentBySourceKey = async (churchId: string, sourceType: string, sourceId: string): Promise<ChurchAssignment | null> => {
  const { data, error } = await supabase
    .from('church_assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('church_id', churchId)
    .eq('source_type', sourceType)
    .eq('source_id', sourceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapAssignment(data) : null;
};

const getCultoTeamAssignmentsByService = async (churchId: string, serviceIds: string[]) => {
  const grouped = new Map<string, ChurchAssignment[]>();
  if (serviceIds.length === 0) return grouped;

  const { data, error } = await supabase
    .from('church_assignments')
    .select(ASSIGNMENT_SELECT)
    .eq('church_id', churchId)
    .in('source_type', ['gestao_culto_team', 'gestao_culto_member'])
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;

  const serviceIdSet = new Set(serviceIds);
  (data ?? []).map(mapAssignment).forEach((assignment) => {
    const serviceId = getCultoAssignmentServiceId(assignment);
    if (!serviceId || !serviceIdSet.has(serviceId)) return;
    const current = grouped.get(serviceId) ?? [];
    current.push(assignment);
    grouped.set(serviceId, current);
  });

  return grouped;
};

const findSubmissionBySource = async (churchId: string, sourceId: string): Promise<ChurchFormSubmission | null> => {
  const { data, error } = await supabase
    .from('church_form_submissions')
    .select('id, church_id, form_id, form_type, submitter_user_id, submitter_name, submitter_contact, payload, status, public_status, priority, assigned_to, is_sensitive, public_feedback, internal_summary, next_action, source_type, source_id, closed_at, created_at, updated_at')
    .eq('church_id', churchId)
    .eq('source_type', 'culto_plus_prayer')
    .eq('source_id', sourceId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSubmission(data) : null;
};

const buildAssignmentPayloadFromSchedule = (service: ChurchService, schedule: ServiceScheduleAssignment) => {
  const status: ChurchAssignmentStatus =
    schedule.status === 'confirmed' ? 'accepted' :
    schedule.status === 'declined' ? 'declined' :
    schedule.status === 'replaced' ? 'removed' :
    'pending';

  return {
    title: `${schedule.ministryName}: ${schedule.role || 'Escala do culto'}`,
    description: `Escala importada do Culto+ para ${service.title}.`,
    assignee_user_id: schedule.userId,
    leader_user_id: null,
    scope_type: 'service',
    scope_id: null,
    status,
    starts_at: service.startsAt,
    ends_at: service.endsAt,
    public_feedback: `Voce foi escalado em ${schedule.ministryName} para ${service.title}.`,
  };
};

const buildSubmissionPayloadFromPrayer = (service: ChurchService, prayer: ServicePrayerRequest) => ({
  form_id: null,
  form_type: 'prayer',
  submitter_user_id: prayer.userId,
  submitter_name: prayer.userName,
  submitter_contact: null,
  payload: {
    source: 'culto_plus',
    serviceId: service.id,
    serviceTitle: service.title,
    serviceStartsAt: service.startsAt,
    prayerId: prayer.id,
    content: prayer.content,
  },
  status: 'received',
  public_status: 'Recebido pela igreja',
  priority: 'normal',
  assigned_to: null,
  is_sensitive: false,
  public_feedback: 'Pedido recebido a partir do Culto+.',
  internal_summary: `Pedido publico do culto ${service.title}.`,
  next_action: 'Acompanhar e responder conforme o fluxo pastoral da igreja.',
});

const toParticipantProfile = (row: any): Pick<UserProfile, 'uid' | 'displayName' | 'photoURL'> => ({
  uid: row.id,
  displayName: row.display_name ?? row.username ?? row.email ?? 'Membro',
  photoURL: row.photo_url ?? null,
});

const ensureServiceMinistryForTeam = async (churchId: string, userId: string, team: ChurchServiceTeam) => {
  const ministries = await cultoPlusService.getMinistriesByChurch(churchId);
  const existing = ministries.find((ministry) => ministry.name.trim().toLowerCase() === team.name.trim().toLowerCase());
  if (existing) return existing;
  return cultoPlusService.createMinistry(churchId, userId, team.name, team.description || team.area || '');
};

const defaultSettings = (churchId: string): ChurchManagementSettings => ({
  churchId,
  qrDefaultValidityDays: 30,
  defaultPrivacyText: 'As informacoes enviadas serao tratadas pela equipe autorizada da igreja.',
  defaultConfirmationText: 'Recebemos seu envio. A igreja dara retorno quando houver proximo passo publico.',
  notifyPastorsOnSensitiveRequests: true,
  notifyLeadersOnVolunteerRequests: true,
  memberFeedbackEnabled: true,
});

const mapSettings = (row: any): ChurchManagementSettings => ({
  churchId: row.church_id,
  qrDefaultValidityDays: row.qr_default_validity_days ?? 30,
  defaultPrivacyText: row.default_privacy_text ?? '',
  defaultConfirmationText: row.default_confirmation_text ?? '',
  notifyPastorsOnSensitiveRequests: Boolean(row.notify_pastors_on_sensitive_requests),
  notifyLeadersOnVolunteerRequests: Boolean(row.notify_leaders_on_volunteer_requests),
  memberFeedbackEnabled: Boolean(row.member_feedback_enabled),
  updatedBy: row.updated_by,
  updatedAt: row.updated_at,
});

const fallbackSummary = (): ChurchManagementSummary => ({
  openSubmissions: 0,
  pendingAssignments: 0,
  activeTeams: 0,
  activeQrForms: 0,
  unreadNotifications: 0,
  badgesAwarded: 0,
});

const awardAssignmentAcceptanceRecognition = async (assignment: ChurchAssignment) => {
  if (!assignment.assigneeUserId) return;

  const badgePayload = {
    church_id: assignment.churchId,
    user_id: assignment.assigneeUserId,
    badge_key: 'assignment_accepted',
    title: 'Disponibilidade',
    description: `Aceitou servir em: ${assignment.title}.`,
    mana_amount: 10,
    visibility: 'private',
    source_type: 'assignment',
    source_id: assignment.id,
    meta: { scopeType: assignment.scopeType, teamId: assignment.teamId ?? null },
  };

  try {
    const { data: existingBadge, error: existingError } = await supabase
      .from('church_volunteer_badges')
      .select('id')
      .eq('church_id', assignment.churchId)
      .eq('user_id', assignment.assigneeUserId)
      .eq('badge_key', 'assignment_accepted')
      .eq('source_type', 'assignment')
      .eq('source_id', assignment.id)
      .maybeSingle();

    if (existingError) throw existingError;
    if (existingBadge) return;

    const { data, error } = await supabase
      .from('church_volunteer_badges')
      .insert(badgePayload)
      .select('id')
      .single();

    if (error) throw error;

    await supabase.from('mana_events').insert({
      user_id: assignment.assigneeUserId,
      church_id: assignment.churchId,
      actor_role: 'user',
      action_type: 'church_assignment_accepted',
      source_type: 'assignment',
      source_id: assignment.id,
      event_key: `church_assignment_accepted:${assignment.id}`,
      xp_amount: 10,
      occurred_at: now(),
      period_key: now().slice(0, 10),
      status: 'valid',
      meta: { badgeId: data?.id ?? null, title: assignment.title },
    });

    await createOperationalNotification({
      churchId: assignment.churchId,
      userId: assignment.assigneeUserId,
      title: 'Conquista registrada',
      message: 'Sua disponibilidade foi reconhecida com uma insignia de servico.',
      eventType: 'volunteer_badge_awarded',
      severity: 'info',
      channel: 'member',
      link: '/minha-igreja/insignias',
      sourceType: 'assignment',
      sourceId: assignment.id,
      dedupeKey: `volunteer_badge_awarded:${assignment.id}`,
      payload: { badgeKey: 'assignment_accepted' },
    });
  } catch {
    // Reconhecimento e Mana nao podem bloquear aceite/recusa de designacao.
  }
};

export const churchManagementService = {
  getSettings: async (churchId: string): Promise<ChurchManagementSettings> => {
    try {
      const { data, error } = await supabase
        .from('church_management_settings')
        .select('church_id, qr_default_validity_days, default_privacy_text, default_confirmation_text, notify_pastors_on_sensitive_requests, notify_leaders_on_volunteer_requests, member_feedback_enabled, updated_by, updated_at')
        .eq('church_id', churchId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSettings(data) : defaultSettings(churchId);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar configuracoes da gestao. ${formatSupabaseError(error)}`);
      return defaultSettings(churchId);
    }
  },

  updateSettings: async (churchId: string, updates: Partial<Omit<ChurchManagementSettings, 'churchId' | 'updatedAt'>>): Promise<ChurchManagementSettings> => {
    const payload = {
      church_id: churchId,
      qr_default_validity_days: updates.qrDefaultValidityDays,
      default_privacy_text: updates.defaultPrivacyText,
      default_confirmation_text: updates.defaultConfirmationText,
      notify_pastors_on_sensitive_requests: updates.notifyPastorsOnSensitiveRequests,
      notify_leaders_on_volunteer_requests: updates.notifyLeadersOnVolunteerRequests,
      member_feedback_enabled: updates.memberFeedbackEnabled,
      updated_by: updates.updatedBy ?? null,
      updated_at: now(),
    };
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data, error } = await supabase
      .from('church_management_settings')
      .upsert(cleaned, { onConflict: 'church_id' })
      .select('church_id, qr_default_validity_days, default_privacy_text, default_confirmation_text, notify_pastors_on_sensitive_requests, notify_leaders_on_volunteer_requests, member_feedback_enabled, updated_by, updated_at')
      .single();
    if (error) throw new Error(`Erro ao salvar configuracoes da gestao. ${formatSupabaseError(error)}`);
    return mapSettings(data);
  },

  getSummary: async (churchId: string): Promise<ChurchManagementSummary> => {
    try {
      const [
        { count: openSubmissions, error: submissionsError },
        { count: pendingAssignments, error: assignmentsError },
        { count: activeTeams, error: teamsError },
        { count: activeQrForms, error: qrError },
        { count: unreadNotifications, error: notificationsError },
        { count: badgesAwarded, error: badgesError },
      ] = await Promise.all([
        supabase.from('church_form_submissions').select('id', { count: 'exact', head: true }).eq('church_id', churchId).not('status', 'in', '("closed","archived")'),
        supabase.from('church_assignments').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('status', 'pending'),
        supabase.from('church_service_teams').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('status', 'active'),
        supabase.from('church_qr_forms').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('status', 'active'),
        supabase.from('church_management_notifications').select('id', { count: 'exact', head: true }).eq('church_id', churchId).is('read_at', null),
        supabase.from('church_volunteer_badges').select('id', { count: 'exact', head: true }).eq('church_id', churchId),
      ]);
      const error = submissionsError || assignmentsError || teamsError || qrError || notificationsError || badgesError;
      if (error) throw error;
      return {
        openSubmissions: openSubmissions ?? 0,
        pendingAssignments: pendingAssignments ?? 0,
        activeTeams: activeTeams ?? 0,
        activeQrForms: activeQrForms ?? 0,
        unreadNotifications: unreadNotifications ?? 0,
        badgesAwarded: badgesAwarded ?? 0,
      };
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar resumo da gestao da igreja. ${formatSupabaseError(error)}`);
      return fallbackSummary();
    }
  },

  listRoles: async (churchId: string, options?: PageOptions): Promise<ChurchMemberRole[]> => {
    try {
      let query = supabase.from('church_member_roles').select('id, church_id, user_id, role, scope_type, scope_id, status, granted_by, granted_at, revoked_at, meta').eq('church_id', churchId).order('granted_at', { ascending: false });
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapRole);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar roles da igreja. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  getRole: async (roleId: string): Promise<ChurchMemberRole | null> => {
    const { data, error } = await supabase
      .from('church_member_roles')
      .select('id, church_id, user_id, role, scope_type, scope_id, status, granted_by, granted_at, revoked_at, meta')
      .eq('id', roleId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao carregar role da igreja. ${formatSupabaseError(error)}`);
    return data ? mapRole(data) : null;
  },

  grantRole: async (input: { churchId: string; userId: string; role: ChurchOperationalRole; scopeType?: string; scopeId?: string | null; grantedBy?: string | null; meta?: Record<string, any>; notify?: boolean }): Promise<ChurchMemberRole> => {
    const payload = {
      church_id: input.churchId,
      user_id: input.userId,
      role: input.role,
      scope_type: input.scopeType ?? 'church',
      scope_id: input.scopeId ?? null,
      granted_by: input.grantedBy ?? null,
      status: 'active',
      revoked_at: null,
      meta: input.meta ?? {},
    };
    const { data, error } = await supabase.from('church_member_roles').upsert(payload, { onConflict: 'church_id,user_id,role,scope_type,scope_id' }).select().single();
    if (error) throw new Error(`Erro ao conceder role da igreja. ${formatSupabaseError(error)}`);
    const role = mapRole(data);
    if (input.notify !== false) await createOperationalNotification({
      churchId: input.churchId,
      userId: input.userId,
      audienceRole: input.role,
      title: 'Permissao atualizada',
      message: 'Seu papel operacional na igreja foi atualizado.',
      eventType: 'role_granted',
      severity: 'action',
      channel: 'both',
      link: '/minha-igreja',
      sourceType: 'church_member_role',
      sourceId: role.id,
      dedupeKey: `role_granted:${input.userId}:${input.role}:${input.scopeType ?? 'church'}:${input.scopeId ?? 'all'}`,
    });
    return role;
  },

  revokeRole: async (roleId: string): Promise<ChurchMemberRole> => {
    const { data, error } = await supabase
      .from('church_member_roles')
      .update({ status: 'revoked', revoked_at: now() })
      .eq('id', roleId)
      .select()
      .single();
    if (error) throw new Error(`Erro ao revogar role da igreja. ${formatSupabaseError(error)}`);
    return mapRole(data);
  },

  listTeams: async (churchId: string, options?: PageOptions): Promise<ChurchServiceTeam[]> => {
    try {
      let query = supabase.from('church_service_teams').select('id, church_id, name, slug, area, description, leader_id, status, capacity, created_by, created_at, updated_at').eq('church_id', churchId).order('created_at', { ascending: false });
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapTeam);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar equipes da igreja. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  getTeamParticipantCounts: async (churchId: string, teamIds: string[]): Promise<Record<string, number>> => {
    const uniqueTeamIds = Array.from(new Set(teamIds.filter(Boolean)));
    const counts = Object.fromEntries(uniqueTeamIds.map((teamId) => [teamId, 0])) as Record<string, number>;
    if (uniqueTeamIds.length === 0) return counts;

    try {
      const [
        { data: roles, error: rolesError },
        { data: teams, error: teamsError },
      ] = await Promise.all([
        supabase
          .from('church_member_roles')
          .select('user_id, scope_id')
          .eq('church_id', churchId)
          .eq('status', 'active')
          .eq('scope_type', 'team')
          .in('scope_id', uniqueTeamIds),
        supabase
          .from('church_service_teams')
          .select('id, leader_id')
          .eq('church_id', churchId)
          .in('id', uniqueTeamIds),
      ]);
      const error = rolesError || teamsError;
      if (error) throw error;

      const participantsByTeam = new Map<string, Set<string>>();
      uniqueTeamIds.forEach((teamId) => participantsByTeam.set(teamId, new Set()));

      (roles ?? []).forEach((role: any) => {
        if (!role.scope_id || !role.user_id) return;
        participantsByTeam.get(role.scope_id)?.add(role.user_id);
      });

      (teams ?? []).forEach((team: any) => {
        if (!team.id || !team.leader_id) return;
        participantsByTeam.get(team.id)?.add(team.leader_id);
      });

      participantsByTeam.forEach((participants, teamId) => {
        counts[teamId] = participants.size;
      });
      return counts;
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao contar participantes dos times. ${formatSupabaseError(error)}`);
      return counts;
    }
  },

  listTeamParticipants: async (churchId: string, teamId: string): Promise<ChurchTeamParticipant[]> => {
    try {
      const [
        { data: roles, error: rolesError },
        { data: team, error: teamError },
      ] = await Promise.all([
        supabase
          .from('church_member_roles')
          .select('user_id, role')
          .eq('church_id', churchId)
          .eq('status', 'active')
          .eq('scope_type', 'team')
          .eq('scope_id', teamId),
        supabase
          .from('church_service_teams')
          .select('leader_id')
          .eq('church_id', churchId)
          .eq('id', teamId)
          .maybeSingle(),
      ]);
      const error = rolesError || teamError;
      if (error) throw error;

      const roleByUser = new Map<string, ChurchTeamParticipant['role']>();
      if (team?.leader_id) roleByUser.set(team.leader_id, 'team_leader');
      (roles ?? []).forEach((role: any) => {
        if (!role.user_id) return;
        if (!roleByUser.has(role.user_id)) roleByUser.set(role.user_id, role.role);
      });

      const userIds = Array.from(roleByUser.keys());
      if (userIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, username, email, photo_url')
        .in('id', userIds);
      if (profilesError) throw profilesError;

      const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.id, toParticipantProfile(profile)]));
      return userIds.map((userId) => {
        const profile = profilesById.get(userId);
        return {
          userId,
          displayName: profile?.displayName ?? 'Membro',
          photoURL: profile?.photoURL ?? null,
          role: roleByUser.get(userId),
        };
      }).sort((a, b) => a.displayName.localeCompare(b.displayName));
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar participantes do time. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  requestTeamServiceApproval: async (input: {
    service: ChurchService;
    team: ChurchServiceTeam;
    createdBy?: string | null;
  }): Promise<ChurchAssignment> => {
    const sourceId = buildTeamServiceSourceId(input.service.id, input.team.id);
    const existing = await findAssignmentBySourceKey(input.service.churchId, 'gestao_culto_team', sourceId);
    if (existing) return existing;

    const { data, error } = await supabase.from('church_assignments').insert({
      church_id: input.service.churchId,
      team_id: input.team.id,
      title: `Escala ${input.team.name}`,
      description: `Time selecionado para participar do culto ${input.service.title}.`,
      assignee_user_id: null,
      leader_user_id: input.team.leaderId ?? null,
      scope_type: 'team',
      scope_id: input.team.id,
      status: 'pending',
      starts_at: input.service.startsAt,
      ends_at: input.service.endsAt ?? null,
      public_feedback: `O time ${input.team.name} aguarda aprovacao para servir no culto ${input.service.title}.`,
      created_by: input.createdBy ?? null,
      source_type: 'gestao_culto_team',
      source_id: sourceId,
    }).select(ASSIGNMENT_SELECT).single();
    if (error) throw new Error(`Erro ao solicitar aprovacao da escala. ${formatSupabaseError(error)}`);

    const assignment = mapAssignment(data);
    await createOperationalNotification({
      churchId: input.service.churchId,
      userId: input.team.leaderId ?? null,
      audienceRole: input.team.leaderId ? null : 'church_manager',
      title: 'Aprovar escala de equipe',
      message: `${input.team.name} foi selecionado para ${input.service.title}. Aprove para notificar os participantes.`,
      eventType: 'team_service_assignment_approval_requested',
      severity: 'action',
      channel: 'dashboard',
      link: '/gestao-igreja/designacoes',
      sourceType: 'assignment',
      sourceId: assignment.id,
      dedupeKey: `team_service_assignment_approval_requested:${assignment.id}`,
      payload: { serviceId: input.service.id, teamId: input.team.id },
    });

    return assignment;
  },

  createTeam: async (input: {
    churchId: string;
    name: string;
    area: string;
    description?: string;
    leaderId?: string | null;
    capacity?: number | null;
    createdBy?: string | null;
  }): Promise<ChurchServiceTeam> => {
    const slug = `${input.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48)}-${Math.random().toString(36).slice(2, 6)}`;
    const payload = {
      church_id: input.churchId,
      name: input.name,
      slug,
      area: input.area,
      description: input.description ?? '',
      leader_id: input.leaderId ?? null,
      capacity: input.capacity ?? null,
      created_by: input.createdBy ?? null,
    };
    const { data, error } = await supabase.from('church_service_teams').insert(payload).select().single();
    if (error) throw new Error(`Erro ao criar equipe. ${formatSupabaseError(error)}`);
    const team = mapTeam(data);
    await createOperationalNotification({
      churchId: input.churchId,
      audienceRole: 'leader',
      title: 'Nova equipe criada',
      message: `A equipe ${team.name} foi criada para organizar o servico da igreja.`,
      eventType: 'team_created',
      severity: 'info',
      channel: 'dashboard',
      link: '/gestao-igreja/equipes',
      sourceType: 'church_service_team',
      sourceId: team.id,
      dedupeKey: `team_created:${team.id}`,
    });
    return team;
  },

  getTeam: async (teamId: string): Promise<ChurchServiceTeam | null> => {
    const { data, error } = await supabase
      .from('church_service_teams')
      .select('id, church_id, name, slug, area, description, leader_id, status, capacity, created_by, created_at, updated_at')
      .eq('id', teamId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao carregar equipe. ${formatSupabaseError(error)}`);
    return data ? mapTeam(data) : null;
  },

  getTeamPublicLeaderName: async (churchId: string, teamId: string): Promise<string | null> => {
    try {
      const { data: team, error: teamError } = await supabase
        .from('church_service_teams')
        .select('leader_id')
        .eq('church_id', churchId)
        .eq('id', teamId)
        .maybeSingle();
      if (teamError) throw teamError;
      if (!team?.leader_id) return null;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', team.leader_id)
        .maybeSingle();
      if (profileError) throw profileError;
      return profile?.display_name?.trim() || null;
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar líder responsável pelo time. ${formatSupabaseError(error)}`);
      return null;
    }
  },

  updateTeam: async (teamId: string, updates: { name?: string; area?: string; description?: string; leaderId?: string | null; capacity?: number | null; status?: ChurchManagementStatus }): Promise<ChurchServiceTeam> => {
    const payload = {
      name: updates.name,
      area: updates.area,
      description: updates.description,
      leader_id: updates.leaderId,
      capacity: updates.capacity,
      status: updates.status,
      updated_at: now(),
    };
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data, error } = await supabase.from('church_service_teams').update(cleaned).eq('id', teamId).select().single();
    if (error) throw new Error(`Erro ao atualizar equipe. ${formatSupabaseError(error)}`);
    return mapTeam(data);
  },

  listTeamFunctions: async (churchId: string, teamId: string): Promise<ChurchTeamFunction[]> => {
    try {
      const { data, error } = await supabase
        .from('church_team_functions')
        .select('id, church_id, team_id, name, description, required_count, profile_hint, status, created_by, created_at, updated_at')
        .eq('church_id', churchId)
        .eq('team_id', teamId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []).map(mapTeamFunction);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar funcoes da equipe. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  upsertTeamFunction: async (input: {
    churchId: string;
    teamId: string;
    name: string;
    description?: string;
    requiredCount?: number;
    profileHint?: string;
    status?: ChurchTeamFunctionStatus;
    createdBy?: string | null;
  }): Promise<ChurchTeamFunction> => {
    const payload = {
      church_id: input.churchId,
      team_id: input.teamId,
      name: input.name,
      description: input.description ?? '',
      required_count: input.requiredCount ?? 1,
      profile_hint: input.profileHint ?? '',
      status: input.status ?? 'active',
      created_by: input.createdBy ?? null,
      updated_at: now(),
    };
    const { data, error } = await supabase
      .from('church_team_functions')
      .upsert(payload, { onConflict: 'church_id,team_id,name' })
      .select('id, church_id, team_id, name, description, required_count, profile_hint, status, created_by, created_at, updated_at')
      .single();
    if (error) throw new Error(`Erro ao salvar funcao da equipe. ${formatSupabaseError(error)}`);
    return mapTeamFunction(data);
  },

  listServiceScaleSlots: async (churchId: string, serviceId: string, teamId?: string): Promise<ChurchServiceScaleSlot[]> => {
    try {
      let query = supabase
        .from('church_service_scale_slots')
        .select('id, church_id, service_id, team_id, function_id, function_name, required_count, assigned_count, status, created_by, created_at, updated_at')
        .eq('church_id', churchId)
        .eq('service_id', serviceId)
        .order('created_at', { ascending: true });
      if (teamId) query = query.eq('team_id', teamId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapScaleSlot);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar vagas da escala. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  upsertServiceScaleSlot: async (input: {
    churchId: string;
    serviceId: string;
    teamId: string;
    functionId?: string | null;
    functionName: string;
    requiredCount?: number;
    assignedCount?: number;
    status?: ChurchScaleSlotStatus;
    createdBy?: string | null;
  }): Promise<ChurchServiceScaleSlot> => {
    const payload = {
      church_id: input.churchId,
      service_id: input.serviceId,
      team_id: input.teamId,
      function_id: input.functionId ?? null,
      function_name: input.functionName,
      required_count: input.requiredCount ?? 1,
      assigned_count: input.assignedCount ?? 0,
      status: input.status ?? 'open',
      created_by: input.createdBy ?? null,
      updated_at: now(),
    };
    const { data, error } = await supabase
      .from('church_service_scale_slots')
      .upsert(payload, { onConflict: 'church_id,service_id,team_id,function_name' })
      .select('id, church_id, service_id, team_id, function_id, function_name, required_count, assigned_count, status, created_by, created_at, updated_at')
      .single();
    if (error) throw new Error(`Erro ao salvar vaga da escala. ${formatSupabaseError(error)}`);
    return mapScaleSlot(data);
  },

  listServiceInvites: async (churchId: string, options: { serviceId?: string; teamId?: string; userId?: string } = {}): Promise<ChurchServiceInvite[]> => {
    try {
      let query = supabase
        .from('church_service_invites')
        .select('id, church_id, service_id, team_id, slot_id, assignment_id, user_id, role, status, response_note, sent_at, responded_at, expires_at, created_by, created_at, updated_at')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });
      if (options.serviceId) query = query.eq('service_id', options.serviceId);
      if (options.teamId) query = query.eq('team_id', options.teamId);
      if (options.userId) query = query.eq('user_id', options.userId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapServiceInvite);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar convites da escala. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  upsertServiceInvite: async (input: {
    churchId: string;
    serviceId: string;
    teamId?: string | null;
    slotId?: string | null;
    assignmentId?: string | null;
    userId: string;
    role?: string;
    status?: ChurchServiceInviteStatus;
    responseNote?: string;
    expiresAt?: string | null;
    createdBy?: string | null;
  }): Promise<ChurchServiceInvite> => {
    const payload = {
      church_id: input.churchId,
      service_id: input.serviceId,
      team_id: input.teamId ?? null,
      slot_id: input.slotId ?? null,
      assignment_id: input.assignmentId ?? null,
      user_id: input.userId,
      role: input.role ?? '',
      status: input.status ?? 'pending',
      response_note: input.responseNote ?? '',
      sent_at: input.status === 'not_sent' ? null : now(),
      expires_at: input.expiresAt ?? null,
      created_by: input.createdBy ?? null,
      updated_at: now(),
    };
    const { data, error } = await supabase
      .from('church_service_invites')
      .upsert(payload, { onConflict: 'church_id,service_id,team_id,user_id,role' })
      .select('id, church_id, service_id, team_id, slot_id, assignment_id, user_id, role, status, response_note, sent_at, responded_at, expires_at, created_by, created_at, updated_at')
      .single();
    if (error) throw new Error(`Erro ao salvar convite da escala. ${formatSupabaseError(error)}`);
    return mapServiceInvite(data);
  },

  listParticipationLogs: async (churchId: string, options: { serviceId?: string; teamId?: string; userId?: string } = {}): Promise<ChurchParticipationLog[]> => {
    try {
      let query = supabase
        .from('church_participation_logs')
        .select('id, church_id, service_id, team_id, assignment_id, invite_id, user_id, status, role, notes, recorded_by, recorded_at, created_at')
        .eq('church_id', churchId)
        .order('recorded_at', { ascending: false });
      if (options.serviceId) query = query.eq('service_id', options.serviceId);
      if (options.teamId) query = query.eq('team_id', options.teamId);
      if (options.userId) query = query.eq('user_id', options.userId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map(mapParticipationLog);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar historico de participacao. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  recordParticipation: async (input: {
    churchId: string;
    userId: string;
    status: ChurchParticipationStatus;
    serviceId?: string | null;
    teamId?: string | null;
    assignmentId?: string | null;
    inviteId?: string | null;
    role?: string;
    notes?: string;
    recordedBy?: string | null;
  }): Promise<ChurchParticipationLog> => {
    const { data, error } = await supabase
      .from('church_participation_logs')
      .insert({
        church_id: input.churchId,
        service_id: input.serviceId ?? null,
        team_id: input.teamId ?? null,
        assignment_id: input.assignmentId ?? null,
        invite_id: input.inviteId ?? null,
        user_id: input.userId,
        status: input.status,
        role: input.role ?? '',
        notes: input.notes ?? '',
        recorded_by: input.recordedBy ?? null,
      })
      .select('id, church_id, service_id, team_id, assignment_id, invite_id, user_id, status, role, notes, recorded_by, recorded_at, created_at')
      .single();
    if (error) throw new Error(`Erro ao registrar participacao. ${formatSupabaseError(error)}`);
    return mapParticipationLog(data);
  },

  listAssignments: async (churchId: string, options?: ListAssignmentsOptions): Promise<ChurchAssignment[]> => {
    try {
      let query = supabase.from('church_assignments').select('id, church_id, team_id, title, description, assignee_user_id, leader_user_id, scope_type, scope_id, status, requires_acceptance, starts_at, ends_at, public_feedback, created_by, source_type, source_id, accepted_at, declined_at, created_at, updated_at').eq('church_id', churchId).order('created_at', { ascending: false });
      if (options?.status) query = query.eq('status', options.status);
      if (options?.assigneeUserId) query = query.eq('assignee_user_id', options.assigneeUserId);
      if (options?.teamId) query = query.eq('team_id', options.teamId);
      if (options?.scopeType) query = query.eq('scope_type', options.scopeType);
      if (options?.scopeId) query = query.eq('scope_id', options.scopeId);
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapAssignment);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar designacoes. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  listAssignmentsForUser: async (userId: string, limit = 25): Promise<ChurchAssignment[]> => {
    const { data, error } = await supabase
      .from('church_assignments')
      .select('id, church_id, team_id, title, description, assignee_user_id, leader_user_id, scope_type, scope_id, status, requires_acceptance, starts_at, ends_at, public_feedback, created_by, source_type, source_id, accepted_at, declined_at, created_at, updated_at')
      .eq('assignee_user_id', userId)
      .in('status', ['pending', 'accepted'])
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw new Error(`Erro ao carregar convites do usuario. ${formatSupabaseError(error)}`);
    return (data ?? []).map(mapAssignment);
  },

  isChurchMember: async (churchId: string, userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('memberships')
      .select('id')
      .eq('church_id', churchId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao verificar vinculo com a igreja. ${formatSupabaseError(error)}`);
    return Boolean(data);
  },

  listUserCultoAssignments: async (churchId: string, userId: string, limit = 24): Promise<UserCultoAssignment[]> => {
    const assignments = await churchManagementService.listAssignments(churchId, { assigneeUserId: userId, limit });
    const visibleAssignments = assignments.filter((assignment) => ['pending', 'accepted'].includes(assignment.status));
    const serviceIds = [...new Set(visibleAssignments.map(getCultoAssignmentServiceId).filter(Boolean))] as string[];
    const teamIds = [...new Set(visibleAssignments.map((assignment) => assignment.teamId).filter(Boolean))] as string[];

    const [services, teams] = await Promise.all([
      Promise.all(serviceIds.map((serviceId) => cultoPlusService.getServiceById(serviceId))),
      teamIds.length ? churchManagementService.listTeams(churchId, { limit: Math.max(teamIds.length, 24) }) : Promise.resolve([]),
    ]);
    const servicesById = new Map(services.filter(Boolean).map((service) => [service!.id, service!]));
    const teamsById = new Map(teams.filter((team) => teamIds.includes(team.id)).map((team) => [team.id, team]));

    return visibleAssignments
      .map((assignment) => ({
        assignment,
        service: servicesById.get(getCultoAssignmentServiceId(assignment) ?? '') ?? null,
        team: teamsById.get(assignment.teamId ?? '') ?? null,
      }))
      .sort((a, b) => new Date(a.assignment.startsAt || a.assignment.createdAt).getTime() - new Date(b.assignment.startsAt || b.assignment.createdAt).getTime());
  },

  listUserTeams: async (churchId: string, userId: string): Promise<ChurchServiceTeam[]> => {
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('church_member_roles')
        .select('scope_id')
        .eq('church_id', churchId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('scope_type', 'team');
      if (rolesError) throw rolesError;
      const teamIds = [...new Set((roles ?? []).map((role: any) => role.scope_id).filter(Boolean))] as string[];

      const [memberResult, leaderResult] = await Promise.all([
        teamIds.length
          ? supabase.from('church_service_teams').select('id, church_id, name, slug, area, description, leader_id, status, capacity, created_by, created_at, updated_at').eq('church_id', churchId).in('id', teamIds)
          : Promise.resolve({ data: [], error: null }),
        supabase.from('church_service_teams').select('id, church_id, name, slug, area, description, leader_id, status, capacity, created_by, created_at, updated_at').eq('church_id', churchId).eq('leader_id', userId),
      ]);
      const error = memberResult.error || leaderResult.error;
      if (error) throw error;
      const unique = new Map<string, ChurchServiceTeam>();
      [...(memberResult.data ?? []), ...(leaderResult.data ?? [])].map(mapTeam).forEach((team) => unique.set(team.id, team));
      return [...unique.values()].filter((team) => team.status === 'active');
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar seus times. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  createAssignment: async (input: {
    churchId: string;
    title: string;
    description?: string;
    teamId?: string | null;
    assigneeUserId?: string | null;
    leaderUserId?: string | null;
    scopeType?: 'church' | 'team' | 'group' | 'service' | 'event';
    scopeId?: string | null;
    startsAt?: string | null;
    endsAt?: string | null;
    publicFeedback?: string;
    createdBy?: string | null;
    sourceType?: string | null;
    sourceId?: string | null;
  }): Promise<ChurchAssignment> => {
    const payload = {
      church_id: input.churchId,
      title: input.title,
      description: input.description ?? '',
      team_id: input.teamId ?? null,
      assignee_user_id: input.assigneeUserId ?? null,
      leader_user_id: input.leaderUserId ?? null,
      scope_type: input.scopeType ?? 'church',
      scope_id: input.scopeId ?? null,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      public_feedback: input.publicFeedback ?? 'Designacao recebida. A igreja dara retorno sobre proximos passos.',
      created_by: input.createdBy ?? null,
      source_type: input.sourceType ?? null,
      source_id: input.sourceId ?? null,
    };
    const { data, error } = await supabase.from('church_assignments').insert(payload).select().single();
    if (error) throw new Error(`Erro ao criar designacao. ${formatSupabaseError(error)}`);
    const assignment = mapAssignment(data);
    await createOperationalNotification({
      churchId: input.churchId,
      userId: assignment.assigneeUserId,
      audienceRole: assignment.assigneeUserId ? null : 'leader',
      title: 'Nova designacao',
      message: assignment.publicFeedback || `Voce recebeu a designacao: ${assignment.title}.`,
      eventType: 'assignment_created',
      severity: 'action',
      channel: 'both',
      link: assignment.assigneeUserId ? '/minha-igreja/designacoes' : '/gestao-igreja/designacoes',
      sourceType: 'assignment',
      sourceId: assignment.id,
      dedupeKey: `assignment_created:${assignment.id}`,
    });
    return assignment;
  },

  getAssignment: async (assignmentId: string): Promise<ChurchAssignment | null> => {
    const { data, error } = await supabase
      .from('church_assignments')
      .select('id, church_id, team_id, title, description, assignee_user_id, leader_user_id, scope_type, scope_id, status, requires_acceptance, starts_at, ends_at, public_feedback, created_by, source_type, source_id, accepted_at, declined_at, created_at, updated_at')
      .eq('id', assignmentId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao carregar designacao. ${formatSupabaseError(error)}`);
    return data ? mapAssignment(data) : null;
  },

  updateAssignment: async (assignmentId: string, updates: { title?: string; description?: string; assigneeUserId?: string | null; leaderUserId?: string | null; scopeType?: ChurchRoleScopeType; scopeId?: string | null; status?: ChurchAssignmentStatus; startsAt?: string | null; endsAt?: string | null; publicFeedback?: string }): Promise<ChurchAssignment> => {
    const payload = {
      title: updates.title,
      description: updates.description,
      assignee_user_id: updates.assigneeUserId,
      leader_user_id: updates.leaderUserId,
      scope_type: updates.scopeType,
      scope_id: updates.scopeId,
      status: updates.status,
      starts_at: updates.startsAt,
      ends_at: updates.endsAt,
      public_feedback: updates.publicFeedback,
      updated_at: now(),
    };
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data, error } = await supabase.from('church_assignments').update(cleaned).eq('id', assignmentId).select().single();
    if (error) throw new Error(`Erro ao atualizar designacao. ${formatSupabaseError(error)}`);
    return mapAssignment(data);
  },

  respondToAssignment: async (assignmentId: string, userId: string, response: 'accepted' | 'declined'): Promise<ChurchAssignment> => {
    const currentAssignment = await churchManagementService.getAssignment(assignmentId);
    if (!currentAssignment) throw new Error('Designacao nao encontrada.');
    if (currentAssignment.assigneeUserId !== userId) throw new Error('Esta designacao nao pertence ao usuario informado.');
    if (response === 'accepted') {
      const isMember = await churchManagementService.isChurchMember(currentAssignment.churchId, userId);
      if (!isMember) throw new Error('Voce precisa ser membro da igreja para aceitar este convite.');
      const conflict = await findAcceptedAssignmentConflict(currentAssignment, userId);
      if (conflict) {
        await createOperationalNotification({
          churchId: currentAssignment.churchId,
          userId: currentAssignment.leaderUserId ?? currentAssignment.createdBy ?? null,
          audienceRole: currentAssignment.leaderUserId || currentAssignment.createdBy ? null : 'leader',
          title: 'Conflito de escala',
          message: `${currentAssignment.title} conflita com ${conflict.title}. Ajuste a escala antes do aceite.`,
          eventType: 'assignment_conflict',
          severity: 'action',
          channel: 'dashboard',
          link: '/gestao-igreja/designacoes',
          sourceType: 'assignment',
          sourceId: currentAssignment.id,
          dedupeKey: `assignment_conflict:${currentAssignment.id}:${conflict.id}`,
          payload: { conflictingAssignmentId: conflict.id },
        });
        throw new Error(`Conflito de horario com a designacao "${conflict.title}".`);
      }
    }
    const timestampField = response === 'accepted' ? 'accepted_at' : 'declined_at';
    const { data, error } = await supabase
      .from('church_assignments')
      .update({ status: response, [timestampField]: now(), updated_at: now() })
      .eq('id', assignmentId)
      .eq('assignee_user_id', userId)
      .select()
      .single();
    if (error) throw new Error(`Erro ao responder designacao. ${formatSupabaseError(error)}`);
    const assignment = mapAssignment(data);
    await createOperationalNotification({
      churchId: assignment.churchId,
      userId: assignment.leaderUserId ?? assignment.createdBy ?? null,
      audienceRole: assignment.leaderUserId || assignment.createdBy ? null : 'leader',
      title: response === 'accepted' ? 'Designacao aceita' : 'Designacao recusada',
      message: `${assignment.title} foi ${response === 'accepted' ? 'aceita' : 'recusada'} pelo membro.`,
      eventType: `assignment_${response}`,
      severity: 'action',
      channel: 'dashboard',
      link: '/gestao-igreja/designacoes',
      sourceType: 'assignment',
      sourceId: assignment.id,
      dedupeKey: `assignment_${response}:${assignment.id}`,
    });
    if (response === 'accepted') {
      await awardAssignmentAcceptanceRecognition(assignment);
    }
    const teamMemberSource = assignment.sourceType === 'gestao_culto_member'
      ? parseTeamMemberServiceSourceId(assignment.sourceId)
      : null;
    if (teamMemberSource) {
      try {
        const { error: scheduleSyncError } = await supabase
          .from('service_schedule_assignments')
          .update({ status: response === 'accepted' ? 'confirmed' : 'declined', updated_at: now() })
          .eq('service_id', teamMemberSource.serviceId)
          .eq('ministry_id', teamMemberSource.ministryId)
          .eq('user_id', userId);
        if (scheduleSyncError) throw scheduleSyncError;
      } catch (scheduleError) {
        if (!isMissingChurchManagementSchema(scheduleError)) throw new Error(`Erro ao sincronizar aceite com Culto+. ${formatSupabaseError(scheduleError)}`);
      }
    }
    return assignment;
  },

  approveTeamServiceAssignment: async (assignmentId: string, approvedBy?: string | null): Promise<ChurchTeamServiceApprovalResult> => {
    const assignment = await churchManagementService.getAssignment(assignmentId);
    if (!assignment) throw new Error('Escala de equipe nao encontrada.');
    if (assignment.sourceType !== 'gestao_culto_team' || !assignment.teamId) {
      throw new Error('Esta designacao nao representa uma escala de equipe do culto.');
    }

    const source = parseTeamServiceSourceId(assignment.sourceId);
    if (!source) throw new Error('Origem da escala de equipe invalida.');

    const [team, service, participants] = await Promise.all([
      churchManagementService.getTeam(assignment.teamId),
      cultoPlusService.getServiceById(source.serviceId),
      churchManagementService.listTeamParticipants(assignment.churchId, assignment.teamId),
    ]);

    if (!team) throw new Error('Time vinculado a escala nao encontrado.');
    if (!service) throw new Error('Culto vinculado a escala nao encontrado.');

    const ministryOwnerId = approvedBy ?? assignment.leaderUserId ?? assignment.createdBy ?? team.createdBy ?? null;
    if (!ministryOwnerId) throw new Error('Usuario aprovador nao identificado para preparar o ministerio do Culto+.');
    const ministry = await ensureServiceMinistryForTeam(assignment.churchId, ministryOwnerId, team);
    const memberAssignments: ChurchAssignment[] = [];
    let schedulesCreated = 0;
    let participantsNotified = 0;

    for (const participant of participants) {
      const memberProfile = {
        uid: participant.userId,
        displayName: participant.displayName,
        photoURL: participant.photoURL ?? null,
      } as UserProfile;
      const roleLabel = participant.role === 'team_leader' ? 'Lider da equipe' : team.name;

      await cultoPlusService.addMinistryMember(ministry, memberProfile, roleLabel);
      await cultoPlusService.createScheduleAssignment(service, ministry, memberProfile, roleLabel);
      schedulesCreated += 1;

      const memberSourceId = buildTeamMemberServiceSourceId(service.id, team.id, ministry.id, participant.userId);
      const existingMemberAssignment = await findAssignmentBySourceKey(assignment.churchId, 'gestao_culto_member', memberSourceId);
      if (existingMemberAssignment) {
        memberAssignments.push(existingMemberAssignment);
        continue;
      }

      const memberAssignment = await churchManagementService.createAssignment({
        churchId: assignment.churchId,
        teamId: team.id,
        title: `${team.name}: ${service.title}`,
        description: `Escala aprovada para o culto ${service.title}.`,
        assigneeUserId: participant.userId,
        leaderUserId: assignment.leaderUserId ?? assignment.createdBy ?? approvedBy ?? null,
        scopeType: 'team',
        scopeId: team.id,
        startsAt: service.startsAt,
        endsAt: service.endsAt ?? null,
        publicFeedback: `Voce foi escalado em ${team.name} para ${service.title}. Confirme sua disponibilidade.`,
        createdBy: approvedBy ?? assignment.createdBy ?? null,
        sourceType: 'gestao_culto_member',
        sourceId: memberSourceId,
      });
      memberAssignments.push(memberAssignment);
      participantsNotified += 1;
    }

    const teamAssignment = await churchManagementService.updateAssignment(assignment.id, { status: 'accepted' });
    await createOperationalNotification({
      churchId: assignment.churchId,
      userId: assignment.createdBy && assignment.createdBy !== approvedBy ? assignment.createdBy : null,
      audienceRole: assignment.createdBy && assignment.createdBy !== approvedBy ? null : 'church_manager',
      title: 'Escala de equipe aprovada',
      message: `${team.name} foi aprovado para ${service.title}. ${participantsNotified} participante(s) foram notificados para aceitar a escala.`,
      eventType: 'team_service_assignment_approved',
      severity: 'action',
      channel: 'dashboard',
      link: '/gestao-igreja/designacoes',
      sourceType: 'assignment',
      sourceId: teamAssignment.id,
      dedupeKey: `team_service_assignment_approved:${teamAssignment.id}`,
      payload: { serviceId: service.id, teamId: team.id, participantsNotified },
    });

    return {
      teamAssignment,
      memberAssignments,
      schedulesCreated,
      participantsNotified,
    };
  },

  listQrForms: async (churchId: string, options?: PageOptions): Promise<ChurchQrForm[]> => {
    try {
      let query = supabase.from('church_qr_forms').select('id, church_id, token, title, form_type, description, fields, destination, privacy_text, confirmation_text, allow_anonymous, status, scans_count, submissions_count, expires_at, created_by, created_at, updated_at').eq('church_id', churchId).order('created_at', { ascending: false });
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapQrForm);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar QR/forms. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  getQrFormByToken: async (token: string): Promise<ChurchQrForm | null> => {
    try {
      const { data, error } = await supabase.from('church_qr_forms').select('id, church_id, token, title, form_type, description, fields, destination, privacy_text, confirmation_text, allow_anonymous, status, scans_count, submissions_count, expires_at, created_by, created_at, updated_at').eq('token', token).eq('status', 'active').maybeSingle();
      if (error) throw error;
      return data ? mapQrForm(data) : null;
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar formulario publico. ${formatSupabaseError(error)}`);
      return null;
    }
  },

  recordQrFormScan: async (formId: string): Promise<void> => {
    try {
      await supabase.rpc('increment_church_qr_counter', { p_form_id: formId, p_counter: 'scan' });
    } catch {
      // Scan e metrica operacional; nao deve bloquear abertura do formulario publico.
    }
  },

  createQrForm: async (input: { churchId: string; title: string; formType: ChurchQrFormType; description?: string; fields: ChurchQrFormField[]; destination?: string; privacyText?: string; confirmationText?: string; allowAnonymous?: boolean; expiresAt?: string | null; createdBy?: string | null }): Promise<ChurchQrForm> => {
    const payload = {
      church_id: input.churchId,
      token: makeToken(input.title),
      title: input.title,
      form_type: input.formType,
      description: input.description ?? '',
      fields: input.fields,
      destination: input.destination ?? 'inbox',
      privacy_text: input.privacyText ?? '',
      confirmation_text: input.confirmationText ?? '',
      allow_anonymous: input.formType === 'volunteer' ? false : (input.allowAnonymous ?? true),
      expires_at: input.expiresAt ?? null,
      created_by: input.createdBy ?? null,
    };
    const { data, error } = await supabase.from('church_qr_forms').insert(payload).select().single();
    if (error) throw new Error(`Erro ao criar QR/formulario. ${formatSupabaseError(error)}`);
    const form = mapQrForm(data);
    await createOperationalNotification({
      churchId: input.churchId,
      audienceRole: 'church_manager',
      title: 'Novo QR Code ativo',
      message: `${form.title} ja pode receber respostas publicas.`,
      eventType: 'qr_form_created',
      severity: 'info',
      channel: 'dashboard',
      link: '/gestao-igreja/qrcodes',
      sourceType: 'qr_form',
      sourceId: form.id,
      dedupeKey: `qr_form_created:${form.id}`,
    });
    return form;
  },

  getQrForm: async (formId: string): Promise<ChurchQrForm | null> => {
    const { data, error } = await supabase
      .from('church_qr_forms')
      .select('id, church_id, token, title, form_type, description, fields, destination, privacy_text, confirmation_text, allow_anonymous, status, scans_count, submissions_count, expires_at, created_by, created_at, updated_at')
      .eq('id', formId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao carregar QR/formulario. ${formatSupabaseError(error)}`);
    return data ? mapQrForm(data) : null;
  },

  updateQrForm: async (formId: string, updates: { title?: string; formType?: ChurchQrFormType; description?: string; destination?: string; privacyText?: string; confirmationText?: string; allowAnonymous?: boolean; status?: ChurchQrFormStatus }): Promise<ChurchQrForm> => {
    const payload = {
      title: updates.title,
      form_type: updates.formType,
      description: updates.description,
      destination: updates.destination,
      privacy_text: updates.privacyText,
      confirmation_text: updates.confirmationText,
      allow_anonymous: updates.formType === 'volunteer' ? false : updates.allowAnonymous,
      status: updates.status,
      updated_at: now(),
    };
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data, error } = await supabase.from('church_qr_forms').update(cleaned).eq('id', formId).select().single();
    if (error) throw new Error(`Erro ao atualizar QR/formulario. ${formatSupabaseError(error)}`);
    return mapQrForm(data);
  },

  submitQrForm: async (input: { form: ChurchQrForm; submitterUserId?: string | null; submitterName?: string | null; submitterContact?: string | null; payload: Record<string, any>; isSensitive?: boolean }): Promise<ChurchFormSubmission> => {
    if (input.form.formType === 'volunteer') {
      if (!input.submitterUserId) throw new Error('Entre na sua conta para se candidatar como voluntário.');
      const isMember = await churchManagementService.isChurchMember(input.form.churchId, input.submitterUserId);
      if (!isMember) throw new Error('Você precisa ser membro desta igreja para se candidatar como voluntário.');
    }
    const routing = getQrSubmissionRouting(input.form.formType);
    const submissionPayload = {
      church_id: input.form.churchId,
      form_id: input.form.id,
      form_type: input.form.formType,
      submitter_user_id: input.submitterUserId ?? null,
      submitter_name: input.submitterName ?? null,
      submitter_contact: input.submitterContact ?? null,
      payload: input.payload,
      is_sensitive: input.isSensitive ?? routing.isSensitive,
      public_status: 'Recebido pela igreja',
      public_feedback: input.form.confirmationText,
      internal_summary: `${input.form.title} recebido por formulario publico.`,
      next_action: routing.nextAction,
    };
    const { data, error } = await supabase.from('church_form_submissions').insert(submissionPayload).select().single();
    if (error) throw new Error(`Erro ao enviar formulario. ${formatSupabaseError(error)}`);
    try {
      await supabase.rpc('increment_church_qr_counter', { p_form_id: input.form.id, p_counter: 'submission' });
    } catch {
      // Contador e otimizacao; a submissao ja foi persistida.
    }
    const submission = mapSubmission(data);
    try {
      await supabase.rpc('notify_church_form_submission', { p_submission_id: submission.id });
    } catch {
      await createOperationalNotification({
        churchId: input.form.churchId,
        audienceRole: routing.audienceRole,
        title: 'Novo pedido recebido',
        message: `${input.form.title} recebeu uma nova resposta pelo QR publico.`,
        eventType: 'submission_created',
        severity: routing.severity,
        channel: 'dashboard',
        link: '/gestao-igreja/inbox',
        sourceType: 'form_submission',
        sourceId: submission.id,
        dedupeKey: `submission_created:${submission.id}`,
        payload: { formId: input.form.id, formType: input.form.formType },
      });
    }
    return submission;
  },

  listSubmissions: async (churchId: string, options?: ListSubmissionsOptions): Promise<ChurchFormSubmission[]> => {
    try {
      let query = supabase.from('church_form_submissions').select('id, church_id, form_id, form_type, submitter_user_id, submitter_name, submitter_contact, payload, status, public_status, priority, assigned_to, is_sensitive, public_feedback, internal_summary, next_action, source_type, source_id, closed_at, created_at, updated_at').eq('church_id', churchId).order('created_at', { ascending: false });
      if (options?.status) query = query.eq('status', options.status);
      if (options?.assignedTo) query = query.eq('assigned_to', options.assignedTo);
      if (options?.submitterUserId) query = query.eq('submitter_user_id', options.submitterUserId);
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapSubmission);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar inbox. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  listMemberSubmissions: async (userId: string, options?: PageOptions): Promise<ChurchFormSubmission[]> => {
    if (!userId) return [];
    try {
      const query = supabase
        .from('church_form_submissions')
        .select('id, church_id, form_id, form_type, submitter_user_id, submitter_name, submitter_contact, payload, status, public_status, priority, is_sensitive, public_feedback, next_action, closed_at, created_at, updated_at')
        .eq('submitter_user_id', userId)
        .order('created_at', { ascending: false });
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapSubmission);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar seus acompanhamentos. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  getSubmission: async (submissionId: string): Promise<ChurchFormSubmission | null> => {
    const { data, error } = await supabase
      .from('church_form_submissions')
      .select('id, church_id, form_id, form_type, submitter_user_id, submitter_name, submitter_contact, payload, status, public_status, priority, assigned_to, is_sensitive, public_feedback, internal_summary, next_action, source_type, source_id, closed_at, created_at, updated_at')
      .eq('id', submissionId)
      .maybeSingle();
    if (error) throw new Error(`Erro ao carregar submissao. ${formatSupabaseError(error)}`);
    return data ? mapSubmission(data) : null;
  },

  approveVolunteerSubmission: async (input: { submissionId: string; teamId: string; functionId?: string | null; approvedBy?: string | null }): Promise<{ submission: ChurchFormSubmission; role: ChurchMemberRole }> => {
    const submission = await churchManagementService.getSubmission(input.submissionId);
    if (!submission) throw new Error('Candidatura não encontrada.');
    if (submission.formType !== 'volunteer') throw new Error('Esta solicitação não é uma candidatura de voluntariado.');
    if (!submission.submitterUserId) throw new Error('A candidatura precisa estar vinculada a um usuário para ser aprovada.');
    if (submission.status === 'closed' || submission.status === 'archived') throw new Error('Esta candidatura já foi encerrada.');

    const team = await churchManagementService.getTeam(input.teamId);
    if (!team || team.churchId !== submission.churchId || team.status !== 'active') {
      throw new Error('Selecione uma equipe ativa desta igreja.');
    }

    const isMember = await churchManagementService.isChurchMember(submission.churchId, submission.submitterUserId);
    if (!isMember) throw new Error('O candidato precisa ser membro desta igreja antes da aprovação.');

    let selectedFunction: ChurchTeamFunction | null = null;
    if (input.functionId) {
      const functions = await churchManagementService.listTeamFunctions(submission.churchId, team.id);
      selectedFunction = functions.find((item) => item.id === input.functionId && item.status === 'active') ?? null;
      if (!selectedFunction) throw new Error('Selecione uma função ativa da equipe.');
    }

    const role = await churchManagementService.grantRole({
      churchId: submission.churchId,
      userId: submission.submitterUserId,
      role: 'volunteer',
      scopeType: 'team',
      scopeId: team.id,
      grantedBy: input.approvedBy ?? null,
      notify: false,
      meta: {
        source_submission_id: submission.id,
        team_function_id: selectedFunction?.id ?? null,
        team_function_name: selectedFunction?.name ?? null,
        approved_at: now(),
      },
    });

    const functionDetail = selectedFunction ? `, na função ${selectedFunction.name}` : '';
    const updatedSubmission = await churchManagementService.updateSubmissionStatus(submission.id, {
      status: 'answered',
      publicStatus: 'Aprovado para servir',
      publicFeedback: `Sua candidatura foi aprovada para a equipe ${team.name}${functionDetail}.`,
      nextAction: 'Aguarde o contato da liderança da equipe para receber as próximas orientações.',
      assignedTo: input.approvedBy ?? submission.assignedTo ?? null,
    });

    return { submission: updatedSubmission, role };
  },

  updateSubmissionStatus: async (submissionId: string, updates: { status?: ChurchSubmissionStatus; publicStatus?: string; assignedTo?: string | null; priority?: ChurchSubmissionPriority; nextAction?: string; publicFeedback?: string }): Promise<ChurchFormSubmission> => {
    const payload = {
      status: updates.status,
      public_status: updates.publicStatus,
      assigned_to: updates.assignedTo,
      priority: updates.priority,
      next_action: updates.nextAction,
      public_feedback: updates.publicFeedback,
      updated_at: now(),
      closed_at: updates.status === 'closed' ? now() : undefined,
    };
    const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const { data, error } = await supabase.from('church_form_submissions').update(cleaned).eq('id', submissionId).select().single();
    if (error) throw new Error(`Erro ao atualizar submissao. ${formatSupabaseError(error)}`);
    const submission = mapSubmission(data);
    if (submission.submitterUserId) {
      await createOperationalNotification({
        churchId: submission.churchId,
        userId: submission.submitterUserId,
        title: 'Atualizacao do seu acompanhamento',
        message: submission.publicFeedback || submission.publicStatus || 'A igreja atualizou o status do seu pedido.',
        eventType: 'submission_status_updated',
        severity: updates.status === 'closed' ? 'info' : 'action',
        channel: 'member',
        link: '/minha-igreja/acompanhamento',
        sourceType: 'form_submission',
        sourceId: submission.id,
        dedupeKey: `submission_status_updated:${submission.id}:${submission.status}`,
      });
    }
    return submission;
  },

  listNotifications: async (churchId: string, options?: PageOptions & { userId?: string }): Promise<ChurchManagementNotification[]> => {
    try {
      let query = supabase.from('church_management_notifications').select('id, church_id, user_id, audience_role, title, message, event_type, severity, channel, link, dedupe_key, read_at, dismissed_at, created_at').eq('church_id', churchId).order('created_at', { ascending: false });
      if (options?.userId) query = query.eq('user_id', options.userId);
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapNotification);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar notificacoes. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  getManagerAlerts: async (churchId: string, nowDate = new Date()): Promise<ChurchManagerAlert[]> => {
    const endDate = new Date(nowDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    const [notifications, assignments, submissions, cultos] = await Promise.all([
      churchManagementService.listNotifications(churchId, { limit: 50 }),
      churchManagementService.listAssignments(churchId, { status: 'pending', limit: 100 }),
      churchManagementService.listSubmissions(churchId, { limit: 100 }),
      churchManagementService.getCultoOperationalItems(churchId, 20, {
        startDate: nowDate.toISOString(),
        endDate: endDate.toISOString(),
      }),
    ]);
    return buildChurchManagerAlerts({ notifications, assignments, submissions, cultos, now: nowDate });
  },

  updateNotificationState: async (notificationId: string, action: 'read' | 'dismiss'): Promise<ChurchManagementNotification> => {
    const payload = getNotificationStatePatch(action, now());
    const { data, error } = await supabase
      .from('church_management_notifications')
      .update(payload)
      .eq('id', notificationId)
      .select()
      .single();
    if (error) throw new Error(`Erro ao atualizar notificacao. ${formatSupabaseError(error)}`);
    try {
      await supabase
        .from('church_notification_events')
        .update({ status: action === 'dismiss' ? 'dismissed' : 'notified' })
        .eq('notification_id', notificationId);
    } catch {
      // Eventos estruturados podem nao existir em ambientes antigos.
    }
    return mapNotification(data);
  },

  markNotificationsRead: async (churchId: string, notificationIds?: string[]): Promise<void> => {
    let query = supabase
      .from('church_management_notifications')
      .update({ read_at: now() })
      .eq('church_id', churchId)
      .is('read_at', null);
    if (notificationIds?.length) query = query.in('id', notificationIds);
    const { error } = await query;
    if (error) throw new Error(`Erro ao marcar notificacoes como lidas. ${formatSupabaseError(error)}`);
  },

  awardBadge: async (input: { churchId: string; userId: string; badgeKey: string; title: string; description?: string; manaAmount?: number; visibility?: 'private' | 'team' | 'church'; sourceType?: string; sourceId?: string; awardedBy?: string | null }): Promise<ChurchVolunteerBadge> => {
    const { data, error } = await supabase.from('church_volunteer_badges').insert({
      church_id: input.churchId,
      user_id: input.userId,
      badge_key: input.badgeKey,
      title: input.title,
      description: input.description ?? '',
      mana_amount: input.manaAmount ?? 0,
      visibility: input.visibility ?? 'private',
      source_type: input.sourceType ?? 'manual',
      source_id: input.sourceId ?? null,
      awarded_by: input.awardedBy ?? null,
    }).select().single();
    if (error) throw new Error(`Erro ao conceder insignia. ${formatSupabaseError(error)}`);
    const badge = mapBadge(data);
    await createOperationalNotification({
      churchId: input.churchId,
      userId: input.userId,
      title: 'Nova insignia recebida',
      message: `${badge.title} foi registrada como reconhecimento de servico.`,
      eventType: 'badge_awarded',
      severity: 'info',
      channel: 'member',
      link: '/minha-igreja/insignias',
      sourceType: input.sourceType ?? 'badge',
      sourceId: badge.id,
      dedupeKey: `badge_awarded:${badge.id}`,
      payload: { badgeKey: badge.badgeKey, sourceId: input.sourceId ?? null, sourceType: input.sourceType ?? null },
    });
    return badge;
  },

  listBadges: async (churchId: string, options?: PageOptions & { userId?: string }): Promise<ChurchVolunteerBadge[]> => {
    try {
      let query = supabase.from('church_volunteer_badges').select('id, church_id, user_id, badge_key, title, description, mana_amount, visibility, source_type, source_id, awarded_by, awarded_at, meta').eq('church_id', churchId).order('awarded_at', { ascending: false });
      if (options?.userId) query = query.eq('user_id', options.userId);
      const { data, error } = await rangeQuery(query, options);
      if (error) throw error;
      return (data ?? []).map(mapBadge);
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao carregar insignias. ${formatSupabaseError(error)}`);
      return [];
    }
  },

  getCultoPlusStats: async (churchId: string): Promise<{ checkinsCount: number; servicesCount: number; activeSchedulesCount: number }> => {
    try {
      const [
        { count: checkinsCount, error: checkinsError },
        { count: servicesCount, error: servicesError },
        { count: activeSchedulesCount, error: schedulesError },
      ] = await Promise.all([
        supabase.from('service_checkins').select('id', { count: 'exact', head: true }).eq('church_id', churchId),
        supabase.from('church_services').select('id', { count: 'exact', head: true }).eq('church_id', churchId),
        supabase.from('service_schedule_assignments').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('status', 'confirmed'),
      ]);
      const error = checkinsError || servicesError || schedulesError;
      if (error) throw error;
      return {
        checkinsCount: checkinsCount ?? 0,
        servicesCount: servicesCount ?? 0,
        activeSchedulesCount: activeSchedulesCount ?? 0,
      };
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw error;
      return { checkinsCount: 0, servicesCount: 0, activeSchedulesCount: 0 };
    }
  },

  getCultoOperationalItems: async (churchId: string, limit = 6, options?: { startDate?: string; endDate?: string }): Promise<ChurchCultoOperationalItem[]> => {
    try {
      const services = (options?.startDate && options?.endDate
        ? await cultoPlusService.getServicesByChurchRange(churchId, {
          startDate: options.startDate,
          endDate: options.endDate,
          includeDrafts: true,
          limit,
        })
        : await cultoPlusService.getServicesByChurch(churchId, { includeDrafts: true, limit }))
        .filter((service) => service.status !== 'archived');
      let assignmentsByService = new Map<string, ChurchAssignment[]>();
      try {
        assignmentsByService = await getCultoTeamAssignmentsByService(churchId, services.map((service) => service.id));
      } catch (assignmentsError) {
        if (!isMissingChurchManagementSchema(assignmentsError)) throw assignmentsError;
      }
      const items = await Promise.all(services.map(async (service) => {
        try {
          const [stats, schedules] = await Promise.all([
            cultoPlusService.getServiceStats(service.id),
            cultoPlusService.getScheduleAssignments(service.id),
          ]);
          return {
            service,
            checkinsCount: stats.checkinsCount,
            prayersCount: stats.prayersCount,
            schedulesCount: schedules.length,
            pendingSchedulesCount: schedules.filter((item) => item.status === 'pending').length,
            schedules,
            assignments: assignmentsByService.get(service.id) ?? [],
          };
        } catch {
          return {
            service,
            checkinsCount: 0,
            prayersCount: 0,
            schedulesCount: 0,
            pendingSchedulesCount: 0,
            schedules: [],
            assignments: [],
          };
        }
      }));
      return items.sort((a, b) => new Date(a.service.startsAt).getTime() - new Date(b.service.startsAt).getTime());
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw error;
      return [];
    }
  },

  syncCultoPlusOperationalItems: async (churchId: string, limit = 10): Promise<ChurchCultoSyncResult> => {
    const result: ChurchCultoSyncResult = {
      servicesChecked: 0,
      assignmentsCreated: 0,
      assignmentsUpdated: 0,
      submissionsCreated: 0,
      submissionsUpdated: 0,
    };

    try {
      const services = (await cultoPlusService.getServicesByChurch(churchId, { includeDrafts: true, limit }))
        .filter((service) => service.status !== 'archived');
      result.servicesChecked = services.length;

      for (const service of services) {
        const [schedules, prayers] = await Promise.all([
          cultoPlusService.getScheduleAssignments(service.id),
          cultoPlusService.getPublicPrayerRequests(service.id),
        ]);

        for (const schedule of schedules) {
          const sourceId = `culto_schedule:${schedule.id}`;
          const existing = await findAssignmentBySource(churchId, sourceId);
          const payload = buildAssignmentPayloadFromSchedule(service, schedule);

          if (existing) {
            await supabase
              .from('church_assignments')
              .update({ ...payload, updated_at: now() })
              .eq('id', existing.id);
            result.assignmentsUpdated += 1;
          } else {
            const { error } = await supabase.from('church_assignments').insert({
              ...payload,
              church_id: churchId,
              source_type: 'culto_plus_schedule',
              source_id: sourceId,
            });
            if (error) throw error;
            result.assignmentsCreated += 1;
          }
        }

        for (const prayer of prayers) {
          const sourceId = `culto_prayer:${prayer.id}`;
          const existing = await findSubmissionBySource(churchId, sourceId);
          const payload = buildSubmissionPayloadFromPrayer(service, prayer);

          if (existing) {
            await supabase
              .from('church_form_submissions')
              .update({ ...payload, updated_at: now() })
              .eq('id', existing.id);
            result.submissionsUpdated += 1;
          } else {
            const { error } = await supabase.from('church_form_submissions').insert({
              ...payload,
              church_id: churchId,
              source_type: 'culto_plus_prayer',
              source_id: sourceId,
            });
            if (error) throw error;
            result.submissionsCreated += 1;
          }
        }
      }

      if (result.assignmentsCreated + result.submissionsCreated > 0) {
        await createOperationalNotification({
          churchId,
          audienceRole: 'leader',
          title: 'Culto+ sincronizado',
          message: `${result.assignmentsCreated} escala(s) e ${result.submissionsCreated} pedido(s) entraram na Gestao da Igreja.`,
          eventType: 'culto_plus_synced',
          severity: 'info',
          channel: 'dashboard',
          link: '/gestao-igreja/cultos',
          sourceType: 'culto_plus',
          sourceId: churchId,
          dedupeKey: `culto_plus_synced:${churchId}:${now().slice(0, 10)}`,
          payload: result,
        });
      }

      return result;
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao sincronizar Culto+ com Gestao. ${formatSupabaseError(error)}`);
      return result;
    }
  },

  getGroupsStats: async (churchId: string): Promise<{ cellsCount: number; pendingInvitesCount: number }> => {
    try {
      const [
        { count: cellsCount, error: cellsError },
        { count: pendingInvitesCount, error: invitesError },
      ] = await Promise.all([
        supabase.from('cells').select('id', { count: 'exact', head: true }).eq('church_id', churchId),
        supabase.from('group_access_invites').select('id', { count: 'exact', head: true }).eq('church_id', churchId).eq('status', 'pending'),
      ]);
      const error = cellsError || invitesError;
      if (error) throw error;
      return {
        cellsCount: cellsCount ?? 0,
        pendingInvitesCount: pendingInvitesCount ?? 0,
      };
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw error;
      return { cellsCount: 0, pendingInvitesCount: 0 };
    }
  },

  getGroupOperationalItems: async (churchId: string, limit = 20): Promise<ChurchGroupOperationalItem[]> => {
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('cells')
        .select('id, church_id, parent_group_id, name, slug, privacy, leader_name, leader_id, created_by, created_at')
        .eq('church_id', churchId)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (groupsError) throw groupsError;

      const groupIds = (groups ?? []).map((group: any) => group.id).filter(Boolean);
      const inviteCounts = new Map<string, number>();

      if (groupIds.length > 0) {
        const { data: invites, error: invitesError } = await supabase
          .from('group_access_invites')
          .select('group_id')
          .eq('church_id', churchId)
          .eq('status', 'pending')
          .in('group_id', groupIds);
        if (invitesError) throw invitesError;

        for (const invite of invites ?? []) {
          const groupId = invite.group_id;
          if (groupId) inviteCounts.set(groupId, (inviteCounts.get(groupId) ?? 0) + 1);
        }
      }

      return (groups ?? []).map((group: any) => ({
        group: mapGroup(group),
        pendingInvitesCount: inviteCounts.get(group.id) ?? 0,
      }));
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw error;
      return [];
    }
  },

  createGroupInviteFollowUp: async (churchId: string): Promise<ChurchGroupFollowUpResult> => {
    const result: ChurchGroupFollowUpResult = {
      groupsChecked: 0,
      pendingInvites: 0,
      notificationsCreated: 0,
    };

    try {
      const items = await churchManagementService.getGroupOperationalItems(churchId, 50);
      result.groupsChecked = items.length;
      result.pendingInvites = items.reduce((sum, item) => sum + item.pendingInvitesCount, 0);

      for (const item of items.filter((entry) => entry.pendingInvitesCount > 0)) {
        await createOperationalNotification({
          churchId,
          audienceRole: 'leader',
          title: 'Convites de grupo pendentes',
          message: `${item.group.name} tem ${item.pendingInvitesCount} convite(s) aguardando acompanhamento.`,
          eventType: 'group_invites_pending',
          severity: 'action',
          channel: 'dashboard',
          link: '/gestao-igreja/grupos',
          sourceType: 'church_group',
          sourceId: item.group.id,
          dedupeKey: `group_invites_pending:${item.group.id}:${now().slice(0, 10)}`,
          payload: { pendingInvitesCount: item.pendingInvitesCount },
        });
        result.notificationsCreated += 1;
      }

      return result;
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw new Error(`Erro ao acompanhar convites de grupos. ${formatSupabaseError(error)}`);
      return result;
    }
  },

  createAnalyticsSnapshot: async (churchId: string): Promise<any> => {
    try {
      const [summary, cultoStats, groupStats, membersCountRes] = await Promise.all([
        churchManagementService.getSummary(churchId),
        churchManagementService.getCultoPlusStats(churchId),
        churchManagementService.getGroupsStats(churchId),
        supabase.from('memberships').select('id', { count: 'exact', head: true }).eq('church_id', churchId),
      ]);

      const snapshot = {
        church_id: churchId,
        period_key: now().slice(0, 10),
        members_count: membersCountRes.count ?? 0,
        active_members_count: membersCountRes.count ?? 0,
        visitors_count: 0,
        new_members_count: 0,
        prayer_requests_count: summary.openSubmissions,
        care_items_open_count: summary.openSubmissions,
        care_items_overdue_count: 0,
        volunteer_applications_count: summary.pendingAssignments,
        active_volunteers_count: summary.activeTeams,
        services_count: cultoStats.servicesCount,
        checkins_count: cultoStats.checkinsCount,
        groups_count: groupStats.cellsCount,
        active_groups_count: groupStats.cellsCount,
        forms_submissions_count: summary.openSubmissions,
        qr_scans_count: 0,
        created_at: now(),
      };

      const { data, error } = await supabase
        .from('church_analytics_snapshots')
        .insert(snapshot)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw error;
      return { church_id: churchId, period_key: now().slice(0, 10), created_at: now() };
    }
  },

  getAnalyticsSnapshots: async (churchId: string, limit = 30): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('church_analytics_snapshots')
        .select('*')
        .eq('church_id', churchId)
        .order('period_key', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    } catch (error) {
      if (!isMissingChurchManagementSchema(error)) throw error;
      return [];
    }
  },
};
