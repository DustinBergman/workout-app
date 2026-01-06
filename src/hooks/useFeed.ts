import { useState, useEffect, useCallback } from 'react';
import {
  getFriendWorkouts,
  FeedWorkout,
} from '../services/supabase/feed';

interface UseFeedReturn {
  workouts: FeedWorkout[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 20;

export const useFeed = (): UseFeedReturn => {
  const [workouts, setWorkouts] = useState<FeedWorkout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, offset]);

  // Initial load
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    workouts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refresh: loadInitial,
  };
};
