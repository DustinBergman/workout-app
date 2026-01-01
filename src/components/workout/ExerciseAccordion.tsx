import { useState, useEffect, FC, DOMAttributes } from 'react';
import { DraggableAttributes } from '@dnd-kit/core';
import { StrengthSessionExercise, ExerciseSuggestion, WeightUnit, StrengthExercise } from '../../types';
import { Card, Button } from '../ui';

interface ExerciseAccordionProps {
  exercise: StrengthSessionExercise;
  exerciseInfo: StrengthExercise | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onLogSet: (reps: number, weight: number) => void;
  onRemoveLastSet: () => void;
  onRemoveExercise: () => void;
  onStartTimer: (duration: number) => void;
  onUpdateTargetSets: (delta: number) => void;
  onShowHistory: () => void;
  weightUnit: WeightUnit;
  suggestion?: ExerciseSuggestion;
  listeners?: Partial<DOMAttributes<HTMLElement>>;
  attributes?: DraggableAttributes;
  isDragging?: boolean;
}

export const ExerciseAccordion: FC<ExerciseAccordionProps> = ({
  exercise,
  exerciseInfo,
  isExpanded,
  onToggle,
  onLogSet,
  onRemoveLastSet,
  onRemoveExercise,
  onStartTimer,
  onUpdateTargetSets,
  onShowHistory,
  weightUnit,
  suggestion,
  listeners,
  attributes,
  isDragging,
}) => {
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const isComplete = exercise.sets.length >= (exercise.targetSets || 3);
  const progress = `${exercise.sets.length}/${exercise.targetSets || 3}`;

  // Calculate average weight for collapsed view (only for strength sets)
  const strengthSets = exercise.sets.filter((s) => s.type === 'strength' || !('type' in s));
  const avgWeight = strengthSets.length > 0
    ? Math.round(strengthSets.reduce((sum, s) => sum + ('weight' in s ? s.weight : 0), 0) / strengthSets.length)
    : 0;

  // Pre-fill inputs when expanded or when suggestion changes
  useEffect(() => {
    if (isExpanded) {
      if (exercise.sets.length > 0) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        if (lastSet.type === 'strength' || !('type' in lastSet)) {
          setWeightInput(('weight' in lastSet ? lastSet.weight : 0).toString());
        }
        setRepsInput(exercise.targetReps?.toString() || '');
      } else if (suggestion) {
        setWeightInput(suggestion.suggestedWeight.toString());
        setRepsInput(suggestion.suggestedReps.toString());
      } else {
        setRepsInput(exercise.targetReps?.toString() || '10');
        setWeightInput('');
      }
    }
  }, [isExpanded, exercise.sets.length, exercise.targetReps, suggestion]);

  const handleLogSet = () => {
    const reps = parseInt(repsInput) || 0;
    const weight = parseFloat(weightInput) || 0;
    if (reps <= 0) return;

    onLogSet(reps, weight);
    onStartTimer(exercise.restSeconds || 90);
  };

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-all ${
        isComplete
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : ''
      } ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
    >
      {/* Simplified Header */}
      <div className="p-4 flex items-center justify-between gap-3">
        {/* Status Icon */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
            isComplete
              ? 'bg-green-500 text-white'
              : exercise.sets.length > 0
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
          }`}
        >
          {isComplete ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            progress
          )}
        </div>

        {/* Exercise Name + Expand Button */}
        <button
          onClick={onToggle}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {exerciseInfo?.name || 'Unknown Exercise'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {isComplete
                ? `${progress} sets - ${avgWeight} ${weightUnit} avg`
                : `Target: ${exercise.targetSets || 3} x ${exercise.targetReps || 10}`}
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
          {/* Control buttons */}
          <div className="flex items-center gap-2 mt-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            {/* History button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowHistory();
              }}
              className="flex-1 py-2 px-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>

            {/* Set count controls */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Target Sets:</span>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTargetSets(-1);
                  }}
                  disabled={exercise.targetSets <= 1}
                  className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-30"
                >
                  -
                </button>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[2rem] text-center">
                  {exercise.targetSets}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTargetSets(1);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* AI Suggestion badge */}
          {suggestion && exercise.sets.length === 0 && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  AI suggests: {suggestion.suggestedWeight} {weightUnit} x {suggestion.suggestedReps}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  suggestion.confidence === 'high'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : suggestion.confidence === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {suggestion.confidence}
                </span>
                {suggestion.progressStatus && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    suggestion.progressStatus === 'improving'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      : suggestion.progressStatus === 'plateau'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : suggestion.progressStatus === 'declining'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {suggestion.progressStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {suggestion.reasoning}
              </p>
              {/* Technique tip for plateau exercises */}
              {suggestion.techniqueTip && (
                <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      {suggestion.techniqueTip}
                    </p>
                  </div>
                  {suggestion.repRangeChange && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-6">
                      Rep range: {suggestion.repRangeChange.from} → {suggestion.repRangeChange.to}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Completed Sets */}
          {exercise.sets.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Completed Sets
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
                  if (set.type !== 'strength' && 'type' in set) return null;
                  const strengthSet = set as { weight: number; unit: string; reps: number };
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"
                    >
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Set {index + 1}
                      </span>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {strengthSet.weight} {strengthSet.unit} x {strengthSet.reps} reps
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Input for next set */}
          {!isComplete && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Set {exercise.sets.length + 1} of {exercise.targetSets || 3}
              </p>
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">
                    Weight ({weightUnit})
                  </label>
                  <input
                    type="number"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 text-lg text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <div className="flex gap-1 mt-2">
                    {[-10, -5, 5, 10].map((delta) => (
                      <button
                        key={delta}
                        onClick={() => {
                          const current = parseFloat(weightInput) || 0;
                          setWeightInput(Math.max(0, current + delta).toString());
                        }}
                        className="flex-1 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      >
                        {delta > 0 ? '+' : ''}{delta}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Reps</label>
                  <input
                    type="number"
                    value={repsInput}
                    onChange={(e) => setRepsInput(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 text-lg text-center rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                  <div className="flex gap-1 mt-2">
                    {[-2, -1, 1, 2].map((delta) => (
                      <button
                        key={delta}
                        onClick={() => {
                          const current = parseInt(repsInput) || 0;
                          setRepsInput(Math.max(1, current + delta).toString());
                        }}
                        className="flex-1 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      >
                        {delta > 0 ? '+' : ''}{delta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleLogSet}
                disabled={!repsInput || parseInt(repsInput) <= 0}
                className="w-full"
                size="lg"
              >
                Log Set
              </Button>
            </div>
          )}

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
}
