import { FC } from 'react';
import { Card } from '../ui';

interface WeightReminderBannerProps {
  onClick: () => void;
}

export const WeightReminderBanner: FC<WeightReminderBannerProps> = ({ onClick }) => {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="mb-6 bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
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
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Log Your Weight
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
              Track your weight for better workout recommendations
            </p>
          </div>
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
      </Card>
    </button>
  );
};
