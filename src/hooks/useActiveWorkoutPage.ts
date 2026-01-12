import { useCallback, useEffect, createElement } from 'react';
import {
  DragEndEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { useModal } from '../contexts/ModalContext';
import {
  useRestTimer,
  useExerciseManagement,
  useCustomExercise,
  useActiveWorkout,
} from './useActiveWorkout';
import {
  ExercisePickerModalWrapper,
  PostWorkoutModalWrapper,
  ExerciseHistoryModalWrapper,
} from '../components/modals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useActiveWorkoutPage = (): any => {
  // App store (direct access)
  const session = useAppStore((state) => state.activeSession);
  const customExercises = useAppStore((state) => state.customExercises);

  // Current workout store (direct access)
  const expandedIndex = useCurrentWorkoutStore((state) => state.expandedIndex);
  const setExpandedIndex = useCurrentWorkoutStore((state) => state.setExpandedIndex);
  const showTimer = useCurrentWorkoutStore((state) => state.showTimer);
  const timerDuration = useCurrentWorkoutStore((state) => state.timerDuration);

  // Modal hook
  const { openModal } = useModal();

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
    createExercise,
  } = useCustomExercise();

  // Main hook (computed values + orchestrated actions)
  const {
    elapsedSeconds,
    totalSets,
    totalVolume,
    totalCardioDistance,
    getSuggestionForExercise,
    cancelWorkout,
  } = useActiveWorkout();

  // Open exercise picker modal
  const openExercisePicker = useCallback(() => {
    openModal(
      createElement(ExercisePickerModalWrapper, {
        onSelect: addExerciseToSession,
      })
    );
  }, [openModal, addExerciseToSession]);

  // Open post workout flow modal
  const openFinishConfirm = useCallback(() => {
    openModal(
      createElement(PostWorkoutModalWrapper, {
        onCancel: cancelWorkout,
      })
    );
  }, [openModal, cancelWorkout]);

  // Open exercise history modal
  const openExerciseHistory = useCallback((exerciseId: string, exerciseName: string) => {
    openModal(
      createElement(ExerciseHistoryModalWrapper, {
        exerciseId,
        exerciseName,
      })
    );
  }, [openModal]);

  // Custom exercise creation handler
  const handleCreateExercise = useCallback(() => {
    const newExercise = createExercise();
    if (newExercise) {
      addExerciseToSession(newExercise.id);
    }
  }, [createExercise, addExerciseToSession]);

  // DND sensors - TouchSensor for mobile with delay, MouseSensor for desktop
  // Using MouseSensor instead of PointerSensor because PointerSensor intercepts
  // touch events on mobile, bypassing TouchSensor's delay constraint
  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Must hold for 250ms before drag starts
        tolerance: 5, // Allow 5px of movement during delay
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts (mouse only)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Haptic feedback when drag starts
  const handleDragStart = useCallback(() => {
    // Trigger haptic feedback on supported devices
    // Android: Use Vibration API
    if (navigator.vibrate) {
      navigator.vibrate(100); // 100ms vibration (more noticeable than 50ms)
    }
    // Note: iOS doesn't support navigator.vibrate() - haptic feedback requires
    // native app integration (via Capacitor/Cordova) or isn't available in PWAs
  }, []);

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
    customExercises,

    // Current workout UI state
    expandedIndex,
    setExpandedIndex,
    showTimer,
    timerDuration,

    // Modal openers
    openExercisePicker,
    openFinishConfirm,
    openExerciseHistory,

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
    handleCreateExercise,

    // Main workout hook
    elapsedSeconds,
    totalSets,
    totalVolume,
    totalCardioDistance,
    getSuggestionForExercise,
    cancelWorkout,

    // Handlers
    handleDragStart,
    handleDragEnd,

    // DND
    sensors,
  };
};
