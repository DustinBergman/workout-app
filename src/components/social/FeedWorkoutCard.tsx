import { FC, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Card } from '../ui';
import { FeedWorkout, calculateWorkoutSummary } from '../../services/supabase/feed';
import { getExerciseById } from '../../data/exercises';

interface FeedWorkoutCardProps {
  workout: FeedWorkout;
}

export const FeedWorkoutCard: FC<FeedWorkoutCardProps> = ({ workout }) => {
  const [isExpanded, setIsExpanded] = useState(false);
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

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{displayName}</p>
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
    </Card>
  );
};
