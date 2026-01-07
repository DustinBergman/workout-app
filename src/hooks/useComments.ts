import { useState, useEffect, useCallback } from 'react';
import {
  addComment as addCommentService,
  deleteComment as deleteCommentService,
  getWorkoutComments,
  likeComment as likeCommentService,
  unlikeComment as unlikeCommentService,
  WorkoutComment,
} from '../services/supabase/comments';
import { useAuth } from './useAuth';

interface UseCommentsReturn {
  comments: WorkoutComment[];
  commentCount: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  addComment: (content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  toggleCommentLike: (commentId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useComments = (
  workoutId: string,
  initialCount?: number
): UseCommentsReturn => {
  const { user } = useAuth();
  const [comments, setComments] = useState<WorkoutComment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCount || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const loadComments = useCallback(async () => {
    if (hasLoaded) return; // Only load once until refresh is called

    setIsLoading(true);
    setError(null);

    try {
      const { comments: fetchedComments, error: fetchError } =
        await getWorkoutComments(workoutId);

      if (fetchError) throw fetchError;

      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [workoutId, hasLoaded]);

  const refresh = useCallback(async () => {
    setHasLoaded(false);
    setIsLoading(true);
    setError(null);

    try {
      const { comments: fetchedComments, error: fetchError } =
        await getWorkoutComments(workoutId);

      if (fetchError) throw fetchError;

      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
      setHasLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments');
    } finally {
      setIsLoading(false);
    }
  }, [workoutId]);

  const addComment = useCallback(
    async (content: string) => {
      if (!user) return;

      setIsSubmitting(true);
      setError(null);

      try {
        const { commentId, error: addError } = await addCommentService(
          workoutId,
          content
        );

        if (addError) throw addError;

        // Optimistically add the comment to the list
        if (commentId) {
          const newComment: WorkoutComment = {
            id: commentId,
            workout_id: workoutId,
            user_id: user.id,
            content: content.trim(),
            created_at: new Date().toISOString(),
            user: {
              id: user.id,
              first_name: user.user_metadata?.firstName || null,
              last_name: user.user_metadata?.lastName || null,
              username: user.user_metadata?.username || null,
            },
            like_count: 0,
            has_liked: false,
          };
          setComments((prev) => [...prev, newComment]);
          setCommentCount((prev) => prev + 1);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add comment');
      } finally {
        setIsSubmitting(false);
      }
    },
    [workoutId, user]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      setError(null);

      // Optimistic delete
      const previousComments = comments;
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));

      try {
        const { error: deleteError } = await deleteCommentService(commentId);

        if (deleteError) throw deleteError;
      } catch (err) {
        // Revert on error
        setComments(previousComments);
        setCommentCount(previousComments.length);
        setError(
          err instanceof Error ? err.message : 'Failed to delete comment'
        );
      }
    },
    [comments]
  );

  const toggleCommentLike = useCallback(
    async (commentId: string) => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      // Optimistic update
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                has_liked: !c.has_liked,
                like_count: c.has_liked ? c.like_count - 1 : c.like_count + 1,
              }
            : c
        )
      );

      try {
        if (comment.has_liked) {
          const { error } = await unlikeCommentService(commentId);
          if (error) throw error;
        } else {
          const { error } = await likeCommentService(commentId);
          if (error) throw error;
        }
      } catch (err) {
        // Revert on error
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  has_liked: comment.has_liked,
                  like_count: comment.like_count,
                }
              : c
          )
        );
        setError(
          err instanceof Error ? err.message : 'Failed to update like'
        );
      }
    },
    [comments]
  );

  // Load comments when first accessed
  useEffect(() => {
    if (!hasLoaded) {
      loadComments();
    }
  }, [loadComments, hasLoaded]);

  return {
    comments,
    commentCount,
    isLoading,
    isSubmitting,
    error,
    addComment,
    deleteComment,
    toggleCommentLike,
    refresh,
  };
};
