import { FC, useEffect, useState } from 'react';
import { Modal } from '../ui';
import { getWorkoutLikes, WorkoutLikeWithUser } from '../../services/supabase/likes';

interface LikersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId: string;
  onUserClick: (userId: string) => void;
}

export const LikersModal: FC<LikersModalProps> = ({
  isOpen,
  onClose,
  workoutId,
  onUserClick,
}) => {
  const [likes, setLikes] = useState<WorkoutLikeWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadLikes = async () => {
        setIsLoading(true);
        setError(null);
        const { likes: fetchedLikes, error: fetchError } = await getWorkoutLikes(workoutId);
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setLikes(fetchedLikes);
        }
        setIsLoading(false);
      };
      loadLikes();
    }
  }, [isOpen, workoutId]);

  const handleUserClick = (userId: string) => {
    onClose();
    onUserClick(userId);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Likes">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">{error}</div>
      ) : likes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No likes yet
        </div>
      ) : (
        <div className="space-y-3">
          {likes.map((like) => {
            const usernameDisplay = like.user.username
              ? `@${like.user.username}`
              : null;

            const fullName =
              like.user.first_name && like.user.last_name
                ? `${like.user.first_name} ${like.user.last_name}`
                : null;

            const displayName = fullName || usernameDisplay || 'Anonymous';

            return (
              <button
                key={like.id}
                onClick={() => handleUserClick(like.user_id)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {(like.user.first_name?.charAt(0) || like.user.username?.charAt(0) || 'A').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{displayName}</p>
                  {fullName && usernameDisplay && (
                    <p className="text-sm text-primary/70 truncate">
                      {usernameDisplay}
                    </p>
                  )}
                </div>
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
};
