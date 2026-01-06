import { FC } from 'react';
import { LikeSummary } from '../../services/supabase/likes';

interface LikeButtonProps {
  likeSummary: LikeSummary | null;
  isLiking: boolean;
  onToggleLike: () => void;
  onShowLikers: () => void;
}

export const LikeButton: FC<LikeButtonProps> = ({
  likeSummary,
  isLiking,
  onToggleLike,
  onShowLikers,
}) => {
  const hasLiked = likeSummary?.hasLiked || false;
  const count = likeSummary?.count || 0;

  return (
    <div className="flex items-center gap-1">
      {/* Like button */}
      <button
        onClick={onToggleLike}
        disabled={isLiking}
        className={`p-1.5 rounded-full transition-colors ${
          hasLiked
            ? 'text-red-500 hover:text-red-600'
            : 'text-muted-foreground hover:text-red-500'
        } disabled:opacity-50`}
        aria-label={hasLiked ? 'Unlike' : 'Like'}
      >
        {hasLiked ? (
          // Filled heart
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          // Outline heart
          <svg
            className="w-5 h-5"
            fill="none"
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
        )}
      </button>

      {/* Like count - clickable to show likers */}
      {count > 0 && (
        <button
          onClick={onShowLikers}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {count}
        </button>
      )}
    </div>
  );
};
