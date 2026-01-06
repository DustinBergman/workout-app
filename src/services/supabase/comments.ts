import { supabase } from '../../lib/supabase';

// Types
export interface CommentUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
}

export interface WorkoutComment {
  id: string;
  workout_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: CommentUser;
}

/**
 * Add a comment to a workout (uses RPC for notification)
 */
export const addComment = async (
  workoutId: string,
  content: string
): Promise<{ commentId: string | null; error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { commentId: null, error: new Error('Not authenticated') };
  }

  const trimmedContent = content.trim();
  if (!trimmedContent || trimmedContent.length > 500) {
    return {
      commentId: null,
      error: new Error('Comment must be between 1 and 500 characters'),
    };
  }

  const { data, error } = await supabase.rpc('add_workout_comment', {
    p_workout_id: workoutId,
    p_content: trimmedContent,
  });

  if (error) {
    return { commentId: null, error };
  }

  return { commentId: data, error: null };
};

/**
 * Delete a comment (only own comments)
 */
export const deleteComment = async (
  commentId: string
): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('workout_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  return { error };
};

/**
 * Get all comments for a workout
 */
export const getWorkoutComments = async (
  workoutId: string
): Promise<{ comments: WorkoutComment[]; error: Error | null }> => {
  const { data, error } = await supabase
    .from('workout_comments')
    .select(`
      id,
      workout_id,
      user_id,
      content,
      created_at,
      user:profiles!workout_comments_user_id_fkey (
        id,
        first_name,
        last_name,
        username
      )
    `)
    .eq('workout_id', workoutId)
    .order('created_at', { ascending: true });

  if (error) {
    return { comments: [], error };
  }

  // Transform the data to match our type
  const comments = (data || []).map((comment) => ({
    ...comment,
    user: comment.user as unknown as CommentUser,
  }));

  return { comments, error: null };
};

/**
 * Get comment count for a workout
 */
export const getCommentCount = async (
  workoutId: string
): Promise<{ count: number; error: Error | null }> => {
  const { count, error } = await supabase
    .from('workout_comments')
    .select('*', { count: 'exact', head: true })
    .eq('workout_id', workoutId);

  if (error) {
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
};

/**
 * Batch get comment counts for multiple workouts (for feed performance)
 */
export const getBatchCommentCounts = async (
  workoutIds: string[]
): Promise<{ counts: Record<string, number>; error: Error | null }> => {
  if (workoutIds.length === 0) {
    return { counts: {}, error: null };
  }

  // Get all comments for these workouts
  const { data, error } = await supabase
    .from('workout_comments')
    .select('workout_id')
    .in('workout_id', workoutIds);

  if (error) {
    return { counts: {}, error };
  }

  // Count comments per workout
  const counts: Record<string, number> = {};

  // Initialize all requested workouts to 0
  for (const workoutId of workoutIds) {
    counts[workoutId] = 0;
  }

  // Count each comment
  for (const comment of data || []) {
    counts[comment.workout_id] = (counts[comment.workout_id] || 0) + 1;
  }

  return { counts, error: null };
};
