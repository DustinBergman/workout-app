import { supabase } from '../../lib/supabase';
import type {
  WorkoutTemplate,
  WorkoutSession,
  Exercise,
  UserPreferences,
  WorkoutGoal,
  ProgressiveOverloadWeek,
  WeightEntry,
} from '../../types';

const STORAGE_KEY = 'workout-app-storage';
const MIGRATION_COMPLETE_KEY = 'workout-app-migration-complete';

interface LocalStorageData {
  state: {
    templates: WorkoutTemplate[];
    sessions: WorkoutSession[];
    preferences: UserPreferences;
    customExercises: Exercise[];
    currentWeek: ProgressiveOverloadWeek;
    weekStartedAt: string | null;
    workoutGoal: WorkoutGoal;
    hasCompletedIntro: boolean;
    weightEntries: WeightEntry[];
  };
  version: number;
}

export interface MigrationResult {
  success: boolean;
  error?: string;
  migratedCounts: {
    templates: number;
    sessions: number;
    customExercises: number;
    weightEntries: number;
  };
}

/**
 * Check if there's localStorage data to migrate
 */
export const hasLocalStorageData = (): boolean => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const data = JSON.parse(stored) as LocalStorageData;
    const state = data.state;

    // Check if there's any meaningful data to migrate
    return (
      (state.templates?.length ?? 0) > 0 ||
      (state.sessions?.length ?? 0) > 0 ||
      (state.customExercises?.length ?? 0) > 0 ||
      (state.weightEntries?.length ?? 0) > 0 ||
      state.hasCompletedIntro
    );
  } catch {
    return false;
  }
};

/**
 * Get summary of data that will be migrated
 */
export const getMigrationSummary = (): {
  templates: number;
  sessions: number;
  customExercises: number;
  weightEntries: number;
} | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const data = JSON.parse(stored) as LocalStorageData;
    const state = data.state;

    return {
      templates: state.templates?.length ?? 0,
      sessions: state.sessions?.length ?? 0,
      customExercises: state.customExercises?.length ?? 0,
      weightEntries: state.weightEntries?.length ?? 0,
    };
  } catch {
    return null;
  }
};

/**
 * Migrate all localStorage data to Supabase
 */
export const migrateLocalStorageToSupabase = async (): Promise<MigrationResult> => {
  // Use getSession() instead of getUser() - it uses the cached session
  // which is available immediately after signup, avoiding timing issues
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    return {
      success: false,
      error: 'Not authenticated',
      migratedCounts: { templates: 0, sessions: 0, customExercises: 0, weightEntries: 0 },
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return {
        success: true,
        migratedCounts: { templates: 0, sessions: 0, customExercises: 0, weightEntries: 0 },
      };
    }

    const data = JSON.parse(stored) as LocalStorageData;
    const state = data.state;
    const migratedCounts = { templates: 0, sessions: 0, customExercises: 0, weightEntries: 0 };

    // 1. Migrate profile/preferences
    await migrateProfile(user.id, state);

    // 2. Migrate custom exercises
    if (state.customExercises?.length > 0) {
      migratedCounts.customExercises = await migrateCustomExercises(user.id, state.customExercises);
    }

    // 3. Migrate templates (need to map exercise IDs for custom exercises)
    if (state.templates?.length > 0) {
      migratedCounts.templates = await migrateTemplates(user.id, state.templates);
    }

    // 4. Migrate sessions
    if (state.sessions?.length > 0) {
      migratedCounts.sessions = await migrateSessions(user.id, state.sessions);
    }

    // 5. Migrate weight entries
    if (state.weightEntries?.length > 0) {
      migratedCounts.weightEntries = await migrateWeightEntries(user.id, state.weightEntries);
    }

    return { success: true, migratedCounts };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      migratedCounts: { templates: 0, sessions: 0, customExercises: 0, weightEntries: 0 },
    };
  }
};

// Helper: Migrate profile data
const migrateProfile = async (
  userId: string,
  state: LocalStorageData['state']
): Promise<void> => {
  const profileData: Record<string, unknown> = {
    weight_unit: state.preferences?.weightUnit ?? 'lbs',
    distance_unit: state.preferences?.distanceUnit ?? 'mi',
    default_rest_seconds: state.preferences?.defaultRestSeconds ?? 90,
    dark_mode: state.preferences?.darkMode ?? false,
    experience_level: state.preferences?.experienceLevel ?? 'intermediate',
    workout_goal: state.workoutGoal ?? 'build',
    current_week: state.currentWeek ?? 0,
    week_started_at: state.weekStartedAt,
    has_completed_intro: state.hasCompletedIntro ?? false,
    first_name: state.preferences?.firstName ?? null,
    last_name: state.preferences?.lastName ?? null,
    openai_api_key: state.preferences?.openaiApiKey ?? null,
  };

  await supabase
    .from('profiles')
    .update(profileData)
    .eq('id', userId);
};

// Helper: Migrate custom exercises
const migrateCustomExercises = async (
  userId: string,
  exercises: Exercise[]
): Promise<number> => {
  // Don't include id - let Supabase generate new UUIDs
  // localStorage IDs are not valid UUIDs
  const exercisesToInsert = exercises.map((ex) => ({
    user_id: userId,
    name: ex.name,
    type: ex.type,
    muscle_groups: ex.type === 'strength' ? ex.muscleGroups : null,
    equipment: ex.type === 'strength' ? ex.equipment : null,
    cardio_type: ex.type === 'cardio' ? ex.cardioType : null,
    instructions: ex.instructions ?? null,
  }));

  const { error } = await supabase
    .from('custom_exercises')
    .insert(exercisesToInsert);

  if (error) throw error;
  return exercises.length;
};

// Helper: Migrate templates
const migrateTemplates = async (
  userId: string,
  templates: WorkoutTemplate[]
): Promise<number> => {
  let count = 0;

  for (const template of templates) {
    // Insert template - let Supabase generate new UUID
    const { data: templateData, error: templateError } = await supabase
      .from('workout_templates')
      .insert({
        user_id: userId,
        name: template.name,
        template_type: template.templateType,
        sort_order: count,
      })
      .select()
      .single();

    if (templateError) {
      // Skip if already exists
      if (templateError.code === '23505') continue;
      throw templateError;
    }

    // Insert template exercises
    if (template.exercises.length > 0) {
      const exercisesToInsert = template.exercises.map((ex, idx) => {
        const base = {
          template_id: templateData.id,
          exercise_id: ex.exerciseId,
          type: ex.type,
          sort_order: idx,
          rest_seconds: ex.restSeconds ?? null,
        };

        if (ex.type === 'cardio') {
          return {
            ...base,
            cardio_category: ex.cardioCategory,
            tracking_mode: ex.trackingMode || 'detailed',
            target_calories: ex.targetCalories ?? null,
            target_duration_minutes: 'targetDurationMinutes' in ex ? ex.targetDurationMinutes ?? null : null,
            target_intensity: 'targetIntensity' in ex ? ex.targetIntensity ?? null : null,
            rounds: 'rounds' in ex ? ex.rounds ?? null : null,
            work_seconds: 'workSeconds' in ex ? ex.workSeconds ?? null : null,
            rest_between_rounds_seconds: 'restBetweenRoundsSeconds' in ex ? ex.restBetweenRoundsSeconds ?? null : null,
            target_laps: 'targetLaps' in ex ? ex.targetLaps ?? null : null,
          };
        }

        return {
          ...base,
          target_sets: ex.targetSets ?? null,
          target_reps: ex.targetReps ?? null,
        };
      });

      await supabase
        .from('template_exercises')
        .insert(exercisesToInsert);
    }

    count++;
  }

  return count;
};

// Helper: Migrate sessions
const migrateSessions = async (
  userId: string,
  sessions: WorkoutSession[]
): Promise<number> => {
  let count = 0;

  for (const session of sessions) {
    // Insert session - let Supabase generate new UUID
    // Note: template_id is set to null since old template IDs don't exist in Supabase
    const { data: sessionData, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        template_id: null, // Old template IDs won't match new Supabase UUIDs
        name: session.name,
        started_at: session.startedAt,
        completed_at: session.completedAt ?? null,
        is_active: !session.completedAt,
      })
      .select()
      .single();

    if (sessionError) {
      // Skip if already exists
      if (sessionError.code === '23505') continue;
      throw sessionError;
    }

    // Insert session exercises
    if (session.exercises.length > 0) {
      const exercisesToInsert = session.exercises.map((ex, idx) => ({
        session_id: sessionData.id,
        exercise_id: ex.exerciseId,
        type: ex.type,
        sort_order: idx,
        target_sets: ex.type === 'strength' ? ex.targetSets : null,
        target_reps: ex.type === 'strength' ? ex.targetReps : null,
        rest_seconds: ex.restSeconds,
      }));

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('session_exercises')
        .insert(exercisesToInsert)
        .select();

      if (exercisesError) throw exercisesError;

      // Insert completed sets
      for (let i = 0; i < session.exercises.length; i++) {
        const ex = session.exercises[i];
        const dbExId = exercisesData?.[i]?.id;

        if (dbExId && ex.sets.length > 0) {
          const setsToInsert = ex.sets.map((set) => ({
            session_exercise_id: dbExId,
            type: set.type,
            reps: set.type === 'strength' ? set.reps : null,
            weight: set.type === 'strength' ? set.weight : null,
            weight_unit: set.type === 'strength' ? set.unit : null,
            distance: set.type === 'cardio' ? set.distance : null,
            distance_unit: set.type === 'cardio' ? set.distanceUnit : null,
            duration_seconds: set.type === 'cardio' ? set.durationSeconds : null,
            completed_at: set.completedAt,
          }));

          await supabase
            .from('completed_sets')
            .insert(setsToInsert);
        }
      }
    }

    count++;
  }

  return count;
};

// Helper: Migrate weight entries
const migrateWeightEntries = async (
  userId: string,
  entries: WeightEntry[]
): Promise<number> => {
  const entriesToInsert = entries.map((entry) => ({
    user_id: userId,
    date: entry.date,
    weight: entry.weight,
    unit: entry.unit,
  }));

  const { error } = await supabase
    .from('weight_entries')
    .upsert(entriesToInsert, { onConflict: 'user_id,date' });

  if (error) throw error;
  return entries.length;
};

/**
 * Mark migration as complete
 * Uses a separate key so it doesn't conflict with Zustand's persist storage
 */
export const markMigrationComplete = (): void => {
  try {
    localStorage.setItem(MIGRATION_COMPLETE_KEY, 'true');
  } catch {
    // Ignore errors
  }
};

/**
 * Check if migration has already been done
 */
export const isMigrationComplete = (): boolean => {
  try {
    return localStorage.getItem(MIGRATION_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
};
