import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';
import type { CompletedSet } from '../../types';

// Types
export interface FeedUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

export interface FeedSessionExercise {
  id: string;
  exercise_id: string;
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
    duration_seconds: number | null;
    completed_at: string;
  }>;
}

export interface FeedWorkout {
  id: string;
  user_id: string;
  name: string;
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

/**
 * Get completed workouts from friends for the feed
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

  if (friendIds.length === 0) {
    return { workouts: [], error: null };
  }

  // Get completed workouts from friends
  const { data, error } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      user_id,
      name,
      started_at,
      completed_at,
      user:profiles!workout_sessions_user_id_profiles_fkey (
        id, first_name, last_name, username
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
          distance, distance_unit, duration_seconds, completed_at
        )
      )
    `)
    .in('user_id', friendIds)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { workouts: [], error };
  }

  // Transform the data
  const workouts = (data || []).map((workout) => ({
    ...workout,
    user: workout.user as unknown as FeedUser,
    session_exercises: (workout.session_exercises || [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((ex) => ({
        ...ex,
        completed_sets: (ex.completed_sets || []).sort(
          (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
        ),
      })),
  })) as FeedWorkout[];

  return { workouts, error: null };
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
