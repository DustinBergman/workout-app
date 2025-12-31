import { FC } from 'react';
import { Card } from '../ui';
import { TemplateExercise } from '../../types';

interface TemplateExerciseCardProps {
  exercise: TemplateExercise;
  index: number;
  exerciseName: string;
  onUpdate: (index: number, updates: Partial<TemplateExercise>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

export const TemplateExerciseCard: FC<TemplateExerciseCardProps> = ({
  exercise,
  index,
  exerciseName,
  onUpdate,
  onRemove,
  onMove,
  isFirst,
  isLast,
}) => {
  return (
    <Card padding="sm">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMove(index, 'up')}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {exerciseName}
            </p>
            {exercise.type === 'cardio' && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                Cardio
              </span>
            )}
          </div>
          {exercise.type === 'cardio' ? (
            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="text-xs text-gray-500">Rest (s)</label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={exercise.restSeconds}
                  onChange={(e) => onUpdate(index, { restSeconds: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Sets</label>
                <input
                  type="number"
                  min="1"
                  value={exercise.targetSets}
                  onChange={(e) => onUpdate(index, { targetSets: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Reps</label>
                <input
                  type="number"
                  min="1"
                  value={exercise.targetReps}
                  onChange={(e) => onUpdate(index, { targetReps: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Rest (s)</label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={exercise.restSeconds}
                  onChange={(e) => onUpdate(index, { restSeconds: parseInt(e.target.value) || 0 })}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(index)}
          className="p-1 text-red-500 hover:text-red-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Card>
  );
};
