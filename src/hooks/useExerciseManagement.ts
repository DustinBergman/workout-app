import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { getExerciseById } from '../data/exercises';
import { isCardioExercise } from '../utils/workoutUtils';
import {
  SessionExercise,
  StrengthSessionExercise,
  StrengthCompletedSet,
  CardioCompletedSet,
  DistanceUnit,
} from '../types';

interface UseExerciseManagementReturn {
  logSetForExercise: (exerciseIndex: number, reps: number, weight: number) => void;
  logCardioForExercise: (exerciseIndex: number, distance: number, distanceUnit: DistanceUnit, durationSeconds: number) => void;
  removeLastSetForExercise: (exerciseIndex: number) => void;
  addExerciseToSession: (exerciseId: string) => void;
  removeExercise: (index: number) => void;
  updateTargetSets: (exerciseId: string, delta: number) => void;
}

export const useExerciseManagement = (): UseExerciseManagementReturn => {
  // App store
  const session = useAppStore((state) => state.activeSession);
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);
  const defaultRestSeconds = useAppStore((state) => state.preferences.defaultRestSeconds);
  const customExercises = useAppStore((state) => state.customExercises);
  const setActiveSession = useAppStore((state) => state.setActiveSession);

  // Current workout store
  const expandedIndex = useCurrentWorkoutStore((state) => state.expandedIndex);
  const setExpandedIndex = useCurrentWorkoutStore((state) => state.setExpandedIndex);
  const setShowExercisePicker = useCurrentWorkoutStore((state) => state.setShowExercisePicker);
  const setExerciseSearch = useCurrentWorkoutStore((state) => state.setExerciseSearch);

  // Log a strength set
  const logSetForExercise = useCallback((exerciseIndex: number, reps: number, weight: number) => {
    if (!session) return;
    const exercise = session.exercises[exerciseIndex];
    if (exercise.type !== 'strength') return;

    const newSet: StrengthCompletedSet = {
      type: 'strength',
      reps,
      weight,
      unit: weightUnit,
      completedAt: new Date().toISOString(),
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setActiveSession(updatedSession);

    // Check if exercise is now complete - auto-collapse and expand next
    const updatedExercise = updatedExercises[exerciseIndex] as StrengthSessionExercise;
    if (updatedExercise.sets.length >= (updatedExercise.targetSets || 3)) {
      // Find next incomplete exercise
      const nextIncomplete = updatedExercises.findIndex(
        (ex, idx) => idx > exerciseIndex && ex.type === 'strength' && ex.sets.length < (ex.targetSets || 3)
      );
      if (nextIncomplete >= 0) {
        setExpandedIndex(nextIncomplete);
      } else {
        // All done, collapse current
        setExpandedIndex(null);
      }
    }
  }, [session, weightUnit, setActiveSession, setExpandedIndex]);

  // Log a cardio set
  const logCardioForExercise = useCallback((
    exerciseIndex: number,
    distance: number,
    distanceUnit: DistanceUnit,
    durationSeconds: number
  ) => {
    if (!session) return;
    const exercise = session.exercises[exerciseIndex];
    if (exercise.type !== 'cardio') return;

    const newSet: CardioCompletedSet = {
      type: 'cardio',
      distance,
      distanceUnit,
      durationSeconds,
      completedAt: new Date().toISOString(),
    };

    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: [...exercise.sets, newSet],
    };

    const updatedSession = {
      ...session,
      exercises: updatedExercises,
    };

    setActiveSession(updatedSession);
  }, [session, setActiveSession]);

  // Remove the last set from an exercise
  const removeLastSetForExercise = useCallback((exerciseIndex: number) => {
    if (!session) return;
    const exercise = session.exercises[exerciseIndex];
    if (exercise.sets.length === 0) return;

    const updatedExercises = [...session.exercises];
    updatedExercises[exerciseIndex] = {
      ...exercise,
      sets: exercise.sets.slice(0, -1),
    };

    setActiveSession({
      ...session,
      exercises: updatedExercises,
    });
  }, [session, setActiveSession]);

  // Add an exercise to the session
  const addExerciseToSession = useCallback((exerciseId: string) => {
    if (!session) return;
    const exerciseInfo = getExerciseById(exerciseId, customExercises);
    const isCardio = exerciseInfo && isCardioExercise(exerciseInfo);

    let newExercise: SessionExercise;
    if (isCardio) {
      newExercise = {
        type: 'cardio',
        exerciseId,
        restSeconds: defaultRestSeconds,
        sets: [],
      };
    } else {
      newExercise = {
        type: 'strength',
        exerciseId,
        targetSets: 3,
        targetReps: 10,
        restSeconds: defaultRestSeconds,
        sets: [],
      };
    }

    const newIndex = session.exercises.length;

    setActiveSession({
      ...session,
      exercises: [...session.exercises, newExercise],
    });

    setShowExercisePicker(false);
    setExerciseSearch('');
    setExpandedIndex(newIndex);
  }, [session, customExercises, defaultRestSeconds, setActiveSession, setShowExercisePicker, setExerciseSearch, setExpandedIndex]);

  // Remove an exercise from the session
  const removeExercise = useCallback((index: number) => {
    if (!session) return;
    const updatedExercises = session.exercises.filter((_, i) => i !== index);
    setActiveSession({
      ...session,
      exercises: updatedExercises,
    });

    // Adjust expanded index if needed
    if (expandedIndex !== null) {
      if (expandedIndex === index) {
        // Find next incomplete strength exercise or stay null
        const nextIncomplete = updatedExercises.findIndex(
          (ex) => ex.type === 'strength' && ex.sets.length < (ex.targetSets || 3)
        );
        setExpandedIndex(nextIncomplete >= 0 ? nextIncomplete : null);
      } else if (expandedIndex > index) {
        setExpandedIndex(expandedIndex - 1);
      }
    }
  }, [session, expandedIndex, setActiveSession, setExpandedIndex]);

  // Update target sets for an exercise
  const updateTargetSets = useCallback((exerciseId: string, delta: number) => {
    if (!session) return;
    const newExercises = session.exercises.map(ex => {
      if (ex.exerciseId === exerciseId && ex.type === 'strength') {
        return { ...ex, targetSets: Math.max(1, ex.targetSets + delta) };
      }
      return ex;
    });
    setActiveSession({ ...session, exercises: newExercises });
  }, [session, setActiveSession]);

  return {
    logSetForExercise,
    logCardioForExercise,
    removeLastSetForExercise,
    addExerciseToSession,
    removeExercise,
    updateTargetSets,
  };
};
