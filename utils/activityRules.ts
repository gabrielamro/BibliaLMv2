import type { ActionType, SystemSettings, UserActivity, UserProfile } from '../types';

type ActivityRuleInput = {
  profile: UserProfile;
  action: ActionType;
  details: string;
  meta?: any;
  systemSettings: SystemSettings;
  now?: string;
};

const ACTION_XP_SETTING: Partial<Record<ActionType, keyof SystemSettings['gamification']>> = {
  reading_chapter: 'xpReadingChapter',
  daily_goal: 'xpDailyGoal',
  devotional: 'xpDevotional',
  create_study: 'xpCreateStudy',
  share_content: 'xpShare',
  mark_verse: 'xpMarkVerse',
  create_sermon: 'xpCreateSermon',
  create_image: 'xpCreateImage',
  use_chat: 'xpUseChat',
};

export const getActivityXp = (
  action: ActionType,
  systemSettings: SystemSettings,
  explicitXp?: number,
) => {
  if (typeof explicitXp === 'number') return explicitXp;
  const settingKey = ACTION_XP_SETTING[action];
  return settingKey ? systemSettings.gamification[settingKey] : 1;
};

export const applyActivityRules = ({
  profile,
  action,
  details,
  meta = {},
  systemSettings,
  now = new Date().toISOString(),
}: ActivityRuleInput) => {
  const xpGained = getActivityXp(action, systemSettings, meta.xpGained);
  const activity: UserActivity = {
    id: now,
    type: action,
    description: details,
    timestamp: now,
    meta: { ...meta, xpGained },
  };
  const activityLog = [activity, ...(profile.activityLog ?? [])].slice(0, 100);

  return {
    activity,
    activityLog,
    lifetimeXp: (profile.lifetimeXp || 0) + xpGained,
  };
};
