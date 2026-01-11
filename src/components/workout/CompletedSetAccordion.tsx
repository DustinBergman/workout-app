import { FC } from 'react';
import { Button } from '../ui';
import { WeightUnit } from '../../types';

interface CompletedSetAccordionProps {
  setIndex: number;
  weight: number;
  unit: string;
  reps: number;
  weightUnit: WeightUnit;
  isExpanded: boolean;
  isEditing: boolean;
  editingWeight: number | null;
  editingReps: number | null;
  onToggle: () => void;
  onStartEditing: () => void;
  onFinishEditing: () => void;
  onRemoveSet: () => void;
  onEditingWeightChange: (value: number) => void;
  onEditingRepsChange: (value: number) => void;
}

export const CompletedSetAccordion: FC<CompletedSetAccordionProps> = ({
  setIndex,
  weight,
  unit,
  reps,
  weightUnit,
  isExpanded,
  isEditing,
  editingWeight,
  editingReps,
  onToggle,
  onStartEditing,
  onFinishEditing,
  onRemoveSet,
  onEditingWeightChange,
  onEditingRepsChange,
}) => {
  return (
    <div className="border border-green-500/40 bg-green-500/25 backdrop-blur-lg rounded-lg overflow-hidden">
      {/* Set Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 hover:bg-green-500/20 transition-colors"
      >
        <span className="text-sm font-medium text-green-600 dark:text-green-400">
          Set {setIndex + 1}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 dark:text-green-400">
            {weight} {unit} x {reps} reps
          </span>
          <svg
            className={`w-4 h-4 text-green-600 dark:text-green-400 transition-transform ${
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

      {/* Set Details */}
      {isExpanded && (
        <div className="px-3 py-2 border-t border-green-500/20 space-y-2">
          {isEditing ? (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                    Weight ({weightUnit})
                  </label>
                  <input
                    type="number"
                    value={editingWeight !== null ? editingWeight : weight}
                    onChange={(e) => onEditingWeightChange(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
                    Reps
                  </label>
                  <input
                    type="number"
                    value={editingReps !== null ? editingReps : reps}
                    onChange={(e) => onEditingRepsChange(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={onFinishEditing}
                  variant="outline"
                  className="flex-1 py-1 text-sm"
                >
                  Done
                </Button>
                <Button
                  onClick={onRemoveSet}
                  variant="outline"
                  className="flex-1 text-red-600 dark:text-red-400 py-1 text-sm"
                >
                  Remove
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-green-700 dark:text-green-300">
                <span className="font-medium">
                  {weight} {unit}
                </span>
                <span className="text-green-600 dark:text-green-400 ml-2">x</span>
                <span className="font-medium ml-2">{reps} reps</span>
              </div>
              <Button
                onClick={onStartEditing}
                variant="outline"
                className="w-full py-1 text-sm"
              >
                Edit
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
