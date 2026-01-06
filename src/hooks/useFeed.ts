import { useState, useEffect, useCallback } from 'react';
import {
  getFriendWorkouts,
  FeedWorkout,
} from '../services/supabase/feed';
import {
  getBatchLikeSummaries,
  LikeSummary,
} from '../services/supabase/likes';
import { getBatchCommentCounts } from '../services/supabase/comments';

interface UseFeedReturn {
  workouts: FeedWorkout[];
  likeSummaries: Record<string, LikeSummary>;
  commentCounts: Record<string, number>;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  updateLikeSummary: (workoutId: string, summary: LikeSummary) => void;
  updateCommentCount: (workoutId: string, count: number) => void;
}

const PAGE_SIZE = 20;

export const useFeed = (): UseFeedReturn => {
  const [workouts, setWorkouts] = useState<FeedWorkout[]>([]);
  const [likeSummaries, setLikeSummaries] = useState<Record<string, LikeSummary>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadEngagementData = useCallback(async (workoutIds: string[]) => {
    if (workoutIds.length === 0) return;

    // Load likes and comments in parallel
    const [likesResult, commentsResult] = await Promise.all([
      getBatchLikeSummaries(workoutIds),
      getBatchCommentCounts(workoutIds),
    ]);

    if (!likesResult.error) {
      setLikeSummaries((prev) => ({ ...prev, ...likesResult.summaries }));
    }

    if (!commentsResult.error) {
      setCommentCounts((prev) => ({ ...prev, ...commentsResult.counts }));
    }
  }, []);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setOffset(0);

    try {
      const { workouts: newWorkouts, error: fetchError } = await getFriendWorkouts(PAGE_SIZE, 0);

      if (fetchError) throw fetchError;

      setWorkouts(newWorkouts);
      setHasMore(newWorkouts.length === PAGE_SIZE);
      setOffset(newWorkouts.length);

      // Load engagement data for new workouts
      const workoutIds = newWorkouts.map((w) => w.id);
      await loadEngagementData(workoutIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, [loadEngagementData]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    try {
      const { workouts: newWorkouts, error: fetchError } = await getFriendWorkouts(PAGE_SIZE, offset);

      if (fetchError) throw fetchError;

      setWorkouts((prev) => [...prev, ...newWorkouts]);
      setHasMore(newWorkouts.length === PAGE_SIZE);
      setOffset((prev) => prev + newWorkouts.length);

      // Load engagement data for new workouts
      const workoutIds = newWorkouts.map((w) => w.id);
      await loadEngagementData(workoutIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, offset, loadEngagementData]);

  // Update functions for optimistic updates from child components
  const updateLikeSummary = useCallback((workoutId: string, summary: LikeSummary) => {
    setLikeSummaries((prev) => ({ ...prev, [workoutId]: summary }));
  }, []);

  const updateCommentCount = useCallback((workoutId: string, count: number) => {
    setCommentCounts((prev) => ({ ...prev, [workoutId]: count }));
  }, []);

  // Initial load
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    workouts,
    likeSummaries,
    commentCounts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh: loadInitial,
    updateLikeSummary,
    updateCommentCount,
  };
};
