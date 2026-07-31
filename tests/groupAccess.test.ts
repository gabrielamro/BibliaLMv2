import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  buildPrivateGroupAccessNotification,
  canViewGroupFeed,
  canPostInGroupFeed,
} from '../utils/groupAccess.ts';
import type { ChurchGroup, GroupAccessInvite, UserProfile } from '../types.ts';

const privateGroup = {
  id: 'group-1',
  churchId: 'church-1',
  name: 'Discipulado',
  slug: 'discipulado',
  privacy: 'private',
  stats: { memberCount: 2, totalMana: 0 },
  createdBy: 'pastor-1',
  createdAt: '2026-04-30T10:00:00.000Z',
} satisfies ChurchGroup;

const publicGroup = {
  ...privateGroup,
  id: 'group-2',
  privacy: 'public',
} satisfies ChurchGroup;

const member = {
  uid: 'member-1',
  email: 'member@example.com',
  displayName: 'Membro',
  photoURL: null,
  username: 'membro',
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
  churchData: {
    churchId: 'church-1',
    churchName: 'Igreja',
    churchSlug: 'igreja',
    groupId: 'group-1',
    groupName: 'Discipulado',
    groupSlug: 'discipulado',
  },
} satisfies UserProfile;

const pendingInvite = {
  id: 'invite-1',
  groupId: 'group-1',
  churchId: 'church-1',
  invitedUserId: 'guest-1',
  invitedByUserId: 'pastor-1',
  status: 'pending',
  source: 'mention',
  createdAt: '2026-04-30T10:00:00.000Z',
} satisfies GroupAccessInvite;

test('private group invite notification points the user to the invite acceptance flow', () => {
  const notification = buildPrivateGroupAccessNotification({
    group: privateGroup,
    invite: pendingInvite,
    actorName: 'Pr. Joao',
  });

  assert.equal(notification.type, 'social');
  assert.equal(notification.title, 'Convite para grupo privado');
  assert.match(notification.message, /Pr\. Joao/);
  assert.match(notification.message, /Discipulado/);
  assert.equal(notification.link, '/grupo/discipulado?invite=invite-1');
});

test('private group feed is visible only after membership is accepted', () => {
  assert.equal(canViewGroupFeed(privateGroup, member, undefined), true);
  assert.equal(canViewGroupFeed(privateGroup, null, pendingInvite), false);
  assert.equal(canViewGroupFeed(privateGroup, null, undefined), false);
  assert.equal(canViewGroupFeed(publicGroup, null, undefined), true);
});

test('only current group members can post in the group feed', () => {
  assert.equal(canPostInGroupFeed(privateGroup, member), true);
  assert.equal(canPostInGroupFeed(privateGroup, null), false);
  assert.equal(canPostInGroupFeed(publicGroup, null), false);
});
