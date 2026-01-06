import { FC, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../ui';
import { FeedWorkout, calculateWorkoutSummary } from '../../services/supabase/feed';
import { getExerciseById } from '../../data/exercises';
import { LikeSummary } from '../../services/supabase/likes';
import { LikeButton } from './LikeButton';
import { CommentsSection } from './CommentsSection';
import { LikersModal } from './LikersModal';
import { ProfileModal } from './ProfileModal';
import { useLikes } from '../../hooks/useLikes';

interface FeedWorkoutCardProps {
  workout: FeedWorkout;
  initialLikeSummary?: LikeSummary;
  initialCommentCount?: number;
  onLikeSummaryChange?: (workoutId: string, summary: LikeSummary) => void;
  onCommentCountChange?: (workoutId: string, count: number) => void;
}

export const FeedWorkoutCard: FC<FeedWorkoutCardProps> = ({
  workout,
  initialLikeSummary,
  initialCommentCount = 0,
  onLikeSummaryChange,
  onCommentCountChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  const {
    likeSummary,
    isLiking,
    toggleLike,
  } = useLikes(workout.id, initialLikeSummary);

  const summary = calculateWorkoutSummary(workout);

  const displayName = workout.user.first_name && workout.user.last_name
    ? `${workout.user.first_name} ${workout.user.last_name}`
    : workout.user.username || 'Anonymous';

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

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Avatar - clickable */}
          <button
            onClick={() => handleUserClick(workout.user_id)}
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold hover:ring-2 hover:ring-primary/50 transition-all"
          >
            {displayName.charAt(0).toUpperCase()}
          </button>
          <div className="flex-1">
            {/* Name - clickable */}
            <button
              onClick={() => handleUserClick(workout.user_id)}
              className="font-semibold hover:text-primary transition-colors text-left"
            >
              {displayName}
            </button>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(workout.completed_at || workout.started_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <h3 className="font-semibold text-lg mb-2">{workout.name}</h3>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{summary.exerciseCount} exercises</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{summary.totalSets} sets</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{formatDuration(summary.durationMinutes)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center mt-2">
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
        <div className="border-t border-border p-4 space-y-4">
          {workout.session_exercises.map((exercise) => {
            const exerciseData = getExerciseById(exercise.exercise_id);
            const exerciseName = exerciseData?.name || 'Unknown Exercise';

            return (
              <div key={exercise.id} className="space-y-2">
                <h4 className="font-medium">{exerciseName}</h4>
                <div className="space-y-1">
                  {exercise.completed_sets.map((set, idx) => (
                    <div
                      key={set.id}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="w-6 text-center text-xs bg-muted rounded">
                        {idx + 1}
                      </span>
                      {set.type === 'strength' ? (
                        <span>
                          {set.weight} {set.weight_unit} x {set.reps} reps
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
      <div className="px-4 py-3 border-t border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
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
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View {commentCount === 1 ? 'comment' : `all ${commentCount} comments`}
          </button>
        )}
      </div>

      {/* Comments Section (Expandable Inline) */}
      <CommentsSection
        workoutId={workout.id}
        initialCount={commentCount}
        isExpanded={showComments}
        onUserClick={handleUserClick}
        onCommentCountChange={handleCommentCountChange}
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
    </Card>
  );
};
