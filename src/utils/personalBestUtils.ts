import {
  WorkoutSession,
  PersonalBest,
  WeightUnit,
  Exercise,
  StrengthCompletedSet,
} from '../types';
import { convertWeight } from './workoutUtils';
import { getExerciseById } from '../data/exercises';

/**
 * Calculate estimated 1RM using Epley formula
 * Only valid for sets with 1-12 reps
 */
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  if (reps > 12) return weight; // Don't estimate for high rep sets
  return weight * (1 + reps / 30);
};

interface HistoricalRecord {
  maxWeight: number;
  max1RM: number;
}

/**
 * Detect personal bests achieved in a workout session
 * Compares against historical sessions to find new records
 *
 * @param currentSession - The session to check for PBs
 * @param historicalSessions - All past completed sessions to compare against
 * @param customExercises - Custom exercises defined by user
 * @returns Array of PersonalBest objects for achievements in this session
 */
export const detectPersonalBests = (
  currentSession: WorkoutSession,
  historicalSessions: WorkoutSession[],
  customExercises: Exercise[] = []
): PersonalBest[] => {
  const personalBests: PersonalBest[] = [];
  const targetUnit: WeightUnit = 'lbs'; // Normalize to lbs for comparison

  // Build historical records: exerciseId -> { maxWeight, max1RM }
  const historicalRecords = new Map<string, HistoricalRecord>();

  for (const session of historicalSessions) {
    // Skip the current session
    if (session.id === currentSession.id) continue;
    // Skip incomplete sessions
    if (!session.completedAt) continue;

    for (const exercise of session.exercises) {
      if (exercise.type !== 'strength') continue;

      for (const set of exercise.sets) {
        if (set.type !== 'strength') continue;

        const strengthSet = set as StrengthCompletedSet;
        const normalizedWeight = convertWeight(strengthSet.weight, strengthSet.unit, targetUnit);
        const estimated1RM = calculate1RM(normalizedWeight, strengthSet.reps);

        const existing = historicalRecords.get(exercise.exerciseId) || { maxWeight: 0, max1RM: 0 };

        historicalRecords.set(exercise.exerciseId, {
          maxWeight: Math.max(existing.maxWeight, normalizedWeight),
          max1RM: Math.max(existing.max1RM, estimated1RM),
        });
      }
    }
  }

  // Check current session for PBs
  for (const exercise of currentSession.exercises) {
    if (exercise.type !== 'strength') continue;

    const exerciseInfo = getExerciseById(exercise.exerciseId, customExercises);
    const exerciseName = exerciseInfo?.name || 'Unknown Exercise';
    const historical = historicalRecords.get(exercise.exerciseId) || { maxWeight: 0, max1RM: 0 };

    let sessionMaxWeight = 0;
    let sessionMax1RM = 0;
    let bestWeightReps = 0;
    let best1RMReps = 0;

    for (const set of exercise.sets) {
      if (set.type !== 'strength') continue;

      const strengthSet = set as StrengthCompletedSet;
      const normalizedWeight = convertWeight(strengthSet.weight, strengthSet.unit, targetUnit);
      const estimated1RM = calculate1RM(normalizedWeight, strengthSet.reps);

      if (normalizedWeight > sessionMaxWeight) {
        sessionMaxWeight = normalizedWeight;
        bestWeightReps = strengthSet.reps;
      }

      if (estimated1RM > sessionMax1RM) {
        sessionMax1RM = estimated1RM;
        best1RMReps = strengthSet.reps;
      }
    }

    // Check for weight PB (only if there's history and it's beaten)
    if (historical.maxWeight > 0 && sessionMaxWeight > historical.maxWeight) {
      personalBests.push({
        exerciseId: exercise.exerciseId,
        exerciseName,
        type: 'weight',
        value: sessionMaxWeight,
        unit: targetUnit,
        reps: bestWeightReps,
      });
    }

    // Check for 1RM PB (only if there's history and it's beaten)
    // Don't add if we already added a weight PB for same exercise
    const hasWeightPB = personalBests.some(
      (pb) => pb.exerciseId === exercise.exerciseId && pb.type === 'weight'
    );

    if (!hasWeightPB && historical.max1RM > 0 && sessionMax1RM > historical.max1RM) {
      personalBests.push({
        exerciseId: exercise.exerciseId,
        exerciseName,
        type: '1rm',
        value: Math.round(sessionMax1RM),
        unit: targetUnit,
        reps: best1RMReps,
      });
    }
  }

  return personalBests;
};
