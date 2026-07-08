import type { ActionType, UserActivity, UserProfile } from '../types';
import { MANA_ACTION_RULES, type ManaActionRule } from '../utils/activityRules';

export type ManaLevel = {
  key: string;
  name: string;
  minXp: number;
  maxXp?: number;
  focus: string;
};

export type ManaChecklistItem = {
  action: ActionType;
  label: string;
  href: string;
  isDoneToday: boolean;
  possibleXp: number;
  limitLabel: string;
};

export const USER_MANA_LEVELS: ManaLevel[] = [
  { key: 'visitor', name: 'Visitante em Jornada', minXp: 0, maxXp: 99, focus: 'Primeiros passos' },
  { key: 'steady_reader', name: 'Leitor Constante', minXp: 100, maxXp: 499, focus: 'Leitura e devocional' },
  { key: 'word_apprentice', name: 'Aprendiz da Palavra', minXp: 500, maxXp: 1499, focus: 'Estudo e quiz' },
  { key: 'active_intercessor', name: 'Intercessor Ativo', minXp: 1500, maxXp: 3999, focus: 'Oracao e comunidade' },
  { key: 'community_servant', name: 'Servo da Comunidade', minXp: 4000, maxXp: 9999, focus: 'Participacao e apoio' },
  { key: 'digital_disciplemaker', name: 'Disciplador Digital', minXp: 10000, focus: 'Constancia ampla' },
];

const CHECKLIST_ACTIONS: Array<{ action: ActionType; href: string }> = [
  { action: 'reading_chapter', href: '/bibliasagrada' },
  { action: 'devotional', href: '/devocional' },
  { action: 'quiz_completion', href: '/quiz' },
  { action: 'prayer_wall', href: '/oracoes' },
  { action: 'social_comment', href: '/social' },
];

const formatLimit = (rule: ManaActionRule) => {
  if (!rule.dailyLimit) return 'Sem limite diario definido';
  if (rule.dailyLimit === 1) return '1 vez por dia';
  return `Ate ${rule.dailyLimit} vezes por dia`;
};

const isActionDoneToday = (activityLog: UserActivity[] = [], action: ActionType) => {
  const today = new Date().toISOString().slice(0, 10);
  return activityLog.some(activity => activity.type === action && activity.timestamp?.startsWith(today) && (activity.meta?.xpGained ?? 0) > 0);
};

export const getManaLevel = (xp: number) => {
  return USER_MANA_LEVELS.find(level => xp >= level.minXp && (level.maxXp === undefined || xp <= level.maxXp)) ?? USER_MANA_LEVELS[0];
};

export const getNextManaLevel = (xp: number) => USER_MANA_LEVELS.find(level => level.minXp > xp) ?? null;

export const getManaProgress = (xp: number) => {
  const current = getManaLevel(xp);
  const next = getNextManaLevel(xp);
  if (!next) return { current, next, percent: 100, remaining: 0 };
  const span = Math.max(1, next.minXp - current.minXp);
  const percent = Math.min(100, Math.max(0, ((xp - current.minXp) / span) * 100));
  return { current, next, percent, remaining: next.minXp - xp };
};

export const getWeeklyMana = (activityLog: UserActivity[] = []) => {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return activityLog.reduce((total, activity) => {
    const when = new Date(activity.timestamp);
    if (Number.isNaN(when.getTime()) || when < weekAgo) return total;
    return total + ((activity.meta?.xpGained as number | undefined) ?? 0);
  }, 0);
};

export const getManaChecklist = (profile: UserProfile): ManaChecklistItem[] => {
  return CHECKLIST_ACTIONS.map(item => {
    const rule = MANA_ACTION_RULES[item.action];
    return {
      action: item.action,
      label: rule.label,
      href: item.href,
      isDoneToday: isActionDoneToday(profile.activityLog, item.action),
      possibleXp: rule.defaultXp,
      limitLabel: formatLimit(rule),
    };
  });
};

export const getPublicManaRules = () => {
  return Object.values(MANA_ACTION_RULES)
    .filter(rule => rule.status !== 'disabled')
    .sort((a, b) => b.defaultXp - a.defaultXp);
};
