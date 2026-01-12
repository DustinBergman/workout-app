import { FC, useMemo } from 'react';
import { WorkoutSession, WeightUnit } from '../../types';
import { Modal } from '../ui';
import { convertWeight, extractExerciseHistory, formatCardioDuration, calculatePace } from '../../utils/workoutUtils';

interface ExerciseHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  sessions: WorkoutSession[];
  weightUnit: WeightUnit;
}

export const ExerciseHistorySheet: FC<ExerciseHistorySheetProps> = ({
  isOpen,
  onClose,
  exerciseId,
  exerciseName,
  sessions,
  weightUnit,
}) => {
  const historyData = useMemo(
    () => extractExerciseHistory(sessions, exerciseId),
    [sessions, exerciseId]
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${exerciseName} History`}
    >
      <div className="max-h-[60vh] overflow-y-auto">
        {historyData.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              No history for this exercise yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Complete a workout with this exercise to see your history
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyData.map((entry, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {formatDate(entry.date)}
                </p>
                <div className="space-y-1">
                  {entry.sets.map((set, setIndex) => (
                    <div
                      key={setIndex}
                      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <span className="text-gray-400">•</span>
                      <span>
                        {set.type === 'cardio' ? (
                          <>
                            {set.calories !== undefined && set.distance === undefined
                              ? `${set.calories} cal`
                              : set.distance !== undefined
                                ? `${set.distance.toFixed(2)} ${set.distanceUnit}`
                                : ''}{' '}
                            in {formatCardioDuration(set.durationSeconds)}
                            {set.distance !== undefined && set.distanceUnit && (
                              <span className="text-gray-400 ml-1">
                                ({calculatePace(set.distance, set.durationSeconds, set.distanceUnit)})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {convertWeight(set.weight, set.unit, weightUnit)} {weightUnit} × {set.reps}
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
