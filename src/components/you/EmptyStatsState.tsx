import { FC } from 'react';
import { Card } from '../ui';

export const EmptyStatsState: FC = () => {
  return (
    <Card className="text-center py-12">
      <svg
        className="w-16 h-16 mx-auto text-muted-foreground mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        Complete your first workout
      </h2>
      <p className="text-muted-foreground">
        Start tracking your progress by completing a workout session.
      </p>
    </Card>
  );
};
