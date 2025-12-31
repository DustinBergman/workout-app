import { FC } from 'react';
import { cn } from '@/lib/utils';
import { ProgressiveOverloadWeek, PROGRESSIVE_OVERLOAD_WEEKS } from '../../types';

interface WeekBadgeProps {
  week: ProgressiveOverloadWeek;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}

const weekColors: Record<ProgressiveOverloadWeek, { bg: string; text: string; border: string }> = {
  0: {
    bg: 'bg-slate-100 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-500/30',
  },
  1: {
    bg: 'bg-green-100 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-500/30',
  },
  2: {
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-500/30',
  },
  3: {
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-500/30',
  },
  4: {
    bg: 'bg-purple-100 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-500/30',
  },
};

export const WeekBadge: FC<WeekBadgeProps> = ({
  week,
  onClick,
  showDetails = false,
  className,
}) => {
  const weekInfo = PROGRESSIVE_OVERLOAD_WEEKS[week];
  const colors = weekColors[week];

  if (showDetails) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full rounded-xl border p-4 text-left transition-all',
          'backdrop-blur-lg',
          colors.bg,
          colors.border,
          onClick && 'hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
          className
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className={cn('text-sm font-semibold', colors.text)}>
            Week {week + 1}
          </span>
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', colors.bg, colors.text)}>
            {weekInfo.weightAdjustment}
          </span>
        </div>
        <h3 className={cn('text-lg font-bold mb-1', colors.text)}>
          {weekInfo.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {weekInfo.description}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Target: {weekInfo.repRange}</span>
        </div>
        {onClick && (
          <p className="text-xs text-muted-foreground mt-3 italic">
            Tap to change week
          </p>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5',
        'backdrop-blur-lg transition-all',
        colors.bg,
        colors.border,
        onClick && 'hover:scale-105 active:scale-95 cursor-pointer',
        className
      )}
    >
      <span className={cn('text-xs font-semibold', colors.text)}>
        Week {week + 1}
      </span>
      <span className={cn('text-xs', colors.text)}>
        {weekInfo.name}
      </span>
    </button>
  );
};
