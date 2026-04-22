import { FC } from 'react';
import { Button } from '../ui';
import { WeightUnit } from '../../types';

interface EmptySetAccordionProps {
  setIndex: number;
  targetReps: number;
  lastSetWeight: number;
  weightUnit: WeightUnit;
  isExpanded: boolean;
  weightInput: string;
  repsInput: string;
  canRemoveSet: boolean;
  onToggle: () => void;
  onWeightChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onAdjustWeight: (delta: number) => void;
  onAdjustReps: (delta: number) => void;
  onCompleteSet: () => void;
  onRemoveSet: () => void;
}

const WEIGHT_STEP = 2.5;
const REPS_STEP = 1;

const StepperButton: FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="w-10 h-10 flex items-center justify-center rounded-lg bg-bg-subtle text-fg-2 text-lg font-medium active:bg-interactive/20 transition-colors"
  >
    {label}
  </button>
);

export const EmptySetAccordion: FC<EmptySetAccordionProps> = ({
  setIndex,
  targetReps,
  lastSetWeight,
  weightUnit,
  isExpanded,
  weightInput,
  repsInput,
  canRemoveSet,
  onToggle,
  onWeightChange,
  onRepsChange,
  onAdjustWeight,
  onAdjustReps,
  onCompleteSet,
  onRemoveSet,
}) => {
  const isValid = repsInput && parseInt(repsInput) > 0;
  const weightStep = weightUnit === 'kg' ? 1.25 : WEIGHT_STEP;

  return (
    <div className="border border-border/60 bg-card/70 backdrop-blur-lg rounded-lg overflow-hidden">
      {/* Empty Set Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Set {setIndex + 1}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {targetReps} reps @ {lastSetWeight} {weightUnit}
          </span>
          <svg
            className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Empty Set Form */}
      {isExpanded && (
        <div className="px-3 py-3 border-t border-border/50 space-y-3">
          <div className="flex gap-3">
            {/* Weight input with steppers */}
            <div className="flex-1 min-w-0">
              <label className="text-xs text-fg-3 mb-1 block">
                Weight ({weightUnit})
              </label>
              <div className="flex items-center gap-1">
                <StepperButton onClick={() => onAdjustWeight(-weightStep)} label="-" />
                <input
                  type="number"
                  inputMode="decimal"
                  value={weightInput}
                  onChange={(e) => onWeightChange(e.target.value)}
                  placeholder="0"
                  className="w-0 flex-1 px-1 py-2 text-lg text-center rounded-lg border border-border/50 bg-card/70 backdrop-blur-lg text-fg-1"
                />
                <StepperButton onClick={() => onAdjustWeight(weightStep)} label="+" />
              </div>
            </div>

            {/* Reps input with steppers */}
            <div className="flex-1 min-w-0">
              <label className="text-xs text-fg-3 mb-1 block">
                Reps
              </label>
              <div className="flex items-center gap-1">
                <StepperButton onClick={() => onAdjustReps(-REPS_STEP)} label="-" />
                <input
                  type="number"
                  inputMode="numeric"
                  value={repsInput}
                  onChange={(e) => onRepsChange(e.target.value)}
                  placeholder="0"
                  className="w-0 flex-1 px-1 py-2 text-lg text-center rounded-lg border border-border/50 bg-card/70 backdrop-blur-lg text-fg-1"
                />
                <StepperButton onClick={() => onAdjustReps(REPS_STEP)} label="+" />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={onCompleteSet}
              disabled={!isValid}
              className="flex-1"
              size="lg"
            >
              Complete Set
            </Button>
            {canRemoveSet && (
              <button
                onClick={onRemoveSet}
                className="px-3 py-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                aria-label="Remove set"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
