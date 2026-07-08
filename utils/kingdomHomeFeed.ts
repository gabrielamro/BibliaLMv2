import type { AppNotification, ChurchGroup, Post, UserProfile } from '../types';

export const KINGDOM_HOME_POST_LIMIT = 5;

export interface KingdomHomeFeedSections {
  highlightedPosts: Post[];
  churchPosts: Post[];
  groupSections: Array<{
    group: ChurchGroup;
    posts: Post[];
  }>;
}

export function getMentionNotifications(
  notifications: AppNotification[],
  userProfile?: UserProfile | null,
  limit = KINGDOM_HOME_POST_LIMIT,
) {
  const username = userProfile?.username?.toLowerCase();
  const uid = userProfile?.uid?.toLowerCase();

  return notifications
    .filter((notification) => {
      const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase();
      if (username && text.includes(`@${username}`)) return true;
      if (uid && text.includes(uid)) return true;
      return Boolean(notification.link?.includes('/p/') && /\b(mencao|menção|mention|marcou|marcado|tag)\b/.test(text));
    })
    .slice(0, limit);
}

export function extractMentionUsernames(content: string) {
  const matches = content.match(/@([a-zA-Z0-9_]+)/g) ?? [];
  return Array.from(new Set(matches.map((match) => match.slice(1).toLowerCase())));
}

export function buildKingdomHomeFeedSections(
  posts: Post[],
  userProfile?: UserProfile | null,
  groups: ChurchGroup[] = [],
  limit = KINGDOM_HOME_POST_LIMIT,
): KingdomHomeFeedSections {
  const churchId = userProfile?.churchData?.churchId;
  const uniqueGroups = Array.from(new Map(groups.map((group) => [group.id, group])).values());
  const communityLimit = Math.min(2, limit);

  return {
    highlightedPosts: getHighlightedPosts(posts, limit),
    churchPosts: churchId
      ? posts.filter((post) => post.churchId === churchId).slice(0, communityLimit)
      : [],
    groupSections: uniqueGroups.map((group) => ({
      group,
      posts: posts.filter((post) => post.cellId === group.id).slice(0, communityLimit),
    })),
  };
}

function engagementScore(post: Post) {
  return (
    (post.likesCount || post.likes || 0) * 3 +
    (post.commentsCount || post.comments || 0) * 2 +
    (post.shares || 0) * 2 +
    (post.viewsCount || 0)
  );
}

function getHighlightedPosts(posts: Post[], limit: number) {
  return [...posts]
    .sort((a, b) => {
      // Priorizar postagens oficiais da igreja no topo do feed
      if (a.destination === 'church' && b.destination !== 'church') return -1;
      if (b.destination === 'church' && a.destination !== 'church') return 1;

      const scoreDiff = engagementScore(b) - engagementScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      return new Date(b.createdAt || b.time || 0).getTime() - new Date(a.createdAt || a.time || 0).getTime();
    })
    .slice(0, limit);
}
