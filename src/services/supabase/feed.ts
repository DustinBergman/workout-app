import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';
import type {
  CompletedSet,
  WorkoutMood,
  ProgressiveOverloadWeek,
  WorkoutGoal,
  PersonalBest,
} from '../../types';

// Types
export interface FeedUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface FeedSessionExercise {
  id: string;
  exercise_id: string;
  custom_exercise_name: string | null;
  type: 'strength' | 'cardio';
  sort_order: number;
  target_sets: number | null;
  target_reps: number | null;
  rest_seconds: number | null;
  completed_sets: Array<{
    id: string;
    type: 'strength' | 'cardio';
    reps: number | null;
    weight: number | null;
    weight_unit: 'lbs' | 'kg' | null;
    distance: number | null;
    distance_unit: 'mi' | 'km' | null;
    calories: number | null;
    duration_seconds: number | null;
    completed_at: string;
  }>;
}

export interface FeedWorkout {
  id: string;
  user_id: string;
  name: string;
  custom_title: string | null;
  mood: WorkoutMood | null;
  progressive_overload_week: ProgressiveOverloadWeek | null;
  workout_goal: WorkoutGoal | null;
  personal_bests: PersonalBest[] | null;
  streak_count: number | null;
  started_at: string;
  completed_at: string | null;
  user: FeedUser;
  session_exercises: FeedSessionExercise[];
}

// Helper to convert DB completed set to app format
const dbSetToCompletedSet = (dbSet: FeedSessionExercise['completed_sets'][0]): CompletedSet => {
  if (dbSet.type === 'cardio') {
    return {
      type: 'cardio',
      ...(dbSet.distance != null && dbSet.distance > 0 && {
        distance: dbSet.distance,
        distanceUnit: dbSet.distance_unit ?? 'mi',
      }),
      ...(dbSet.calories != null && dbSet.calories > 0 && {
        calories: dbSet.calories,
      }),
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

/**
 * Get completed workouts from friends AND self for the feed
 */
export const getFriendWorkouts = async (
  limit = 20,
  offset = 0
): Promise<{ workouts: FeedWorkout[]; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { workouts: [], error: new Error('Not authenticated') };
  }

  // First get friend IDs
  const { data: friendships, error: friendshipsError } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', user.id);

  if (friendshipsError) {
    return { workouts: [], error: friendshipsError };
  }

  const friendIds = (friendships || []).map((f) => f.friend_id);

  // Include self AND friends in the feed
  const userIds = [user.id, ...friendIds];

  // Get completed workouts from self and friends
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      user_id,
      name,
      custom_title,
      mood,
      progressive_overload_week,
      workout_goal,
      personal_bests,
      streak_count,
      started_at,
      completed_at,
      user:profiles!workout_sessions_user_id_profiles_fkey (
        id, first_name, last_name, username, avatar_url
      ),
      session_exercises (
        id,
        exercise_id,
        type,
        sort_order,
        target_sets,
        target_reps,
        rest_seconds,
        completed_sets (
          id, type, reps, weight, weight_unit,
          distance, distance_unit, calories, duration_seconds, completed_at
        )
      )
    `)
    .in('user_id', userIds)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { workouts: [], error };
  }

  // Collect all unique exercise IDs from the workouts
  const exerciseIds = new Set<string>();
  (data || []).forEach((workout) => {
    (workout.session_exercises || []).forEach((ex) => {
      exerciseIds.add(ex.exercise_id);
    });
  });

  // Fetch custom exercise names using RPC function (bypasses RLS for name lookup)
  // Only send UUIDs - built-in exercises have string IDs like "bench-press"
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const customExerciseMap = new Map<string, string>();
  const uuidIds = Array.from(exerciseIds).filter((id) => UUID_REGEX.test(id));

  if (uuidIds.length > 0) {
    const { data: customExercises } = await supabase
      .rpc('get_custom_exercise_names', { exercise_ids: uuidIds });

    (customExercises || []).forEach((ce: { id: string; name: string }) => {
      customExerciseMap.set(ce.id, ce.name);
    });
  }

  // Transform the data
  const workouts = (data || []).map((workout) => ({
    ...workout,
    user: workout.user as unknown as FeedUser,
    session_exercises: (workout.session_exercises || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ex) => ({
        ...ex,
        custom_exercise_name: customExerciseMap.get(ex.exercise_id) || null,
        completed_sets: (ex.completed_sets || []).sort(
          (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        ),
      })),
  })) as FeedWorkout[];

  return { workouts, error: null };
};

/**
 * Get a single workout by ID (for workout detail page)
 */
export const getWorkoutById = async (
  workoutId: string
): Promise<{ workout: FeedWorkout | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { workout: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      user_id,
      name,
      custom_title,
      mood,
      progressive_overload_week,
      workout_goal,
      personal_bests,
      streak_count,
      started_at,
      completed_at,
      user:profiles!workout_sessions_user_id_profiles_fkey (
        id, first_name, last_name, username, avatar_url
      ),
      session_exercises (
        id,
        exercise_id,
        type,
        sort_order,
        target_sets,
        target_reps,
        rest_seconds,
        completed_sets (
          id, type, reps, weight, weight_unit,
          distance, distance_unit, calories, duration_seconds, completed_at
        )
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error) {
    return { workout: null, error };
  }

  if (!data) {
    return { workout: null, error: new Error('Workout not found') };
  }

  // Collect exercise IDs and fetch custom exercise names using RPC (bypasses RLS)
  // Only send UUIDs - built-in exercises have string IDs like "bench-press"
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const exerciseIds = (data.session_exercises || []).map((ex) => ex.exercise_id);
  const uuidIds = exerciseIds.filter((id) => UUID_REGEX.test(id));
  const customExerciseMap = new Map<string, string>();

  if (uuidIds.length > 0) {
    const { data: customExercises } = await supabase
      .rpc('get_custom_exercise_names', { exercise_ids: uuidIds });

    (customExercises || []).forEach((ce: { id: string; name: string }) => {
      customExerciseMap.set(ce.id, ce.name);
    });
  }

  // Transform the data
  const workout: FeedWorkout = {
    ...data,
    user: data.user as unknown as FeedUser,
    session_exercises: (data.session_exercises || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ex) => ({
        ...ex,
        custom_exercise_name: customExerciseMap.get(ex.exercise_id) || null,
        completed_sets: (ex.completed_sets || []).sort(
          (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        ),
      })),
  };

  return { workout, error: null };
};

/**
 * Calculate workout summary statistics
 */
export const calculateWorkoutSummary = (workout: FeedWorkout): {
  exerciseCount: number;
  totalSets: number;
  durationMinutes: number;
} => {
  const exerciseCount = workout.session_exercises.length;
  const totalSets = workout.session_exercises.reduce(
    (sum, ex) => sum + ex.completed_sets.length,
    0
  );

  let durationMinutes = 0;
  if (workout.completed_at && workout.started_at) {
    const start = new Date(workout.started_at).getTime();
    const end = new Date(workout.completed_at).getTime();
    durationMinutes = Math.round((end - start) / 1000 / 60);
  }

  return { exerciseCount, totalSets, durationMinutes };
};

/**
 * Transform feed workout exercises to app format for display
 */
export const transformFeedExerciseSets = (
  exercise: FeedSessionExercise
): CompletedSet[] => {
  return exercise.completed_sets.map(dbSetToCompletedSet);
};
