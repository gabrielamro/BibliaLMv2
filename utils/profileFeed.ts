import type { Post } from '../types';

const PROFILE_FEED_EXCLUDED_TYPES = new Set<Post['type']>(['study', 'room']);

export function getProfileFeedPosts(posts: Post[], userId: string): Post[] {
  return posts.filter((post) => post.userId === userId && !PROFILE_FEED_EXCLUDED_TYPES.has(post.type));
}
