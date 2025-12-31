import { useState, useEffect, FC } from 'react';
import { SessionExercise, ExerciseSuggestion, WeightUnit } from '../../types';
import { Exercise } from '../../types';
import { Card, Button } from '../ui';

interface ExerciseAccordionProps {
  exercise: SessionExercise;
  exerciseInfo: Exercise | undefined;
  isExpanded: boolean;
  onToggle: () => void;
  onLogSet: (reps: number, weight: number) => void;
  onRemoveLastSet: () => void;
  onRemoveExercise: () => void;
  onStartTimer: (duration: number) => void;
  weightUnit: WeightUnit;
  suggestion?: ExerciseSuggestion;
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
  weightUnit,
  suggestion,
}) => {
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');

  const isComplete = exercise.sets.length >= (exercise.targetSets || 3);
  const progress = `${exercise.sets.length}/${exercise.targetSets || 3}`;

  // Calculate average weight for collapsed view
  const avgWeight = exercise.sets.length > 0
    ? Math.round(exercise.sets.reduce((sum, s) => sum + s.weight, 0) / exercise.sets.length)
    : 0;

  // Pre-fill inputs when expanded or when suggestion changes
  useEffect(() => {
    if (isExpanded) {
      if (exercise.sets.length > 0) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        setWeightInput(lastSet.weight.toString());
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
      }`}
    >
      {/* Header - Always visible */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
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

          <div>
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              {exerciseInfo?.name || 'Unknown Exercise'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isComplete
                ? `${progress} sets - ${avgWeight} ${weightUnit} avg`
                : `Target: ${exercise.targetSets || 3} x ${exercise.targetReps || 10}`}
            </p>
          </div>
        </div>

        {/* Expand/collapse icon */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700">
          {/* Exercise Image */}
          {exerciseInfo?.imageUrl && (
            <div className="mt-3 mb-3">
              <img
                src={exerciseInfo.imageUrl}
                alt={exerciseInfo.name}
                className="w-full max-w-[200px] mx-auto rounded-lg"
                loading="lazy"
              />
            </div>
          )}

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
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {suggestion.reasoning}
              </p>
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
                {exercise.sets.map((set, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-green-100 dark:bg-green-900/20 rounded-lg"
                  >
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Set {index + 1}
                    </span>
                    <span className="text-sm text-green-600 dark:text-green-400">
                      {set.weight} {set.unit} x {set.reps} reps
                    </span>
                  </div>
                ))}
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
