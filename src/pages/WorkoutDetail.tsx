import { FC, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FeedWorkout, getWorkoutById } from '../services/supabase/feed';
import { getLikeSummary, LikeSummary } from '../services/supabase/likes';
import { getCommentCount } from '../services/supabase/comments';
import { FeedWorkoutCard } from '../components/social/FeedWorkoutCard';
import { Card, Button } from '../components/ui';

export const WorkoutDetail: FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<FeedWorkout | null>(null);
  const [likeSummary, setLikeSummary] = useState<LikeSummary | undefined>();
  const [commentCount, setCommentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkout = async () => {
      if (!workoutId) {
        setError('Workout not found');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const [workoutResult, likeSummaryResult, commentCountResult] = await Promise.all([
        getWorkoutById(workoutId),
        getLikeSummary(workoutId),
        getCommentCount(workoutId),
      ]);

      if (workoutResult.error) {
        setError(workoutResult.error.message);
      } else if (!workoutResult.workout) {
        setError('Workout not found');
      } else {
        setWorkout(workoutResult.workout);
      }

      if (!likeSummaryResult.error && likeSummaryResult.summary) {
        setLikeSummary(likeSummaryResult.summary);
      }

      if (!commentCountResult.error) {
        setCommentCount(commentCountResult.count);
      }

      setIsLoading(false);
    };

    fetchWorkout();
  }, [workoutId]);

  if (isLoading) {
    return (
      <div className="px-3 py-4 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="px-3 py-2 max-w-2xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-3 px-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Button>
        <Card className="p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-sm mb-1">Workout not found</h3>
          <p className="text-xs text-muted-foreground">
            {error || 'This workout may have been deleted or you may not have access to it.'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 max-w-2xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-3 px-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Button>

      <FeedWorkoutCard
        workout={workout}
        initialLikeSummary={likeSummary}
        initialCommentCount={commentCount}
        defaultCommentsExpanded
      />
    </div>
  );
};
