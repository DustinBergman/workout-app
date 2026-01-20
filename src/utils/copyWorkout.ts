import {
  Exercise,
  StrengthExercise,
  CardioExercise,
  WorkoutTemplate,
  TemplateExercise,
  StrengthTemplateExercise,
  CardioTemplateExercise,
  CARDIO_TYPE_TO_CATEGORY,
  TemplateCopiedFrom,
} from '../types';
import { FeedWorkout } from '../services/supabase/feed';
import { getAllExercises, getExerciseById } from '../data/exercises';

// UUID validation regex for detecting custom exercises
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID format
 * Used to detect custom exercises (which use UUIDs) vs built-in exercises (which use short IDs)
 */
export const isUUID = (id: string): boolean => UUID_REGEX.test(id);

export interface CopyWorkoutResult {
  template: WorkoutTemplate;
  newCustomExercises: Exercise[];
}

/**
 * Convert a FeedWorkout to a WorkoutTemplate
 * Used when copying a friend's workout to your plans
 * Also creates copies of any custom exercises that the copying user doesn't have
 */
export const convertFeedWorkoutToTemplate = (
  workout: FeedWorkout,
  templateName: string,
  existingCustomExercises: Exercise[] = []
): CopyWorkoutResult => {
  const now = new Date().toISOString();
  const allExercises = getAllExercises(existingCustomExercises);

  // Track custom exercises that need to be created for the copying user
  const newCustomExercises: Exercise[] = [];
  // Map from original exercise ID to new exercise ID (for custom exercises)
  const exerciseIdMap = new Map<string, string>();

  // First pass: identify custom exercises that need to be copied
  for (const ex of workout.session_exercises) {
    // Check if this is a custom exercise (UUID format) and not a built-in exercise
    if (isUUID(ex.exercise_id)) {
      const existingExercise = getExerciseById(ex.exercise_id, existingCustomExercises);

      // If the exercise doesn't exist for the copying user, create a copy
      if (!existingExercise) {
        // Custom exercise name must be available - it's fetched via RPC
        if (!ex.custom_exercise_name) {
          throw new Error('Unable to copy workout: custom exercise name not found');
        }

        const newExerciseId = crypto.randomUUID();
        exerciseIdMap.set(ex.exercise_id, newExerciseId);

        // Create a new custom exercise based on the type
        if (ex.type === 'strength') {
          const newExercise: StrengthExercise = {
            id: newExerciseId,
            name: ex.custom_exercise_name,
            type: 'strength',
            muscleGroups: ['chest'], // Default - user can edit later
            equipment: 'other',
          };
          newCustomExercises.push(newExercise);
        } else {
          const newExercise: CardioExercise = {
            id: newExerciseId,
            name: ex.custom_exercise_name,
            type: 'cardio',
            cardioType: 'other',
          };
          newCustomExercises.push(newExercise);
        }
      }
    }
  }

  // Determine template type from exercises
  const hasStrength = workout.session_exercises.some(ex => ex.type === 'strength');
  const hasCardio = workout.session_exercises.some(ex => ex.type === 'cardio');
  const templateType = hasCardio && !hasStrength ? 'cardio' : 'strength';

  // Convert exercises, using mapped IDs for custom exercises
  const exercises: TemplateExercise[] = workout.session_exercises
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ex): TemplateExercise | null => {
      // Use mapped ID if this is a custom exercise that was copied, otherwise use original
      const exerciseId = exerciseIdMap.get(ex.exercise_id) || ex.exercise_id;

      if (ex.type === 'strength') {
        const strengthEx: StrengthTemplateExercise = {
          type: 'strength',
          exerciseId,
          targetSets: ex.target_sets || ex.completed_sets.length || 3,
          targetReps: ex.target_reps || 10,
          restSeconds: ex.rest_seconds || 90,
        };
        return strengthEx;
      } else {
        // Cardio - determine category from exercise definition
        const exerciseInfo = allExercises.find(e => e.id === ex.exercise_id);
        // Also check newly created exercises
        const newExerciseInfo = newCustomExercises.find(e => e.id === exerciseId);
        const foundExercise = exerciseInfo || newExerciseInfo;

        if (!foundExercise || foundExercise.type !== 'cardio') {
          // Unknown cardio exercise - use 'other' category
          const otherCardio: CardioTemplateExercise = {
            type: 'cardio',
            cardioCategory: 'other',
            exerciseId,
            targetDurationMinutes: 20,
            restSeconds: ex.rest_seconds || 60,
          };
          return otherCardio;
        }

        const cardioType = (foundExercise as CardioExercise).cardioType;
        const category = CARDIO_TYPE_TO_CATEGORY[cardioType];

        // Build cardio template based on category
        const baseCardio = {
          type: 'cardio' as const,
          exerciseId,
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

  const template: WorkoutTemplate = {
    id: crypto.randomUUID(),
    name: templateName,
    templateType,
    exercises,
    copiedFrom,
    inRotation: true,
    createdAt: now,
    updatedAt: now,
  };

  return { template, newCustomExercises };
};
