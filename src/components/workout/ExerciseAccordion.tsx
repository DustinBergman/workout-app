import { FC, DOMAttributes } from 'react';
import { DraggableAttributes } from '@dnd-kit/core';
import { StrengthSessionExercise, StrengthExercise } from '../../types';
import { Card, Button } from '../ui';
import { useActiveWorkoutContext } from '../../contexts/ActiveWorkoutContext';
import { useExerciseAccordion } from '../../hooks/useExerciseAccordion';
import { CompletedSetAccordion } from './CompletedSetAccordion';
import { EmptySetAccordion } from './EmptySetAccordion';
import { AISuggestionBadge } from './AISuggestionBadge';

interface ExerciseAccordionProps {
  exercise: StrengthSessionExercise;
  exerciseInfo: StrengthExercise | undefined;
  listeners?: Partial<DOMAttributes<HTMLElement>>;
  attributes?: DraggableAttributes;
  isDragging?: boolean;
}

export const ExerciseAccordion: FC<ExerciseAccordionProps> = ({
  exercise,
  exerciseInfo,
  listeners,
  attributes,
  isDragging,
}) => {
  const {
    session,
    weightUnit,
    expandedIndex,
    setExpandedIndex,
    logSetForExercise,
    removeExercise,
    removeSetForExercise,
    updateSetForExercise,
    handleStartTimer,
    updateTargetSets,
    handleShowHistory,
    getSuggestionForExercise,
  } = useActiveWorkoutContext();

  // Find the index of this exercise in the session
  const index = session?.exercises.findIndex((ex) => ex.id === exercise.id) ?? -1;

  // Derived state from context
  const isExpanded = expandedIndex === index;
  const onToggle = () => setExpandedIndex(isExpanded ? null : index);
  const suggestion = getSuggestionForExercise(exercise.exerciseId);

  // Wrapped handlers
  const wrappedLogSet = (reps: number, weight: number) => logSetForExercise(index, reps, weight);
  const wrappedRemoveExercise = () => removeExercise(index);
  const wrappedUpdateTargetSets = (delta: number) => updateTargetSets(exercise.exerciseId, delta);
  const wrappedShowHistory = () => handleShowHistory(exercise.exerciseId);

  // Use the hook for state management
  const {
    repsInput,
    setRepsInput,
    weightInput,
    setWeightInput,
    expandedSetIndex,
    setExpandedSetIndex,
    editingSetIndex,
    setEditingSetIndex,
    editingWeight,
    setEditingWeight,
    editingReps,
    setEditingReps,
    isComplete,
    progress,
    targetSets,
    avgWeight,
    allSets,
    getEmptySetDefaults,
    handleCompleteSet,
    handleToggleSet,
    handleStartEditing,
    handleFinishEditing,
    handleAddSet,
    adjustWeight,
    adjustReps,
  } = useExerciseAccordion({
    exercise,
    index,
    isExpanded,
    suggestion,
    weightUnit,
    onLogSet: wrappedLogSet,
    onRemoveExercise: wrappedRemoveExercise,
    onRemoveSet: (setIndex) => removeSetForExercise(index, setIndex),
    onUpdateSet: (setIndex, reps, weight) => updateSetForExercise(index, setIndex, reps, weight),
    onUpdateTargetSets: wrappedUpdateTargetSets,
    onStartTimer: handleStartTimer,
  });

  const { lastSetWeight, targetReps } = getEmptySetDefaults();

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-all ${
        isComplete
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
          : ''
      } ${isDragging ? 'opacity-50 ring-2 ring-blue-500' : ''}`}
    >
      {/* Header */}
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
        <button onClick={onToggle} className="flex items-center gap-2 text-left flex-1 min-w-0">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {exerciseInfo?.name || 'Unknown Exercise'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {isComplete
                ? `${progress} sets - ${avgWeight} ${weightUnit} avg`
                : `Target: ${targetSets} x ${exercise.targetReps || 10}`}
            </p>
          </div>

          {/* Chevron */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Drag Handle */}
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
        <div className="px-4 pb-4 border-t border-border/50 bg-white/15 dark:bg-white/8 backdrop-blur-lg">
          {/* Control buttons */}
          <div className="flex items-center gap-2 mt-3 pb-3 border-b border-border/50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                wrappedShowHistory();
              }}
              className="flex-1 py-2 px-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Target: {targetSets} sets
            </span>
          </div>

          {/* AI Suggestion badge */}
          {suggestion && exercise.sets.length === 0 && (
            <AISuggestionBadge suggestion={suggestion} weightUnit={weightUnit} />
          )}

          {/* All Sets (Completed + Empty) */}
          {allSets.length > 0 && (
            <div className="mt-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                Sets
              </span>
              <div className="space-y-2">
                {allSets.map((setItem) => {
                  const isSetExpanded = expandedSetIndex === setItem.index;

                  if (setItem.type === 'completed' && setItem.data) {
                    return (
                      <CompletedSetAccordion
                        key={setItem.index}
                        setIndex={setItem.index}
                        weight={setItem.data.weight}
                        unit={setItem.data.unit}
                        reps={setItem.data.reps}
                        weightUnit={weightUnit}
                        isExpanded={isSetExpanded}
                        isEditing={editingSetIndex === setItem.index}
                        editingWeight={editingWeight}
                        editingReps={editingReps}
                        onToggle={() => handleToggleSet(setItem.index)}
                        onStartEditing={() =>
                          handleStartEditing(setItem.index, setItem.data!.weight, setItem.data!.reps)
                        }
                        onFinishEditing={() =>
                          handleFinishEditing(
                            setItem.index,
                            setItem.data!.reps,
                            setItem.data!.weight,
                            (setIdx, reps, weight) =>
                              updateSetForExercise(index, setIdx, reps, weight)
                          )
                        }
                        onRemoveSet={() => {
                          removeSetForExercise(index, setItem.index);
                          setEditingSetIndex(null);
                          setEditingWeight(null);
                          setEditingReps(null);
                        }}
                        onEditingWeightChange={setEditingWeight}
                        onEditingRepsChange={setEditingReps}
                      />
                    );
                  } else {
                    return (
                      <EmptySetAccordion
                        key={setItem.index}
                        setIndex={setItem.index}
                        targetReps={targetReps}
                        lastSetWeight={lastSetWeight}
                        weightUnit={weightUnit}
                        isExpanded={isSetExpanded}
                        weightInput={weightInput}
                        repsInput={repsInput}
                        canRemoveSet={targetSets > 1}
                        onToggle={() => handleToggleSet(setItem.index)}
                        onWeightChange={setWeightInput}
                        onRepsChange={setRepsInput}
                        onAdjustWeight={adjustWeight}
                        onAdjustReps={adjustReps}
                        onCompleteSet={handleCompleteSet}
                        onRemoveSet={() => {
                          wrappedUpdateTargetSets(-1);
                          setExpandedSetIndex(null);
                        }}
                      />
                    );
                  }
                })}
              </div>
            </div>
          )}

          {/* Add Set Button */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleAddSet(wrappedUpdateTargetSets);
            }}
            variant="outline"
            className="mt-4 w-full"
          >
            + Add Set
          </Button>

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
