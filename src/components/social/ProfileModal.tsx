import { FC } from 'react';
import { Modal, Button } from '../ui';
import { useProfile, FriendshipStatus } from '../../hooks/useProfile';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const experienceLevelLabels: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const workoutGoalLabels: Record<string, string> = {
  strength: 'Build Strength',
  hypertrophy: 'Build Muscle',
  endurance: 'Improve Endurance',
  general_fitness: 'General Fitness',
};

const getFriendshipButtonText = (status: FriendshipStatus): string => {
  switch (status) {
    case 'friends':
      return 'Friends';
    case 'pending_sent':
      return 'Request Pending';
    case 'pending_received':
      return 'Accept Request';
    case 'self':
      return '';
    default:
      return 'Add Friend';
  }
};

export const ProfileModal: FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const {
    profile,
    friendshipStatus,
    isLoading,
    isActionLoading,
    error,
    sendRequest,
    acceptRequest,
    cancelRequest,
  } = useProfile(userId);

  // Username is the primary identifier
  const usernameDisplay = profile?.username ? `@${profile.username}` : null;

  const fullName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : null;

  const displayName = fullName || usernameDisplay || 'Anonymous';

  const handleFriendAction = async () => {
    if (friendshipStatus === 'none') {
      await sendRequest();
    } else if (friendshipStatus === 'pending_received') {
      await acceptRequest();
    } else if (friendshipStatus === 'pending_sent') {
      await cancelRequest();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
              {(profile.first_name?.charAt(0) || profile.username?.charAt(0) || 'A').toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{displayName}</h2>
              {fullName && usernameDisplay && (
                <p className="text-primary/70">{usernameDisplay}</p>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="space-y-3">
            {profile.experience_level && (
              <div className="flex items-center gap-2">
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-sm">
                  {experienceLevelLabels[profile.experience_level] ||
                    profile.experience_level}
                </span>
              </div>
            )}
            {profile.workout_goal && (
              <div className="flex items-center gap-2">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">
                  {workoutGoalLabels[profile.workout_goal] ||
                    profile.workout_goal}
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Friendship Action Button */}
          {friendshipStatus !== 'self' && (
            <div className="pt-2">
              {friendshipStatus === 'friends' ? (
                <div className="flex items-center justify-center gap-2 py-2 text-green-500">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="font-medium">Friends</span>
                </div>
              ) : (
                <Button
                  onClick={handleFriendAction}
                  disabled={isActionLoading}
                  variant={friendshipStatus === 'pending_sent' ? 'outline' : 'primary'}
                  className="w-full"
                >
                  {isActionLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    getFriendshipButtonText(friendshipStatus)
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Profile not found
        </div>
      )}
    </Modal>
  );
};
