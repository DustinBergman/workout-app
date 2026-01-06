import { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { WorkoutComment } from '../../services/supabase/comments';

interface CommentItemProps {
  comment: WorkoutComment;
  isOwn: boolean;
  onDelete: () => void;
  onUserClick: () => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  isOwn,
  onDelete,
  onUserClick,
}) => {
  const displayName =
    comment.user.first_name && comment.user.last_name
      ? `${comment.user.first_name} ${comment.user.last_name}`
      : comment.user.username || 'Anonymous';

  return (
    <div className="flex gap-3">
      {/* Avatar - clickable */}
      <button
        onClick={onUserClick}
        className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold flex-shrink-0 hover:ring-2 hover:ring-primary/50 transition-all"
      >
        {displayName.charAt(0).toUpperCase()}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {/* Name - clickable */}
          <button
            onClick={onUserClick}
            className="font-medium text-sm hover:text-primary transition-colors"
          >
            {displayName}
          </button>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-sm mt-0.5 break-words">{comment.content}</p>

        {/* Delete button for own comments */}
        {isOwn && (
          <button
            onClick={onDelete}
            className="text-xs text-muted-foreground hover:text-destructive mt-1 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
