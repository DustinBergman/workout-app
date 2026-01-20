import { FC } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FriendRequest } from '../../services/supabase/friends';
import { Avatar } from '../ui';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (requestId: string) => void;
  onDecline: (requestId: string) => void;
  onProfileClick: (userId: string) => void;
  isAccepting: boolean;
  isDeclining: boolean;
}

export const FriendRequestCard: FC<FriendRequestCardProps> = ({
  request,
  onAccept,
  onDecline,
  onProfileClick,
  isAccepting,
  isDeclining,
}) => {
  const user = request.from_user;
  if (!user) {
    return null;
  }
  const displayName = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.username || 'Anonymous';

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
      {/* Avatar & Info - clickable area */}
      <button
        onClick={() => onProfileClick(user.id)}
        className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
      >
        <Avatar
          src={user.avatar_url}
          name={displayName}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{displayName}</p>
          {user.username && (
            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>
        </div>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onDecline(request.id)}
          disabled={isDeclining || isAccepting}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 transition-colors"
          aria-label="Decline"
        >
          {isDeclining ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
        <button
          onClick={() => onAccept(request.id)}
          disabled={isAccepting || isDeclining}
          className="p-2 text-primary hover:bg-primary/10 rounded-lg disabled:opacity-50 transition-colors"
          aria-label="Accept"
        >
          {isAccepting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
