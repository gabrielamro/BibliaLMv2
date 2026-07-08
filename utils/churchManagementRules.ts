import type {
  ChurchMemberRole,
  ChurchOperationalRole,
  ChurchQrFormType,
  ChurchSubmissionPriority,
  ChurchSubmissionStatus,
} from '../types';

export const DEFAULT_CHURCH_MANAGEMENT_ROLES: ChurchOperationalRole[] = ['church_manager', 'pastor', 'leader'];

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
