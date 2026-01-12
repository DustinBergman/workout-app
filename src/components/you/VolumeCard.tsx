import { FC } from 'react';
import { Card } from '../ui';
import { WeightUnit } from '../../types';

interface VolumeCardProps {
  averageVolumePerSession: number;
  weightUnit: WeightUnit;
}

export const VolumeCard: FC<VolumeCardProps> = ({ averageVolumePerSession, weightUnit }) => {
  return (
    <Card padding="lg">
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
              d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
            />
          </svg>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avg Volume Per Session</p>
          <p className="text-2xl font-bold text-foreground">
            {averageVolumePerSession.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}{' '}
            {weightUnit}
          </p>
        </div>
      </div>
    </Card>
  );
};
