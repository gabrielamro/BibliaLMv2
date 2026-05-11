import test from 'node:test';
import * as assert from 'node:assert/strict';

import { getProfileFeedPosts } from '../utils/profileFeed.ts';
import type { Post } from '../types.ts';

const basePost: Post = {
  id: 'base',
  userId: 'user-1',
  userDisplayName: 'Gabriel',
  userUsername: 'gabriel',
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

test('profile feed keeps only user posts and excludes studies and rooms', () => {
  const posts: Post[] = [
    { ...basePost, id: 'reflection', type: 'reflection' },
    { ...basePost, id: 'image', type: 'image' },
    { ...basePost, id: 'study', type: 'study' },
    { ...basePost, id: 'room', type: 'room' },
    { ...basePost, id: 'other-user', userId: 'user-2' },
  ];

  assert.deepEqual(
    getProfileFeedPosts(posts, 'user-1').map((post) => post.id),
    ['reflection', 'image'],
  );
});
