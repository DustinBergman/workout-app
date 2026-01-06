import { FC, useState } from 'react';
import { FriendProfile } from '../../services/supabase/friends';

interface FriendListItemProps {
  friend: FriendProfile;
  onRemove: (friendId: string) => void;
  isRemoving: boolean;
}

export const FriendListItem: FC<FriendListItemProps> = ({
  friend,
  onRemove,
  isRemoving,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const displayName = friend.first_name && friend.last_name
    ? `${friend.first_name} ${friend.last_name}`
    : friend.username || 'Anonymous';

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
        {displayName.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{displayName}</p>
        {friend.username && (
          <p className="text-sm text-muted-foreground">@{friend.username}</p>
        )}
      </div>

      {/* Actions */}
      {showConfirm ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfirm(false)}
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onRemove(friend.id)}
            disabled={isRemoving}
            className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors"
          >
            {isRemoving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-destructive-foreground" />
            ) : (
              'Remove'
            )}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          aria-label="Remove friend"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
          </svg>
        </button>
      )}
    </div>
  );
};
