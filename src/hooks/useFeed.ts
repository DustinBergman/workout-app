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
  workouts: FeedWorkout[];
  likeSummaries: Record<string, LikeSummary>;
  commentCounts: Record<string, number>;
  previewComments: Record<string, WorkoutComment[]>;
  offset: number;
  hasMore: boolean;
  timestamp: number;
}

let feedCache: FeedCache | null = null;

const isCacheValid = (): boolean => {
  if (!feedCache) return false;
  return Date.now() - feedCache.timestamp < CACHE_TTL_MS;
};

const clearFeedCache = () => {
  feedCache = null;
};

// Export for testing
export { clearFeedCache };

export const useFeed = (): UseFeedReturn => {
  const [workouts, setWorkouts] = useState<FeedWorkout[]>(feedCache?.workouts || []);
  const [likeSummaries, setLikeSummaries] = useState<Record<string, LikeSummary>>(feedCache?.likeSummaries || {});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(feedCache?.commentCounts || {});
  const [previewComments, setPreviewComments] = useState<Record<string, WorkoutComment[]>>(feedCache?.previewComments || {});
  const [isLoading, setIsLoading] = useState(!isCacheValid());
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(feedCache?.hasMore ?? true);
  const [offset, setOffset] = useState(feedCache?.offset || 0);
  const initialLoadDone = useRef(isCacheValid());

  const loadEngagementData = useCallback(async (workoutIds: string[]): Promise<{
    likes: Record<string, LikeSummary>;
    counts: Record<string, number>;
    previews: Record<string, WorkoutComment[]>;
  }> => {
    if (workoutIds.length === 0) return { likes: {}, counts: {}, previews: {} };

    // Load likes, comment counts, and preview comments in parallel
    const [likesResult, commentsResult, previewsResult] = await Promise.all([
      getBatchLikeSummaries(workoutIds),
      getBatchCommentCounts(workoutIds),
      getBatchPreviewComments(workoutIds),
    ]);

    const likes = likesResult.error ? {} : likesResult.summaries;
    const counts = commentsResult.error ? {} : commentsResult.counts;
    const previews = previewsResult.error ? {} : previewsResult.previews;

    setLikeSummaries((prev) => ({ ...prev, ...likes }));
    setCommentCounts((prev) => ({ ...prev, ...counts }));
    setPreviewComments((prev) => ({ ...prev, ...previews }));

    return { likes, counts, previews };
  }, []);

  const loadInitial = useCallback(async (force = false) => {
    // If cache is valid and not forcing, skip loading
    if (!force && isCacheValid() && initialLoadDone.current) {
      setIsLoading(false);
      return;
    }

    // Use isRefreshing if we already have data, isLoading for initial load
    if (workouts.length > 0) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const { workouts: newWorkouts, error: fetchError } = await getFriendWorkouts(PAGE_SIZE, 0);

      if (fetchError) throw fetchError;

      const newHasMore = newWorkouts.length === PAGE_SIZE;
      const newOffset = newWorkouts.length;

      setWorkouts(newWorkouts);
      setHasMore(newHasMore);
      setOffset(newOffset);

      // Load engagement data for new workouts
      const workoutIds = newWorkouts.map((w) => w.id);
      const engagement = await loadEngagementData(workoutIds);

      // Update cache
      feedCache = {
        workouts: newWorkouts,
        likeSummaries: engagement.likes,
        commentCounts: engagement.counts,
        previewComments: engagement.previews,
        offset: newOffset,
        hasMore: newHasMore,
        timestamp: Date.now(),
      };

      initialLoadDone.current = true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load feed';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadEngagementData, workouts.length]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const { workouts: newWorkouts, error: fetchError } = await getFriendWorkouts(PAGE_SIZE, offset);

      if (fetchError) throw fetchError;

      const updatedWorkouts = [...workouts, ...newWorkouts];
      const newHasMore = newWorkouts.length === PAGE_SIZE;
      const newOffset = offset + newWorkouts.length;

      setWorkouts(updatedWorkouts);
      setHasMore(newHasMore);
      setOffset(newOffset);

      // Load engagement data for new workouts
      const workoutIds = newWorkouts.map((w) => w.id);
      const engagement = await loadEngagementData(workoutIds);

      // Update cache with new data
      if (feedCache) {
        feedCache = {
          ...feedCache,
          workouts: updatedWorkouts,
          likeSummaries: { ...feedCache.likeSummaries, ...engagement.likes },
          commentCounts: { ...feedCache.commentCounts, ...engagement.counts },
          previewComments: { ...feedCache.previewComments, ...engagement.previews },
          offset: newOffset,
          hasMore: newHasMore,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load more';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, offset, workouts, loadEngagementData]);

  // Update functions for optimistic updates from child components
  const updateLikeSummary = useCallback((workoutId: string, summary: LikeSummary) => {
    setLikeSummaries((prev) => {
      const updated = { ...prev, [workoutId]: summary };
      // Also update cache
      if (feedCache) {
        feedCache.likeSummaries = updated;
      }
      return updated;
    });
  }, []);

  const updateCommentCount = useCallback((workoutId: string, count: number) => {
    setCommentCounts((prev) => {
      const updated = { ...prev, [workoutId]: count };
      // Also update cache
      if (feedCache) {
        feedCache.commentCounts = updated;
      }
      return updated;
    });
  }, []);

  const updatePreviewComments = useCallback((workoutId: string, comments: WorkoutComment[]) => {
    setPreviewComments((prev) => {
      const updated = { ...prev, [workoutId]: comments };
      // Also update cache
      if (feedCache) {
        feedCache.previewComments = updated;
      }
      return updated;
    });
  }, []);

  const removeWorkout = useCallback((workoutId: string) => {
    setWorkouts((prev) => {
      const updated = prev.filter((w) => w.id !== workoutId);
      // Also update cache
      if (feedCache) {
        feedCache.workouts = updated;
      }
      return updated;
    });
    // Clean up related engagement data
    setLikeSummaries((prev) => {
      const { [workoutId]: _, ...rest } = prev;
      if (feedCache) {
        feedCache.likeSummaries = rest;
      }
      return rest;
    });
    setCommentCounts((prev) => {
      const { [workoutId]: _, ...rest } = prev;
      if (feedCache) {
        feedCache.commentCounts = rest;
      }
      return rest;
    });
    setPreviewComments((prev) => {
      const { [workoutId]: _, ...rest } = prev;
      if (feedCache) {
        feedCache.previewComments = rest;
      }
      return rest;
    });
  }, []);

  // Refresh function that forces a reload
  const refresh = useCallback(async (force = true) => {
    await loadInitial(force);
  }, [loadInitial]);

  // Initial load
  useEffect(() => {
    loadInitial(false);
  }, [loadInitial]);

  return {
    workouts,
    likeSummaries,
    commentCounts,
    previewComments,
    isLoading,
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
