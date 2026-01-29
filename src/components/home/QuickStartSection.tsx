import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../ui';
import { WorkoutTemplate } from '../../types';

interface QuickStartSectionProps {
  nextWorkout: WorkoutTemplate | null;
  onStartWorkout: (template: WorkoutTemplate) => void;
  onStartQuickWorkout: () => void;
}

export const QuickStartSection: FC<QuickStartSectionProps> = ({
  nextWorkout,
  onStartWorkout,
  onStartQuickWorkout,
}) => {
  return (
    <section className="mb-6">
      <Card>
        {/* Next Workout Suggestion */}
        {nextWorkout && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs text-fg-3 font-medium uppercase tracking-wide mb-1">
                Up Next
              </p>
              <p className="text-lg font-semibold text-fg-1">
                {nextWorkout.name}
              </p>
              <p className="text-sm text-fg-3">
                {nextWorkout.exercises.length} exercises
              </p>
            </div>
            <Button onClick={() => onStartWorkout(nextWorkout)}>
              Start
            </Button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onStartQuickWorkout}
            size="sm"
            variant="ghost"
            className="flex items-center justify-center gap-1.5 bg-bg-subtle hover:bg-bg-subtle/80"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Empty Workout
          </Button>
          <Link to="/plans" className="block">
            <Button
              size="sm"
              variant="ghost"
              className="w-full flex items-center justify-center gap-1.5 bg-bg-subtle hover:bg-bg-subtle/80"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              From Plan
            </Button>
          </Link>
        </div>
      </Card>
    </section>
  );
};
