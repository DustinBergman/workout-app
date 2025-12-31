import { useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { getAllExercises, searchExercises } from '../data/exercises';
import { hasSessionDeviatedFromTemplate } from '../utils/workoutUtils';
import {
  WorkoutSession,
  ExerciseSuggestion,
  WorkoutScoreResult,
  MuscleGroup,
  Equipment,
  DistanceUnit,
  Exercise,
} from '../types';

// Import sub-hooks
import { useWorkoutTimer } from './useWorkoutTimer';
import { useRestTimer } from './useRestTimer';
import { useExerciseManagement } from './useExerciseManagement';
import { useCustomExercise, CustomExerciseState, MUSCLE_GROUPS, EQUIPMENT_OPTIONS } from './useCustomExercise';
import { useWorkoutScoring } from './useWorkoutScoring';
import { useExerciseHistory } from './useExerciseHistory';
import { useSessionStats } from './useSessionStats';

// Re-export constants for backwards compatibility
export { MUSCLE_GROUPS, EQUIPMENT_OPTIONS };

export interface UseActiveWorkoutReturn {
  // Session state
  session: WorkoutSession | null;
  elapsedSeconds: number;
  hasDeviated: boolean;
  totalSets: number;
  totalVolume: number;
  totalCardioDistance: number;

  // Exercise management
  expandedIndex: number | null;
  setExpandedIndex: (index: number | null) => void;
  logSetForExercise: (exerciseIndex: number, reps: number, weight: number) => void;
  logCardioForExercise: (exerciseIndex: number, distance: number, distanceUnit: DistanceUnit, durationSeconds: number) => void;
  removeLastSetForExercise: (exerciseIndex: number) => void;
  addExerciseToSession: (exerciseId: string) => void;
  removeExercise: (index: number) => void;
  updateTargetSets: (exerciseId: string, delta: number) => void;
  getSuggestionForExercise: (exerciseId: string) => ExerciseSuggestion | undefined;

  // Custom exercise creation
  customExerciseState: CustomExerciseState;
  setIsCreatingExercise: (value: boolean) => void;
  setNewExerciseName: (name: string) => void;
  setNewExerciseEquipment: (equipment: Equipment) => void;
  toggleMuscleGroup: (muscle: MuscleGroup) => void;
  resetNewExerciseForm: () => void;
  handleCreateExercise: () => void;

  // Timer
  timerDuration: number;
  showTimer: boolean;
  handleStartTimer: (duration: number) => void;
  hideTimer: () => void;

  // Modals
  showExercisePicker: boolean;
  setShowExercisePicker: (value: boolean) => void;
  exerciseSearch: string;
  setExerciseSearch: (value: string) => void;
  showFinishConfirm: boolean;
  setShowFinishConfirm: (value: boolean) => void;
  filteredExercises: Exercise[];

  // Exercise history
  historyExerciseId: string | null;
  historyExerciseName: string;
  handleShowHistory: (exerciseId: string) => void;
  closeHistory: () => void;

  // Template update
  updatePlan: boolean;
  setUpdatePlan: (value: boolean) => void;

  // Scoring
  isScoring: boolean;
  scoreResult: WorkoutScoreResult | null;
  scoreError: string | null;
  clearScoreResult: () => void;

  // Actions
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;

  // Preferences (exposed for components)
  preferences: {
    weightUnit: 'lbs' | 'kg';
    distanceUnit: DistanceUnit;
  };
}

export const useActiveWorkout = (): UseActiveWorkoutReturn => {
  const navigate = useNavigate();
  const location = useLocation();

  // App store selectors (granular)
  const session = useAppStore((state) => state.activeSession);
  const templates = useAppStore((state) => state.templates);
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);
  const distanceUnit = useAppStore((state) => state.preferences.distanceUnit);
  const customExercises = useAppStore((state) => state.customExercises);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const addSession = useAppStore((state) => state.addSession);
  const updateTemplate = useAppStore((state) => state.updateTemplate);

  // Current workout store selectors
  const expandedIndex = useCurrentWorkoutStore((state) => state.expandedIndex);
  const setExpandedIndex = useCurrentWorkoutStore((state) => state.setExpandedIndex);
  const showExercisePicker = useCurrentWorkoutStore((state) => state.showExercisePicker);
  const setShowExercisePicker = useCurrentWorkoutStore((state) => state.setShowExercisePicker);
  const exerciseSearch = useCurrentWorkoutStore((state) => state.exerciseSearch);
  const setExerciseSearch = useCurrentWorkoutStore((state) => state.setExerciseSearch);
  const showFinishConfirm = useCurrentWorkoutStore((state) => state.showFinishConfirm);
  const setShowFinishConfirm = useCurrentWorkoutStore((state) => state.setShowFinishConfirm);
  const updatePlan = useCurrentWorkoutStore((state) => state.updatePlan);
  const setUpdatePlan = useCurrentWorkoutStore((state) => state.setUpdatePlan);

  // Compose sub-hooks
  const { elapsedSeconds } = useWorkoutTimer(session);
  const { showTimer, timerDuration, handleStartTimer, hideTimer } = useRestTimer();
  const exerciseManagement = useExerciseManagement();
  const customExercise = useCustomExercise();
  const scoring = useWorkoutScoring();
  const exerciseHistory = useExerciseHistory();
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
    if (session && expandedIndex === null) {
      const firstIncomplete = session.exercises.findIndex(
        (ex) => ex.type === 'cardio'
          ? ex.sets.length === 0
          : ex.sets.length < (ex.targetSets || 3)
      );
      setExpandedIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    }
  }, [session, expandedIndex, setExpandedIndex]);

  // Custom exercise creation with session integration
  const handleCreateExercise = useCallback(() => {
    const newExercise = customExercise.createExercise();
    if (newExercise) {
      exerciseManagement.addExerciseToSession(newExercise.id);
    }
  }, [customExercise, exerciseManagement]);

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

  // Return the same interface for backwards compatibility
  return {
    // Session state
    session,
    elapsedSeconds,
    hasDeviated,
    totalSets: sessionStats.totalSets,
    totalVolume: sessionStats.totalVolume,
    totalCardioDistance: sessionStats.totalCardioDistance,

    // Exercise management
    expandedIndex,
    setExpandedIndex,
    logSetForExercise: exerciseManagement.logSetForExercise,
    logCardioForExercise: exerciseManagement.logCardioForExercise,
    removeLastSetForExercise: exerciseManagement.removeLastSetForExercise,
    addExerciseToSession: exerciseManagement.addExerciseToSession,
    removeExercise: exerciseManagement.removeExercise,
    updateTargetSets: exerciseManagement.updateTargetSets,
    getSuggestionForExercise,

    // Custom exercise creation
    customExerciseState: customExercise.customExerciseState,
    setIsCreatingExercise: customExercise.setIsCreatingExercise,
    setNewExerciseName: customExercise.setNewExerciseName,
    setNewExerciseEquipment: customExercise.setNewExerciseEquipment,
    toggleMuscleGroup: customExercise.toggleMuscleGroup,
    resetNewExerciseForm: customExercise.resetNewExerciseForm,
    handleCreateExercise,

    // Timer
    timerDuration,
    showTimer,
    handleStartTimer,
    hideTimer,

    // Modals
    showExercisePicker,
    setShowExercisePicker,
    exerciseSearch,
    setExerciseSearch,
    showFinishConfirm,
    setShowFinishConfirm,
    filteredExercises,

    // Exercise history
    historyExerciseId: exerciseHistory.historyExerciseId,
    historyExerciseName: exerciseHistory.historyExerciseName,
    handleShowHistory: exerciseHistory.handleShowHistory,
    closeHistory: exerciseHistory.closeHistory,

    // Template update
    updatePlan,
    setUpdatePlan,

    // Scoring
    isScoring: scoring.isScoring,
    scoreResult: scoring.scoreResult,
    scoreError: scoring.scoreError,
    clearScoreResult: scoring.clearScoreResult,

    // Actions
    finishWorkout,
    cancelWorkout,

    // Preferences
    preferences: {
      weightUnit,
      distanceUnit,
    },
  };
};
