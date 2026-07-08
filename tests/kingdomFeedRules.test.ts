import test from 'node:test';
import * as assert from 'node:assert/strict';

import {
  buildKingdomPersonalizedFeed,
  getKingdomFeedReason,
  normalizePostVisibility,
} from '../utils/kingdomFeedRules.ts';
import type { Post, UserProfile } from '../types.ts';

const viewer: UserProfile = {
  uid: 'viewer',
  email: 'viewer@example.com',
  displayName: 'Viewer',
  photoURL: null,
  username: 'viewer',
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
  city: 'Manaus',
  churchData: {
    churchId: 'church-1',
    churchName: 'Igreja',
    churchSlug: 'igreja',
    groupId: 'group-1',
    groupName: 'Grupo',
  },
};

const post = (partial: Partial<Post>): Post => ({
  id: partial.id || 'post',
  userId: partial.userId || 'author',
  userDisplayName: 'Author',
  userUsername: 'author',
  type: 'reflection',
  content: 'conteudo',
  likesCount: partial.likesCount ?? 0,
  commentsCount: partial.commentsCount ?? 0,
  shares: partial.shares ?? 0,
  likes: partial.likes ?? partial.likesCount ?? 0,
  comments: partial.comments ?? partial.commentsCount ?? 0,
  saved: false,
  likedBy: [],
  createdAt: partial.createdAt || '2026-06-16T10:00:00.000Z',
  time: partial.createdAt || '2026-06-16T10:00:00.000Z',
  location: 'Reino',
  destination: partial.destination || 'global',
  visibility: partial.visibility,
  churchId: partial.churchId,
  cellId: partial.cellId,
  authorProfilePublic: partial.authorProfilePublic,
  authorChurchId: partial.authorChurchId,
  authorCity: partial.authorCity,
});

test('normalizes legacy destination into visibility', () => {
  assert.equal(normalizePostVisibility(post({ destination: 'church' })), 'church');
  assert.equal(normalizePostVisibility(post({ destination: 'cell' })), 'group');
  assert.equal(normalizePostVisibility(post({ destination: 'global' })), 'public');
});

test('followers visibility is only eligible for followers and owner', () => {
  const followersPost = post({ id: 'followers', userId: 'pastor', visibility: 'followers' });

  assert.equal(getKingdomFeedReason(followersPost, { viewer, followingIds: [] }), null);
  assert.equal(getKingdomFeedReason(followersPost, { viewer, followingIds: ['pastor'] }), 'following');
  assert.equal(getKingdomFeedReason({ ...followersPost, userId: 'viewer' }, { viewer }), 'own_post');
});

test('public discovery requires a public author profile', () => {
  const publicPost = post({ id: 'public', userId: 'public-author', visibility: 'public', authorProfilePublic: true, authorCity: 'Manaus' });
  const privateAuthorPost = post({ id: 'hidden', userId: 'private-author', visibility: 'public', authorProfilePublic: false });

  assert.equal(getKingdomFeedReason(publicPost, { viewer, followingIds: [] }), 'public_discovery');
  assert.equal(getKingdomFeedReason(privateAuthorPost, { viewer, followingIds: [] }), null);
  assert.equal(getKingdomFeedReason(privateAuthorPost, { viewer: null, followingIds: [] }), null);
  assert.equal(getKingdomFeedReason(publicPost, { viewer: null, followingIds: [] }), 'global_public');
});

test('public discovery for non-followed authors requires a recommendation signal', () => {
  const randomPublicPost = post({ id: 'random', userId: 'random-author', visibility: 'public', authorProfilePublic: true });
  const sameCityPost = post({ id: 'same-city', userId: 'city-author', visibility: 'public', authorProfilePublic: true, authorCity: 'Manaus' });
  const sameChurchAuthorPost = post({ id: 'same-church-author', userId: 'church-author', visibility: 'public', authorProfilePublic: true, authorChurchId: 'church-1' });
  const engagedPost = post({ id: 'engaged', userId: 'engaged-author', visibility: 'public', authorProfilePublic: true, likesCount: 9 });

  assert.equal(getKingdomFeedReason(randomPublicPost, { viewer, followingIds: [] }), null);
  assert.equal(getKingdomFeedReason(sameCityPost, { viewer, followingIds: [] }), 'public_discovery');
  assert.equal(getKingdomFeedReason(sameChurchAuthorPost, { viewer, followingIds: [] }), 'public_discovery');
  assert.equal(getKingdomFeedReason(engagedPost, { viewer, followingIds: [] }), 'public_discovery');
});

test('church and group posts require matching community', () => {
  assert.equal(getKingdomFeedReason(post({ visibility: 'church', churchId: 'church-1' }), { viewer }), 'same_church');
  assert.equal(getKingdomFeedReason(post({ visibility: 'church', churchId: 'church-2' }), { viewer }), null);
  assert.equal(getKingdomFeedReason(post({ visibility: 'group', cellId: 'group-1' }), { viewer, groupIds: ['group-1'] }), 'same_group');
  assert.equal(getKingdomFeedReason(post({ visibility: 'group', cellId: 'group-2' }), { viewer, groupIds: ['group-1'] }), null);
});

test('personalized feed prioritizes network and limits discovery', () => {
  const posts = [
    post({ id: 'followed', userId: 'followed', visibility: 'followers', likesCount: 1 }),
    post({ id: 'church', userId: 'church-author', visibility: 'church', churchId: 'church-1' }),
    post({ id: 'discovery-1', userId: 'public-1', visibility: 'public', authorProfilePublic: true, likesCount: 100 }),
    post({ id: 'discovery-2', userId: 'public-2', visibility: 'public', authorProfilePublic: true, likesCount: 90 }),
    post({ id: 'random-public', userId: 'random-public', visibility: 'public', authorProfilePublic: true }),
    post({ id: 'private-author', userId: 'public-3', visibility: 'public', authorProfilePublic: false, likesCount: 200 }),
  ];

  const feed = buildKingdomPersonalizedFeed(posts, { viewer, followingIds: ['followed'], groupIds: ['group-1'], now: new Date('2026-06-16T12:00:00.000Z') }, 4);

  assert.equal(feed.some((item) => item.id === 'private-author'), false);
  assert.equal(feed.some((item) => item.id === 'random-public'), false);
  assert.equal(feed.some((item) => item.id === 'followed'), true);
  assert.equal(feed.some((item) => item.id === 'church'), true);
  assert.ok(feed.filter((item) => item.feedReason === 'public_discovery').length <= 2);
});
