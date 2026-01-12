import { useState, useEffect, useCallback } from 'react';
import { getCachedAvatarUrl, cacheAvatarUrl, cacheAvatarUrls } from '../services/avatarCache';
import { supabase } from '../lib/supabase';

interface UseAvatarReturn {
  avatarUrl: string | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

/**
 * Hook to get a user's avatar URL with caching
 * @param userId - The user ID to get the avatar for
 * @returns Avatar URL and loading state
 */
export const useAvatar = (userId: string | null | undefined): UseAvatarReturn => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    if (!userId) return null;
    const cached = getCachedAvatarUrl(userId);
    return cached !== undefined ? cached : null;
  });
  const [isLoading, setIsLoading] = useState(() => {
    if (!userId) return false;
    return getCachedAvatarUrl(userId) === undefined;
  });

  const fetchAvatar = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setAvatarUrl(null);
      setIsLoading(false);
      return;
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedAvatarUrl(userId);
      if (cached !== undefined) {
        setAvatarUrl(cached);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch avatar:', error);
        setAvatarUrl(null);
      } else {
        const url = data?.avatar_url || null;
        cacheAvatarUrl(userId, url);
        setAvatarUrl(url);
      }
    } catch (err) {
      console.error('Failed to fetch avatar:', err);
      setAvatarUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch on mount or when userId changes
  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  const refresh = useCallback(async () => {
    await fetchAvatar(true);
  }, [fetchAvatar]);

  return { avatarUrl, isLoading, refresh };
};

/**
 * Fetch and cache avatar for a single user
 */
export const fetchAndCacheAvatar = async (userId: string): Promise<string | null> => {
  // Check cache first
  const cached = getCachedAvatarUrl(userId);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch avatar:', error);
      return null;
    }

    const url = data?.avatar_url || null;
    cacheAvatarUrl(userId, url);
    return url;
  } catch (err) {
    console.error('Failed to fetch avatar:', err);
    return null;
  }
};

/**
 * Prefetch and cache avatars for multiple users
 * Used on app load to cache the current user's avatar and all friends' avatars
 */
export const prefetchAvatars = async (userIds: string[]): Promise<void> => {
  if (userIds.length === 0) return;

  // Filter out already cached IDs
  const uncachedIds = userIds.filter((id) => getCachedAvatarUrl(id) === undefined);

  if (uncachedIds.length === 0) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .in('id', uncachedIds);

    if (error) {
      console.error('Failed to prefetch avatars:', error);
      return;
    }

    if (data) {
      const entries = data.map((profile) => ({
        userId: profile.id,
        url: profile.avatar_url,
      }));
      cacheAvatarUrls(entries);
    }
  } catch (err) {
    console.error('Failed to prefetch avatars:', err);
  }
};

/**
 * Update avatar in cache (call this after uploading a new avatar)
 */
export const updateCachedAvatar = (userId: string, url: string | null): void => {
  cacheAvatarUrl(userId, url);
};
