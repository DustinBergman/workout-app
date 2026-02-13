import { FC } from 'react';
import { Card, Button } from '../ui';
import type { AdvancementInfo } from '../../hooks/useWeekAdvancement';

interface WeekAdvancementBannerProps {
  advancementInfo: AdvancementInfo;
  onAccept: () => void;
  onDismiss: () => void;
}

export const WeekAdvancementBanner: FC<WeekAdvancementBannerProps> = ({
  advancementInfo,
  onAccept,
  onDismiss,
}) => {
  const title = advancementInfo.isCycleReset
    ? 'Cycle complete! Ready to start fresh?'
    : 'Ready to advance?';

  const subtitle = `${advancementInfo.fromLabel} \u2192 ${advancementInfo.toLabel} \u00B7 ${advancementInfo.sessionsCompleted} session${advancementInfo.sessionsCompleted === 1 ? '' : 's'} completed`;

  return (
    <Card className="mb-6 bg-blue-500/10 border-blue-500/30">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
          <svg
            className="w-5 h-5 text-blue-700 dark:text-blue-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            {title}
          </p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
            {subtitle}
          </p>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onAccept} className="text-xs">
              Advance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-xs text-blue-600/80 dark:text-blue-400/80"
            >
              Not yet
            </Button>
          </div>
        </div>

        {/* Dismiss X button */}
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-blue-600/80 dark:text-blue-400/80"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Card>
  );
};
