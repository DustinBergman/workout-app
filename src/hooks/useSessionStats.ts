import { useMemo } from 'react';
import {
  WorkoutSession,
  SessionExercise,
  CompletedSet,
  WeightUnit,
  DistanceUnit,
} from '../types';
import { convertDistance, convertWeight } from '../utils/workoutUtils';

interface SessionStats {
  totalSets: number;
  totalVolume: number;
  totalReps: number;
  totalCardioDistance: number;
  totalCardioDurationSeconds: number;
  totalCardioCalories: number;
}

const processSet = (
  set: CompletedSet,
  weightUnit: WeightUnit,
  distanceUnit: DistanceUnit
) => {
  if (set.type === 'cardio') {
    return {
      volume: 0,
      reps: 0,
      distance: set.distance !== undefined && set.distanceUnit
        ? convertDistance(set.distance, set.distanceUnit, distanceUnit)
        : 0,
      duration: set.durationSeconds,
      calories: set.calories ?? 0,
    };
  }
  // Handle strength sets (including legacy sets without type)
  const strengthSet = set as {
    weight: number;
    reps: number;
    unit?: WeightUnit;
    type?: string;
  };
  const normalizedWeight = convertWeight(
    strengthSet.weight,
    strengthSet.unit ?? weightUnit,
    weightUnit
  );
  return {
    volume: normalizedWeight * strengthSet.reps,
    reps: strengthSet.reps,
    distance: 0,
    duration: 0,
    calories: 0,
  };
};

export const useSessionStats = (
  session: WorkoutSession | null,
  weightUnit: WeightUnit = 'lbs',
  distanceUnit: DistanceUnit = 'mi'
): SessionStats => {
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
        const processed = processSet(set, weightUnit, distanceUnit);
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
  }, [session, weightUnit, distanceUnit]);
};

// Pure function version for when you need to calculate stats without hooks
export const calculateSessionStats = (
  session: WorkoutSession,
  weightUnit: WeightUnit = 'lbs',
  distanceUnit: DistanceUnit = 'mi'
): SessionStats => {
  let totalSets = 0;
  let totalVolume = 0;
  let totalReps = 0;
  let totalCardioDistance = 0;
  let totalCardioDurationSeconds = 0;
  let totalCardioCalories = 0;

  session.exercises.forEach((ex: SessionExercise) => {
    ex.sets.forEach((set) => {
      totalSets++;
      const processed = processSet(set, weightUnit, distanceUnit);
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
