import { FC } from 'react';
import { Card } from '../ui';
import { TemplateExercise } from '../../types';
import { CardioFields, NumberInput } from './template-exercise';

interface TemplateExerciseCardProps {
  exercise: TemplateExercise;
  index: number;
  exerciseName: string;
  isOwnCustomExercise?: boolean;
  onUpdate: (index: number, updates: Partial<TemplateExercise>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onEditCustomExercise?: (exerciseId: string, exerciseName: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

export const TemplateExerciseCard: FC<TemplateExerciseCardProps> = ({
  exercise,
  index,
  exerciseName,
  isOwnCustomExercise,
  onUpdate,
  onRemove,
  onMove,
  onEditCustomExercise,
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
            {isOwnCustomExercise && onEditCustomExercise && (
              <button
                onClick={() => onEditCustomExercise(exercise.exerciseId, exerciseName)}
                className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                aria-label="Edit exercise name"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {exercise.type === 'cardio' && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                Cardio
              </span>
            )}
          </div>
          {exercise.type === 'cardio' ? (
            <CardioFields exercise={exercise} index={index} onUpdate={onUpdate} />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <NumberInput
                label="Sets"
                value={exercise.targetSets}
                onChange={(v) => onUpdate(index, { targetSets: v })}
                min={1}
              />
              <NumberInput
                label="Reps"
                value={exercise.targetReps}
                onChange={(v) => onUpdate(index, { targetReps: v })}
                min={1}
              />
              <NumberInput
                label="Rest (s)"
                value={exercise.restSeconds}
                onChange={(v) => onUpdate(index, { restSeconds: v })}
                step={15}
              />
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
