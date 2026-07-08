import type { ActionType, SystemSettings, UserActivity, UserProfile } from '../types';

type ActivityRuleInput = {
  profile: UserProfile;
  action: ActionType;
  details: string;
  meta?: any;
  systemSettings: SystemSettings;
  now?: string;
};

export type ManaAudience = 'user' | 'pastor' | 'church';
export type ManaRuleStatus = 'implemented' | 'partial' | 'tracked_only' | 'disabled';

export type ManaActionRule = {
  action: ActionType;
  label: string;
  description: string;
  xpSetting?: keyof SystemSettings['gamification'];
  defaultXp: number;
  dailyLimit?: number;
  cooldownSeconds?: number;
  minTextLength?: number;
  uniqueKeyStrategy: 'none' | 'daily' | 'source' | 'source_daily';
  audience: ManaAudience[];
  status: ManaRuleStatus;
  stat?: keyof UserProfile['stats'];
};

export const MANA_ACTION_RULES: Record<ActionType, ManaActionRule> = {
  reading_chapter: { action: 'reading_chapter', label: 'Ler capitulo', description: 'Concluir um capitulo da Biblia.', xpSetting: 'xpReadingChapter', defaultXp: 20, dailyLimit: 12, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'implemented', stat: 'totalChaptersRead' },
  daily_goal: { action: 'daily_goal', label: 'Meta diaria', description: 'Completar uma meta de leitura ou rotina.', xpSetting: 'xpDailyGoal', defaultXp: 50, dailyLimit: 1, uniqueKeyStrategy: 'daily', audience: ['user'], status: 'implemented' },
  reading_presence: { action: 'reading_presence', label: 'Presenca na Palavra', description: 'Permanecer em leitura ativa por pelo menos 5 minutos.', xpSetting: 'xpReadingPresence', defaultXp: 5, dailyLimit: 1, uniqueKeyStrategy: 'source_daily', audience: ['user'], status: 'implemented' },
  devotional: { action: 'devotional', label: 'Devocional', description: 'Concluir o devocional do dia.', xpSetting: 'xpDevotional', defaultXp: 15, dailyLimit: 1, uniqueKeyStrategy: 'daily', audience: ['user'], status: 'implemented', stat: 'totalDevotionalsRead' },
  deep_study: { action: 'deep_study', label: 'Estudo profundo', description: 'Aprofundar uma reflexao, plano ou conteudo.', xpSetting: 'xpDeepStudy', defaultXp: 20, dailyLimit: 5, cooldownSeconds: 600, uniqueKeyStrategy: 'source_daily', audience: ['user'], status: 'partial' },
  create_image: { action: 'create_image', label: 'Criar arte', description: 'Gerar e salvar uma arte sacra.', xpSetting: 'xpCreateImage', defaultXp: 10, dailyLimit: 10, cooldownSeconds: 120, uniqueKeyStrategy: 'source_daily', audience: ['user'], status: 'implemented', stat: 'totalImagesGenerated' },
  share_content: { action: 'share_content', label: 'Compartilhar', description: 'Compartilhar conteudo biblico ou uma arte.', xpSetting: 'xpShare', defaultXp: 10, dailyLimit: 5, cooldownSeconds: 60, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'implemented', stat: 'totalShares' },
  mark_verse: { action: 'mark_verse', label: 'Marcar versiculo', description: 'Salvar ou marcar um versiculo.', xpSetting: 'xpMarkVerse', defaultXp: 2, dailyLimit: 10, uniqueKeyStrategy: 'source_daily', audience: ['user'], status: 'implemented', stat: 'totalVersesMarked' },
  create_sermon: { action: 'create_sermon', label: 'Criar sermao', description: 'Criar ou organizar um esboco pastoral.', xpSetting: 'xpCreateSermon', defaultXp: 40, dailyLimit: 3, cooldownSeconds: 900, uniqueKeyStrategy: 'source_daily', audience: ['user', 'pastor'], status: 'implemented', stat: 'totalSermonsCreated' },
  use_chat: { action: 'use_chat', label: 'Conversar com IA', description: 'Usar o Conselheiro/Obreiro IA de forma valida.', xpSetting: 'xpUseChat', defaultXp: 5, dailyLimit: 10, cooldownSeconds: 60, uniqueKeyStrategy: 'none', audience: ['user'], status: 'implemented', stat: 'totalChatMessages' },
  quiz_completion: { action: 'quiz_completion', label: 'Completar quiz', description: 'Finalizar um Desafio da Sabedoria.', xpSetting: 'xpQuizCompletion', defaultXp: 20, dailyLimit: 8, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial', stat: 'totalQuizzesCompleted' },
  social_follow: { action: 'social_follow', label: 'Seguir perfil', description: 'Acompanhar um usuario ou igreja.', xpSetting: 'xpSocialFollow', defaultXp: 3, dailyLimit: 10, uniqueKeyStrategy: 'source', audience: ['user'], status: 'partial' },
  prayer_wall: { action: 'prayer_wall', label: 'Oracao e intercessao', description: 'Publicar pedido ou interceder no mural.', xpSetting: 'xpPrayerWall', defaultXp: 8, dailyLimit: 5, cooldownSeconds: 120, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  create_note: { action: 'create_note', label: 'Criar anotacao', description: 'Registrar uma anotacao ou reflexao.', xpSetting: 'xpCreateNote', defaultXp: 5, dailyLimit: 8, cooldownSeconds: 60, uniqueKeyStrategy: 'source_daily', audience: ['user'], status: 'implemented', stat: 'totalNotes' },
  social_like: { action: 'social_like', label: 'Reagir', description: 'Curtir ou reagir a uma publicacao.', xpSetting: 'xpSocialLike', defaultXp: 1, dailyLimit: 10, cooldownSeconds: 15, uniqueKeyStrategy: 'source_daily', audience: ['user'], status: 'partial' },
  social_post: { action: 'social_post', label: 'Publicar no Reino', description: 'Criar uma publicacao edificante.', xpSetting: 'xpSocialPost', defaultXp: 8, dailyLimit: 4, cooldownSeconds: 180, minTextLength: 12, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  start_module: { action: 'start_module', label: 'Iniciar modulo', description: 'Comecar modulo de trilha ou jornada.', xpSetting: 'xpStartModule', defaultXp: 5, dailyLimit: 5, uniqueKeyStrategy: 'source', audience: ['user'], status: 'partial' },
  create_study: { action: 'create_study', label: 'Criar estudo', description: 'Criar e salvar um estudo.', xpSetting: 'xpCreateStudy', defaultXp: 30, dailyLimit: 4, cooldownSeconds: 600, uniqueKeyStrategy: 'source_daily', audience: ['user', 'pastor'], status: 'implemented', stat: 'studiesCreated' },
  join_plan: { action: 'join_plan', label: 'Entrar em jornada', description: 'Participar de uma jornada/plano.', xpSetting: 'xpJoinPlan', defaultXp: 10, dailyLimit: 5, uniqueKeyStrategy: 'source', audience: ['user', 'church'], status: 'partial' },
  create_evaluation: { action: 'create_evaluation', label: 'Criar avaliacao', description: 'Criar avaliacao em trilha ou sala.', xpSetting: 'xpCreateEvaluation', defaultXp: 20, dailyLimit: 4, cooldownSeconds: 600, uniqueKeyStrategy: 'source_daily', audience: ['pastor'], status: 'partial' },
  finish_track: { action: 'finish_track', label: 'Concluir trilha', description: 'Finalizar uma trilha de estudo.', xpSetting: 'xpFinishTrack', defaultXp: 60, dailyLimit: 3, uniqueKeyStrategy: 'source', audience: ['user', 'church'], status: 'partial' },
  collect_artifact: { action: 'collect_artifact', label: 'Coletar artefato', description: 'Salvar um material de apoio de uma jornada.', xpSetting: 'xpCollectArtifact', defaultXp: 5, dailyLimit: 8, uniqueKeyStrategy: 'source', audience: ['user'], status: 'partial' },
  social_interaction: { action: 'social_interaction', label: 'Interacao comunitaria', description: 'Interagir em culto, sala ou comunidade.', xpSetting: 'xpSocialInteraction', defaultXp: 5, dailyLimit: 10, cooldownSeconds: 30, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  invite_sent: { action: 'invite_sent', label: 'Convite enviado', description: 'Convidar alguem para grupo, sala ou conteudo.', xpSetting: 'xpInviteSent', defaultXp: 2, dailyLimit: 5, cooldownSeconds: 60, uniqueKeyStrategy: 'source', audience: ['user', 'pastor', 'church'], status: 'partial' },
  invite_accepted: { action: 'invite_accepted', label: 'Convite aceito', description: 'Convite aceito por uma pessoa real.', xpSetting: 'xpInviteAccepted', defaultXp: 15, dailyLimit: 5, uniqueKeyStrategy: 'source', audience: ['user', 'pastor', 'church'], status: 'partial' },
  social_comment: { action: 'social_comment', label: 'Comentar no Reino', description: 'Comentario valido em publicacao do Reino.', xpSetting: 'xpSocialComment', defaultXp: 4, dailyLimit: 8, cooldownSeconds: 45, minTextLength: 12, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  social_mention: { action: 'social_mention', label: 'Mencao valida', description: 'Mencao que notifica ou convida uma pessoa.', xpSetting: 'xpSocialMention', defaultXp: 3, dailyLimit: 5, cooldownSeconds: 60, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  group_comment: { action: 'group_comment', label: 'Comentar no grupo', description: 'Comentario valido em grupo/celula.', xpSetting: 'xpGroupComment', defaultXp: 4, dailyLimit: 8, cooldownSeconds: 45, minTextLength: 12, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  church_comment: { action: 'church_comment', label: 'Comentar na igreja', description: 'Comentario valido em mural ou pagina da igreja.', xpSetting: 'xpChurchComment', defaultXp: 4, dailyLimit: 8, cooldownSeconds: 45, minTextLength: 12, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  content_share: { action: 'content_share', label: 'Compartilhar conteudo', description: 'Compartilhamento validado de estudo, sala ou post.', xpSetting: 'xpContentShare', defaultXp: 10, dailyLimit: 5, cooldownSeconds: 60, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial', stat: 'totalShares' },
  plan_comment: { action: 'plan_comment', label: 'Comentar em jornada', description: 'Comentario valido em plano ou sala.', xpSetting: 'xpPlanComment', defaultXp: 4, dailyLimit: 8, cooldownSeconds: 45, minTextLength: 12, uniqueKeyStrategy: 'source_daily', audience: ['user', 'church'], status: 'partial' },
  culto_checkin: { action: 'culto_checkin', label: 'Check-in no culto', description: 'Participar de um culto publicado no Culto+.', xpSetting: 'xpCultoCheckin', defaultXp: 10, dailyLimit: 2, uniqueKeyStrategy: 'source', audience: ['user', 'church'], status: 'partial' },
};

export const ACTION_XP_SETTING = Object.fromEntries(
  Object.entries(MANA_ACTION_RULES).map(([action, rule]) => [action, rule.xpSetting])
) as Partial<Record<ActionType, keyof SystemSettings['gamification']>>;

export const getActivityXp = (
  action: ActionType,
  systemSettings: SystemSettings,
  explicitXp?: number,
) => {
  if (typeof explicitXp === 'number') return explicitXp;
  const rule = MANA_ACTION_RULES[action];
  const settingKey = rule?.xpSetting;
  const configured = settingKey ? systemSettings.gamification[settingKey] : undefined;
  return typeof configured === 'number' ? configured : rule?.defaultXp ?? 0;
};

export const getActivityRule = (action: ActionType) => MANA_ACTION_RULES[action];

const getPeriodKey = (isoDate: string) => isoDate.slice(0, 10);

const getRuleEventKey = (action: ActionType, meta: any, periodKey: string) => {
  const rule = MANA_ACTION_RULES[action];
  const sourceId = meta.sourceId ?? meta.postId ?? meta.planId ?? meta.groupId ?? meta.serviceId ?? meta.prayerId ?? meta.verseRef ?? meta.ref;
  if (!rule) return `${action}:${periodKey}`;
  if (rule.uniqueKeyStrategy === 'source' && sourceId) return `${action}:${sourceId}`;
  if (rule.uniqueKeyStrategy === 'source_daily' && sourceId) return `${action}:${sourceId}:${periodKey}`;
  if (rule.uniqueKeyStrategy === 'daily') return `${action}:${periodKey}`;
  return `${action}:${meta.clientNonce ?? globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
};

const shouldGrantXp = (profile: UserProfile, action: ActionType, meta: any, now: string) => {
  const rule = MANA_ACTION_RULES[action];
  if (!rule || meta.skipXp) return { allowed: false, reason: 'disabled' };

  const periodKey = getPeriodKey(now);
  const text = String(meta.text ?? meta.content ?? meta.comment ?? '');
  if (rule.minTextLength && text.trim().length < rule.minTextLength) {
    return { allowed: false, reason: 'min_text_length' };
  }

  const activityLog = profile.activityLog ?? [];
  const validEventsToday = activityLog.filter(activity => activity.type === action && activity.timestamp?.startsWith(periodKey) && (activity.meta?.xpGained ?? 0) > 0);
  if (rule.dailyLimit && validEventsToday.length >= rule.dailyLimit) {
    return { allowed: false, reason: 'daily_limit' };
  }

  const lastSameAction = activityLog.find(activity => activity.type === action && (activity.meta?.xpGained ?? 0) > 0);
  if (rule.cooldownSeconds && lastSameAction) {
    const elapsedMs = new Date(now).getTime() - new Date(lastSameAction.timestamp).getTime();
    if (elapsedMs >= 0 && elapsedMs < rule.cooldownSeconds * 1000) {
      return { allowed: false, reason: 'cooldown' };
    }
  }

  const eventKey = getRuleEventKey(action, meta, periodKey);
  if (rule.uniqueKeyStrategy !== 'none') {
    const alreadyGranted = activityLog.some(activity => activity.meta?.manaEventKey === eventKey && activity.meta?.xpGained > 0);
    if (alreadyGranted) return { allowed: false, reason: 'duplicate' };
  }

  return { allowed: true, eventKey };
};

const applyStatIncrement = (profile: UserProfile, action: ActionType) => {
  const stat = MANA_ACTION_RULES[action]?.stat;
  if (!stat) return profile.stats;
  return {
    ...profile.stats,
    [stat]: ((profile.stats?.[stat] as number | undefined) ?? 0) + 1,
  };
};

export const applyActivityRules = ({
  profile,
  action,
  details,
  meta = {},
  systemSettings,
  now = new Date().toISOString(),
}: ActivityRuleInput) => {
  const grantDecision = shouldGrantXp(profile, action, meta, now);
  const xpGained = grantDecision.allowed ? getActivityXp(action, systemSettings, meta.xpGained) : 0;
  const nextStats = xpGained > 0 ? applyStatIncrement(profile, action) : profile.stats;
  const activity: UserActivity = {
    id: now,
    type: action,
    description: details,
    timestamp: now,
    meta: {
      ...meta,
      xpGained,
      manaEventKey: grantDecision.eventKey,
      manaStatus: grantDecision.allowed ? 'valid' : 'ignored',
      manaReason: grantDecision.allowed ? undefined : grantDecision.reason,
    },
  };
  const activityLog = [activity, ...(profile.activityLog ?? [])].slice(0, 100);

  return {
    activity,
    activityLog,
    lifetimeXp: (profile.lifetimeXp || 0) + xpGained,
    stats: nextStats,
  };
};
