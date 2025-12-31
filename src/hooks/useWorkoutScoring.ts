import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getWorkoutScore } from '../services/openai';
import { WorkoutSession, WorkoutScoreResult } from '../types';

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

  const [isScoring, setIsScoring] = useState(false);
  const [scoreResult, setScoreResult] = useState<WorkoutScoreResult | null>(null);
  const [scoreError, setScoreError] = useState<string | null>(null);

  const clearScoreResult = useCallback(() => {
    setScoreResult(null);
    setScoreError(null);
  }, []);

  const hasApiKey = Boolean(preferences.openaiApiKey?.trim());

  const scoreWorkout = useCallback(async (completedSession: WorkoutSession): Promise<boolean> => {
    const apiKey = preferences.openaiApiKey?.trim();
    if (!apiKey) return false;

    setIsScoring(true);
    setScoreError(null);

    try {
      const score = await getWorkoutScore(
        apiKey,
        completedSession,
        sessions,
        preferences.weightUnit
      );
      setScoreResult(score);
      return true;
    } catch (err) {
      console.error('Scoring error:', err);
      setScoreError(err instanceof Error ? err.message : 'Failed to get score');
      return false;
    } finally {
      setIsScoring(false);
    }
  }, [sessions, preferences.openaiApiKey, preferences.weightUnit]);

  return {
    isScoring,
    scoreResult,
    scoreError,
    clearScoreResult,
    scoreWorkout,
    hasApiKey,
  };
};
