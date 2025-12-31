import { FC } from 'react';
import { Button } from '../ui';
import { formatDuration } from '../../utils/workoutUtils';
import { WeightUnit, DistanceUnit } from '../../types';

export interface WorkoutHeaderProps {
  sessionName: string;
  elapsedSeconds: number;
  totalSets: number;
  totalVolume: number;
  totalCardioDistance: number;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  onFinishClick: () => void;
}

export const WorkoutHeader: FC<WorkoutHeaderProps> = ({
  sessionName,
  elapsedSeconds,
  totalSets,
  totalVolume,
  totalCardioDistance,
  weightUnit,
  distanceUnit,
  onFinishClick,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {sessionName}
          </h1>
          <span className="text-lg font-mono text-primary">
            {formatDuration(elapsedSeconds)}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalSets} sets
          {totalVolume > 0 && ` | ${totalVolume.toLocaleString()} ${weightUnit}`}
          {totalCardioDistance > 0 && ` | ${totalCardioDistance.toFixed(2)} ${distanceUnit}`}
        </p>
      </div>
      <Button variant="danger" size="sm" onClick={onFinishClick}>
        Finish
      </Button>
    </div>
  );
};
