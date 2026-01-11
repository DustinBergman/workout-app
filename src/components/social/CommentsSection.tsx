import { FC, useState } from 'react';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import { CommentItem } from './CommentItem';
import { WorkoutComment } from '../../services/supabase/comments';

interface CommentsSectionProps {
  workoutId: string;
  workoutOwnerId?: string;
  initialCount?: number;
  isExpanded: boolean;
  onUserClick: (userId: string) => void;
  onCommentCountChange?: (count: number) => void;
  previewComments?: WorkoutComment[];
  onPreviewCommentLike?: (commentId: string) => void;
}

export const CommentsSection: FC<CommentsSectionProps> = ({
  workoutId,
  workoutOwnerId,
  initialCount = 0,
  isExpanded,
  onUserClick,
  onCommentCountChange,
  previewComments,
  onPreviewCommentLike,
}) => {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const {
    comments,
    commentCount,
    isLoading,
    isSubmitting,
    error,
    addComment,
    deleteComment,
    toggleCommentLike,
  } = useComments(workoutId, initialCount, workoutOwnerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    await addComment(newComment);
    setNewComment('');
    onCommentCountChange?.(commentCount + 1);
  };

  const handleDelete = async (commentId: string) => {
    await deleteComment(commentId);
    onCommentCountChange?.(Math.max(0, commentCount - 1));
  };

  // Show preview comments when not expanded
  const displayComments = isExpanded ? comments : (previewComments || []);
  const showViewMoreLink = !isExpanded && commentCount > (previewComments?.length || 0);

  return (
    <div className="border-t border-border">
      {/* Preview comments or full comments list */}
      {displayComments.length > 0 && (
        <div className={`px-3 py-2 space-y-2.5 ${isExpanded ? 'max-h-48 overflow-y-auto' : ''}`}>
          {isExpanded && isLoading ? (
            <div className="flex items-center justify-center py-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            displayComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isOwn={comment.user_id === user?.id}
                onDelete={() => handleDelete(comment.id)}
                onUserClick={() => onUserClick(comment.user_id)}
                onToggleLike={() =>
                  isExpanded
                    ? toggleCommentLike(comment.id)
                    : onPreviewCommentLike?.(comment.id)
                }
              />
            ))
          )}
        </div>
      )}

      {/* View more comments link when in preview mode */}
      {showViewMoreLink && (
        <div className="px-3 pb-1.5">
          <span className="text-xs text-muted-foreground">
            View all {commentCount} comments
          </span>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-3 pb-1.5 text-xs text-destructive">{error}</div>
      )}

      {/* Add comment form - always visible */}
      <form onSubmit={handleSubmit} className="px-3 py-2 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          className="flex-1 px-2.5 py-1.5 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            'Post'
          )}
        </button>
      </form>
    </div>
  );
};
