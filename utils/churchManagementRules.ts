import type {
  ChurchMemberRole,
  ChurchOperationalRole,
  ChurchQrFormType,
  ChurchSubmissionPriority,
  ChurchSubmissionStatus,
} from '../types';

// Pastor possui uma visao pastoral propria. A gestao operacional exige papel de
// gestor ou lider e, no caso do lider, continua limitada ao escopo concedido.
export const DEFAULT_CHURCH_MANAGEMENT_ROLES: ChurchOperationalRole[] = ['church_manager', 'leader'];
export const VOLUNTEER_REJECTION_PUBLIC_STATUS = 'Solicitação recusada';

export function getVolunteerApplicantIdentity(input: {
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  metadataDisplayName?: string | null;
  metadataFullName?: string | null;
}): { name: string; handle: string } {
  const emailPrefix = input.email?.split('@')[0]?.trim() ?? '';
  const username = (input.username?.trim() || emailPrefix).replace(/^@+/, '');
  const aliases = new Set([username, emailPrefix, `@${username}`, 'membro', 'usuario', 'usuário'].filter(Boolean).map(normalizeIdentityValue));
  const name = [input.displayName, input.metadataFullName, input.metadataDisplayName]
    .map((value) => value?.trim() ?? '')
    .find((value) => value && !aliases.has(normalizeIdentityValue(value))) ?? '';

  return { name, handle: username ? `@${username}` : '' };
}

export function canAccessChurchManagement(params: {
  userId?: string | null;
  roles: ChurchMemberRole[];
  allowedRoles?: ChurchOperationalRole[];
  isPlatformAdmin?: boolean;
  isChurchAdmin?: boolean;
}): boolean {
  if (params.isPlatformAdmin || params.isChurchAdmin) return true;
  if (!params.userId) return false;
  const allowedRoles = params.allowedRoles ?? DEFAULT_CHURCH_MANAGEMENT_ROLES;
  return params.roles.some((role) =>
    role.userId === params.userId &&
    role.status === 'active' &&
    allowedRoles.includes(role.role)
  );
}

export function getQrSubmissionRouting(formType: ChurchQrFormType): {
  isSensitive: boolean;
  nextAction: string;
  audienceRole: 'pastor' | 'leader';
  severity: 'urgent' | 'action';
} {
  const isSensitive = formType === 'prayer' || formType === 'pastor_care';
  return {
    isSensitive,
    nextAction: formType === 'volunteer' ? 'Encaminhar para lideranca' : 'Atribuir responsavel',
    audienceRole: isSensitive ? 'pastor' : 'leader',
    severity: isSensitive ? 'urgent' : 'action',
  };
}

export function extractQrSubmitterFields(payload: Record<string, FormDataEntryValue | string | number | null | undefined>): {
  submitterName: string;
  submitterContact: string;
} {
  return {
    submitterName: getPayloadValue(payload, ['Nome', 'name']),
    submitterContact: getPayloadValue(payload, ['Contato', 'Telefone', 'Telefone ou email', 'Email']),
  };
}

export function getInboxStatusToggleUpdate(currentStatus: ChurchSubmissionStatus): {
  status: ChurchSubmissionStatus;
  publicStatus: string;
  nextAction: string;
} {
  const status = currentStatus === 'waiting_member' ? 'closed' : 'waiting_member';
  return {
    status,
    publicStatus: status === 'closed' ? 'Encerrado pela igreja' : 'Aguardando sua resposta',
    nextAction: status === 'closed' ? 'Sem acao pendente' : 'Aguardar retorno do membro',
  };
}

export function getInboxAssignmentUpdate(params: {
  currentStatus: ChurchSubmissionStatus;
  assigneeDraft: string;
  priority: ChurchSubmissionPriority;
  publicStatus: string;
}): {
  status: ChurchSubmissionStatus;
  assignedTo: string | null;
  priority: ChurchSubmissionPriority;
  publicStatus: string;
  nextAction: string;
} {
  const assignedTo = params.assigneeDraft.trim() || null;
  return {
    status: assignedTo && params.currentStatus === 'received' ? 'assigned' : params.currentStatus,
    assignedTo,
    priority: params.priority,
    publicStatus: assignedTo ? 'Encaminhado para responsavel' : params.publicStatus,
    nextAction: assignedTo ? 'Responsavel deve acompanhar retorno' : 'Atribuir responsavel',
  };
}

export function getVolunteerRejectionUpdate(reason?: string | null): {
  status: 'closed';
  publicStatus: string;
  publicFeedback: string;
  nextAction: string;
} {
  const normalizedReason = reason?.trim() ?? '';
  const reasonFeedback = normalizedReason
    ? ` Retorno da liderança: ${normalizedReason}${/[.!?]$/.test(normalizedReason) ? '' : '.'}`
    : '';
  const retryMessage = 'Você pode enviar uma nova solicitação de voluntariado quando desejar.';

  return {
    status: 'closed',
    publicStatus: VOLUNTEER_REJECTION_PUBLIC_STATUS,
    publicFeedback: `Após avaliação, sua solicitação de voluntariado não foi aprovada neste momento.${reasonFeedback} ${retryMessage}`,
    nextAction: retryMessage,
  };
}

export function splitVolunteerLeadershipFeedback(feedback: string): {
  before: string;
  leadership: string;
  after: string;
} {
  const leadershipMarker = 'Retorno da liderança:';
  const retryMarker = 'Você pode enviar uma nova solicitação de voluntariado quando desejar.';
  const leadershipIndex = feedback.indexOf(leadershipMarker);
  if (leadershipIndex < 0) return { before: feedback, leadership: '', after: '' };

  const descriptionStart = leadershipIndex + leadershipMarker.length;
  const retryIndex = feedback.indexOf(retryMarker, descriptionStart);
  return {
    before: feedback.slice(0, leadershipIndex).trimEnd(),
    leadership: feedback.slice(descriptionStart, retryIndex >= 0 ? retryIndex : undefined).trim(),
    after: retryIndex >= 0 ? feedback.slice(retryIndex).trim() : '',
  };
}

export function getNotificationStatePatch(action: 'read' | 'dismiss', timestamp: string): {
  read_at: string;
  dismissed_at?: string;
} {
  return action === 'dismiss'
    ? { dismissed_at: timestamp, read_at: timestamp }
    : { read_at: timestamp };
}

function getPayloadValue(payload: Record<string, FormDataEntryValue | string | number | null | undefined>, labels: string[]) {
  const normalizedLabels = labels.map((label) => label.toLowerCase());
  const entry = Object.entries(payload).find(([key]) => normalizedLabels.includes(key.toLowerCase()));
  return entry && entry[1] != null ? String(entry[1]).trim() : '';
}

function normalizeIdentityValue(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}
