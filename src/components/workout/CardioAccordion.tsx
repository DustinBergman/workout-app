import { useState, useEffect, FC } from 'react';
import { CardioSessionExercise, DistanceUnit, CardioExercise } from '../../types';
import { Card, Button } from '../ui';
import { formatCardioDuration, calculatePace } from '../../utils/workoutUtils';

interface CardioAccordionProps {
  exercise: CardioSessionExercise;
  exerciseInfo: CardioExercise | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onLogCardio: (distance: number, distanceUnit: DistanceUnit, durationSeconds: number) => void;
  onRemoveLastSet: () => void;
  onRemoveExercise: () => void;
  onShowHistory: () => void;
  distanceUnit: DistanceUnit;
}

export const CardioAccordion: FC<CardioAccordionProps> = ({
  exercise,
  exerciseInfo,
  isExpanded,
  onToggle,
  onLogCardio,
  onRemoveLastSet,
  onRemoveExercise,
  onShowHistory,
  distanceUnit,
}) => {
  const [distanceInput, setDistanceInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [secondsInput, setSecondsInput] = useState('');

  const hasLogs = exercise.sets.length > 0;

  // Calculate totals for display
  const totalDistance = exercise.sets.reduce((sum, s) => {
    if (s.type === 'cardio') return sum + s.distance;
    return sum;
  }, 0);
  const totalDuration = exercise.sets.reduce((sum, s) => {
    if (s.type === 'cardio') return sum + s.durationSeconds;
    return sum;
  }, 0);

  // Pre-fill inputs when expanded
  useEffect(() => {
    if (isExpanded && exercise.sets.length > 0) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      if (lastSet.type === 'cardio') {
        setDistanceInput(lastSet.distance.toString());
        const mins = Math.floor(lastSet.durationSeconds / 60);
        const secs = lastSet.durationSeconds % 60;
        setMinutesInput(mins.toString());
        setSecondsInput(secs.toString());
      }
    }
  }, [isExpanded, exercise.sets.length]);

  const handleLogCardio = () => {
    const distance = parseFloat(distanceInput) || 0;
    const minutes = parseInt(minutesInput) || 0;
    const seconds = parseInt(secondsInput) || 0;
    const durationSeconds = minutes * 60 + seconds;

    if (distance <= 0 || durationSeconds <= 0) return;

    onLogCardio(distance, distanceUnit, durationSeconds);
  };

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-all ${
        hasLogs
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : ''
      }`}
    >
      {/* Header - Always visible */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={onToggle}
          className="flex items-center gap-3 text-left flex-1"
        >
          {/* Status indicator */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              hasLogs
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}
          >
            {hasLogs ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>

          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {exerciseInfo?.name || 'Unknown Cardio'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hasLogs
                ? `${totalDistance.toFixed(2)} ${distanceUnit} in ${formatCardioDuration(totalDuration)}`
                : 'Cardio exercise'}
            </p>
          </div>
        </button>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* History button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowHistory();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="View history"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Expand/collapse icon */}
          <button onClick={onToggle} className="p-2">
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Completed Cardio Logs */}
          {exercise.sets.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Logged Activity
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveLastSet();
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Undo last
                </button>
              </div>
              <div className="space-y-1">
                {exercise.sets.map((set, index) => {
                  if (set.type !== 'cardio') return null;
                  const pace = calculatePace(set.distance, set.durationSeconds, set.distanceUnit);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"
                    >
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Entry {index + 1}
                      </span>
                      <div className="text-right">
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {set.distance.toFixed(2)} {set.distanceUnit} in {formatCardioDuration(set.durationSeconds)}
                        </span>
                        <span className="text-xs text-green-500 dark:text-green-500 block">
                          Pace: {pace}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input for cardio */}
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Log Cardio
            </p>

            {/* Distance input */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Distance ({distanceUnit})
              </label>
              <input
                type="number"
                step="0.01"
                value={distanceInput}
                onChange={(e) => setDistanceInput(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 text-lg text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <div className="flex gap-1 mt-2">
                {[0.25, 0.5, 1, -0.25].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => {
                      const current = parseFloat(distanceInput) || 0;
                      setDistanceInput(Math.max(0, current + delta).toFixed(2));
                    }}
                    className="flex-1 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {delta > 0 ? '+' : ''}{delta}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration input (minutes and seconds) */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Duration</label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="number"
                    value={minutesInput}
                    onChange={(e) => setMinutesInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 text-lg text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-xs text-gray-500 text-center block mt-1">min</span>
                </div>
                <span className="text-2xl text-gray-400">:</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={secondsInput}
                    onChange={(e) => setSecondsInput(e.target.value)}
                    placeholder="00"
                    className="w-full px-4 py-3 text-lg text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <span className="text-xs text-gray-500 text-center block mt-1">sec</span>
                </div>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 5, 10, -1].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => {
                      const current = parseInt(minutesInput) || 0;
                      setMinutesInput(Math.max(0, current + delta).toString());
                    }}
                    className="flex-1 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {delta > 0 ? '+' : ''}{delta} min
                  </button>
                ))}
              </div>
            </div>

            {/* Pace preview */}
            {distanceInput && (minutesInput || secondsInput) && (
              <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Pace: {calculatePace(
                    parseFloat(distanceInput) || 0,
                    (parseInt(minutesInput) || 0) * 60 + (parseInt(secondsInput) || 0),
                    distanceUnit
                  )}
                </span>
              </div>
            )}

            <Button
              onClick={handleLogCardio}
              disabled={
                !distanceInput ||
                parseFloat(distanceInput) <= 0 ||
                (!minutesInput && !secondsInput)
              }
              className="w-full"
              size="lg"
            >
              Log Cardio
            </Button>
          </div>

          {/* Remove exercise button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Remove this exercise?')) {
                onRemoveExercise();
              }
            }}
            className="mt-4 w-full py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            Remove Exercise
          </button>
        </div>
      )}
    </Card>
  );
};
