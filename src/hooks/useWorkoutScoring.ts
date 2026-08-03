import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getWorkoutScore } from '../services/openai';
import { WorkoutSession, WorkoutScoreResult } from '../types';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { getAuthUser } from '../services/supabase/authHelper';

let scoringRequestGeneration = 0;

interface UseWorkoutScoringReturn {
  isScoring: boolean;
  scoreResult: WorkoutScoreResult | null;
  scoreError: string | null;
  clearScoreResult: () => void;
  scoreWorkout: (completedSession: WorkoutSession) => Promise<boolean>;
  hasApiKey: boolean;
}

export const useWorkoutScoring = (): UseWorkoutScoringReturn => {
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);

  const isScoring = useCurrentWorkoutStore((state) => state.isScoring);
  const scoreResult = useCurrentWorkoutStore((state) => state.scoreResult);
  const scoreError = useCurrentWorkoutStore((state) => state.scoreError);
  const setIsScoring = useCurrentWorkoutStore((state) => state.setIsScoring);
  const setScoreResult = useCurrentWorkoutStore((state) => state.setScoreResult);
  const setScoreError = useCurrentWorkoutStore((state) => state.setScoreError);
  const clearStoredScoreResult = useCurrentWorkoutStore((state) => state.clearScoreResult);

  const clearScoreResult = useCallback(() => {
    clearStoredScoreResult();
  }, [clearStoredScoreResult]);

  const hasApiKey = Boolean(preferences.openaiApiKey?.trim());

  const scoreWorkout = useCallback(async (completedSession: WorkoutSession): Promise<boolean> => {
    const apiKey = preferences.openaiApiKey?.trim();
    if (!apiKey) return false;
    const requestUserId = (await getAuthUser())?.id;
    if (!requestUserId) return false;
    const requestGeneration = ++scoringRequestGeneration;

    clearStoredScoreResult();
    setIsScoring(true);
    setScoreError(null);

    try {
      const score = await getWorkoutScore(
        apiKey,
        completedSession,
        sessions,
        preferences.weightUnit
      );
      const currentUserId = (await getAuthUser())?.id;
      if (
        requestGeneration !== scoringRequestGeneration ||
        currentUserId !== requestUserId
      ) {
        return false;
      }
      setScoreResult(score);
      return true;
    } catch (err) {
      console.error('Scoring error:', err);
      const currentUserId = (await getAuthUser())?.id;
      if (
        requestGeneration === scoringRequestGeneration &&
        currentUserId === requestUserId
      ) {
        setScoreError(err instanceof Error ? err.message : 'Failed to get score');
      }
      return false;
    } finally {
      if (requestGeneration === scoringRequestGeneration) {
        setIsScoring(false);
      }
    }
  }, [
    sessions,
    preferences.openaiApiKey,
    preferences.weightUnit,
    clearStoredScoreResult,
    setIsScoring,
    setScoreError,
    setScoreResult,
  ]);

  return {
    isScoring,
    scoreResult,
    scoreError,
    clearScoreResult,
    scoreWorkout,
    hasApiKey,
  };
};
