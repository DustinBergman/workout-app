import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';

// Types
export interface WorkoutLike {
  id: string;
  workout_id: string;
  user_id: string;
  created_at: string;
}

export interface LikeUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

export interface WorkoutLikeWithUser extends WorkoutLike {
  user: LikeUser;
}

export interface LikeSummary {
  count: number;
  hasLiked: boolean;
  recentLikers: LikeUser[];
}

/**
 * Like a workout (uses RPC for batched notifications)
 */
export const likeWorkout = async (
  workoutId: string
): Promise<{ likeId: string | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { likeId: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase.rpc('like_workout', {
    p_workout_id: workoutId,
  });

  if (error) {
    return { likeId: null, error };
  }

  return { likeId: data, error: null };
};

/**
 * Unlike a workout
 */
export const unlikeWorkout = async (
  workoutId: string
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('workout_likes')
    .delete()
    .eq('workout_id', workoutId)
    .eq('user_id', user.id);

  return { error };
};

/**
 * Get all users who liked a workout
 */
export const getWorkoutLikes = async (
  workoutId: string
): Promise<{ likes: WorkoutLikeWithUser[]; error: Error | null }> => {
  const { data, error } = await supabase
    .from('workout_likes')
    .select(`
      id,
      workout_id,
      user_id,
      created_at,
      user:profiles!workout_likes_user_id_fkey (
        id,
        first_name,
        last_name,
        username
      )
    `)
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: false });

  if (error) {
    return { likes: [], error };
  }

  // Transform the data to match our type
  const likes = (data || []).map((like) => ({
    ...like,
    user: like.user as unknown as LikeUser,
  }));

  return { likes, error: null };
};

/**
 * Get like summary for a workout (count, hasLiked, recent likers)
 */
export const getLikeSummary = async (
  workoutId: string
): Promise<{ summary: LikeSummary | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { summary: null, error: new Error('Not authenticated') };
  }

  // Get count
  const { count, error: countError } = await supabase
    .from('workout_likes')
    .select('*', { count: 'exact', head: true })
    .eq('workout_id', workoutId);

  if (countError) {
    return { summary: null, error: countError };
  }

  // Check if current user has liked
  const { data: userLike, error: userLikeError } = await supabase
    .from('workout_likes')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (userLikeError) {
    return { summary: null, error: userLikeError };
  }

  // Get recent likers (up to 3)
  const { data: recentLikes, error: recentError } = await supabase
    .from('workout_likes')
    .select(`
      user:profiles!workout_likes_user_id_fkey (
        id,
        first_name,
        last_name,
        username
      )
    `)
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: false })
    .limit(3);

  if (recentError) {
    return { summary: null, error: recentError };
  }

  const recentLikers = (recentLikes || []).map(
    (like) => like.user as unknown as LikeUser
  );

  return {
    summary: {
      count: count || 0,
      hasLiked: !!userLike,
      recentLikers,
    },
    error: null,
  };
};

/**
 * Batch get like summaries for multiple workouts (for feed performance)
 */
export const getBatchLikeSummaries = async (
  workoutIds: string[]
): Promise<{ summaries: Record<string, LikeSummary>; error: Error | null }> => {
  if (workoutIds.length === 0) {
    return { summaries: {}, error: null };
  }

  const user = await getAuthUser();
  if (!user) {
    return { summaries: {}, error: new Error('Not authenticated') };
  }

  const summaries: Record<string, LikeSummary> = {};
  const results = await Promise.all(
    workoutIds.map(async (workoutId) => ({
      workoutId,
      result: await getLikeSummary(workoutId),
    }))
  );
  const failed = results.find(({ result }) => result.error);
  if (failed?.result.error) {
    return { summaries: {}, error: failed.result.error };
  }

  for (const { workoutId, result } of results) {
    summaries[workoutId] = result.summary ?? {
      count: 0,
      hasLiked: false,
      recentLikers: [],
    };
  }
  return { summaries, error: null };
};
