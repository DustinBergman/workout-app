import { FC } from 'react';
import { Card } from '../ui';
import { formatDuration } from '../../hooks/useYouPage';

interface StatsGridProps {
  averageSessionDuration: number;
  averageSessionsPerWeek: number;
  averageWeightChangePerWeek: number;
}

export const StatsGrid: FC<StatsGridProps> = ({
  averageSessionDuration,
  averageSessionsPerWeek,
  averageWeightChangePerWeek,
}) => {
  const weightChangeColorClass =
    averageWeightChangePerWeek > 0
      ? 'text-red-600 dark:text-red-400'
      : averageWeightChangePerWeek < 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-foreground';

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Avg Duration */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-1">
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs text-muted-foreground">Avg Duration</span>
        </div>
        <p className="text-xl font-bold text-foreground">
          {formatDuration(averageSessionDuration)}
        </p>
      </Card>

      {/* Workouts Per Week */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-1">
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs text-muted-foreground">Workouts/Week</span>
        </div>
        <p className="text-xl font-bold text-foreground">
          {averageSessionsPerWeek.toFixed(1)}
        </p>
      </Card>

      {/* Weight Change Per Week */}
      <Card padding="md">
        <div className="flex items-center gap-2 mb-1">
          <svg
            className="w-4 h-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
          <span className="text-xs text-muted-foreground">Weight Change/Wk</span>
        </div>
        <p className={`text-xl font-bold ${weightChangeColorClass}`}>
          {averageWeightChangePerWeek > 0 ? '+' : ''}
          {averageWeightChangePerWeek.toFixed(1)}%
        </p>
      </Card>
    </div>
  );
};
