import { useCallback, useEffect } from 'react';
import {
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import {
  useRestTimer,
  useExerciseManagement,
  useCustomExercise,
  useExerciseHistory,
  useActiveWorkout,
} from './useActiveWorkout';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useActiveWorkoutPage = (): any => {
  // App store (direct access)
  const session = useAppStore((state) => state.activeSession);
  const sessions = useAppStore((state) => state.sessions);
  const customExercises = useAppStore((state) => state.customExercises);
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);
  const distanceUnit = useAppStore((state) => state.preferences.distanceUnit);

  // Current workout store (direct access)
  const expandedIndex = useCurrentWorkoutStore((state) => state.expandedIndex);
  const setExpandedIndex = useCurrentWorkoutStore((state) => state.setExpandedIndex);
  const showTimer = useCurrentWorkoutStore((state) => state.showTimer);
  const timerDuration = useCurrentWorkoutStore((state) => state.timerDuration);
  const showExercisePicker = useCurrentWorkoutStore((state) => state.showExercisePicker);
  const setShowExercisePicker = useCurrentWorkoutStore((state) => state.setShowExercisePicker);
  const exerciseSearch = useCurrentWorkoutStore((state) => state.exerciseSearch);
  const setExerciseSearch = useCurrentWorkoutStore((state) => state.setExerciseSearch);
  const showFinishConfirm = useCurrentWorkoutStore((state) => state.showFinishConfirm);
  const setShowFinishConfirm = useCurrentWorkoutStore((state) => state.setShowFinishConfirm);
  const updatePlan = useCurrentWorkoutStore((state) => state.updatePlan);
  const setUpdatePlan = useCurrentWorkoutStore((state) => state.setUpdatePlan);

  // Sub-hooks
  const { handleStartTimer, hideTimer } = useRestTimer();
  const {
    logSetForExercise,
    logCardioForExercise,
    removeLastSetForExercise,
    removeSetForExercise,
    updateSetForExercise,
    addExerciseToSession,
    removeExercise,
    updateTargetSets,
    reorderExercises,
  } = useExerciseManagement();
  const {
    customExerciseState,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,
    toggleMuscleGroup,
    resetNewExerciseForm,
    createExercise,
  } = useCustomExercise();
  const {
    historyExerciseId,
    historyExerciseName,
    handleShowHistory,
    closeHistory,
  } = useExerciseHistory();

  // Main hook (computed values + orchestrated actions)
  const {
    elapsedSeconds,
    hasDeviated,
    totalSets,
    totalVolume,
    totalCardioDistance,
    filteredExercises,
    getSuggestionForExercise,
    isScoring,
    scoreResult,
    scoreError,
    clearScoreResult,
    finishWorkout,
    cancelWorkout,
  } = useActiveWorkout();

  // Custom exercise creation handler
  const handleCreateExercise = useCallback(() => {
    const newExercise = createExercise();
    if (newExercise) {
      addExerciseToSession(newExercise.id);
    }
  }, [createExercise, addExerciseToSession]);

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Skip auto-expand of accordions when reordering
      const { setSkipAutoExpand } = useCurrentWorkoutStore.getState();
      setSkipAutoExpand(true);

      // Reset expanded index to keep accordion collapsed
      setExpandedIndex(null);

      // Then reorder exercises
      reorderExercises(active.id as string, over.id as string);
    }
  }, [setExpandedIndex, reorderExercises]);

  // Migration: Add IDs to exercises that don't have them
  useEffect(() => {
    if (session && session.exercises.some(ex => !ex.id)) {
      const setActiveSession = useAppStore.getState().setActiveSession;
      const migratedSession = {
        ...session,
        exercises: session.exercises.map((ex, idx) => ({
          ...ex,
          id: ex.id || `migrated-${session.id}-${idx}`,
        })),
      };
      setActiveSession(migratedSession);
    }
  }, [session]);

  // Prevent horizontal scroll entirely
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Block any horizontal scroll attempts
      if (e.deltaX !== 0) {
        e.preventDefault();
      }
    };

    const handleScroll = () => {
      // Reset scroll position if somehow scrolled horizontally
      if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return {
    // Store state
    session,
    sessions,
    customExercises,
    weightUnit,
    distanceUnit,

    // Current workout UI state
    expandedIndex,
    setExpandedIndex,
    showTimer,
    timerDuration,
    showExercisePicker,
    setShowExercisePicker,
    exerciseSearch,
    setExerciseSearch,
    showFinishConfirm,
    setShowFinishConfirm,
    updatePlan,
    setUpdatePlan,

    // Rest timer
    handleStartTimer,
    hideTimer,

    // Exercise management
    logSetForExercise,
    logCardioForExercise,
    removeLastSetForExercise,
    removeSetForExercise,
    updateSetForExercise,
    addExerciseToSession,
    removeExercise,
    updateTargetSets,
    reorderExercises,

    // Custom exercise
    customExerciseState,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,
    toggleMuscleGroup,
    resetNewExerciseForm,
    createExercise,

    // Exercise history
    historyExerciseId,
    historyExerciseName,
    handleShowHistory,
    closeHistory,

    // Main workout hook
    elapsedSeconds,
    hasDeviated,
    totalSets,
    totalVolume,
    totalCardioDistance,
    filteredExercises,
    getSuggestionForExercise,
    isScoring,
    scoreResult,
    scoreError,
    clearScoreResult,
    finishWorkout,
    cancelWorkout,

    // Handlers
    handleCreateExercise,
    handleDragEnd,

    // DND
    sensors,
  };
};
