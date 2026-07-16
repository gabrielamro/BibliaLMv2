import type { ChurchAssignment, ChurchFormSubmission, ChurchManagementNotification, ChurchManagerAlert, ChurchService } from '../types';

type CultoAlertSource = {
  service: ChurchService;
  schedulesCount: number;
  pendingSchedulesCount: number;
};

const CLOSED_SUBMISSION_STATUSES = new Set(['closed', 'archived']);
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function getServiceConfigurationIssues(item: CultoAlertSource): string[] {
  const issues: string[] = [];
  if (item.service.status === 'draft') issues.push('publicação');
  if (!item.service.theme?.trim()) issues.push('tema');
  if (!item.service.preacherName?.trim()) issues.push('pregador');
  if (!item.service.keyVerseRef?.trim()) issues.push('texto-base');
  if (!item.service.liturgyItems?.length) issues.push('programação');
  if (item.schedulesCount === 0) issues.push('escala');
  else if (item.pendingSchedulesCount > 0) issues.push('aceites da escala');
  return issues;
}

export function buildChurchManagerAlerts(input: {
  notifications: ChurchManagementNotification[];
  assignments: ChurchAssignment[];
  submissions: ChurchFormSubmission[];
  cultos: CultoAlertSource[];
  now?: Date;
}): ChurchManagerAlert[] {
  const now = input.now ?? new Date();
  const nowMs = now.getTime();

  const approvals = input.assignments
    .filter((item) => item.status === 'pending' && item.sourceType === 'gestao_culto_team')
    .map<ChurchManagerAlert>((item) => ({
      id: `approval:${item.id}`,
      kind: 'approval',
      title: 'Aprovação de escala pendente',
      message: `${item.title} aguarda aprovação antes de notificar os voluntários.`,
      severity: 'action',
      link: '/gestao-igreja/designacoes',
      createdAt: item.createdAt,
      dueAt: item.startsAt,
    }));

  const volunteers = input.submissions
    .filter((item) => item.formType === 'volunteer' && !CLOSED_SUBMISSION_STATUSES.has(item.status))
    .map<ChurchManagerAlert>((item) => ({
      id: `volunteer:${item.id}`,
      kind: 'volunteer',
      title: 'Solicitação de voluntariado',
      message: `${item.submitterName || 'Uma pessoa'} deseja servir e aguarda acompanhamento da liderança.`,
      severity: item.priority === 'urgent' ? 'urgent' : 'action',
      link: '/gestao-igreja/voluntariado',
      createdAt: item.createdAt,
    }));

  const cultos = input.cultos.flatMap<ChurchManagerAlert>((item) => {
    const startsAtMs = new Date(item.service.startsAt).getTime();
    if (!Number.isFinite(startsAtMs) || startsAtMs < nowMs || startsAtMs - nowMs > THREE_DAYS_MS) return [];
    const issues = getServiceConfigurationIssues(item);
    if (issues.length === 0) return [];
    return [{
      id: `service:${item.service.id}`,
      kind: 'service_configuration',
      title: 'Culto próximo precisa de configuração',
      message: `${item.service.title}: revise ${issues.join(', ')} antes do culto.`,
      severity: startsAtMs - nowMs <= 24 * 60 * 60 * 1000 ? 'urgent' : 'action',
      link: `/gestao-igreja/cultos/${item.service.id}`,
      createdAt: item.service.updatedAt || item.service.createdAt,
      dueAt: item.service.startsAt,
    }];
  });

  const persisted = input.notifications
    .filter((item) => !item.dismissedAt && (item.channel === 'dashboard' || item.channel === 'both'))
    .filter((item) => item.eventType !== 'team_service_assignment_approval_requested')
    .map<ChurchManagerAlert>((item) => ({
      id: `notification:${item.id}`,
      kind: 'notification',
      title: item.title,
      message: item.message,
      severity: item.severity,
      link: item.link || '/gestao-igreja/notificacoes',
      createdAt: item.createdAt,
    }));

  return [...cultos, ...approvals, ...volunteers, ...persisted]
    .sort((a, b) => {
      const severityOrder = { urgent: 0, action: 1, info: 2 };
      const severityDifference = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDifference !== 0) return severityDifference;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}
