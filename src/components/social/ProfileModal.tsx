import { FC, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Modal, Button, Avatar } from '../ui';
import { useProfile, FriendshipStatus } from '../../hooks/useProfile';
import { MuscleGroup } from '../../types';
import { ProfileHeatmap } from './ProfileHeatmap';

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

const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f97316',
  biceps: '#8b5cf6',
  triceps: '#a855f7',
  forearms: '#ec4899',
  core: '#eab308',
  quadriceps: '#22c55e',
  hamstrings: '#14b8a6',
  glutes: '#06b6d4',
  calves: '#84cc16',
  traps: '#6366f1',
  lats: '#0ea5e9',
};

const formatMuscleGroup = (mg: MuscleGroup): string => {
  return mg.charAt(0).toUpperCase() + mg.slice(1);
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
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
  const [showFullImage, setShowFullImage] = useState(false);

  const {
    profile,
    stats,
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
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : profile ? (
        <div className="space-y-4">
          {/* Profile Header */}
          <div className="flex items-center gap-3">
            <Avatar
              src={profile.avatar_url}
              name={profile.first_name || profile.username}
              size="lg"
              className="flex-shrink-0"
              onClick={profile.avatar_url ? () => setShowFullImage(true) : undefined}
            />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{displayName}</h2>
              {fullName && usernameDisplay && (
                <p className="text-sm text-primary/70">{usernameDisplay}</p>
              )}
            </div>
          </div>

          {/* Full-screen image overlay */}
          {showFullImage && profile.avatar_url && (
            <div
              className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
              onClick={() => setShowFullImage(false)}
            >
              <button
                className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors"
                onClick={() => setShowFullImage(false)}
              >
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Profile Info Tags */}
          <div className="flex flex-wrap gap-2">
            {profile.experience_level && (
              <span className="px-2 py-1 text-xs bg-muted rounded-full">
                {experienceLevelLabels[profile.experience_level] || profile.experience_level}
              </span>
            )}
            {profile.workout_goal && (
              <span className="px-2 py-1 text-xs bg-muted rounded-full">
                {workoutGoalLabels[profile.workout_goal] || profile.workout_goal}
              </span>
            )}
            {stats?.memberSince && (
              <span className="px-2 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                Joined {formatDistanceToNow(new Date(stats.memberSince), { addSuffix: true })}
              </span>
            )}
          </div>

          {/* Stats Section */}
          {stats && stats.totalWorkouts > 0 && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold">{stats.totalWorkouts}</p>
                  <p className="text-xs text-muted-foreground">Workouts</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold">{stats.workoutsPerWeek.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Per Week</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold">{formatDuration(stats.averageDurationMinutes)}</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
              </div>

              {/* Total Sets */}
              <div className="bg-muted/50 rounded-lg p-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Sets Completed</span>
                <span className="font-semibold">{stats.totalSets.toLocaleString()}</span>
              </div>

              {/* Muscle Group Breakdown */}
              {stats.muscleGroupBreakdown.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Muscle Focus</h3>
                  <div className="space-y-1.5">
                    {stats.muscleGroupBreakdown.slice(0, 5).map((item) => (
                      <div key={item.muscleGroup} className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: MUSCLE_GROUP_COLORS[item.muscleGroup] }}
                        />
                        <span className="text-xs flex-1">{formatMuscleGroup(item.muscleGroup)}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: MUSCLE_GROUP_COLORS[item.muscleGroup],
                            }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {item.percentage.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workout Activity Heatmap */}
              {stats.heatmapSessions.length > 0 && (
                <ProfileHeatmap sessions={stats.heatmapSessions} memberSince={stats.memberSince} />
              )}
            </>
          )}

          {/* No Stats Message for non-friends */}
          {stats && stats.totalWorkouts === 0 && friendshipStatus !== 'friends' && friendshipStatus !== 'self' && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <p>Add as a friend to see their workout stats</p>
            </div>
          )}

          {/* No workouts yet */}
          {stats && stats.totalWorkouts === 0 && (friendshipStatus === 'friends' || friendshipStatus === 'self') && (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <p>No workouts completed yet</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg text-xs">
              {error}
            </div>
          )}

          {/* Friendship Action Button */}
          {friendshipStatus !== 'self' && (
            <div className="pt-1">
              {friendshipStatus === 'friends' ? (
                <div className="flex items-center justify-center gap-1.5 py-1.5 text-green-500 text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-medium">Friends</span>
                </div>
              ) : (
                <Button
                  onClick={handleFriendAction}
                  disabled={isActionLoading}
                  variant={friendshipStatus === 'pending_sent' ? 'outline' : 'primary'}
                  className="w-full"
                  size="sm"
                >
                  {isActionLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    getFriendshipButtonText(friendshipStatus)
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 text-sm text-muted-foreground">
          Profile not found
        </div>
      )}
    </Modal>
  );
};
