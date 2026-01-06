import { FC, useState } from 'react';
import { useComments } from '../../hooks/useComments';
import { useAuth } from '../../hooks/useAuth';
import { CommentItem } from './CommentItem';

interface CommentsSectionProps {
  workoutId: string;
  initialCount?: number;
  isExpanded: boolean;
  onUserClick: (userId: string) => void;
  onCommentCountChange?: (count: number) => void;
}

export const CommentsSection: FC<CommentsSectionProps> = ({
  workoutId,
  initialCount = 0,
  isExpanded,
  onUserClick,
  onCommentCountChange,
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
  } = useComments(workoutId, initialCount);

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

  if (!isExpanded) return null;

  return (
    <div className="border-t border-border">
      {/* Comments list */}
      <div className="p-4 space-y-4 max-h-60 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-2">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOwn={comment.user_id === user?.id}
              onDelete={() => handleDelete(comment.id)}
              onUserClick={() => onUserClick(comment.user_id)}
            />
          ))
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="px-4 pb-2 text-sm text-destructive">{error}</div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="p-4 pt-0 flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          maxLength={500}
          className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
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
