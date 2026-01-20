import { useMemo } from 'react';
import { WorkoutSession, SessionExercise, CompletedSet } from '../types';

interface SessionStats {
  totalSets: number;
  totalVolume: number;
  totalReps: number;
  totalCardioDistance: number;
  totalCardioDurationSeconds: number;
  totalCardioCalories: number;
}

const processSet = (set: CompletedSet) => {
  if (set.type === 'cardio') {
    return {
      volume: 0,
      reps: 0,
      distance: set.distance ?? 0,
      duration: set.durationSeconds,
      calories: set.calories ?? 0,
    };
  }
  // Handle strength sets (including legacy sets without type)
  const strengthSet = set as { weight: number; reps: number; type?: string };
  return {
    volume: strengthSet.weight * strengthSet.reps,
    reps: strengthSet.reps,
    distance: 0,
    duration: 0,
    calories: 0,
  };
};

export const useSessionStats = (session: WorkoutSession | null): SessionStats => {
  return useMemo(() => {
    if (!session) {
      return {
        totalSets: 0,
        totalVolume: 0,
        totalReps: 0,
        totalCardioDistance: 0,
        totalCardioDurationSeconds: 0,
        totalCardioCalories: 0,
      };
    }

    let totalSets = 0;
    let totalVolume = 0;
    let totalReps = 0;
    let totalCardioDistance = 0;
    let totalCardioDurationSeconds = 0;
    let totalCardioCalories = 0;

    session.exercises.forEach((ex: SessionExercise) => {
      ex.sets.forEach((set) => {
        totalSets++;
        const processed = processSet(set);
        totalVolume += processed.volume;
        totalReps += processed.reps;
        totalCardioDistance += processed.distance;
        totalCardioDurationSeconds += processed.duration;
        totalCardioCalories += processed.calories;
      });
    });

    return {
      totalSets,
      totalVolume,
      totalReps,
      totalCardioDistance,
      totalCardioDurationSeconds,
      totalCardioCalories,
    };
  }, [session]);
};

// Pure function version for when you need to calculate stats without hooks
export const calculateSessionStats = (session: WorkoutSession): SessionStats => {
  let totalSets = 0;
  let totalVolume = 0;
  let totalReps = 0;
  let totalCardioDistance = 0;
  let totalCardioDurationSeconds = 0;
  let totalCardioCalories = 0;

  session.exercises.forEach((ex: SessionExercise) => {
    ex.sets.forEach((set) => {
      totalSets++;
      const processed = processSet(set);
      totalVolume += processed.volume;
      totalReps += processed.reps;
      totalCardioDistance += processed.distance;
      totalCardioDurationSeconds += processed.duration;
      totalCardioCalories += processed.calories;
    });
  });

  return {
    totalSets,
    totalVolume,
    totalReps,
    totalCardioDistance,
    totalCardioDurationSeconds,
    totalCardioCalories,
  };
};
