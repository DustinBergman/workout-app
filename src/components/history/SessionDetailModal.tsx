import { FC } from 'react';
import { Modal } from '../ui';
import { WorkoutSession, Exercise, WeightUnit, DistanceUnit } from '../../types';
import { getExerciseById } from '../../data/exercises';
import { calculateSessionStats } from '../../hooks/useSessionStats';
import { formatCardioDuration, calculatePace } from '../../utils/workoutUtils';
import { formatSessionDuration } from '../../hooks/useWorkoutHistory';

interface SessionDetailModalProps {
  session: WorkoutSession | null;
  customExercises: Exercise[];
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  onClose: () => void;
}

export const SessionDetailModal: FC<SessionDetailModalProps> = ({
  session,
  customExercises,
  weightUnit,
  distanceUnit,
  onClose,
}) => {
  if (!session) return null;

  const sessionStats = calculateSessionStats(session);
  const hasStrength = sessionStats.totalVolume > 0;
  const hasCardio = sessionStats.totalCardioDistance > 0;

  return (
    <Modal
      isOpen={!!session}
      onClose={onClose}
      title={session.name || 'Workout Details'}
    >
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{new Date(session.startedAt).toLocaleString()}</span>
          <span>{formatSessionDuration(session)}</span>
        </div>

        {session.exercises.map((exercise, index) => {
          const info = getExerciseById(exercise.exerciseId, customExercises);
          const isCardio = exercise.type === 'cardio';
          return (
            <div
              key={index}
              className="border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {info?.name || 'Unknown Exercise'}
                </h4>
                {isCardio && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    Cardio
                  </span>
                )}
              </div>
              {exercise.sets.length > 0 ? (
                <div className="space-y-1">
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">
                        {isCardio ? `Entry ${setIndex + 1}` : `Set ${setIndex + 1}`}
                      </span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {set.type === 'cardio' ? (
                          <>
                            {set.calories !== undefined && set.distance === undefined
                              ? `${set.calories} cal`
                              : set.distance !== undefined
                                ? `${set.distance.toFixed(2)} ${set.distanceUnit}`
                                : ''}{' '}
                            in {formatCardioDuration(set.durationSeconds)}
                            {set.distance !== undefined && set.distanceUnit && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({calculatePace(set.distance, set.durationSeconds, set.distanceUnit)})
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            {'weight' in set ? set.weight : 0}{' '}
                            {'unit' in set ? set.unit : weightUnit} x{' '}
                            {'reps' in set ? set.reps : 0} reps
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No sets recorded</p>
              )}
            </div>
          );
        })}

        {/* Summary */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {sessionStats.totalSets}
              </p>
              <p className="text-xs text-gray-500">Sets</p>
            </div>
            {hasStrength && (
              <>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {sessionStats.totalReps}
                  </p>
                  <p className="text-xs text-gray-500">Reps</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {sessionStats.totalVolume.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{weightUnit}</p>
                </div>
              </>
            )}
            {hasCardio && (
              <>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {sessionStats.totalCardioDistance.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">{distanceUnit}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatCardioDuration(sessionStats.totalCardioDurationSeconds)}
                  </p>
                  <p className="text-xs text-gray-500">Duration</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
