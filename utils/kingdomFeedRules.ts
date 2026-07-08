import type { Post, UserProfile } from '../types';

export type KingdomPostVisibility = 'public' | 'followers' | 'church' | 'group' | 'private';
export type KingdomFeedReason = 'own_post' | 'following' | 'same_church' | 'same_group' | 'public_discovery' | 'global_public';

export interface KingdomFeedViewerContext {
  viewer?: UserProfile | null;
  followingIds?: string[];
  groupIds?: string[];
  now?: Date;
}

export interface RankedKingdomPost {
  post: Post;
  reason: KingdomFeedReason;
  score: number;
}

const discoveryRatioFor = (followingCount: number) => {
  if (followingCount <= 3) return 0.5;
  if (followingCount <= 10) return 0.35;
  return 0.3;
};

export const normalizePostVisibility = (post: Partial<Post>): KingdomPostVisibility => {
  if (post.visibility) return post.visibility;
  if (post.destination === 'church') return 'church';
  if (post.destination === 'cell') return 'group';
  return 'public';
};

const hasPublicDiscoverySignal = (post: Post, context: KingdomFeedViewerContext) => {
  const viewer = context.viewer;
  if (!viewer?.uid) return true;
  if (viewer.churchData?.churchId && (post.churchId === viewer.churchData.churchId || post.authorChurchId === viewer.churchData.churchId)) return true;
  if (viewer.city && post.authorCity && viewer.city === post.authorCity) return true;

  const engagement =
    (post.likesCount || post.likes || 0) * 3 +
    (post.commentsCount || post.comments || 0) * 4 +
    (post.shares || 0) * 5 +
    Math.min(post.viewsCount || 0, 40);

  return engagement >= 25;
};

export const getKingdomFeedReason = (
  post: Post,
  context: KingdomFeedViewerContext,
): KingdomFeedReason | null => {
  const viewer = context.viewer;
  const visibility = normalizePostVisibility(post);

  if (viewer?.uid && post.userId === viewer.uid) return 'own_post';
  if (visibility === 'private') return null;

  const followingIds = new Set(context.followingIds || []);
  const groupIds = new Set(context.groupIds || []);
  const isFollowing = Boolean(viewer?.uid && followingIds.has(post.userId));

  if (visibility === 'followers') return isFollowing ? 'following' : null;

  if (visibility === 'church') {
    return viewer?.churchData?.churchId && post.churchId === viewer.churchData.churchId ? 'same_church' : null;
  }

  if (visibility === 'group') {
    return post.cellId && groupIds.has(post.cellId) ? 'same_group' : null;
  }

  if (isFollowing) return 'following';
  if (post.authorProfilePublic === false) return null;

  if (!viewer?.uid) return 'global_public';
  if (!hasPublicDiscoverySignal(post, context)) return null;

  return 'public_discovery';
};

const recencyScore = (post: Post, now: Date) => {
  const createdAt = new Date(post.createdAt || post.time || 0).getTime();
  if (!Number.isFinite(createdAt) || createdAt <= 0) return 0;

  const ageHours = Math.max(0, (now.getTime() - createdAt) / 36e5);
  return Math.max(0, 20 - Math.floor(ageHours / 6));
};

const engagementScore = (post: Post) => (
  (post.likesCount || post.likes || 0) * 3 +
  (post.commentsCount || post.comments || 0) * 4 +
  (post.shares || 0) * 5 +
  Math.min(post.viewsCount || 0, 40)
);

export const scoreKingdomFeedPost = (
  post: Post,
  reason: KingdomFeedReason,
  context: KingdomFeedViewerContext,
) => {
  const baseByReason: Record<KingdomFeedReason, number> = {
    own_post: 120,
    following: 100,
    same_group: 90,
    same_church: 75,
    public_discovery: 25,
    global_public: 20,
  };

  let score = baseByReason[reason] + recencyScore(post, context.now || new Date()) + engagementScore(post);
  if (reason === 'public_discovery' && context.viewer?.churchData?.churchId && post.churchId === context.viewer.churchData.churchId) score += 20;
  if (reason === 'public_discovery' && context.viewer?.city && post.authorCity && context.viewer.city === post.authorCity) score += 8;
  return score;
};

export const buildKingdomPersonalizedFeed = (
  posts: Post[],
  context: KingdomFeedViewerContext = {},
  limit = 50,
) => {
  const ranked = posts
    .map((post): RankedKingdomPost | null => {
      const reason = getKingdomFeedReason(post, context);
      if (!reason) return null;
      return { post: { ...post, feedReason: reason }, reason, score: scoreKingdomFeedPost(post, reason, context) };
    })
    .filter((item): item is RankedKingdomPost => Boolean(item))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.createdAt || b.post.time || 0).getTime() - new Date(a.post.createdAt || a.post.time || 0).getTime();
    });

  if (!context.viewer?.uid) return ranked.slice(0, limit).map((item) => item.post);

  const discoveryLimit = Math.max(3, Math.floor(limit * discoveryRatioFor(context.followingIds?.length || 0)));
  const networkItems = ranked.filter((item) => item.reason !== 'public_discovery' && item.reason !== 'global_public');
  const discoveryItems = ranked.filter((item) => item.reason === 'public_discovery' || item.reason === 'global_public').slice(0, discoveryLimit);

  const mixed: Post[] = [];
  let networkIndex = 0;
  let discoveryIndex = 0;
  let discoveryStreak = 0;

  while (mixed.length < limit && (networkIndex < networkItems.length || discoveryIndex < discoveryItems.length)) {
    const shouldTakeDiscovery =
      discoveryIndex < discoveryItems.length &&
      (networkIndex >= networkItems.length || (mixed.length + 1) % 4 === 0) &&
      discoveryStreak < 1;

    if (shouldTakeDiscovery) {
      mixed.push(discoveryItems[discoveryIndex].post);
      discoveryIndex += 1;
      discoveryStreak += 1;
      continue;
    }

    if (networkIndex < networkItems.length) {
      mixed.push(networkItems[networkIndex].post);
      networkIndex += 1;
      discoveryStreak = 0;
      continue;
    }

    if (discoveryIndex < discoveryItems.length) {
      mixed.push(discoveryItems[discoveryIndex].post);
      discoveryIndex += 1;
      discoveryStreak += 1;
    }
  }

  return mixed;
};
