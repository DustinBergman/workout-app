import { FC } from 'react';
import { Card } from '../ui';
import type { CardioStats } from '../../hooks/useUserStats';

interface CardioStatsCardProps {
  cardioStats: CardioStats;
}

const formatPace = (pace: number | null, distanceUnit: string): string => {
  if (pace === null) return '--:--';
  const minutes = Math.floor(pace);
  const seconds = Math.round((pace - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')} /${distanceUnit}`;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours}h ${mins}m`;
};

export const CardioStatsCard: FC<CardioStatsCardProps> = ({ cardioStats }) => {
  const {
    totalDistance,
    distanceUnit,
    averagePace,
    paceImprovement,
    totalCalories,
    sessionCount,
    averageDuration,
  } = cardioStats;

  const hasPaceImprovement = paceImprovement > 1;
  const hasPaceDecline = paceImprovement < -1;

  const paceTextColor = hasPaceImprovement
    ? 'text-green-600 dark:text-green-400'
    : hasPaceDecline
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  const needsMoreData = sessionCount < 2;

  return (
    <Card padding="lg">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cardio Progress</p>
            <p className="text-lg font-semibold text-foreground">
              {sessionCount} session{sessionCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {needsMoreData ? (
          <p className="text-sm text-muted-foreground">
            Complete more cardio workouts to track progress
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Total Distance */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Distance</p>
              <p className="text-xl font-bold text-foreground">
                {totalDistance.toFixed(1)} {distanceUnit}
              </p>
            </div>

            {/* Total Calories */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Calories</p>
              <p className="text-xl font-bold text-foreground">
                {totalCalories.toLocaleString()}
              </p>
            </div>

            {/* Average Pace */}
            {averagePace !== null && (
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Pace</p>
                <p className="text-xl font-bold text-foreground">
                  {formatPace(averagePace, distanceUnit)}
                </p>
                {Math.abs(paceImprovement) > 1 && (
                  <p className={`text-xs ${paceTextColor}`}>
                    {hasPaceImprovement ? '+' : ''}{paceImprovement.toFixed(1)}% {hasPaceImprovement ? 'faster' : 'slower'}
                  </p>
                )}
              </div>
            )}

            {/* Average Duration */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Duration</p>
              <p className="text-xl font-bold text-foreground">
                {formatDuration(averageDuration)}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
