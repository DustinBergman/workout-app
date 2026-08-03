import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';

// Types
export interface CommentUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface WorkoutComment {
  id: string;
  workout_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user: CommentUser;
  like_count: number;
  has_liked: boolean;
}

/**
 * Add a comment to a workout (uses RPC for notification)
 */
export const addComment = async (
  workoutId: string,
  content: string
): Promise<{ commentId: string | null; error: Error | null }> => {
  const user = await getAuthUser();
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
  const user = await getAuthUser();
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
 * Get all comments for a workout with like counts
 */
export const getWorkoutComments = async (
  workoutId: string,
  limit?: number,
  ascending = true
): Promise<{ comments: WorkoutComment[]; error: Error | null }> => {
  const user = await getAuthUser();

  let query = supabase
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
        username,
        avatar_url
      ),
      comment_likes (
        id,
        user_id
      )
    `)
    .eq('workout_id', workoutId)
    .order('created_at', { ascending });

  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    return { comments: [], error };
  }

  // Transform the data to match our type
  const comments = (data || []).map((comment) => ({
    id: comment.id,
    workout_id: comment.workout_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: comment.created_at,
    user: comment.user as unknown as CommentUser,
    like_count: (comment.comment_likes || []).length,
    has_liked: user ? (comment.comment_likes || []).some((like: { user_id: string }) => like.user_id === user.id) : false,
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

  const counts: Record<string, number> = {};
  const results = await Promise.all(
    workoutIds.map(async (workoutId) => ({
      workoutId,
      result: await getCommentCount(workoutId),
    }))
  );
  const failed = results.find(({ result }) => result.error);
  if (failed?.result.error) {
    return { counts: {}, error: failed.result.error };
  }
  for (const { workoutId, result } of results) {
    counts[workoutId] = result.count;
  }

  return { counts, error: null };
};

/**
 * Get preview comments for multiple workouts (latest 2 per workout)
 */
export const getBatchPreviewComments = async (
  workoutIds: string[]
): Promise<{ previews: Record<string, WorkoutComment[]>; error: Error | null }> => {
  if (workoutIds.length === 0) {
    return { previews: {}, error: null };
  }

  const previews: Record<string, WorkoutComment[]> = {};
  const results = await Promise.all(
    workoutIds.map(async (workoutId) => {
      const { comments, error } = await getWorkoutComments(workoutId, 2, false);
      return { workoutId, comments, error };
    })
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { previews: {}, error: failed.error };
  }
  for (const { workoutId, comments } of results) {
    previews[workoutId] = [...comments].reverse();
  }

  return { previews, error: null };
};

/**
 * Like a comment
 */
export const likeComment = async (
  commentId: string
): Promise<{ likeId: string | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { likeId: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase.rpc('like_comment', {
    p_comment_id: commentId,
  });

  if (error) {
    return { likeId: null, error };
  }

  return { likeId: data, error: null };
};

/**
 * Unlike a comment
 */
export const unlikeComment = async (
  commentId: string
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase.rpc('unlike_comment', {
    p_comment_id: commentId,
  });

  return { error };
};
