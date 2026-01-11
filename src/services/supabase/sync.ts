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
import { preferencesToProfileUpdates } from './profiles';

import { getAuthUser } from './authHelper';

/**
 * Check if user is authenticated (uses cached auth)
 */
const getUserId = async (): Promise<string | null> => {
  const user = await getAuthUser();
  return user?.id ?? null;
};

// ============================================
// Profile Sync
// ============================================

export const syncPreferences = async (prefs: Partial<UserPreferences>): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  const updates = preferencesToProfileUpdates(prefs);
  await supabase.from('profiles').update(updates).eq('id', userId);
};

export const syncWorkoutGoal = async (goal: WorkoutGoal): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from('profiles').update({ workout_goal: goal }).eq('id', userId);
};

export const syncCurrentWeek = async (week: ProgressiveOverloadWeek, weekStartedAt: string | null): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from('profiles').update({
    current_week: week,
    week_started_at: weekStartedAt,
  }).eq('id', userId);
};

export const syncHasCompletedIntro = async (value: boolean): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  await supabase.from('profiles').update({ has_completed_intro: value }).eq('id', userId);
};

// ============================================
// Template Sync
// ============================================

export const syncAddTemplate = async (template: WorkoutTemplate): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // Insert template
  const { data: templateData, error: templateError } = await supabase
    .from('workout_templates')
    .insert({
      id: template.id,
      user_id: userId,
      name: template.name,
      template_type: template.templateType,
      copied_from: template.copiedFrom || null,
      created_at: template.createdAt,
      updated_at: template.updatedAt,
    })
    .select()
    .single();

  if (templateError) {
    console.error('[Sync] Failed to sync template:', templateError.message, templateError.code);
    throw templateError;
  }
  if (!templateData) return;

  // Insert exercises
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

    await supabase.from('template_exercises').insert(exercisesToInsert);
  }
};

export const syncUpdateTemplate = async (template: WorkoutTemplate): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // Update template metadata
  await supabase
    .from('workout_templates')
    .update({
      name: template.name,
      template_type: template.templateType,
      copied_from: template.copiedFrom || null,
      updated_at: template.updatedAt,
    })
    .eq('id', template.id)
    .eq('user_id', userId);

  // Delete existing exercises and re-insert
  await supabase.from('template_exercises').delete().eq('template_id', template.id);

  if (template.exercises.length > 0) {
    const exercisesToInsert = template.exercises.map((ex, idx) => {
      const base = {
        template_id: template.id,
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

    await supabase.from('template_exercises').insert(exercisesToInsert);
  }
};

export const syncDeleteTemplate = async (templateId: string): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId);
};

export const syncReorderTemplates = async (templateIds: string[]): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // Update sort_order for each template
  await Promise.all(
    templateIds.map((id, index) =>
      supabase
        .from('workout_templates')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('user_id', userId)
    )
  );
};

// ============================================
// Session Sync
// ============================================

export const syncAddSession = async (session: WorkoutSession): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // Insert session
  const { data: sessionData, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      id: session.id,
      user_id: userId,
      template_id: session.templateId || null,
      name: session.name,
      custom_title: session.customTitle || null,
      mood: session.mood || null,
      progressive_overload_week: session.progressiveOverloadWeek ?? null,
      workout_goal: session.workoutGoal || null,
      personal_bests: session.personalBests || null,
      streak_count: session.streakCount || null,
      started_at: session.startedAt,
      completed_at: session.completedAt ?? null,
      is_active: !session.completedAt,
    })
    .select()
    .single();

  if (sessionError) {
    console.error('[Sync] Failed to sync session:', sessionError.message, sessionError.code);
    throw sessionError;
  }
  if (!sessionData) return;

  // Insert session exercises
  if (session.exercises.length > 0) {
    const exercisesToInsert = session.exercises.map((ex, idx) => ({
      id: ex.id,
      session_id: sessionData.id,
      exercise_id: ex.exerciseId,
      type: ex.type,
      sort_order: idx,
      target_sets: ex.type === 'strength' ? ex.targetSets : null,
      target_reps: ex.type === 'strength' ? ex.targetReps : null,
      rest_seconds: ex.restSeconds,
    }));

    const { data: exercisesData } = await supabase
      .from('session_exercises')
      .insert(exercisesToInsert)
      .select();

    // Insert completed sets
    if (exercisesData) {
      for (let i = 0; i < session.exercises.length; i++) {
        const ex = session.exercises[i];
        const dbExId = exercisesData[i]?.id;

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

          await supabase.from('completed_sets').insert(setsToInsert);
        }
      }
    }
  }
};

export const syncUpdateSession = async (session: WorkoutSession): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  // For active session updates, we need to sync the full state
  // This includes updating exercises and sets

  const { error: updateError } = await supabase
    .from('workout_sessions')
    .update({
      name: session.name,
      custom_title: session.customTitle || null,
      mood: session.mood || null,
      progressive_overload_week: session.progressiveOverloadWeek ?? null,
      workout_goal: session.workoutGoal || null,
      personal_bests: session.personalBests || null,
      streak_count: session.streakCount || null,
      completed_at: session.completedAt ?? null,
      is_active: !session.completedAt,
    })
    .eq('id', session.id)
    .eq('user_id', userId);

  if (updateError) {
    console.error('[Sync] Failed to update session:', updateError.message, updateError.code);
    throw updateError;
  }

  // For completed sessions, also ensure all sets are synced
  // Delete and re-insert exercises + sets for simplicity
  await supabase.from('session_exercises').delete().eq('session_id', session.id);

  if (session.exercises.length > 0) {
    const exercisesToInsert = session.exercises.map((ex, idx) => ({
      id: ex.id || `${session.id}-ex-${idx}`,
      session_id: session.id,
      exercise_id: ex.exerciseId,
      type: ex.type,
      sort_order: idx,
      target_sets: ex.type === 'strength' ? ex.targetSets : null,
      target_reps: ex.type === 'strength' ? ex.targetReps : null,
      rest_seconds: ex.restSeconds,
    }));

    const { data: exercisesData } = await supabase
      .from('session_exercises')
      .insert(exercisesToInsert)
      .select();

    if (exercisesData) {
      for (let i = 0; i < session.exercises.length; i++) {
        const ex = session.exercises[i];
        const dbExId = exercisesData[i]?.id;

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

          await supabase.from('completed_sets').insert(setsToInsert);
        }
      }
    }
  }
};

export const syncSetActiveSession = async (session: WorkoutSession | null): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  if (session === null) {
    // Clear active session - mark all as inactive
    await supabase
      .from('workout_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);
  } else {
    // Sync the active session
    await syncUpdateSession(session);
  }
};

// ============================================
// Custom Exercise Sync
// ============================================

export const syncAddCustomExercise = async (exercise: Exercise): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  const insertData = {
    id: exercise.id,
    user_id: userId,
    name: exercise.name,
    type: exercise.type,
    muscle_groups: exercise.type === 'strength' ? exercise.muscleGroups : null,
    equipment: exercise.type === 'strength' ? exercise.equipment : null,
    cardio_type: exercise.type === 'cardio' ? exercise.cardioType : null,
    instructions: exercise.instructions ?? null,
  };

  const { error } = await supabase.from('custom_exercises').insert(insertData);
  if (error) {
    console.error('[Sync] Failed to sync custom exercise:', error.message, error.code);
    throw error;
  }
};

// ============================================
// Weight Entry Sync
// ============================================

export const syncAddWeightEntry = async (entry: WeightEntry): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from('weight_entries').upsert({
    user_id: userId,
    date: entry.date,
    weight: entry.weight,
    unit: entry.unit,
  }, { onConflict: 'user_id,date' });

  if (error) {
    console.error('[Sync] Failed to sync weight entry:', error.message, error.code);
    throw error;
  }
};

export const syncDeleteWeightEntry = async (date: string): Promise<void> => {
  const userId = await getUserId();
  if (!userId) return;

  await supabase
    .from('weight_entries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);
};
