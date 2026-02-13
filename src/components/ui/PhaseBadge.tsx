import { FC } from 'react';
import { cn } from '@/lib/utils';
import { TrainingCycleConfig, UserCycleState } from '../../types';
import { StrengthPhaseType, CardioPhaseType, isStrengthPhase, StrengthPhaseConfig } from '../../types/cycles';

interface PhaseBadgeProps {
  cycleConfig: TrainingCycleConfig;
  cycleState: UserCycleState;
  onClick?: () => void;
  showDetails?: boolean;
  className?: string;
}

type PhaseType = StrengthPhaseType | CardioPhaseType;

const phaseColors: Record<string, { bg: string; text: string; border: string }> = {
  baseline: {
    bg: 'bg-slate-100 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-500/30',
  },
  accumulation: {
    bg: 'bg-green-100 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-500/30',
  },
  intensification: {
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-500/30',
  },
  realization: {
    bg: 'bg-blue-100 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-500/30',
  },
  deload: {
    bg: 'bg-purple-100 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-500/30',
  },
  // Cardio phase types
  easy: {
    bg: 'bg-slate-100 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-500/30',
  },
  moderate: {
    bg: 'bg-green-100 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-500/30',
  },
  hard: {
    bg: 'bg-orange-100 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-500/30',
  },
};

const getPhaseColors = (phaseType: PhaseType) => {
  return phaseColors[phaseType] || phaseColors.baseline;
};

export const PhaseBadge: FC<PhaseBadgeProps> = ({
  cycleConfig,
  cycleState,
  onClick,
  showDetails = false,
  className,
}) => {
  const currentPhase = cycleConfig.phases[cycleState.currentPhaseIndex];
  if (!currentPhase) return null;

  const colors = getPhaseColors(currentPhase.type as PhaseType);
  const phaseNumber = cycleState.currentPhaseIndex + 1;
  const weightAdjustment = isStrengthPhase(currentPhase) ? (currentPhase as StrengthPhaseConfig).weightAdjustment : undefined;

  if (showDetails) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'w-full rounded-xl border px-3 py-2 text-left transition-all',
          'backdrop-blur-lg',
          colors.bg,
          colors.border,
          onClick && 'hover:scale-[1.01] active:scale-[0.99] cursor-pointer',
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn('text-sm font-bold whitespace-nowrap', colors.text)}>
              Phase {phaseNumber}
            </span>
            <span className={cn('text-sm font-medium truncate', colors.text)}>
              {currentPhase.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {weightAdjustment && (
              <span className={cn('text-xs px-2 py-0.5 rounded-full', colors.bg, colors.text, 'border', colors.border)}>
                {weightAdjustment}
              </span>
            )}
            <svg className={cn('w-4 h-4', colors.text)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
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
        Phase {phaseNumber}
      </span>
      <span className={cn('text-xs', colors.text)}>
        {currentPhase.name}
      </span>
    </button>
  );
};
