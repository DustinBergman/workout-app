import { useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { getAllExercises, searchExercises } from '../data/exercises';
import { hasSessionDeviatedFromTemplate } from '../utils/workoutUtils';
import {
  ExerciseSuggestion,
  WorkoutScoreResult,
  Exercise,
} from '../types';

// Import sub-hooks used internally
import { useWorkoutTimer } from './useWorkoutTimer';
import { useWorkoutScoring } from './useWorkoutScoring';
import { useSessionStats } from './useSessionStats';
import { MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from './useCustomExercise';

// Re-export constants for backwards compatibility
export { MUSCLE_GROUPS, EQUIPMENT_OPTIONS };

// Re-export sub-hooks for direct component use
export { useRestTimer } from './useRestTimer';
export { useExerciseManagement } from './useExerciseManagement';
export { useCustomExercise } from './useCustomExercise';
export { useWorkoutScoring } from './useWorkoutScoring';
export { useExerciseHistory } from './useExerciseHistory';

export interface UseActiveWorkoutReturn {
  // Computed values
  elapsedSeconds: number;
  hasDeviated: boolean;
  totalSets: number;
  totalVolume: number;
  totalCardioDistance: number;
  filteredExercises: Exercise[];
  getSuggestionForExercise: (exerciseId: string) => ExerciseSuggestion | undefined;

  // Scoring state (from useWorkoutScoring)
  isScoring: boolean;
  scoreResult: WorkoutScoreResult | null;
  scoreError: string | null;
  clearScoreResult: () => void;

  // Orchestrated actions
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
}

export const useActiveWorkout = (): UseActiveWorkoutReturn => {
  const navigate = useNavigate();
  const location = useLocation();

  // App store selectors (granular)
  const session = useAppStore((state) => state.activeSession);
  const templates = useAppStore((state) => state.templates);
  const customExercises = useAppStore((state) => state.customExercises);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const addSession = useAppStore((state) => state.addSession);
  const updateTemplate = useAppStore((state) => state.updateTemplate);

  // Current workout store selectors
  const exerciseSearch = useCurrentWorkoutStore((state) => state.exerciseSearch);
  const updatePlan = useCurrentWorkoutStore((state) => state.updatePlan);
  const setShowFinishConfirm = useCurrentWorkoutStore((state) => state.setShowFinishConfirm);
  const setExpandedIndex = useCurrentWorkoutStore((state) => state.setExpandedIndex);

  // Compose sub-hooks
  const { elapsedSeconds } = useWorkoutTimer(session);
  const scoring = useWorkoutScoring();
  const sessionStats = useSessionStats(session);

  // Suggestions from navigation state (memoized)
  const suggestions: ExerciseSuggestion[] = useMemo(
    () => location.state?.suggestions || [],
    [location.state?.suggestions]
  );

  // Computed values
  const hasDeviated = useMemo(
    () => session ? hasSessionDeviatedFromTemplate(session, templates) : false,
    [session, templates]
  );

  const filteredExercises = useMemo(() => {
    const allExercises = getAllExercises(customExercises);
    return exerciseSearch
      ? searchExercises(exerciseSearch, customExercises)
      : allExercises;
  }, [exerciseSearch, customExercises]);

  const getSuggestionForExercise = useCallback((exerciseId: string): ExerciseSuggestion | undefined => {
    return suggestions.find((s) => s.exerciseId === exerciseId);
  }, [suggestions]);

  // Redirect if no active session
  useEffect(() => {
    if (!session) {
      navigate('/');
    }
  }, [session, navigate]);

  // Auto-expand first incomplete exercise on mount
  useEffect(() => {
    if (session) {
      const state = useCurrentWorkoutStore.getState();
      const expandedIndex = state.expandedIndex;
      const skipAutoExpand = state.skipAutoExpand;

      // Skip auto-expand if user just reordered exercises
      if (skipAutoExpand) {
        state.setSkipAutoExpand(false);
        return;
      }

      if (expandedIndex === null) {
        const firstIncomplete = session.exercises.findIndex(
          (ex) => ex.type === 'cardio'
            ? ex.sets.length === 0
            : ex.sets.length < (ex.targetSets || 3)
        );
        setExpandedIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
      }
    }
  }, [session, setExpandedIndex]);

  // Finish workout
  const finishWorkout = useCallback(async () => {
    if (!session) return;

    const completedSession = {
      ...session,
      completedAt: new Date().toISOString(),
    };

    // Update template if user opted to
    if (updatePlan && session.templateId && hasDeviated) {
      const existingTemplate = templates.find(t => t.id === session.templateId);
      if (existingTemplate) {
        const updatedTemplate = {
          ...existingTemplate,
          exercises: session.exercises.map(ex => {
            if (ex.type === 'cardio') {
              return {
                type: 'cardio' as const,
                exerciseId: ex.exerciseId,
                restSeconds: ex.restSeconds,
              };
            }
            return {
              type: 'strength' as const,
              exerciseId: ex.exerciseId,
              targetSets: ex.targetSets,
              targetReps: ex.targetReps,
              restSeconds: ex.restSeconds,
            };
          }),
        };
        updateTemplate(updatedTemplate);
      }
    }

    // Save to history immediately
    addSession(completedSession);
    setActiveSession(null);

    // Score if API key exists
    if (scoring.hasApiKey) {
      setShowFinishConfirm(false);
      const success = await scoring.scoreWorkout(completedSession);
      if (!success && scoring.scoreError) {
        // Navigate to history on error after brief delay
        setTimeout(() => navigate('/history'), 2000);
      }
    } else {
      // No API key, go directly to history
      navigate('/history');
    }
  }, [session, updatePlan, hasDeviated, templates, addSession, setActiveSession, updateTemplate, scoring, navigate, setShowFinishConfirm]);

  // Cancel workout
  const cancelWorkout = useCallback(() => {
    setActiveSession(null);
    navigate('/');
  }, [setActiveSession, navigate]);

  return {
    // Computed values
    elapsedSeconds,
    hasDeviated,
    totalSets: sessionStats.totalSets,
    totalVolume: sessionStats.totalVolume,
    totalCardioDistance: sessionStats.totalCardioDistance,
    filteredExercises,
    getSuggestionForExercise,

    // Scoring
    isScoring: scoring.isScoring,
    scoreResult: scoring.scoreResult,
    scoreError: scoring.scoreError,
    clearScoreResult: scoring.clearScoreResult,

    // Actions
    finishWorkout,
    cancelWorkout,
  };
};
