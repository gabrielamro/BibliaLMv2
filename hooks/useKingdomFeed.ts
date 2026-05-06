"use client";
import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/supabase';
import { getMockPosts } from '../data/mockFeedData';
import { Post, UserProfile } from '../types';

export function useKingdomFeed(userProfile: UserProfile | null) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const churchId = userProfile?.churchData?.churchId;

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetched = await dbService.getGlobalFeed(10, userProfile);
      if (fetched && fetched.length > 0) {
        // Prioriza posts da mesma igreja quando disponíveis
        const sorted = churchId
          ? [...fetched].sort((a, b) => {
              const aMatch = a.churchId === churchId ? -1 : 0;
              const bMatch = b.churchId === churchId ? -1 : 0;
              return aMatch - bMatch;
            })
          : fetched;
        setPosts(sorted.slice(0, 3));
      } else {
        setPosts(getMockPosts().slice(0, 3));
      }
    } catch {
      setPosts(getMockPosts().slice(0, 3));
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, churchId]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return { posts, isLoading, reload: loadFeed };
}
