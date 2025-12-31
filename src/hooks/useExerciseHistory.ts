import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { getExerciseById } from '../data/exercises';

interface UseExerciseHistoryReturn {
  historyExerciseId: string | null;
  historyExerciseName: string;
  handleShowHistory: (exerciseId: string) => void;
  closeHistory: () => void;
}

export const useExerciseHistory = (): UseExerciseHistoryReturn => {
  const customExercises = useAppStore((state) => state.customExercises);
  const historyExerciseId = useCurrentWorkoutStore((state) => state.historyExerciseId);
  const setHistoryExerciseId = useCurrentWorkoutStore((state) => state.setHistoryExerciseId);

  const historyExerciseName = historyExerciseId
    ? getExerciseById(historyExerciseId, customExercises)?.name || 'Exercise'
    : '';

  const handleShowHistory = useCallback((exerciseId: string) => {
    setHistoryExerciseId(exerciseId);
  }, [setHistoryExerciseId]);

  const closeHistory = useCallback(() => {
    setHistoryExerciseId(null);
  }, [setHistoryExerciseId]);

  return {
    historyExerciseId,
    historyExerciseName,
    handleShowHistory,
    closeHistory,
  };
};
