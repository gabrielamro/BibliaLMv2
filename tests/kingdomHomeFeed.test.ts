import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  buildKingdomHomeFeedSections,
  extractMentionUsernames,
  getMentionNotifications,
  KINGDOM_HOME_POST_LIMIT,
} from '../utils/kingdomHomeFeed.ts';
import type { AppNotification, ChurchGroup, Post, UserProfile } from '../types.ts';

const basePost: Post = {
  id: 'base',
  userId: 'author',
  userDisplayName: 'Autor',
  userUsername: 'autor',
  type: 'reflection',
  content: 'Post',
  likesCount: 0,
  commentsCount: 0,
  shares: 0,
  likes: 0,
  comments: 0,
  saved: false,
  likedBy: [],
  createdAt: '2026-05-01T00:00:00.000Z',
  time: '2026-05-01T00:00:00.000Z',
  location: '',
};

const profile: UserProfile = {
  uid: 'user-1',
  email: 'user@example.com',
  displayName: 'Gabriel',
  photoURL: null,
  username: 'gabriel',
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
    churchName: 'Igreja Central',
    churchSlug: 'igreja-central',
  },
};

test('keeps kingdom home mentions limited to notifications that mention or mark the user', () => {
  const notifications: AppNotification[] = [
    { id: '1', title: 'Menção', message: '@gabriel marcou você', type: 'social', timestamp: '', read: false, link: '/p/1' },
    { id: '2', title: 'Curtida', message: 'Maria curtiu sua postagem', type: 'social', timestamp: '', read: false, link: '/p/2' },
    { id: '3', title: 'Marcado', message: 'Você foi marcado em uma postagem', type: 'social', timestamp: '', read: false, link: '/p/3' },
    { id: '4', title: 'Sistema', message: 'Aviso geral', type: 'info', timestamp: '', read: false },
  ];

  assert.deepEqual(
    getMentionNotifications(notifications, profile).map((notification) => notification.id),
    ['1', '3'],
  );
});

test('extracts unique usernames mentioned with at sign from post content', () => {
  assert.deepEqual(
    extractMentionUsernames('Orando com @Maria e @joao_silva. Obrigado @maria!'),
    ['maria', 'joao_silva'],
  );
});

test('builds highlighted, church and per-group sections with at most two posts each', () => {
  const groups: ChurchGroup[] = [
    { id: 'group-1', churchId: 'church-1', name: 'Jovens', slug: 'jovens', stats: { memberCount: 4, totalMana: 0 }, createdBy: 'pastor', createdAt: '' },
    { id: 'group-2', churchId: 'church-1', name: 'Louvor', slug: 'louvor', stats: { memberCount: 5, totalMana: 0 }, createdBy: 'pastor', createdAt: '' },
  ];

  const posts: Post[] = [
    { ...basePost, id: 'global-low', createdAt: '2026-05-01T00:00:00.000Z' },
    { ...basePost, id: 'global-hot', likesCount: 10, likes: 10, createdAt: '2026-05-02T00:00:00.000Z' },
    { ...basePost, id: 'church-a', churchId: 'church-1' },
    { ...basePost, id: 'church-b', churchId: 'church-1' },
    { ...basePost, id: 'church-c', churchId: 'church-1' },
    { ...basePost, id: 'church-d', churchId: 'church-1' },
    { ...basePost, id: 'other-church', churchId: 'church-2' },
    { ...basePost, id: 'group-1-a', cellId: 'group-1' },
    { ...basePost, id: 'group-1-b', cellId: 'group-1' },
    { ...basePost, id: 'group-1-c', cellId: 'group-1' },
    { ...basePost, id: 'group-1-d', cellId: 'group-1' },
    { ...basePost, id: 'group-2-a', cellId: 'group-2' },
  ];

  const sections = buildKingdomHomeFeedSections(posts, profile, groups);

  assert.equal(sections.highlightedPosts.length, KINGDOM_HOME_POST_LIMIT);
  assert.equal(sections.highlightedPosts[0].id, 'global-hot');
  assert.deepEqual(sections.churchPosts.map((post) => post.id), ['church-a', 'church-b']);
  assert.deepEqual(sections.groupSections.map((section) => section.group.id), ['group-1', 'group-2']);
  assert.deepEqual(sections.groupSections[0].posts.map((post) => post.id), ['group-1-a', 'group-1-b']);
  assert.deepEqual(sections.groupSections[1].posts.map((post) => post.id), ['group-2-a']);
});
