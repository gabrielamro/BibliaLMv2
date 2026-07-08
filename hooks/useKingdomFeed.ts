"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { dbService } from '../services/supabase';
import { getMockPosts } from '../data/mockFeedData';
import { ChurchGroup, Post, UserProfile } from '../types';
import { buildKingdomHomeFeedSections, type KingdomHomeFeedSections } from '../utils/kingdomHomeFeed';

export function useKingdomFeed(userProfile: UserProfile | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [groups, setGroups] = useState<ChurchGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const churchId = userProfile?.churchData?.churchId;
  const userId = userProfile?.uid;

  const loadFeed = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const canUpdate = () => mountedRef.current && requestId === requestIdRef.current;

    if (!mountedRef.current) return;
    setIsLoading(true);
    try {
      const [fetched, fetchedGroups] = await Promise.all([
        dbService.getKingdomHomePosts(60, userProfile),
        userId ? dbService.getUserGroups(userId, churchId) : Promise.resolve([]),
      ]);

      if (!canUpdate()) return;
      setPosts(fetched && fetched.length > 0 ? fetched : getMockPosts());
      setGroups(fetchedGroups);
    } catch {
      if (!canUpdate()) return;
      setPosts(getMockPosts());
      setGroups([]);
    } finally {
      if (canUpdate()) setIsLoading(false);
    }
  }, [userProfile, userId, churchId]);

  useEffect(() => {
    mountedRef.current = true;
    loadFeed();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
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
