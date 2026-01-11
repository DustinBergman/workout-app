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

const WEIGHT_ADJUSTMENTS = [-10, -5, 5, 10];
const REPS_ADJUSTMENTS = [-2, -1, 1, 2];

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
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Weight ({weightUnit})
              </label>
              <input
                type="number"
                value={weightInput}
                onChange={(e) => onWeightChange(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 text-lg text-center rounded-lg border border-border/50 bg-card/70 backdrop-blur-lg text-gray-900 dark:text-gray-100"
              />
              <div className="flex gap-1 mt-2">
                {WEIGHT_ADJUSTMENTS.map((delta) => (
                  <button
                    key={delta}
                    onClick={() => onAdjustWeight(delta)}
                    className="flex-1 py-1 text-xs rounded bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                Reps
              </label>
              <input
                type="number"
                value={repsInput}
                onChange={(e) => onRepsChange(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 text-lg text-center rounded-lg border border-border/50 bg-card/70 backdrop-blur-lg text-gray-900 dark:text-gray-100"
              />
              <div className="flex gap-1 mt-2">
                {REPS_ADJUSTMENTS.map((delta) => (
                  <button
                    key={delta}
                    onClick={() => onAdjustReps(delta)}
                    className="flex-1 py-1 text-xs rounded bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    {delta > 0 ? '+' : ''}
                    {delta}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={onCompleteSet}
            disabled={!isValid}
            className="w-full"
            size="lg"
          >
            Complete Set
          </Button>
          {canRemoveSet && (
            <Button
              onClick={onRemoveSet}
              variant="outline"
              className="w-full text-red-600 dark:text-red-400"
            >
              Remove Set
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
