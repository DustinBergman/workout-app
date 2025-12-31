import { WeightUnit, WorkoutSession, WorkoutTemplate } from '../types';

/**
 * Convert weight between units (lbs <-> kg)
 */
export const convertWeight = (weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number => {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'lbs' && toUnit === 'kg') return Math.round(weight * 0.453592 * 10) / 10;
  if (fromUnit === 'kg' && toUnit === 'lbs') return Math.round(weight * 2.20462 * 10) / 10;
  return weight;
};

/**
 * Check if a workout session has deviated from its original template
 */
export const hasSessionDeviatedFromTemplate = (
  session: WorkoutSession,
  templates: WorkoutTemplate[]
): boolean => {
  if (!session.templateId) return false;

  const template = templates.find(t => t.id === session.templateId);
  if (!template) return false;

  // Check if exercise count differs
  if (session.exercises.length !== template.exercises.length) return true;

  // Check if any exercise differs
  return session.exercises.some((ex, i) => {
    const templateEx = template.exercises[i];
    if (!templateEx) return true;
    return ex.exerciseId !== templateEx.exerciseId ||
           ex.targetSets !== templateEx.targetSets ||
           ex.targetReps !== templateEx.targetReps;
  });
};

/**
 * Extract exercise history from past sessions
 */
export interface ExerciseHistoryEntry {
  date: string;
  sets: Array<{
    weight: number;
    reps: number;
    unit: WeightUnit;
  }>;
}

export const extractExerciseHistory = (
  sessions: WorkoutSession[],
  exerciseId: string,
  limit: number = 10
): ExerciseHistoryEntry[] => {
  if (!exerciseId) return [];

  return sessions
    .filter(s => s.completedAt && s.exercises.some(e => e.exerciseId === exerciseId))
    .map(session => {
      const exercise = session.exercises.find(e => e.exerciseId === exerciseId);
      return {
        date: session.startedAt,
        sets: exercise?.sets.map(set => ({
          weight: set.weight,
          reps: set.reps,
          unit: set.unit,
        })) || [],
      };
    })
    .filter(entry => entry.sets.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
};

/**
 * Format seconds to HH:MM:SS
 */
export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
