"use client";
import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/supabase';
import { getMockPosts } from '../data/mockFeedData';
import { ChurchGroup, Post, UserProfile } from '../types';
import { buildKingdomHomeFeedSections, type KingdomHomeFeedSections } from '../utils/kingdomHomeFeed';

export function useKingdomFeed(userProfile: UserProfile | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const churchId = userProfile?.churchData?.churchId;
  const userId = userProfile?.uid;

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetched, fetchedGroups] = await Promise.all([
        dbService.getKingdomHomePosts(60, userProfile),
        userId ? dbService.getUserGroups(userId, churchId) : Promise.resolve([]),
      ]);

      setPosts(fetched && fetched.length > 0 ? fetched : getMockPosts());
      setGroups(fetchedGroups);
    } catch {
      setPosts(getMockPosts());
      setGroups([]);
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, userId, churchId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const sections: KingdomHomeFeedSections = buildKingdomHomeFeedSections(posts, userProfile, groups);

  return {
    posts,
    groups,
    highlightedPosts: sections.highlightedPosts,
    churchPosts: sections.churchPosts,
    groupSections: sections.groupSections,
    isLoading,
    reload: loadFeed,
  };
}
