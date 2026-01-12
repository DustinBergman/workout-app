import { FC } from 'react';
import { Card } from '../ui';

interface StrengthProgressCardProps {
  averageStrengthIncrease: number;
  totalSessions: number;
}

export const StrengthProgressCard: FC<StrengthProgressCardProps> = ({
  averageStrengthIncrease,
  totalSessions,
}) => {
  const isPositive = averageStrengthIncrease > 0;
  const isNegative = averageStrengthIncrease < 0;
  const needsMoreData = totalSessions < 2;

  const bgColorClass = isPositive
    ? 'bg-green-100 dark:bg-green-900/30'
    : isNegative
    ? 'bg-red-100 dark:bg-red-900/30'
    : 'bg-muted';

  const textColorClass = isPositive
    ? 'text-green-600 dark:text-green-400'
    : isNegative
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  const valueTextColorClass = isPositive
    ? 'text-green-600 dark:text-green-400'
    : isNegative
    ? 'text-red-600 dark:text-red-400'
    : 'text-foreground';

  const displayValue = needsMoreData
    ? 'Need more data'
    : isPositive
    ? `+${averageStrengthIncrease.toFixed(1)}%`
    : isNegative
    ? `${averageStrengthIncrease.toFixed(1)}%`
    : '0%';

  const description = needsMoreData
    ? 'Complete more workouts to track progress'
    : 'Avg weight change per exercise (first vs latest)';

  return (
    <Card padding="lg">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${bgColorClass}`}>
          <svg
            className={`w-6 h-6 ${textColorClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Strength Progress</p>
          <p className={`text-2xl font-bold ${valueTextColorClass}`}>{displayValue}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </div>
    </Card>
  );
};
