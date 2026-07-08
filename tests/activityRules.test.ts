import test from 'node:test';
import * as assert from 'node:assert/strict';

import { applyActivityRules, getActivityXp, MANA_ACTION_RULES } from '../utils/activityRules.ts';
import type { ActionType, SystemSettings, UserProfile } from '../types.ts';

const systemSettings: SystemSettings = {
  general: { maintenanceMode: false, welcomeMessage: 'Bem-vindo' },
  gamification: {
    xpReadingChapter: 20,
    xpDailyGoal: 50,
    xpReadingPresence: 5,
    xpDevotional: 15,
    xpCreateStudy: 30,
    xpShare: 10,
    xpMarkVerse: 2,
    xpCreateSermon: 40,
    xpCreateImage: 10,
    xpUseChat: 5,
    xpSocialComment: 4,
    xpCreateNote: 5,
  },
  links: { pixKey: '', supportUrl: '' },
  costs: { imageGen: 0, podcastGen: 0, deepAnalysis: 0, captionGen: 0, sermonGen: 0 },
  limits: { freeImages: 2, freePodcasts: 1, dailyFreeChat: 10 },
  subscription: {
    prices: {
      bronzeMonthly: 9.99,
      bronzeAnnual: 59.9,
      silverMonthly: 19.99,
      silverAnnual: 119.9,
      goldMonthly: 39.99,
      goldAnnual: 239.9,
    },
    promo: { active: false, title: '', description: '', color: '' },
  },
};

const profile = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'User',
  photoURL: null,
  username: 'user',
  lifetimeXp: 10,
  credits: 0,
  badges: [],
  subscriptionTier: 'free',
  subscriptionStatus: 'active',
  activityLog: [{ id: 'old', type: 'use_chat', description: 'Old', timestamp: '2026-04-28T10:00:00.000Z', meta: { xpGained: 5 } }],
  stats: {
    totalChaptersRead: 0,
    daysStreak: 0,
    studiesCreated: 0,
    totalDevotionalsRead: 0,
    totalNotes: 0,
    totalShares: 0,
    totalImagesGenerated: 0,
    totalChatMessages: 0,
    totalSermonsCreated: 0,
    totalVersesMarked: 0,
    totalQuizzesCompleted: 0,
    perfectQuizzes: 0,
  },
} satisfies UserProfile;

const makeProfile = (overrides: Partial<UserProfile> = {}) => ({
  ...profile,
  activityLog: [...profile.activityLog],
  stats: { ...profile.stats },
  ...overrides,
}) satisfies UserProfile;

test('getActivityXp uses configured Mana rules when explicit XP is not provided', () => {
  assert.equal(getActivityXp('devotional', systemSettings), 15);
  assert.equal(getActivityXp('use_chat', systemSettings), 5);
  assert.equal(getActivityXp('devotional', systemSettings, 99), 99);
});

test('applyActivityRules prepends activity to history and increases lifetime XP', () => {
  const result = applyActivityRules({
    profile: makeProfile(),
    action: 'devotional',
    details: 'Pao Diario concluido',
    systemSettings,
    now: '2026-04-29T12:00:00.000Z',
  });

  assert.equal(result.lifetimeXp, 25);
  assert.equal(result.stats.totalDevotionalsRead, 1);
  assert.equal(result.activityLog.length, 2);
  assert.equal(result.activityLog[0].type, 'devotional');
  assert.equal(result.activityLog[0].meta.xpGained, 15);
  assert.equal(result.activityLog[1].id, 'old');
});

test('every ActionType has an explicit Mana rule decision', () => {
  const actionTypes: ActionType[] = [
    'reading_chapter',
    'daily_goal',
    'reading_presence',
    'devotional',
    'deep_study',
    'create_image',
    'share_content',
    'mark_verse',
    'create_sermon',
    'use_chat',
    'quiz_completion',
    'social_follow',
    'prayer_wall',
    'create_note',
    'social_like',
    'social_post',
    'start_module',
    'create_study',
    'join_plan',
    'create_evaluation',
    'finish_track',
    'collect_artifact',
    'social_interaction',
    'invite_sent',
    'invite_accepted',
    'social_comment',
    'social_mention',
    'group_comment',
    'church_comment',
    'content_share',
    'plan_comment',
    'culto_checkin',
  ];

  assert.deepEqual(Object.keys(MANA_ACTION_RULES).sort(), actionTypes.sort());
});

test('applyActivityRules ignores duplicate source-daily Mana events', () => {
  const first = applyActivityRules({
    profile: makeProfile(),
    action: 'reading_chapter',
    details: 'Capitulo lido: joao 1',
    meta: { sourceId: 'joao-1' },
    systemSettings,
    now: '2026-04-29T12:00:00.000Z',
  });

  const second = applyActivityRules({
    profile: { ...profile, lifetimeXp: first.lifetimeXp, stats: first.stats, activityLog: first.activityLog },
    action: 'reading_chapter',
    details: 'Capitulo lido: joao 1',
    meta: { sourceId: 'joao-1' },
    systemSettings,
    now: '2026-04-29T13:00:00.000Z',
  });

  assert.equal(first.activityLog[0].meta.xpGained, 20);
  assert.equal(first.stats.totalChaptersRead, 1);
  assert.equal(second.activityLog[0].meta.xpGained, 0);
  assert.equal(second.activityLog[0].meta.manaReason, 'duplicate');
  assert.equal(second.lifetimeXp, first.lifetimeXp);
  assert.equal(second.stats.totalChaptersRead, 1);
});

test('applyActivityRules grants reading presence Mana once per plan day', () => {
  const first = applyActivityRules({
    profile: makeProfile(),
    action: 'reading_presence',
    details: '5 minutos de presenca na Palavra',
    meta: { sourceId: 'plan-day-6', readingSeconds: 300 },
    systemSettings,
    now: '2026-04-29T12:00:00.000Z',
  });

  const second = applyActivityRules({
    profile: { ...profile, lifetimeXp: first.lifetimeXp, stats: first.stats, activityLog: first.activityLog },
    action: 'reading_presence',
    details: '5 minutos de presenca na Palavra',
    meta: { sourceId: 'plan-day-6', readingSeconds: 600 },
    systemSettings,
    now: '2026-04-29T12:10:00.000Z',
  });

  assert.equal(first.activityLog[0].meta.xpGained, 5);
  assert.equal(second.activityLog[0].meta.xpGained, 0);
  assert.equal(second.activityLog[0].meta.manaReason, 'daily_limit');
});


test('applyActivityRules grants Mana for a valid social comment and writes audit metadata', () => {
  const result = applyActivityRules({
    profile: makeProfile({ lifetimeXp: 100 }),
    action: 'social_comment',
    details: 'Comentou em uma publicacao do Reino',
    meta: { sourceId: 'post-1-comment-1', postId: 'post-1', commentId: 'comment-1', text: 'Uma palavra de encorajamento para hoje.' },
    systemSettings,
    now: '2026-04-29T12:00:00.000Z',
  });

  assert.equal(result.lifetimeXp, 104);
  assert.equal(result.activityLog[0].meta.xpGained, 4);
  assert.equal(result.activityLog[0].meta.manaStatus, 'valid');
  assert.equal(result.activityLog[0].meta.manaEventKey, 'social_comment:post-1-comment-1:2026-04-29');
});

test('applyActivityRules blocks Mana for short comments that do not meet anti-spam rules', () => {
  const result = applyActivityRules({
    profile: makeProfile({ lifetimeXp: 100 }),
    action: 'social_comment',
    details: 'Comentario curto',
    meta: { sourceId: 'post-1-comment-short', text: 'amem' },
    systemSettings,
    now: '2026-04-29T12:00:00.000Z',
  });

  assert.equal(result.lifetimeXp, 100);
  assert.equal(result.activityLog[0].meta.xpGained, 0);
  assert.equal(result.activityLog[0].meta.manaStatus, 'ignored');
  assert.equal(result.activityLog[0].meta.manaReason, 'min_text_length');
});

test('applyActivityRules blocks Mana after the daily limit for once-a-day actions', () => {
  const alreadyCompletedDevotional = {
    id: 'devotional-today',
    type: 'devotional' as const,
    description: 'Pao Diario concluido',
    timestamp: '2026-04-29T08:00:00.000Z',
    meta: { xpGained: 15, manaEventKey: 'devotional:2026-04-29' },
  };

  const result = applyActivityRules({
    profile: makeProfile({ lifetimeXp: 25, activityLog: [alreadyCompletedDevotional] }),
    action: 'devotional',
    details: 'Pao Diario concluido novamente',
    systemSettings,
    now: '2026-04-29T18:00:00.000Z',
  });

  assert.equal(result.lifetimeXp, 25);
  assert.equal(result.activityLog[0].meta.xpGained, 0);
  assert.equal(result.activityLog[0].meta.manaReason, 'daily_limit');
});

test('applyActivityRules blocks Mana during cooldown but allows it after cooldown expires', () => {
  const recentImage = {
    id: 'image-1',
    type: 'create_image' as const,
    description: 'Arte criada',
    timestamp: '2026-04-29T12:00:00.000Z',
    meta: { xpGained: 10, manaEventKey: 'create_image:image-1:2026-04-29' },
  };

  const blocked = applyActivityRules({
    profile: makeProfile({ lifetimeXp: 20, activityLog: [recentImage] }),
    action: 'create_image',
    details: 'Arte criada',
    meta: { sourceId: 'image-2' },
    systemSettings,
    now: '2026-04-29T12:01:00.000Z',
  });

  const allowed = applyActivityRules({
    profile: makeProfile({ lifetimeXp: 20, activityLog: [recentImage] }),
    action: 'create_image',
    details: 'Arte criada',
    meta: { sourceId: 'image-2' },
    systemSettings,
    now: '2026-04-29T12:03:00.000Z',
  });

  assert.equal(blocked.lifetimeXp, 20);
  assert.equal(blocked.activityLog[0].meta.manaReason, 'cooldown');
  assert.equal(allowed.lifetimeXp, 30);
  assert.equal(allowed.activityLog[0].meta.xpGained, 10);
  assert.equal(allowed.stats.totalImagesGenerated, 1);
});

test('applyActivityRules records ignored activity without counting it against later valid daily limits', () => {
  const ignoredShortComment = {
    id: 'comment-short',
    type: 'social_comment' as const,
    description: 'Comentario curto',
    timestamp: '2026-04-29T09:00:00.000Z',
    meta: { xpGained: 0, manaStatus: 'ignored', manaReason: 'min_text_length' },
  };

  const result = applyActivityRules({
    profile: makeProfile({ lifetimeXp: 100, activityLog: [ignoredShortComment] }),
    action: 'social_comment',
    details: 'Comentario valido',
    meta: { sourceId: 'post-2-comment-1', text: 'Agora sim um comentario com conteudo edificante.' },
    systemSettings,
    now: '2026-04-29T10:00:00.000Z',
  });

  assert.equal(result.lifetimeXp, 104);
  assert.equal(result.activityLog[0].meta.manaStatus, 'valid');
});
