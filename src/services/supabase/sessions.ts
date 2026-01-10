import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';
import type {
  WorkoutSession,
  SessionExercise,
  CompletedSet,
  WorkoutMood,
  ProgressiveOverloadWeek,
  WorkoutGoal,
  PersonalBest,
} from '../../types';

interface DbCompletedSet {
  id: string;
  session_exercise_id: string;
  type: 'strength' | 'cardio';
  reps: number | null;
  weight: number | null;
  weight_unit: 'lbs' | 'kg' | null;
  distance: number | null;
  distance_unit: 'mi' | 'km' | null;
  duration_seconds: number | null;
  completed_at: string;
}

interface DbSessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  type: 'strength' | 'cardio';
  sort_order: number;
  target_sets: number | null;
  target_reps: number | null;
  rest_seconds: number | null;
  completed_sets?: DbCompletedSet[];
}

interface DbWorkoutSession {
  id: string;
  user_id: string;
  template_id: string | null;
  name: string;
  custom_title: string | null;
  mood: number | null;
  progressive_overload_week: number | null;
  workout_goal: string | null;
  personal_bests: PersonalBest[] | null;
  streak_count: number | null;
  started_at: string;
  completed_at: string | null;
  is_active: boolean;
  created_at: string;
  session_exercises?: DbSessionExercise[];
}

/**
 * Get all completed sessions for the current user
 */
export const getSessions = async (): Promise<{ sessions: WorkoutSession[]; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { sessions: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      session_exercises (
        *,
        completed_sets (*)
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', false)
    .order('started_at', { ascending: false });

  if (error) {
    return { sessions: [], error };
  }

  const sessions = (data || []).map(dbSessionToSession);
  return { sessions, error: null };
};

/**
 * Get the active session for the current user
 */
export const getActiveSession = async (): Promise<{ session: WorkoutSession | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { session: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      session_exercises (
        *,
        completed_sets (*)
      )
    `)
    .eq('user_id', user.id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return { session: null, error };
  }

  return { session: data ? dbSessionToSession(data) : null, error: null };
};

/**
 * Create a new workout session
 */
export const createSession = async (
  session: Omit<WorkoutSession, 'id' | 'completedAt'>
): Promise<{ session: WorkoutSession | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { session: null, error: new Error('Not authenticated') };
  }

  // Create the session
  const { data: sessionData, error: sessionError } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: user.id,
      template_id: session.templateId || null,
      name: session.name,
      started_at: session.startedAt,
      is_active: true,
    })
    .select()
    .single();

  if (sessionError || !sessionData) {
    return { session: null, error: sessionError };
  }

  // Create session exercises
  if (session.exercises.length > 0) {
    const exercisesToInsert = session.exercises.map((ex, idx) =>
      sessionExerciseToDbExercise(ex, sessionData.id, idx)
    );

    const { data: exercisesData, error: exercisesError } = await supabase
      .from('session_exercises')
      .insert(exercisesToInsert)
      .select();

    if (exercisesError) {
      return { session: null, error: exercisesError };
    }

    // Insert any initial sets
    const setsToInsert: Array<Omit<DbCompletedSet, 'id'>> = [];
    session.exercises.forEach((ex, exIdx) => {
      const dbExId = exercisesData?.[exIdx]?.id;
      if (dbExId && ex.sets.length > 0) {
        ex.sets.forEach((set) => {
          setsToInsert.push(completedSetToDbSet(set, dbExId));
        });
      }
    });

    if (setsToInsert.length > 0) {
      const { error: setsError } = await supabase
        .from('completed_sets')
        .insert(setsToInsert);

      if (setsError) {
        return { session: null, error: setsError };
      }
    }
  }

  // Fetch complete session
  const { data: completeData, error: fetchError } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      session_exercises (
        *,
        completed_sets (*)
      )
    `)
    .eq('id', sessionData.id)
    .single();

  if (fetchError) {
    return { session: null, error: fetchError };
  }

  return { session: dbSessionToSession(completeData), error: null };
};

/**
 * Update an existing session
 */
export const updateSession = async (
  id: string,
  updates: Partial<WorkoutSession>
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  // Update session metadata
  const sessionUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) sessionUpdates.name = updates.name;
  if (updates.customTitle !== undefined) sessionUpdates.custom_title = updates.customTitle;
  if (updates.mood !== undefined) sessionUpdates.mood = updates.mood;
  if (updates.progressiveOverloadWeek !== undefined) sessionUpdates.progressive_overload_week = updates.progressiveOverloadWeek;
  if (updates.workoutGoal !== undefined) sessionUpdates.workout_goal = updates.workoutGoal;
  if (updates.personalBests !== undefined) sessionUpdates.personal_bests = updates.personalBests;
  if (updates.streakCount !== undefined) sessionUpdates.streak_count = updates.streakCount;
  if (updates.completedAt !== undefined) {
    sessionUpdates.completed_at = updates.completedAt;
    sessionUpdates.is_active = false;
  }

  if (Object.keys(sessionUpdates).length > 0) {
    const { error: updateError } = await supabase
      .from('workout_sessions')
      .update(sessionUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return { error: updateError };
    }
  }

  return { error: null };
};

/**
 * Add a completed set to a session exercise
 */
export const addCompletedSet = async (
  sessionExerciseId: string,
  set: CompletedSet
): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('completed_sets')
    .insert(completedSetToDbSet(set, sessionExerciseId));

  return { error };
};

/**
 * Delete a completed set
 */
export const deleteCompletedSet = async (setId: string): Promise<{ error: Error | null }> => {
  const { error } = await supabase
    .from('completed_sets')
    .delete()
    .eq('id', setId);

  return { error };
};

/**
 * Complete a workout session
 */
export const completeSession = async (id: string): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('workout_sessions')
    .update({
      completed_at: new Date().toISOString(),
      is_active: false,
    })
    .eq('id', id)
    .eq('user_id', user.id);

  return { error };
};

/**
 * Cancel/delete an active session
 */
export const cancelSession = async (id: string): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_active', true);

  return { error };
};

/**
 * Delete a completed workout session
 */
export const deleteSession = async (id: string): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return { error };
};

// Helper: Convert DB session to app session
const dbSessionToSession = (dbSession: DbWorkoutSession): WorkoutSession => ({
  id: dbSession.id,
  templateId: dbSession.template_id ?? undefined,
  name: dbSession.name,
  customTitle: dbSession.custom_title ?? undefined,
  mood: dbSession.mood as WorkoutMood | undefined ?? undefined,
  progressiveOverloadWeek: dbSession.progressive_overload_week as ProgressiveOverloadWeek | undefined ?? undefined,
  workoutGoal: dbSession.workout_goal as WorkoutGoal | undefined ?? undefined,
  personalBests: dbSession.personal_bests ?? undefined,
  streakCount: dbSession.streak_count ?? undefined,
  startedAt: dbSession.started_at,
  completedAt: dbSession.completed_at ?? undefined,
  exercises: (dbSession.session_exercises || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(dbExerciseToSessionExercise),
});

// Helper: Convert DB exercise to app session exercise
const dbExerciseToSessionExercise = (dbEx: DbSessionExercise): SessionExercise => {
  const sets = (dbEx.completed_sets || []).map(dbSetToCompletedSet);

  if (dbEx.type === 'cardio') {
    return {
      id: dbEx.id,
      type: 'cardio',
      exerciseId: dbEx.exercise_id,
      restSeconds: dbEx.rest_seconds ?? 0,
      sets,
    };
  }

  return {
    id: dbEx.id,
    type: 'strength',
    exerciseId: dbEx.exercise_id,
    targetSets: dbEx.target_sets ?? 0,
    targetReps: dbEx.target_reps ?? 0,
    restSeconds: dbEx.rest_seconds ?? 0,
    sets,
  };
};

// Helper: Convert DB set to app completed set
const dbSetToCompletedSet = (dbSet: DbCompletedSet): CompletedSet => {
  if (dbSet.type === 'cardio') {
    return {
      type: 'cardio',
      distance: dbSet.distance ?? 0,
      distanceUnit: dbSet.distance_unit ?? 'mi',
      durationSeconds: dbSet.duration_seconds ?? 0,
      completedAt: dbSet.completed_at,
    };
  }

  return {
    type: 'strength',
    reps: dbSet.reps ?? 0,
    weight: dbSet.weight ?? 0,
    unit: dbSet.weight_unit ?? 'lbs',
    completedAt: dbSet.completed_at,
  };
};

// Helper: Convert app session exercise to DB format
const sessionExerciseToDbExercise = (
  ex: SessionExercise,
  sessionId: string,
  sortOrder: number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => ({
  session_id: sessionId,
  exercise_id: ex.exerciseId,
  type: ex.type,
  sort_order: sortOrder,
  target_sets: ex.type === 'strength' ? ex.targetSets : null,
  target_reps: ex.type === 'strength' ? ex.targetReps : null,
  rest_seconds: ex.restSeconds,
});

// Helper: Convert app completed set to DB format
const completedSetToDbSet = (
  set: CompletedSet,
  sessionExerciseId: string
): Omit<DbCompletedSet, 'id'> => ({
  session_exercise_id: sessionExerciseId,
  type: set.type,
  reps: set.type === 'strength' ? set.reps : null,
  weight: set.type === 'strength' ? set.weight : null,
  weight_unit: set.type === 'strength' ? set.unit : null,
  distance: set.type === 'cardio' ? set.distance : null,
  distance_unit: set.type === 'cardio' ? set.distanceUnit : null,
  duration_seconds: set.type === 'cardio' ? set.durationSeconds : null,
  completed_at: set.completedAt,
});
