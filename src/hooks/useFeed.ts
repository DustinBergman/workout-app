import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getFriendWorkouts,
  FeedWorkout,
} from '../services/supabase/feed';
import {
  getBatchLikeSummaries,
  LikeSummary,
} from '../services/supabase/likes';
import { getBatchCommentCounts, getBatchPreviewComments, WorkoutComment } from '../services/supabase/comments';
import { toast } from '../store/toastStore';
import { cacheAvatarUrls } from '../services/avatarCache';
import { useAuth } from './useAuth';

interface UseFeedReturn {
  workouts: FeedWorkout[];
  likeSummaries: Record<string, LikeSummary>;
  commentCounts: Record<string, number>;
  previewComments: Record<string, WorkoutComment[]>;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: (force?: boolean) => Promise<void>;
  updateLikeSummary: (workoutId: string, summary: LikeSummary) => void;
  updateCommentCount: (workoutId: string, count: number) => void;
  updatePreviewComments: (workoutId: string, comments: WorkoutComment[]) => void;
  removeWorkout: (workoutId: string) => void;
}

const PAGE_SIZE = 20;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// In-memory cache for feed data
interface FeedCache {
  userId: string;
  workouts: FeedWorkout[];
  likeSummaries: Record<string, LikeSummary>;
  commentCounts: Record<string, number>;
  previewComments: Record<string, WorkoutComment[]>;
  offset: number;
  hasMore: boolean;
  timestamp: number;
}

interface EngagementVersions {
  likes: number;
  counts: number;
  previews: number;
}

let feedCache: FeedCache | null = null;
let feedCacheGeneration = 0;

const isCacheValid = (userId: string): boolean => {
  if (!feedCache || feedCache.userId !== userId) return false;
  return Date.now() - feedCache.timestamp < CACHE_TTL_MS;
};

const clearFeedCache = (discard = false) => {
  if (discard) {
    feedCache = null;
  } else if (feedCache) {
    feedCache = { ...feedCache, timestamp: 0 };
  }
  feedCacheGeneration += 1;
};

export const setFeedCacheUser = (userId: string | null): void => {
  if (feedCache && feedCache.userId !== (userId ?? 'anonymous')) {
    clearFeedCache(true);
  }
};

export { clearFeedCache };

export const useFeed = (): UseFeedReturn => {
  const { user } = useAuth();
  const feedUserId = user?.id ?? 'anonymous';
  const initialCache = feedCache?.userId === feedUserId ? feedCache : null;
  const [stateUserId, setStateUserId] = useState(feedUserId);
  const [workouts, setWorkouts] = useState<FeedWorkout[]>(initialCache?.workouts || []);
  const [likeSummaries, setLikeSummaries] = useState<Record<string, LikeSummary>>(initialCache?.likeSummaries || {});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(initialCache?.commentCounts || {});
  const [previewComments, setPreviewComments] = useState<Record<string, WorkoutComment[]>>(initialCache?.previewComments || {});
  const [isLoading, setIsLoading] = useState(!initialCache);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialCache?.hasMore ?? true);
  const initialLoadDone = useRef(isCacheValid(feedUserId));
  const identityRef = useRef(feedUserId);
  const workoutsRef = useRef(workouts);
  const offsetRef = useRef(initialCache?.offset || 0);
  const hasMoreRef = useRef(initialCache?.hasMore ?? true);
  const loadMoreInFlightRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const engagementVersionsRef = useRef<Record<string, EngagementVersions>>({});
  identityRef.current = feedUserId;

  useEffect(() => {
    const cache = feedCache?.userId === feedUserId
      ? feedCache
      : null;
    setStateUserId(feedUserId);
    setWorkouts(cache?.workouts ?? []);
    workoutsRef.current = cache?.workouts ?? [];
    setLikeSummaries(cache?.likeSummaries ?? {});
    setCommentCounts(cache?.commentCounts ?? {});
    setPreviewComments(cache?.previewComments ?? {});
    setHasMore(cache?.hasMore ?? true);
    hasMoreRef.current = cache?.hasMore ?? true;
    offsetRef.current = cache?.offset ?? 0;
    initialLoadDone.current = isCacheValid(feedUserId);
    loadMoreInFlightRef.current = false;
    refreshInFlightRef.current = false;
    engagementVersionsRef.current = {};
    setIsLoadingMore(false);
    setIsLoading(!cache);
  }, [feedUserId]);

  const loadEngagementData = useCallback(async (
    workoutIds: string[],
    requestUserId: string,
    requestGeneration: number
  ): Promise<{
    likes: Record<string, LikeSummary>;
    counts: Record<string, number>;
    previews: Record<string, WorkoutComment[]>;
  }> => {
    if (workoutIds.length === 0) return { likes: {}, counts: {}, previews: {} };
    const requestVersions = Object.fromEntries(
      workoutIds.map((workoutId) => [
        workoutId,
        engagementVersionsRef.current[workoutId] ?? {
          likes: 0,
          counts: 0,
          previews: 0,
        },
      ])
    );

    // Load likes, comment counts, and preview comments in parallel
    const [likesResult, commentsResult, previewsResult] = await Promise.all([
      getBatchLikeSummaries(workoutIds),
      getBatchCommentCounts(workoutIds),
      getBatchPreviewComments(workoutIds),
    ]);

    const filterUnchanged = <T>(
      values: Record<string, T>,
      category: keyof EngagementVersions
    ): Record<string, T> =>
      Object.fromEntries(
        Object.entries(values).filter(([workoutId]) =>
          (engagementVersionsRef.current[workoutId]?.[category] ?? 0) ===
          requestVersions[workoutId][category]
        )
      );
    const likes = filterUnchanged(
      likesResult.error ? {} : likesResult.summaries,
      'likes'
    );
    const counts = filterUnchanged(
      commentsResult.error ? {} : commentsResult.counts,
      'counts'
    );
    const previews = filterUnchanged(
      previewsResult.error ? {} : previewsResult.previews,
      'previews'
    );

    if (
      identityRef.current !== requestUserId ||
      requestGeneration !== feedCacheGeneration
    ) {
      return { likes: {}, counts: {}, previews: {} };
    }

    setLikeSummaries((prev) => ({ ...prev, ...likes }));
    setCommentCounts((prev) => ({ ...prev, ...counts }));
    setPreviewComments((prev) => ({ ...prev, ...previews }));

    return { likes, counts, previews };
  }, []);

  const loadInitial = useCallback(async (force = false) => {
    const requestUserId = feedUserId;
    const requestGeneration = feedCacheGeneration;
    // If cache is valid and not forcing, skip loading
    if (!force && isCacheValid(requestUserId) && initialLoadDone.current) {
      setIsLoading(false);
      return;
    }
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;

    // Use isRefreshing if we already have data, isLoading for initial load
    if (workoutsRef.current.length > 0) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const { workouts: firstWorkouts, error: fetchError } =
        await getFriendWorkouts(PAGE_SIZE, 0);

      if (fetchError) throw fetchError;
      if (
        identityRef.current !== requestUserId ||
        requestGeneration !== feedCacheGeneration
      ) return;

      let newWorkouts = firstWorkouts;
      if (!force && newWorkouts.length === 0 && workoutsRef.current.length > 0) {
        const confirmation = await getFriendWorkouts(PAGE_SIZE, 0);
        if (confirmation.error) throw confirmation.error;
        if (
          identityRef.current !== requestUserId ||
          requestGeneration !== feedCacheGeneration
        ) return;
        newWorkouts = confirmation.workouts;
      }

      const newHasMore = newWorkouts.length === PAGE_SIZE;
      const newOffset = newWorkouts.length;

      // Cache avatar URLs for quick access
      cacheAvatarUrls(
        newWorkouts.map((w) => ({ userId: w.user_id, url: w.user.avatar_url }))
      );

      setWorkouts(newWorkouts);
      workoutsRef.current = newWorkouts;
      setHasMore(newHasMore);
      hasMoreRef.current = newHasMore;
      offsetRef.current = newOffset;
      // Cache workouts immediately. Engagement requests can be slower and
      // should not make a later feed visit lose the known-good workout list.
      const existingEngagement =
        feedCache?.userId === requestUserId ? feedCache : null;
      feedCache = {
        userId: requestUserId,
        workouts: newWorkouts,
        likeSummaries: existingEngagement?.likeSummaries ?? {},
        commentCounts: existingEngagement?.commentCounts ?? {},
        previewComments: existingEngagement?.previewComments ?? {},
        offset: newOffset,
        hasMore: newHasMore,
        timestamp: 0,
      };

      // Load engagement data for new workouts
      const workoutIds = newWorkouts.map((w) => w.id);
      const engagement = await loadEngagementData(
        workoutIds,
        requestUserId,
        requestGeneration
      );
      if (
        identityRef.current !== requestUserId ||
        requestGeneration !== feedCacheGeneration
      ) return;

      // Update cache
      const latestEngagement =
        feedCache?.userId === requestUserId ? feedCache : null;
      feedCache = {
        userId: requestUserId,
        workouts: newWorkouts,
        likeSummaries: {
          ...latestEngagement?.likeSummaries,
          ...engagement.likes,
        },
        commentCounts: {
          ...latestEngagement?.commentCounts,
          ...engagement.counts,
        },
        previewComments: {
          ...latestEngagement?.previewComments,
          ...engagement.previews,
        },
        offset: newOffset,
        hasMore: newHasMore,
        timestamp: Date.now(),
      };

      initialLoadDone.current = true;
    } catch (err) {
      if (identityRef.current !== requestUserId) return;
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      setError(message);
      toast.error(message);
    } finally {
      if (identityRef.current === requestUserId) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      refreshInFlightRef.current = false;
    }
  }, [feedUserId, loadEngagementData]);

  const loadMore = useCallback(async () => {
    if (
      loadMoreInFlightRef.current ||
      !hasMoreRef.current ||
      refreshInFlightRef.current
    ) return;
    if (!isCacheValid(feedUserId)) {
      await loadInitial(false);
      if (!isCacheValid(feedUserId) || !hasMoreRef.current) return;
    }

    const requestUserId = feedUserId;
    const requestGeneration = feedCacheGeneration;
    const requestOffset = offsetRef.current;
    loadMoreInFlightRef.current = true;
    setIsLoadingMore(true);
    setError(null);

    try {
      const { workouts: newWorkouts, error: fetchError } =
        await getFriendWorkouts(PAGE_SIZE, requestOffset);

      if (fetchError) throw fetchError;
      if (
        identityRef.current !== requestUserId ||
        requestGeneration !== feedCacheGeneration
      ) return;

      const newHasMore = newWorkouts.length === PAGE_SIZE;
      const newOffset = requestOffset + newWorkouts.length;

      // Cache avatar URLs for quick access
      cacheAvatarUrls(
        newWorkouts.map((w) => ({ userId: w.user_id, url: w.user.avatar_url }))
      );

      const currentById = new Map(workoutsRef.current.map((workout) => [workout.id, workout]));
      for (const workout of newWorkouts) currentById.set(workout.id, workout);
      const updatedWorkouts = [...currentById.values()];
      setWorkouts((previous) => {
        const byId = new Map(previous.map((workout) => [workout.id, workout]));
        for (const workout of newWorkouts) byId.set(workout.id, workout);
        const updated = [...byId.values()];
        workoutsRef.current = updated;
        return updated;
      });
      setHasMore(newHasMore);
      hasMoreRef.current = newHasMore;
      offsetRef.current = newOffset;

      // Load engagement data for new workouts
      const workoutIds = newWorkouts.map((w) => w.id);
      const engagement = await loadEngagementData(
        workoutIds,
        requestUserId,
        requestGeneration
      );
      if (
        identityRef.current !== requestUserId ||
        requestGeneration !== feedCacheGeneration
      ) return;

      // Update cache with new data
      if (feedCache?.userId === requestUserId) {
        feedCache = {
          ...feedCache,
          workouts: updatedWorkouts,
          likeSummaries: { ...feedCache.likeSummaries, ...engagement.likes },
          commentCounts: { ...feedCache.commentCounts, ...engagement.counts },
          previewComments: { ...feedCache.previewComments, ...engagement.previews },
          offset: newOffset,
          hasMore: newHasMore,
          timestamp: Date.now(),
        };
      }
    } catch (err) {
      if (identityRef.current !== requestUserId) return;
      const message = err instanceof Error ? err.message : 'Failed to load more';
      setError(message);
      toast.error(message);
    } finally {
      loadMoreInFlightRef.current = false;
      if (identityRef.current === requestUserId) setIsLoadingMore(false);
    }
  }, [feedUserId, loadEngagementData, loadInitial]);

  // Update functions for optimistic updates from child components
  const updateLikeSummary = useCallback((workoutId: string, summary: LikeSummary) => {
    const versions = engagementVersionsRef.current[workoutId] ?? {
      likes: 0,
      counts: 0,
      previews: 0,
    };
    engagementVersionsRef.current[workoutId] = {
      ...versions,
      likes: versions.likes + 1,
    };
    setLikeSummaries((prev) => {
      const updated = { ...prev, [workoutId]: summary };
      // Also update cache
      if (feedCache?.userId === feedUserId) {
        feedCache.likeSummaries = updated;
      }
      return updated;
    });
  }, [feedUserId]);

  const updateCommentCount = useCallback((workoutId: string, count: number) => {
    const versions = engagementVersionsRef.current[workoutId] ?? {
      likes: 0,
      counts: 0,
      previews: 0,
    };
    engagementVersionsRef.current[workoutId] = {
      ...versions,
      counts: versions.counts + 1,
    };
    setCommentCounts((prev) => {
      const updated = { ...prev, [workoutId]: count };
      // Also update cache
      if (feedCache?.userId === feedUserId) {
        feedCache.commentCounts = updated;
      }
      return updated;
    });
  }, [feedUserId]);

  const updatePreviewComments = useCallback((workoutId: string, comments: WorkoutComment[]) => {
    const versions = engagementVersionsRef.current[workoutId] ?? {
      likes: 0,
      counts: 0,
      previews: 0,
    };
    engagementVersionsRef.current[workoutId] = {
      ...versions,
      previews: versions.previews + 1,
    };
    setPreviewComments((prev) => {
      const updated = { ...prev, [workoutId]: comments };
      // Also update cache
      if (feedCache?.userId === feedUserId) {
        feedCache.previewComments = updated;
      }
      return updated;
    });
  }, [feedUserId]);

  const removeWorkout = useCallback((workoutId: string) => {
    const versions = engagementVersionsRef.current[workoutId] ?? {
      likes: 0,
      counts: 0,
      previews: 0,
    };
    engagementVersionsRef.current[workoutId] = {
      likes: versions.likes + 1,
      counts: versions.counts + 1,
      previews: versions.previews + 1,
    };
    setWorkouts((prev) => {
      const updated = prev.filter((w) => w.id !== workoutId);
      workoutsRef.current = updated;
      // Also update cache
      if (feedCache?.userId === feedUserId) {
        feedCache.workouts = updated;
      }
      return updated;
    });
    // Clean up related engagement data
    setLikeSummaries((prev) => {
      const rest = { ...prev };
      delete rest[workoutId];
      if (feedCache?.userId === feedUserId) {
        feedCache.likeSummaries = rest;
      }
      return rest;
    });
    setCommentCounts((prev) => {
      const rest = { ...prev };
      delete rest[workoutId];
      if (feedCache?.userId === feedUserId) {
        feedCache.commentCounts = rest;
      }
      return rest;
    });
    setPreviewComments((prev) => {
      const rest = { ...prev };
      delete rest[workoutId];
      if (feedCache?.userId === feedUserId) {
        feedCache.previewComments = rest;
      }
      return rest;
    });
  }, [feedUserId]);

  // Refresh function that forces a reload
  const refresh = useCallback(async (force = true) => {
    await loadInitial(force);
  }, [loadInitial]);

  // Initial load
  useEffect(() => {
    loadInitial(false);
  }, [loadInitial]);

  const isCurrentUserState = stateUserId === feedUserId;

  return {
    workouts: isCurrentUserState ? workouts : [],
    likeSummaries: isCurrentUserState ? likeSummaries : {},
    commentCounts: isCurrentUserState ? commentCounts : {},
    previewComments: isCurrentUserState ? previewComments : {},
    isLoading: isCurrentUserState ? isLoading : true,
    isLoadingMore,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    refresh,
    updateLikeSummary,
    updateCommentCount,
    updatePreviewComments,
    removeWorkout,
  };
};
