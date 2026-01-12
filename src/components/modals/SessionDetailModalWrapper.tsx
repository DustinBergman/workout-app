import { FC } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { Modal } from '../ui';
import { WorkoutSession } from '../../types';
import { getExerciseById } from '../../data/exercises';
import { calculateSessionStats } from '../../hooks/useSessionStats';
import { formatCardioDuration, calculatePace } from '../../utils/workoutUtils';
import { formatSessionDuration } from '../../hooks/useWorkoutHistory';

interface SessionDetailModalWrapperProps {
  session: WorkoutSession;
}

export const SessionDetailModalWrapper: FC<SessionDetailModalWrapperProps> = ({ session }) => {
  const { closeModal } = useModal();
  const customExercises = useAppStore((state) => state.customExercises);
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);
  const distanceUnit = useAppStore((state) => state.preferences.distanceUnit);

  const sessionStats = calculateSessionStats(session);
  const hasStrength = sessionStats.totalVolume > 0;
  const hasCardio = sessionStats.totalCardioDistance > 0;

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
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
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {info?.name || exercise.exerciseId}
                </h3>
                {isCardio && (
                  <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    Cardio
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {exercise.sets.map((set, setIndex) => (
                  <div
                    key={setIndex}
                    className="text-sm text-gray-600 dark:text-gray-400"
                  >
                    {set.type === 'strength' ? (
                      <span>
                        Set {setIndex + 1}: {set.reps} reps × {set.weight} {set.unit}
                      </span>
                    ) : (
                      <span>
                        {set.calories !== undefined && set.distance === undefined
                          ? `${set.calories} cal`
                          : set.distance !== undefined
                            ? `${set.distance} ${set.distanceUnit}`
                            : ''}{' '}
                        in {formatCardioDuration(set.durationSeconds)}
                        {set.distance !== undefined && set.distance > 0 && set.distanceUnit && (
                          <span className="text-gray-500 dark:text-gray-500 ml-2">
                            ({calculatePace(set.durationSeconds, set.distance, set.distanceUnit)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {hasStrength && (
              <>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Volume</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionStats.totalVolume.toLocaleString()} {weightUnit}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Sets</span>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {sessionStats.totalSets}
                  </p>
                </div>
              </>
            )}
            {hasCardio && (
              <div>
                <span className="text-gray-500 dark:text-gray-400">Distance</span>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {sessionStats.totalCardioDistance.toFixed(2)} {distanceUnit}
                </p>
              </div>
            )}
          </div>
        </div>

        {session.mood && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <span className="text-gray-500 dark:text-gray-400 text-sm">Mood</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {['😫', '😕', '😐', '😊', '🔥'][session.mood - 1]} ({session.mood}/5)
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
