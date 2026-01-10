import { FC, useState, useCallback, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card, Modal, Button } from '../ui';
import { FeedWorkout, calculateWorkoutSummary } from '../../services/supabase/feed';
import { getExerciseById } from '../../data/exercises';
import { LikeSummary } from '../../services/supabase/likes';
import { WorkoutComment, likeComment, unlikeComment } from '../../services/supabase/comments';
import { LikeButton } from './LikeButton';
import { CommentsSection } from './CommentsSection';
import { LikersModal } from './LikersModal';
import { ProfileModal } from './ProfileModal';
import { useLikes } from '../../hooks/useLikes';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { WORKOUT_MOOD_CONFIG, getWeekConfigForGoal } from '../../types';
import { deleteSession } from '../../services/supabase/sessions';
import { toast } from '../../store/toastStore';

interface FeedWorkoutCardProps {
  workout: FeedWorkout;
  initialLikeSummary?: LikeSummary;
  initialCommentCount?: number;
  initialPreviewComments?: WorkoutComment[];
  defaultCommentsExpanded?: boolean;
  onLikeSummaryChange?: (workoutId: string, summary: LikeSummary) => void;
  onCommentCountChange?: (workoutId: string, count: number) => void;
  onPreviewCommentsChange?: (workoutId: string, comments: WorkoutComment[]) => void;
  onDelete?: (workoutId: string) => void;
}

export const FeedWorkoutCard: FC<FeedWorkoutCardProps> = ({
  workout,
  initialLikeSummary,
  initialCommentCount = 0,
  initialPreviewComments = [],
  defaultCommentsExpanded = false,
  onLikeSummaryChange,
  onCommentCountChange,
  onPreviewCommentsChange,
  onDelete,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(defaultCommentsExpanded);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [previewComments, setPreviewComments] = useState<WorkoutComment[]>(initialPreviewComments);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const customExercises = useAppStore((state) => state.customExercises);
  const deleteSessionFromStore = useAppStore((state) => state.deleteSession);
  const { user } = useAuth();

  const isOwnWorkout = user?.id === workout.user_id;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const {
    likeSummary,
    isLiking,
    toggleLike,
  } = useLikes(workout.id, initialLikeSummary);

  const summary = calculateWorkoutSummary(workout);

  // Username is the primary identifier
  const displayName = workout.user.username
    ? `@${workout.user.username}`
    : 'Anonymous';

  // Full name shown as secondary info if available
  const fullName = workout.user.first_name && workout.user.last_name
    ? `${workout.user.first_name} ${workout.user.last_name}`
    : null;

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleUserClick = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setShowProfileModal(true);
  }, []);

  const handleToggleLike = useCallback(async () => {
    await toggleLike();
    if (likeSummary && onLikeSummaryChange) {
      onLikeSummaryChange(workout.id, {
        ...likeSummary,
        hasLiked: !likeSummary.hasLiked,
        count: likeSummary.hasLiked ? likeSummary.count - 1 : likeSummary.count + 1,
      });
    }
  }, [toggleLike, likeSummary, onLikeSummaryChange, workout.id]);

  const handleCommentCountChange = useCallback((count: number) => {
    setCommentCount(count);
    onCommentCountChange?.(workout.id, count);
  }, [onCommentCountChange, workout.id]);

  const handlePreviewCommentLike = useCallback(async (commentId: string) => {
    const comment = previewComments.find((c) => c.id === commentId);
    if (!comment) return;

    // Optimistic update
    const updatedComments = previewComments.map((c) =>
      c.id === commentId
        ? {
            ...c,
            has_liked: !c.has_liked,
            like_count: c.has_liked ? c.like_count - 1 : c.like_count + 1,
          }
        : c
    );
    setPreviewComments(updatedComments);
    onPreviewCommentsChange?.(workout.id, updatedComments);

    try {
      if (comment.has_liked) {
        await unlikeComment(commentId);
      } else {
        await likeComment(commentId);
      }
    } catch {
      // Revert on error
      setPreviewComments(previewComments);
      onPreviewCommentsChange?.(workout.id, previewComments);
    }
  }, [previewComments, workout.id, onPreviewCommentsChange]);

  const handleConfirmDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const { error } = await deleteSession(workout.id);
      if (error) {
        toast.error('Failed to delete workout');
        console.error('Delete error:', error);
      } else {
        deleteSessionFromStore(workout.id);
        onDelete?.(workout.id);
        toast.success('Workout deleted');
      }
    } catch (err) {
      toast.error('Failed to delete workout');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [workout.id, deleteSessionFromStore, onDelete]);

  return (
    <Card className="overflow-hidden" padding="none">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2.5">
          {/* Avatar - clickable */}
          <button
            onClick={() => handleUserClick(workout.user_id)}
            className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold hover:ring-2 hover:ring-primary/50 transition-all flex-shrink-0"
          >
            {(workout.user.first_name?.charAt(0) || workout.user.username?.charAt(0) || 'A').toUpperCase()}
          </button>
          <div className="flex-1 min-w-0">
            {/* Name - clickable */}
            <button
              onClick={() => handleUserClick(workout.user_id)}
              className="font-semibold text-sm hover:text-primary transition-colors text-left truncate block"
            >
              {fullName || displayName}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {fullName && (
                <span className="text-primary/70">{displayName}</span>
              )}
              <span>{formatDistanceToNow(new Date(workout.completed_at || workout.started_at), { addSuffix: true })}</span>
            </div>
          </div>
          {/* Three-dot menu (only for own workouts) */}
          {isOwnWorkout && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
                aria-label="More options"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete workout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 text-left hover:bg-muted/30 transition-colors"
      >
        {/* Title */}
        {workout.custom_title ? (
          <div className="mb-1.5">
            <h3 className="font-semibold text-base">{workout.custom_title}</h3>
            <p className="text-xs text-muted-foreground">{workout.name}</p>
          </div>
        ) : (
          <h3 className="font-semibold text-base mb-1.5">{workout.name}</h3>
        )}

        {/* Chips Row - Smart selection of 1-3 most interesting chips */}
        {(() => {
          const chips: React.ReactNode[] = [];

          // Calculate cardio distance
          const totalCardioDistance = workout.session_exercises.reduce((sum, ex) => {
            if (ex.type === 'cardio') {
              return sum + ex.completed_sets.reduce((setSum, set) => {
                return setSum + (set.distance || 0);
              }, 0);
            }
            return sum;
          }, 0);

          // Determine distance unit from first cardio set
          const firstCardioSet = workout.session_exercises
            .filter(ex => ex.type === 'cardio')
            .flatMap(ex => ex.completed_sets)
            .find(set => set.distance_unit);
          const distanceUnit = firstCardioSet?.distance_unit || 'mi';

          // 1. Mood chip (always show if set)
          if (workout.mood) {
            const moodConfig = WORKOUT_MOOD_CONFIG[workout.mood];
            chips.push(
              <span key="mood" className="px-2 py-0.5 rounded-full bg-muted text-xs">
                {moodConfig.emoji} {moodConfig.label}
              </span>
            );
          }

          // 2. Streak chip (if >= 2 days)
          if (workout.streak_count && workout.streak_count >= 2) {
            chips.push(
              <span key="streak" className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
                🔥 {workout.streak_count} day streak
              </span>
            );
          }

          // 3. PB chip (max 1, prioritize weight PBs)
          if (workout.personal_bests && workout.personal_bests.length > 0) {
            const weightPB = workout.personal_bests.find(pb => pb.type === 'weight');
            const bestPB = weightPB || workout.personal_bests[0];
            chips.push(
              <span key="pb" className="px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 text-xs">
                🏆 PB: {bestPB.exerciseName}
              </span>
            );
          }

          // 4. Intensity chip (based on duration)
          if (summary.durationMinutes > 0) {
            if (summary.durationMinutes < 30) {
              chips.push(
                <span key="intensity" className="px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 text-xs">
                  ⚡ Quick
                </span>
              );
            } else if (summary.durationMinutes > 75) {
              chips.push(
                <span key="intensity" className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs">
                  💪 Long
                </span>
              );
            }
          }

          // 5. Cardio distance chip (if significant cardio)
          if (totalCardioDistance >= 1) {
            chips.push(
              <span key="cardio" className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 text-xs">
                🏃 {totalCardioDistance.toFixed(1)} {distanceUnit}
              </span>
            );
          }

          // 6. Week chip (if on training plan) - lower priority
          if (workout.progressive_overload_week != null && workout.workout_goal && chips.length < 3) {
            const weekConfig = getWeekConfigForGoal(workout.workout_goal);
            const weekName = weekConfig[workout.progressive_overload_week]?.name || '';
            chips.push(
              <span key="week" className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                Week {workout.progressive_overload_week + 1}{weekName ? ` - ${weekName}` : ''}
              </span>
            );
          }

          // Limit to 3 chips max
          const displayChips = chips.slice(0, 3);

          return displayChips.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {displayChips}
            </div>
          ) : null;
        })()}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{summary.exerciseCount} exercises</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{summary.totalSets} sets</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDuration(summary.durationMinutes)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center mt-1.5">
          <svg
            className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border px-3 py-2.5 space-y-3">
          {workout.session_exercises.map((exercise) => {
            const exerciseData = getExerciseById(exercise.exercise_id, customExercises);
            const exerciseName = exerciseData?.name || 'Unknown Exercise';

            return (
              <div key={exercise.id} className="space-y-1">
                <h4 className="font-medium text-sm">{exerciseName}</h4>
                <div className="space-y-0.5">
                  {exercise.completed_sets.map((set, idx) => (
                    <div
                      key={set.id}
                      className="text-xs text-muted-foreground flex items-center gap-1.5"
                    >
                      <span className="w-5 text-center text-xs bg-muted rounded">
                        {idx + 1}
                      </span>
                      {set.type === 'strength' ? (
                        <span>
                          {set.weight} {set.weight_unit} × {set.reps} reps
                        </span>
                      ) : (
                        <span>
                          {set.distance} {set.distance_unit} in {Math.floor((set.duration_seconds || 0) / 60)}m
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Engagement Section (Likes & Comments) */}
      <div className="px-3 py-2 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Like Button */}
          <LikeButton
            likeSummary={likeSummary}
            isLiking={isLiking}
            onToggleLike={handleToggleLike}
            onShowLikers={() => setShowLikersModal(true)}
          />

          {/* Comment Button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            {commentCount > 0 && (
              <span className="text-sm">{commentCount}</span>
            )}
          </button>
        </div>

        {/* View comments link */}
        {commentCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            View {commentCount === 1 ? 'comment' : `all ${commentCount} comments`}
          </button>
        )}
      </div>

      {/* Comments Section (Always shows preview + input, expands for full list) */}
      <CommentsSection
        workoutId={workout.id}
        initialCount={commentCount}
        isExpanded={showComments}
        onUserClick={handleUserClick}
        onCommentCountChange={handleCommentCountChange}
        previewComments={previewComments}
        onPreviewCommentLike={handlePreviewCommentLike}
      />

      {/* Likers Modal */}
      <LikersModal
        isOpen={showLikersModal}
        onClose={() => setShowLikersModal(false)}
        workoutId={workout.id}
        onUserClick={handleUserClick}
      />

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedUserId(null);
          }}
          userId={selectedUserId}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete Workout"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete this workout? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};
