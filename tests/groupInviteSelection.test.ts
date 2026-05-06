import test from 'node:test';
import * as assert from 'node:assert/strict';

import { addGroupInviteParticipant, removeGroupInviteParticipant } from '../utils/groupInviteSelection.ts';
import type { UserProfile } from '../types.ts';

const user = (uid: string, username: string): UserProfile => ({
  uid,
  email: `${username}@example.com`,
  displayName: username,
  photoURL: null,
  username,
  lifetimeXp: 0,
  credits: 0,
  badges: [],
  subscriptionTier: 'free',
  subscriptionStatus: 'active',
  activityLog: [],
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
});

test('addGroupInviteParticipant appends a new user once', () => {
  const gabriel = user('u1', 'gabriel');

  const selected = addGroupInviteParticipant([], gabriel);
  const deduped = addGroupInviteParticipant(selected, gabriel);

  assert.deepEqual(selected.map(item => item.uid), ['u1']);
  assert.deepEqual(deduped.map(item => item.uid), ['u1']);
});

test('removeGroupInviteParticipant removes by uid', () => {
  const selected = [user('u1', 'gabriel'), user('u2', 'maria')];

  const next = removeGroupInviteParticipant(selected, 'u1');

  assert.deepEqual(next.map(item => item.uid), ['u2']);
});
