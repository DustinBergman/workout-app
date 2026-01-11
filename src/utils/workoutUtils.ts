import {
  WeightUnit,
  DistanceUnit,
  WorkoutSession,
  WorkoutTemplate,
  Exercise,
  CardioExercise,
  CompletedSet,
  CardioCompletedSet,
  SessionExercise,
  StrengthSessionExercise,
  TemplateExercise,
  StrengthTemplateExercise,
  CardioTemplateExercise,
  CARDIO_TYPE_TO_CATEGORY,
  TemplateCopiedFrom,
} from '../types';
import { FeedWorkout } from '../services/supabase/feed';
import { getAllExercises } from '../data/exercises';

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

    // Check exercise ID and type
    if (ex.exerciseId !== templateEx.exerciseId) return true;
    if (ex.type !== templateEx.type) return true;

    // For strength exercises, check target sets/reps
    if (ex.type === 'strength' && templateEx.type === 'strength') {
      return ex.targetSets !== templateEx.targetSets ||
             ex.targetReps !== templateEx.targetReps;
    }

    return false;
  });
};

/**
 * Extract exercise history from past sessions
 */
export interface StrengthHistorySet {
  type: 'strength';
  weight: number;
  reps: number;
  unit: WeightUnit;
}

export interface CardioHistorySet {
  type: 'cardio';
  distance: number;
  distanceUnit: DistanceUnit;
  durationSeconds: number;
}

export type HistorySet = StrengthHistorySet | CardioHistorySet;

export interface ExerciseHistoryEntry {
  date: string;
  sets: HistorySet[];
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
        sets: exercise?.sets.map(set => {
          if (set.type === 'cardio') {
            return {
              type: 'cardio' as const,
              distance: set.distance,
              distanceUnit: set.distanceUnit,
              durationSeconds: set.durationSeconds,
            };
          }
          // Handle strength sets (including legacy sets without type)
          const strengthSet = set as { weight: number; reps: number; unit: WeightUnit; type?: string };
          return {
            type: 'strength' as const,
            weight: strengthSet.weight,
            reps: strengthSet.reps,
            unit: strengthSet.unit,
          };
        }) || [],
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

/**
 * Convert distance between units (mi <-> km)
 */
export const convertDistance = (
  distance: number,
  fromUnit: DistanceUnit,
  toUnit: DistanceUnit
): number => {
  if (fromUnit === toUnit) return distance;
  if (fromUnit === 'mi' && toUnit === 'km') return Math.round(distance * 1.60934 * 100) / 100;
  if (fromUnit === 'km' && toUnit === 'mi') return Math.round(distance / 1.60934 * 100) / 100;
  return distance;
};

/**
 * Format cardio duration to MM:SS or H:MM:SS
 */
export const formatCardioDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/**
 * Calculate pace (time per mile/km)
 */
export const calculatePace = (
  distance: number,
  durationSeconds: number,
  unit: DistanceUnit
): string => {
  if (distance <= 0 || durationSeconds <= 0) return '--:--';
  const paceSeconds = durationSeconds / distance;
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /${unit}`;
};

/**
 * Type guard for cardio exercise
 */
export const isCardioExercise = (exercise: Exercise): exercise is CardioExercise => {
  return exercise.type === 'cardio';
};

/**
 * Type guard for cardio completed set
 */
export const isCardioSet = (set: CompletedSet): set is CardioCompletedSet => {
  return set.type === 'cardio';
};

/**
 * Type guard for strength session exercise
 */
export const isStrengthSessionExercise = (
  exercise: SessionExercise
): exercise is StrengthSessionExercise => {
  return exercise.type === 'strength';
};

/**
 * Convert a FeedWorkout to a WorkoutTemplate
 * Used when copying a friend's workout to your plans
 */
export const convertFeedWorkoutToTemplate = (
  workout: FeedWorkout,
  templateName: string,
  customExercises: Exercise[] = []
): WorkoutTemplate => {
  const now = new Date().toISOString();
  const allExercises = getAllExercises(customExercises);

  // Determine template type from exercises
  const hasStrength = workout.session_exercises.some(ex => ex.type === 'strength');
  const hasCardio = workout.session_exercises.some(ex => ex.type === 'cardio');
  const templateType = hasCardio && !hasStrength ? 'cardio' : 'strength';

  // Convert exercises
  const exercises: TemplateExercise[] = workout.session_exercises
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ex): TemplateExercise | null => {
      if (ex.type === 'strength') {
        const strengthEx: StrengthTemplateExercise = {
          type: 'strength',
          exerciseId: ex.exercise_id,
          targetSets: ex.target_sets || ex.completed_sets.length || 3,
          targetReps: ex.target_reps || 10,
          restSeconds: ex.rest_seconds || 90,
        };
        return strengthEx;
      } else {
        // Cardio - determine category from exercise definition
        const exerciseInfo = allExercises.find(e => e.id === ex.exercise_id);
        if (!exerciseInfo || exerciseInfo.type !== 'cardio') {
          // Unknown cardio exercise - use 'other' category
          const otherCardio: CardioTemplateExercise = {
            type: 'cardio',
            cardioCategory: 'other',
            exerciseId: ex.exercise_id,
            targetDurationMinutes: 20,
            restSeconds: ex.rest_seconds || 60,
          };
          return otherCardio;
        }

        const cardioType = (exerciseInfo as CardioExercise).cardioType;
        const category = CARDIO_TYPE_TO_CATEGORY[cardioType];

        // Build cardio template based on category
        const baseCardio = {
          type: 'cardio' as const,
          exerciseId: ex.exercise_id,
          restSeconds: ex.rest_seconds || 60,
        };

        switch (category) {
          case 'distance':
            return {
              ...baseCardio,
              cardioCategory: 'distance',
              targetDurationMinutes: 30,
            } as CardioTemplateExercise;
          case 'interval':
            return {
              ...baseCardio,
              cardioCategory: 'interval',
              rounds: 4,
              workSeconds: 30,
              restBetweenRoundsSeconds: 15,
            } as CardioTemplateExercise;
          case 'laps':
            return {
              ...baseCardio,
              cardioCategory: 'laps',
              targetLaps: 20,
            } as CardioTemplateExercise;
          case 'duration':
            return {
              ...baseCardio,
              cardioCategory: 'duration',
              targetDurationMinutes: 20,
              targetIntensity: 'moderate',
            } as CardioTemplateExercise;
          default:
            return {
              ...baseCardio,
              cardioCategory: 'other',
              targetDurationMinutes: 20,
            } as CardioTemplateExercise;
        }
      }
    })
    .filter((ex): ex is TemplateExercise => ex !== null);

  // Build copiedFrom attribution
  const copiedFrom: TemplateCopiedFrom = {
    userId: workout.user_id,
    username: workout.user.username,
    firstName: workout.user.first_name,
    lastName: workout.user.last_name,
  };

  return {
    id: crypto.randomUUID(),
    name: templateName,
    templateType,
    exercises,
    copiedFrom,
    createdAt: now,
    updatedAt: now,
  };
};
