import { supabase } from './supabase';

export type ChurchNotificationEventInput = {
  churchId: string;
  userId?: string | null;
  audienceRole?: string | null;
  title: string;
  message: string;
  eventType: string;
  sourceType?: string | null;
  sourceId?: string | null;
  severity?: 'info' | 'action' | 'urgent';
  channel?: 'dashboard' | 'member' | 'both';
  link?: string | null;
  dedupeKey?: string | null;
  payload?: Record<string, any>;
};

const EVENT_DEFAULTS: Record<string, Pick<Required<ChurchNotificationEventInput>, 'severity' | 'channel'>> = {
  role_granted: { severity: 'action', channel: 'both' },
  team_created: { severity: 'info', channel: 'dashboard' },
  assignment_created: { severity: 'action', channel: 'both' },
  assignment_accepted: { severity: 'action', channel: 'dashboard' },
  assignment_declined: { severity: 'action', channel: 'dashboard' },
  team_service_assignment_approval_requested: { severity: 'action', channel: 'dashboard' },
  team_service_assignment_approved: { severity: 'action', channel: 'both' },
  qr_form_created: { severity: 'info', channel: 'dashboard' },
  submission_created: { severity: 'action', channel: 'dashboard' },
  submission_status_updated: { severity: 'action', channel: 'member' },
  volunteer_badge_awarded: { severity: 'info', channel: 'member' },
  badge_awarded: { severity: 'info', channel: 'member' },
};

export const churchNotificationService = {
  createOperationalNotification: async (input: ChurchNotificationEventInput): Promise<void> => {
    const defaults = EVENT_DEFAULTS[input.eventType] ?? { severity: 'info' as const, channel: 'dashboard' as const };
    const severity = input.severity ?? defaults.severity;
    const channel = input.channel ?? defaults.channel;
    let eventId: string | null = null;

    try {
      const { data } = await supabase.from('church_notification_events').insert({
        church_id: input.churchId,
        user_id: input.userId ?? null,
        audience_role: input.audienceRole ?? null,
        event_type: input.eventType,
        severity,
        channel,
        source_type: input.sourceType ?? null,
        source_id: input.sourceId ?? null,
        dedupe_key: input.dedupeKey ?? null,
        payload: input.payload ?? {},
      }).select('id').maybeSingle();
      eventId = data?.id ?? null;
    } catch {
      // Ambientes sem a tabela nova continuam apenas com notificacao visivel.
    }

    try {
      const { data } = await supabase.from('church_management_notifications').insert({
        church_id: input.churchId,
        user_id: input.userId ?? null,
        audience_role: input.audienceRole ?? null,
        title: input.title,
        message: input.message,
        event_type: input.eventType,
        severity,
        channel,
        link: input.link ?? null,
        dedupe_key: input.dedupeKey ?? null,
      }).select('id').maybeSingle();

      if (eventId && data?.id) {
        await supabase
          .from('church_notification_events')
          .update({ status: 'notified', notification_id: data.id })
          .eq('id', eventId);
      }
    } catch {
      // Notificacoes operacionais nao podem bloquear o fluxo principal.
    }
  },
};
