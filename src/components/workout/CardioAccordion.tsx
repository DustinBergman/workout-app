import { useState, useEffect, FC, DOMAttributes, useMemo } from 'react';
import { DraggableAttributes } from '@dnd-kit/core';
import { CardioSessionExercise, CardioExercise } from '../../types';
import { Card, Button } from '../ui';
import { formatCardioDuration, calculatePace, estimateCardioCalories } from '../../utils/workoutUtils';
import { useActiveWorkoutContext } from '../../contexts/ActiveWorkoutContext';
import { LogCardioParams } from '../../hooks/useExerciseManagement';

type CardioTrackingType = 'distance' | 'calories';

interface CardioAccordionProps {
  exercise: CardioSessionExercise;
  exerciseInfo: CardioExercise | undefined;
  listeners?: Partial<DOMAttributes<HTMLElement>>;
  attributes?: DraggableAttributes;
  isDragging?: boolean;
}

export const CardioAccordion: FC<CardioAccordionProps> = ({
  exercise,
  exerciseInfo,
  listeners,
  attributes,
  isDragging,
}) => {
  const {
    session,
    distanceUnit,
    expandedIndex,
    setExpandedIndex,
    logCardioForExercise,
    removeLastSetForExercise,
    removeExercise,
    handleShowHistory,
  } = useActiveWorkoutContext();

  // Find the index of this exercise in the session
  const index = session?.exercises.findIndex(ex => ex.id === exercise.id) ?? -1;

  // Check if this is an interval-based cardio (HIIT, Boxing)
  const isIntervalCardio = exerciseInfo?.cardioType === 'hiit' || exerciseInfo?.cardioType === 'boxing';

  // Wrapped handlers that include the index
  const wrappedLogCardio = (params: LogCardioParams) => logCardioForExercise(index, params);
  const wrappedRemoveLastSet = () => removeLastSetForExercise(index);
  const wrappedRemoveExercise = () => removeExercise(index);
  const wrappedShowHistory = () => handleShowHistory(exercise.exerciseId, exerciseInfo?.name || 'Unknown');

  // Derived state from context
  const isExpanded = expandedIndex === index;
  const onToggle = () => setExpandedIndex(isExpanded ? null : index);

  // Tracking mode - interval cardio defaults to calories, others to distance
  const [trackingType, setTrackingType] = useState<CardioTrackingType>(
    isIntervalCardio ? 'calories' : 'distance'
  );
  const [distanceInput, setDistanceInput] = useState('');
  const [caloriesInput, setCaloriesInput] = useState('');
  const [caloriesOverrideInput, setCaloriesOverrideInput] = useState('');
  const [minutesInput, setMinutesInput] = useState('');
  const [secondsInput, setSecondsInput] = useState('');

  const hasLogs = exercise.sets.length > 0;

  // Calculate totals for display
  const totalDistance = exercise.sets.reduce((sum, s) => {
    if (s.type === 'cardio' && s.distance !== undefined) return sum + s.distance;
    return sum;
  }, 0);
  const totalCalories = exercise.sets.reduce((sum, s) => {
    if (s.type === 'cardio' && s.calories !== undefined) return sum + s.calories;
    return sum;
  }, 0);
  const totalDuration = exercise.sets.reduce((sum, s) => {
    if (s.type === 'cardio') return sum + s.durationSeconds;
    return sum;
  }, 0);

  // Calculate estimated calories for distance-based entries without explicit calories
  const estimatedCalories = useMemo(() => {
    if (!exerciseInfo?.cardioType) return 0;
    return exercise.sets.reduce((sum, s) => {
      if (s.type === 'cardio') {
        // If set already has calories, use that
        if (s.calories !== undefined) return sum + s.calories;
        // Otherwise estimate from distance or duration
        return sum + estimateCardioCalories(exerciseInfo.cardioType, {
          distance: s.distance,
          distanceUnit: s.distanceUnit,
          durationSeconds: s.durationSeconds,
        });
      }
      return sum;
    }, 0);
  }, [exercise.sets, exerciseInfo?.cardioType]);

  // Pre-fill inputs when expanded
  useEffect(() => {
    if (isExpanded && exercise.sets.length > 0) {
      const lastSet = exercise.sets[exercise.sets.length - 1];
      if (lastSet.type === 'cardio') {
        if (lastSet.distance !== undefined) {
          setDistanceInput(lastSet.distance.toString());
        }
        if (lastSet.calories !== undefined) {
          setCaloriesInput(lastSet.calories.toString());
          // If distance was also set, this was an override
          if (lastSet.distance !== undefined) {
            setCaloriesOverrideInput(lastSet.calories.toString());
          }
        }
        const mins = Math.floor(lastSet.durationSeconds / 60);
        const secs = lastSet.durationSeconds % 60;
        setMinutesInput(mins.toString());
        setSecondsInput(secs.toString());
      }
    }
  }, [isExpanded, exercise]);

  const handleLogCardio = () => {
    const minutes = parseInt(minutesInput) || 0;
    const seconds = parseInt(secondsInput) || 0;
    const durationSeconds = minutes * 60 + seconds;

    if (durationSeconds <= 0) return;

    if (trackingType === 'distance') {
      const distance = parseFloat(distanceInput) || 0;
      if (distance <= 0) return;
      // Include calorie override if provided
      const caloriesOverride = parseInt(caloriesOverrideInput) || undefined;
      wrappedLogCardio({ distance, distanceUnit, durationSeconds, calories: caloriesOverride });
    } else {
      const calories = parseInt(caloriesInput) || 0;
      if (calories <= 0) return;
      wrappedLogCardio({ calories, durationSeconds });
    }
  };

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-all ${
        hasLogs
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : ''
      } ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
    >
      {/* Simplified Header */}
      <div className="p-4 flex items-center justify-between gap-3">
        {/* Status Icon */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
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

        {/* Exercise Name + Expand Button */}
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {exerciseInfo?.name || 'Unknown Cardio'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {hasLogs
                ? totalCalories > 0 && totalDistance === 0
                  ? `${totalCalories} cal in ${formatCardioDuration(totalDuration)}`
                  : totalDistance > 0
                    ? `${totalDistance.toFixed(2)} ${distanceUnit} • ~${estimatedCalories} cal`
                    : `${totalCalories} cal in ${formatCardioDuration(totalDuration)}`
                : 'Cardio exercise'}
            </p>
          </div>

          {/* Chevron */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Drag Handle (RIGHT SIDE) */}
        <div
          {...listeners}
          {...attributes}
          className="p-2 cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reorder exercise"
          role="button"
          tabIndex={0}
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* History button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              wrappedShowHistory();
            }}
            className="w-full mt-3 py-2 px-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            History
          </button>

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
                    wrappedRemoveLastSet();
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Undo last
                </button>
              </div>
              <div className="space-y-1">
                {exercise.sets.map((set, setIndex) => {
                  if (set.type !== 'cardio') return null;
                  const hasDistance = set.distance !== undefined && set.distance > 0;
                  const hasCalories = set.calories !== undefined && set.calories > 0;
                  const pace = hasDistance && set.distanceUnit
                    ? calculatePace(set.distance!, set.durationSeconds, set.distanceUnit)
                    : null;
                  // Estimate calories if not explicitly set
                  const entryCalories = hasCalories
                    ? set.calories!
                    : exerciseInfo?.cardioType
                      ? estimateCardioCalories(exerciseInfo.cardioType, {
                          distance: set.distance,
                          distanceUnit: set.distanceUnit,
                          durationSeconds: set.durationSeconds,
                        })
                      : 0;
                  return (
                    <div
                      key={setIndex}
                      className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"
                    >
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Entry {setIndex + 1}
                      </span>
                      <div className="text-right">
                        <span className="text-sm text-green-600 dark:text-green-400">
                          {hasCalories && !hasDistance
                            ? `${set.calories} cal in ${formatCardioDuration(set.durationSeconds)}`
                            : hasDistance
                              ? `${set.distance!.toFixed(2)} ${set.distanceUnit} in ${formatCardioDuration(set.durationSeconds)}`
                              : `${formatCardioDuration(set.durationSeconds)}`}
                        </span>
                        {pace && (
                          <span className="text-xs text-green-500 dark:text-green-500 block">
                            Pace: {pace}
                          </span>
                        )}
                        {entryCalories > 0 && (
                          <span className="text-xs text-orange-500 dark:text-orange-400 block">
                            {hasCalories ? '' : '~'}{entryCalories} cal
                          </span>
                        )}
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

            {/* Tracking type toggle for interval cardio */}
            {isIntervalCardio && (
              <div className="mb-4">
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button
                    onClick={() => setTrackingType('calories')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      trackingType === 'calories'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Calories
                  </button>
                  <button
                    onClick={() => setTrackingType('distance')}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      trackingType === 'distance'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Distance
                  </button>
                </div>
              </div>
            )}

            {/* Distance input */}
            {trackingType === 'distance' && (
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
            )}

            {/* Calories override input (optional, for distance tracking) */}
            {trackingType === 'distance' && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">
                  Calories (optional - override estimate)
                </label>
                <input
                  type="number"
                  value={caloriesOverrideInput}
                  onChange={(e) => setCaloriesOverrideInput(e.target.value)}
                  placeholder={exerciseInfo?.cardioType && distanceInput ?
                    `~${estimateCardioCalories(exerciseInfo.cardioType, {
                      distance: parseFloat(distanceInput) || 0,
                      distanceUnit,
                      durationSeconds: (parseInt(minutesInput) || 0) * 60 + (parseInt(secondsInput) || 0),
                    })}` : 'Leave blank for estimate'}
                  className="w-full px-4 py-3 text-lg text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <div className="flex gap-1 mt-2">
                  {[25, 50, 100, -25].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => {
                        const current = parseInt(caloriesOverrideInput) ||
                          (exerciseInfo?.cardioType ? estimateCardioCalories(exerciseInfo.cardioType, {
                            distance: parseFloat(distanceInput) || 0,
                            distanceUnit,
                            durationSeconds: (parseInt(minutesInput) || 0) * 60 + (parseInt(secondsInput) || 0),
                          }) : 0);
                        setCaloriesOverrideInput(Math.max(0, current + delta).toString());
                      }}
                      className="flex-1 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      {delta > 0 ? '+' : ''}{delta}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Calories input */}
            {trackingType === 'calories' && (
              <div className="mb-4">
                <label className="text-xs text-gray-500 mb-1 block">
                  Calories Burned
                </label>
                <input
                  type="number"
                  value={caloriesInput}
                  onChange={(e) => setCaloriesInput(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 text-lg text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <div className="flex gap-1 mt-2">
                  {[25, 50, 100, -25].map((delta) => (
                    <button
                      key={delta}
                      onClick={() => {
                        const current = parseInt(caloriesInput) || 0;
                        setCaloriesInput(Math.max(0, current + delta).toString());
                      }}
                      className="flex-1 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    >
                      {delta > 0 ? '+' : ''}{delta}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

            {/* Pace and calorie preview (only for distance tracking) */}
            {trackingType === 'distance' && distanceInput && (minutesInput || secondsInput) && (
              <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex justify-center gap-4">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    Pace: {calculatePace(
                      parseFloat(distanceInput) || 0,
                      (parseInt(minutesInput) || 0) * 60 + (parseInt(secondsInput) || 0),
                      distanceUnit
                    )}
                  </span>
                  <span className="text-sm text-orange-600 dark:text-orange-400">
                    {caloriesOverrideInput ? (
                      `${caloriesOverrideInput} cal`
                    ) : exerciseInfo?.cardioType ? (
                      `~${estimateCardioCalories(exerciseInfo.cardioType, {
                        distance: parseFloat(distanceInput) || 0,
                        distanceUnit,
                        durationSeconds: (parseInt(minutesInput) || 0) * 60 + (parseInt(secondsInput) || 0),
                      })} cal`
                    ) : null}
                  </span>
                </div>
              </div>
            )}

            {/* Calories/hour preview (only for calories tracking) */}
            {trackingType === 'calories' && caloriesInput && (minutesInput || secondsInput) && (
              <div className="mb-4 p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                <span className="text-sm text-orange-700 dark:text-orange-300">
                  {Math.round(
                    ((parseInt(caloriesInput) || 0) / ((parseInt(minutesInput) || 0) + (parseInt(secondsInput) || 0) / 60)) * 60
                  )} cal/hour
                </span>
              </div>
            )}

            <Button
              onClick={handleLogCardio}
              disabled={
                (trackingType === 'distance' && (!distanceInput || parseFloat(distanceInput) <= 0)) ||
                (trackingType === 'calories' && (!caloriesInput || parseInt(caloriesInput) <= 0)) ||
                (!minutesInput && !secondsInput)
              }
              className="w-full"
              size="lg"
            >
              Log Cardio
            </Button>
          </div>

          {/* Remove exercise button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Remove this exercise?')) {
                wrappedRemoveExercise();
              }
            }}
            variant="outline"
            className="mt-4 w-full"
          >
            Remove Exercise
          </Button>
        </div>
      )}
    </Card>
  );
};
