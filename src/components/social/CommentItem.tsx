import { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { WorkoutComment } from '../../services/supabase/comments';
import { Avatar } from '../ui';

interface CommentItemProps {
  comment: WorkoutComment;
  isOwn: boolean;
  onDelete: () => void;
  onUserClick: () => void;
  onToggleLike?: () => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  isOwn,
  onDelete,
  onUserClick,
  onToggleLike,
}) => {
  // Username is the primary identifier
  const username = comment.user.username
    ? `@${comment.user.username}`
    : null;

  const fullName =
    comment.user.first_name && comment.user.last_name
      ? `${comment.user.first_name} ${comment.user.last_name}`
      : null;

  const displayName = fullName || username || 'Anonymous';

  return (
    <div className="flex gap-2">
      {/* Avatar - clickable */}
      <Avatar
        src={comment.user.avatar_url}
        name={comment.user.first_name || comment.user.username}
        size="xs"
        onClick={onUserClick}
        className="flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Name - clickable */}
          <button
            onClick={onUserClick}
            className="font-medium text-xs hover:text-primary transition-colors"
          >
            {displayName}
          </button>
          {fullName && username && (
            <span className="text-xs text-primary/70">{username}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            })}
          </span>
        </div>
        <p className="text-xs mt-0.5 break-words">{comment.content}</p>

        {/* Actions row */}
        <div className="flex items-center gap-2 mt-0.5">
          {/* Like button */}
          {onToggleLike && (
            <button
              onClick={onToggleLike}
              className={`flex items-center gap-1 text-xs transition-colors ${
                comment.has_liked
                  ? 'text-red-500'
                  : 'text-muted-foreground hover:text-red-500'
              }`}
            >
              <svg
                className="w-3.5 h-3.5"
                fill={comment.has_liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {comment.like_count > 0 && <span>{comment.like_count}</span>}
            </button>
          )}

          {/* Delete button for own comments */}
          {isOwn && (
            <button
              onClick={onDelete}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
