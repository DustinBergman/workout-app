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
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Quick Start
      </h2>

      {/* Next Workout Suggestion */}
      {nextWorkout && (
        <Card className="mb-3 bg-primary/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                Up Next
              </p>
              <p className="text-lg font-semibold text-foreground">
                {nextWorkout.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {nextWorkout.exercises.length} exercises
              </p>
            </div>
            <Button onClick={() => onStartWorkout(nextWorkout)}>
              Start
            </Button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onStartQuickWorkout}
          className="h-20 flex flex-col items-center justify-center bg-card/60 backdrop-blur-lg border border-border/50 hover:bg-card/80"
          variant="ghost"
        >
          <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Empty Workout
        </Button>
        <Link to="/plans" className="block">
          <Button
            className="w-full h-20 flex flex-col items-center justify-center bg-card/60 backdrop-blur-lg border border-border/50 hover:bg-card/80"
            variant="ghost"
          >
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            From Plan
          </Button>
        </Link>
      </div>
    </section>
  );
};
