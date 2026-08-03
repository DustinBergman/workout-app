import { supabase } from '../../lib/supabase';
import type {
  WorkoutTemplate,
  WorkoutSession,
  Exercise,
  UserPreferences,
  WorkoutGoal,
  WeightEntry,
  UserCycleState,
} from '../../types';
import { preferencesToProfileUpdates } from './profiles';

import { getAuthUser } from './authHelper';

/**
 * Check if user is authenticated (uses cached auth)
 */
const getUserId = async (expectedUserId?: string): Promise<string | null> => {
  const user = await getAuthUser();
  if (expectedUserId && user?.id !== expectedUserId) {
    throw new Error('Authenticated user changed during synchronization');
  }
  return user?.id ?? null;
};

// ============================================
// Per-resource queues - coalesce rapid writes to the newest snapshot
// ============================================

interface SyncQueueEntry<T> {
  latest: T | null;
  promise: Promise<void>;
}

const templateSyncQueues = new Map<string, SyncQueueEntry<WorkoutTemplate>>();
const sessionSyncQueues = new Map<string, SyncQueueEntry<WorkoutSession>>();

export const waitForQueuedSyncs = async (): Promise<void> => {
  while (templateSyncQueues.size > 0 || sessionSyncQueues.size > 0) {
    await Promise.all([
      ...[...templateSyncQueues.values()].map((entry) => entry.promise),
      ...[...sessionSyncQueues.values()].map((entry) => entry.promise),
    ]);
  }
};

const enqueueLatest = <T>(
  queues: Map<string, SyncQueueEntry<T>>,
  id: string,
  value: T,
  sync: (snapshot: T) => Promise<void>
): Promise<void> => {
  const existing = queues.get(id);
  if (existing) {
    existing.latest = value;
    return existing.promise;
  }

  const entry = {} as SyncQueueEntry<T>;
  entry.latest = value;
  entry.promise = (async () => {
    while (entry.latest) {
      const snapshot = entry.latest;
      entry.latest = null;
      await sync(snapshot);
    }
  })().finally(() => {
    queues.delete(id);
  });
  queues.set(id, entry);
  return entry.promise;
};

// ============================================
// Profile Sync
// ============================================

export const syncPreferences = async (prefs: Partial<UserPreferences>, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const updates = preferencesToProfileUpdates(prefs);
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
  if (error) throw error;
};

export const syncWorkoutGoal = async (goal: WorkoutGoal, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const { error } = await supabase.from('profiles').update({ workout_goal: goal }).eq('id', userId);
  if (error) throw error;
};

export const syncCycleState = async (cycleState: UserCycleState, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const { error } = await supabase.from('profiles').update({
    cycle_state: cycleState,
  }).eq('id', userId);
  if (error) throw error;
};

export const syncHasCompletedIntro = async (value: boolean, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const { error } = await supabase.from('profiles').update({ has_completed_intro: value }).eq('id', userId);
  if (error) throw error;
};

// ============================================
// Template Sync
// ============================================

const performAddTemplate = async (template: WorkoutTemplate, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;
    // Guard against corrupted data - templates should never have more than 50 exercises
    // and should never have more than 3 duplicates of the same exercise
    const exerciseIdCounts = new Map<string, number>();
    for (const ex of template.exercises) {
      exerciseIdCounts.set(ex.exerciseId, (exerciseIdCounts.get(ex.exerciseId) || 0) + 1);
    }
    const maxDuplicates = Math.max(...exerciseIdCounts.values(), 0);

    if (template.exercises.length > 50 || maxDuplicates > 3) {
      console.error('[Sync] Detected corrupted template data, skipping sync:', {
        templateId: template.id,
        exerciseCount: template.exercises.length,
        maxDuplicates,
      });
      return;
    }

    // Check if template already exists (prevent duplicate exercise inserts)
    const { data: existing, error: existingError } = await supabase
      .from('workout_templates')
      .select('id')
      .eq('id', template.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      await performUpdateTemplate(template, expectedUserId);
      return;
    }

    // Insert template
    const { data: templateData, error: templateError } = await supabase
      .from('workout_templates')
      .insert({
        id: template.id,
        user_id: userId,
        name: template.name,
        template_type: template.templateType,
        copied_from: template.copiedFrom || null,
        in_rotation: template.inRotation ?? true,
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

      const { error: exerciseError } = await supabase.from('template_exercises').insert(exercisesToInsert);
      if (exerciseError) throw exerciseError;
    }
};

const performUpdateTemplate = async (template: WorkoutTemplate, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;
    // SAFETY: Fetch current DB state first
    const { data: existingExercises, error: existingExercisesError } = await supabase
      .from('template_exercises')
      .select('id')
      .eq('template_id', template.id);
    if (existingExercisesError) throw existingExercisesError;

    const dbExerciseCount = existingExercises?.length || 0;
    const localExerciseCount = template.exercises.length;

    // SAFETY CHECK 1: Never sync if local has no exercises but DB does
    if (dbExerciseCount > 0 && localExerciseCount === 0) {
      console.error('[Sync] BLOCKED: Local template has 0 exercises but DB has', dbExerciseCount);
      return;
    }

    // Note: Removed "local < DB * 0.5" check - it was blocking legitimate saves
    // when DB had corrupted duplicate data. Since we now do direct syncs on
    // explicit user actions, we trust the local state.

    // SAFETY CHECK 2: Guard against obviously corrupted data
    if (localExerciseCount > 50) {
      console.error('[Sync] BLOCKED: Template has too many exercises:', localExerciseCount);
      return;
    }

    // Check for duplicate exercises (corruption indicator)
    const exerciseIdCounts = new Map<string, number>();
    for (const ex of template.exercises) {
      exerciseIdCounts.set(ex.exerciseId, (exerciseIdCounts.get(ex.exerciseId) || 0) + 1);
    }
    const maxDuplicates = Math.max(...exerciseIdCounts.values(), 0);
    if (maxDuplicates > 3) {
      console.error('[Sync] BLOCKED: Template has too many duplicate exercises:', maxDuplicates);
      return;
    }

    // Update template metadata only (safe operation)
    const { error: templateError } = await supabase
      .from('workout_templates')
      .update({
        name: template.name,
        template_type: template.templateType,
        copied_from: template.copiedFrom || null,
        in_rotation: template.inRotation ?? true,
        updated_at: template.updatedAt,
      })
      .eq('id', template.id)
      .eq('user_id', userId);
    if (templateError) throw templateError;

    // ONLY sync exercises if local has exercises AND count matches or exceeds DB
    // This prevents accidental data loss
    if (localExerciseCount === 0) {
      console.log('[Sync] Skipping exercise sync - no local exercises');
      return;
    }

    // Delete and re-insert (only if we passed all safety checks)
    const { error: deleteError } = await supabase
      .from('template_exercises')
      .delete()
      .eq('template_id', template.id);
    if (deleteError) throw deleteError;

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

    const { error: insertError } = await supabase.from('template_exercises').insert(exercisesToInsert);
    if (insertError) {
      console.error('[Sync] Failed to insert template exercises:', insertError.message, insertError.code);
      throw insertError;
    }
};

const queueTemplateSync = (
  template: WorkoutTemplate,
  expectedUserId?: string
): Promise<void> => enqueueLatest(
  templateSyncQueues,
  template.id,
  template,
  (snapshot) => performAddTemplate(snapshot, expectedUserId)
);

export const syncAddTemplate = async (
  template: WorkoutTemplate,
  expectedUserId?: string
): Promise<void> => queueTemplateSync(template, expectedUserId);

export const syncUpdateTemplate = async (
  template: WorkoutTemplate,
  expectedUserId?: string
): Promise<void> => queueTemplateSync(template, expectedUserId);

export const syncDeleteTemplate = async (templateId: string, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId)
    .eq('user_id', userId);
  if (error) throw error;
};

export const syncReorderTemplates = async (templateIds: string[], expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const results = await Promise.all(
    templateIds.map((id, index) =>
      supabase
        .from('workout_templates')
        .update({ sort_order: index })
        .eq('id', id)
        .eq('user_id', userId)
    )
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) throw failed.error;
};

// ============================================
// Session Sync
// ============================================

const performAddSession = async (session: WorkoutSession, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  // Completed empty sessions are invalid, but an active quick workout may
  // legitimately exist before the user adds its first exercise.
  if (session.exercises.length === 0 && session.completedAt) {
    console.warn('[Sync] SAFETY BLOCK: Refusing to add session with zero exercises:', {
      sessionId: session.id,
      sessionName: session.name,
    });
    // Save to localStorage for later reconciliation
    const failedSyncs = JSON.parse(localStorage.getItem('workout-app-failed-syncs') || '[]');
    failedSyncs.push({
      type: 'empty_session_blocked',
      sessionId: session.id,
      sessionName: session.name,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('workout-app-failed-syncs', JSON.stringify(failedSyncs));
    return;
  }

    // Check if session already exists (prevent duplicate exercise inserts)
    const { data: existing, error: existingError } = await supabase
      .from('workout_sessions')
      .select('id')
      .eq('id', session.id)
      .eq('user_id', userId)
      .maybeSingle();
    if (existingError) throw existingError;

    if (existing) {
      await performUpdateSession(session, expectedUserId);
      return;
    }

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

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('session_exercises')
        .insert(exercisesToInsert)
        .select();
      if (exercisesError) throw exercisesError;

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
              distance: set.type === 'cardio' ? (set.distance ?? null) : null,
              distance_unit: set.type === 'cardio' ? (set.distanceUnit ?? null) : null,
              calories: set.type === 'cardio' ? (set.calories ?? null) : null,
              duration_seconds: set.type === 'cardio' ? set.durationSeconds : null,
              completed_at: set.completedAt,
            }));

            const { error: setsError } = await supabase.from('completed_sets').insert(setsToInsert);
            if (setsError) throw setsError;
          }
        }
      }
    }
};

const performUpdateSession = async (session: WorkoutSession, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;
    // SAFETY: Fetch current DB state first
    const { data: existingExercises, error: existingExercisesError } = await supabase
      .from('session_exercises')
      .select('id')
      .eq('session_id', session.id);
    if (existingExercisesError) throw existingExercisesError;

    const dbExerciseCount = existingExercises?.length || 0;
    const localExerciseCount = session.exercises.length;

    // SAFETY CHECK 1: Never sync if local has no exercises but DB does
    if (dbExerciseCount > 0 && localExerciseCount === 0) {
      console.error('[Sync] BLOCKED: Local session has 0 exercises but DB has', dbExerciseCount);
      return;
    }

    // SAFETY CHECK 2: Never sync if local has significantly fewer exercises than DB
    if (dbExerciseCount > 0 && localExerciseCount < dbExerciseCount * 0.5) {
      console.error('[Sync] BLOCKED: Local session has fewer exercises than DB', {
        sessionId: session.id,
        local: localExerciseCount,
        db: dbExerciseCount,
      });
      return;
    }

    // SAFETY CHECK 3: Guard against obviously corrupted data
    if (localExerciseCount > 50) {
      console.error('[Sync] BLOCKED: Session has too many exercises:', localExerciseCount);
      return;
    }

    // Update session metadata only (safe operation)
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

    // ONLY sync exercises if local has exercises
    if (localExerciseCount === 0) {
      console.log('[Sync] Skipping exercise sync - no local exercises');
      return;
    }

    // Delete and re-insert exercises + sets (only if we passed all safety checks)
    const { error: deleteError } = await supabase
      .from('session_exercises')
      .delete()
      .eq('session_id', session.id);
    if (deleteError) throw deleteError;

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

      const { data: exercisesData, error: exercisesError } = await supabase
        .from('session_exercises')
        .insert(exercisesToInsert)
        .select();
      if (exercisesError) throw exercisesError;

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
              distance: set.type === 'cardio' ? (set.distance ?? null) : null,
              distance_unit: set.type === 'cardio' ? (set.distanceUnit ?? null) : null,
              calories: set.type === 'cardio' ? (set.calories ?? null) : null,
              duration_seconds: set.type === 'cardio' ? set.durationSeconds : null,
              completed_at: set.completedAt,
            }));

            const { error: setsError } = await supabase.from('completed_sets').insert(setsToInsert);
            if (setsError) throw setsError;
          }
        }
      }
    }
};

const queueSessionSync = (
  session: WorkoutSession,
  expectedUserId?: string
): Promise<void> => enqueueLatest(
  sessionSyncQueues,
  session.id,
  session,
  (snapshot) => performAddSession(snapshot, expectedUserId)
);

export const syncAddSession = async (
  session: WorkoutSession,
  expectedUserId?: string
): Promise<void> => queueSessionSync(session, expectedUserId);

export const syncUpdateSession = async (
  session: WorkoutSession,
  expectedUserId?: string
): Promise<void> => queueSessionSync(session, expectedUserId);

export const syncSetActiveSession = async (
  session: WorkoutSession | null,
  expectedUserId?: string
): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  if (session === null) {
    // Clear active session - mark all as inactive
    const { error } = await supabase
      .from('workout_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;
  } else {
    // Upsert the parent row before marking it active.
    await syncAddSession(session, expectedUserId);
  }
};

export const syncDeleteSession = async (
  sessionId: string,
  expectedUserId?: string
): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);
  if (error) throw error;
};

// ============================================
// Custom Exercise Sync
// ============================================

export const syncAddCustomExercise = async (
  exercise: Exercise,
  expectedUserId?: string
): Promise<void> => {
  const userId = await getUserId(expectedUserId);
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

  const { error } = await supabase
    .from('custom_exercises')
    .upsert(insertData, { onConflict: 'id' });
  if (error) {
    console.error('[Sync] Failed to sync custom exercise:', error.message, error.code);
    throw error;
  }
};

export const syncDeleteCustomExercise = async (
  exerciseId: string,
  expectedUserId?: string
): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const { error } = await supabase
    .from('custom_exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('user_id', userId);
  if (error) throw error;
};

// ============================================
// Weight Entry Sync
// ============================================

export const syncAddWeightEntry = async (entry: WeightEntry, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
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

export const syncDeleteWeightEntry = async (date: string, expectedUserId?: string): Promise<void> => {
  const userId = await getUserId(expectedUserId);
  if (!userId) return;

  const { error } = await supabase
    .from('weight_entries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date);
  if (error) throw error;
};
