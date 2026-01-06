import { useState, useCallback } from 'react';
import {
  likeWorkout,
  unlikeWorkout,
  getLikeSummary,
  LikeSummary,
} from '../services/supabase/likes';

interface UseLikesReturn {
  likeSummary: LikeSummary | null;
  isLiking: boolean;
  error: string | null;
  toggleLike: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useLikes = (
  workoutId: string,
  initialSummary?: LikeSummary
): UseLikesReturn => {
  const [likeSummary, setLikeSummary] = useState<LikeSummary | null>(
    initialSummary || null
  );
  const [isLiking, setIsLiking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { summary, error: fetchError } = await getLikeSummary(workoutId);
    if (fetchError) {
      setError(fetchError.message);
      return;
    }
    setLikeSummary(summary);
    setError(null);
  }, [workoutId]);

  const toggleLike = useCallback(async () => {
    if (isLiking || !likeSummary) return;

    setIsLiking(true);
    setError(null);

    // Optimistic update
    const wasLiked = likeSummary.hasLiked;
    setLikeSummary({
      ...likeSummary,
      hasLiked: !wasLiked,
      count: wasLiked ? likeSummary.count - 1 : likeSummary.count + 1,
    });

    try {
      if (wasLiked) {
        const { error: unlikeError } = await unlikeWorkout(workoutId);
        if (unlikeError) throw unlikeError;
      } else {
        const { error: likeError } = await likeWorkout(workoutId);
        if (likeError) throw likeError;
      }
    } catch (err) {
      // Revert optimistic update on error
      setLikeSummary({
        ...likeSummary,
        hasLiked: wasLiked,
        count: likeSummary.count,
      });
      setError(err instanceof Error ? err.message : 'Failed to update like');
    } finally {
      setIsLiking(false);
    }
  }, [workoutId, likeSummary, isLiking]);

  return {
    likeSummary,
    isLiking,
    error,
    toggleLike,
    refresh,
  };
};
