import test from 'node:test';
import * as assert from 'node:assert/strict';

import { applyActivityRules, getActivityXp } from '../utils/activityRules.ts';
import type { SystemSettings, UserProfile } from '../types.ts';

const systemSettings: SystemSettings = {
  general: { maintenanceMode: false, welcomeMessage: 'Bem-vindo' },
  gamification: {
    xpReadingChapter: 20,
    xpDailyGoal: 50,
    xpDevotional: 15,
    xpCreateStudy: 30,
    xpShare: 10,
    xpMarkVerse: 2,
    xpCreateSermon: 40,
    xpCreateImage: 10,
    xpUseChat: 5,
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

test('getActivityXp uses configured Mana rules when explicit XP is not provided', () => {
  assert.equal(getActivityXp('devotional', systemSettings), 15);
  assert.equal(getActivityXp('use_chat', systemSettings), 5);
  assert.equal(getActivityXp('devotional', systemSettings, 99), 99);
});

test('applyActivityRules prepends activity to history and increases lifetime XP', () => {
  const result = applyActivityRules({
    profile,
    action: 'devotional',
    details: 'Pao Diario concluido',
    systemSettings,
    now: '2026-04-29T12:00:00.000Z',
  });

  assert.equal(result.lifetimeXp, 25);
  assert.equal(result.activityLog.length, 2);
  assert.equal(result.activityLog[0].type, 'devotional');
  assert.equal(result.activityLog[0].meta.xpGained, 15);
  assert.equal(result.activityLog[1].id, 'old');
});
