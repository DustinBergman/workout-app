import { useMemo } from 'react';
import { WorkoutSession, SessionExercise } from '../types';

interface SessionStats {
  totalSets: number;
  totalVolume: number;
  totalReps: number;
}

export const useSessionStats = (session: WorkoutSession | null): SessionStats => {
  return useMemo(() => {
    if (!session) {
      return { totalSets: 0, totalVolume: 0, totalReps: 0 };
    }

    let totalSets = 0;
    let totalVolume = 0;
    let totalReps = 0;

    session.exercises.forEach((ex: SessionExercise) => {
      ex.sets.forEach((set) => {
        totalSets++;
        totalVolume += set.weight * set.reps;
        totalReps += set.reps;
      });
    });

    return { totalSets, totalVolume, totalReps };
  }, [session]);
};

// Pure function version for when you need to calculate stats without hooks
export const calculateSessionStats = (session: WorkoutSession): SessionStats => {
  let totalSets = 0;
  let totalVolume = 0;
  let totalReps = 0;

  session.exercises.forEach((ex: SessionExercise) => {
    ex.sets.forEach((set) => {
      totalSets++;
      totalVolume += set.weight * set.reps;
      totalReps += set.reps;
    });
  });

  return { totalSets, totalVolume, totalReps };
};
