import { FC } from 'react';
import { Card } from '../ui';
import { WorkoutSession, WeightUnit, DistanceUnit } from '../../types';
import { calculateSessionStats } from '../../hooks/useSessionStats';
import { formatSessionDuration } from '../../hooks/useWorkoutHistory';

interface HistorySessionCardProps {
  session: WorkoutSession;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  onClick: () => void;
  onDeleteClick: (e: React.MouseEvent) => void;
}

export const HistorySessionCard: FC<HistorySessionCardProps> = ({
  session,
  weightUnit,
  distanceUnit,
  onClick,
  onDeleteClick,
}) => {
  const stats = calculateSessionStats(session);

  return (
    <Card
      className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {session.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {session.exercises.length} exercises | {formatSessionDuration(session)}
          </p>
        </div>
        <div className="text-right mr-2">
          <p className="font-medium text-gray-900 dark:text-gray-100">
            {stats.totalSets} sets
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stats.totalVolume > 0 && `${stats.totalVolume.toLocaleString()} ${weightUnit}`}
            {stats.totalVolume > 0 && stats.totalCardioDistance > 0 && ' | '}
            {stats.totalCardioDistance > 0 &&
              `${stats.totalCardioDistance.toFixed(2)} ${distanceUnit}`}
          </p>
        </div>
        <button
          onClick={onDeleteClick}
          className="p-1.5 -mr-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          aria-label="Delete workout"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </Card>
  );
};
