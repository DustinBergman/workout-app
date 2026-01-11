import { useState, useEffect, useCallback, useMemo } from 'react';
import { StrengthSessionExercise, ExerciseSuggestion, WeightUnit } from '../types';

export interface SetItem {
  type: 'completed' | 'empty';
  data?: { weight: number; unit: string; reps: number; type?: string };
  index: number;
}

export interface UseExerciseAccordionProps {
  exercise: StrengthSessionExercise;
  index: number;
  isExpanded: boolean;
  suggestion: ExerciseSuggestion | undefined;
  weightUnit: WeightUnit;
  onLogSet: (reps: number, weight: number) => void;
  onRemoveExercise: () => void;
  onRemoveSet: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, reps: number, weight: number) => void;
  onUpdateTargetSets: (delta: number) => void;
  onStartTimer: (seconds: number) => void;
}

export const useExerciseAccordion = ({
  exercise,
  isExpanded,
  suggestion,
  onLogSet,
  onStartTimer,
}: UseExerciseAccordionProps) => {
  // Input state
  const [repsInput, setRepsInput] = useState('');
  const [weightInput, setWeightInput] = useState('');
  const [expandedSetIndex, setExpandedSetIndex] = useState<number | null>(null);

  // Editing state
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [editingWeight, setEditingWeight] = useState<number | null>(null);
  const [editingReps, setEditingReps] = useState<number | null>(null);

  // Computed values
  const isComplete = exercise.sets.length >= (exercise.targetSets || 3);
  const progress = `${exercise.sets.length}/${exercise.targetSets || 3}`;
  const targetSets = exercise.targetSets || 3;

  // Calculate average weight for collapsed view (only for strength sets)
  const avgWeight = useMemo(() => {
    const strengthSets = exercise.sets.filter(
      (s) => s.type === 'strength' || !('type' in s)
    );
    return strengthSets.length > 0
      ? Math.round(
          strengthSets.reduce((sum, s) => sum + ('weight' in s ? s.weight : 0), 0) /
            strengthSets.length
        )
      : 0;
  }, [exercise.sets]);

  // Generate array of all sets (completed + empty placeholders)
  const allSets: SetItem[] = useMemo(() => {
    return Array.from({ length: exercise.targetSets || 3 }, (_, idx) => {
      if (idx < exercise.sets.length) {
        const set = exercise.sets[idx];
        return {
          type: 'completed' as const,
          data: set as { weight: number; unit: string; reps: number; type?: string },
          index: idx,
        };
      }
      return { type: 'empty' as const, index: idx };
    });
  }, [exercise.sets, exercise.targetSets]);

  // Get suggested/last values for empty sets
  const getEmptySetDefaults = useCallback(() => {
    const lastSetWeight =
      exercise.sets.length > 0
        ? (exercise.sets[exercise.sets.length - 1] as { weight?: number }).weight || 0
        : suggestion?.suggestedWeight || 0;

    const targetReps =
      exercise.sets.length === 0 && suggestion
        ? suggestion.suggestedReps
        : exercise.targetReps || 10;

    return { lastSetWeight, targetReps };
  }, [exercise.sets, exercise.targetReps, suggestion]);

  // Auto-open next incomplete set when exercise accordion is expanded
  useEffect(() => {
    if (isExpanded) {
      setExpandedSetIndex(exercise.sets.length);
    }
  }, [isExpanded]);

  // Pre-fill inputs when an empty set is expanded
  useEffect(() => {
    if (expandedSetIndex !== null && expandedSetIndex >= exercise.sets.length) {
      // Empty set accordion expanded
      if (exercise.sets.length > 0) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        if (lastSet.type === 'strength' || !('type' in lastSet)) {
          setWeightInput(('weight' in lastSet ? lastSet.weight : 0).toString());
        }
      } else if (suggestion) {
        setWeightInput(suggestion.suggestedWeight.toString());
      } else {
        setWeightInput('');
      }
      // Use AI suggested reps when available (no sets completed yet), otherwise use template target
      const reps =
        exercise.sets.length === 0 && suggestion
          ? suggestion.suggestedReps
          : exercise.targetReps || 10;
      setRepsInput(reps.toString());
    }
  }, [expandedSetIndex, exercise.sets.length, exercise.targetReps, suggestion]);

  // Handlers
  const handleLogSet = useCallback(() => {
    const reps = parseInt(repsInput) || 0;
    const weight = parseFloat(weightInput) || 0;
    if (reps <= 0) return;

    onLogSet(reps, weight);
    onStartTimer(exercise.restSeconds || 90);
  }, [repsInput, weightInput, onLogSet, onStartTimer, exercise.restSeconds]);

  const handleCompleteSet = useCallback(() => {
    handleLogSet();
    setExpandedSetIndex(null);
    setRepsInput('');
    setWeightInput('');
  }, [handleLogSet]);

  const handleToggleSet = useCallback(
    (setIndex: number) => {
      setExpandedSetIndex(expandedSetIndex === setIndex ? null : setIndex);
    },
    [expandedSetIndex]
  );

  const handleStartEditing = useCallback(
    (setIndex: number, weight: number, reps: number) => {
      setEditingSetIndex(setIndex);
      setEditingWeight(weight);
      setEditingReps(reps);
    },
    []
  );

  const handleCancelEditing = useCallback(() => {
    setEditingSetIndex(null);
    setEditingWeight(null);
    setEditingReps(null);
  }, []);

  const handleFinishEditing = useCallback(
    (
      setIndex: number,
      defaultReps: number,
      defaultWeight: number,
      onUpdateSet: (setIndex: number, reps: number, weight: number) => void
    ) => {
      const finalReps = editingReps ?? defaultReps;
      const finalWeight = editingWeight ?? defaultWeight;
      onUpdateSet(setIndex, finalReps, finalWeight);
      setEditingSetIndex(null);
      setExpandedSetIndex(null);
      setEditingWeight(null);
      setEditingReps(null);
    },
    [editingReps, editingWeight]
  );

  const handleAddSet = useCallback(
    (onUpdateTargetSets: (delta: number) => void) => {
      onUpdateTargetSets(1);
      setRepsInput('');
      setWeightInput('');
      setExpandedSetIndex(exercise.targetSets || 3);
    },
    [exercise.targetSets]
  );

  const adjustWeight = useCallback(
    (delta: number) => {
      const current = parseFloat(weightInput) || 0;
      setWeightInput(Math.max(0, current + delta).toString());
    },
    [weightInput]
  );

  const adjustReps = useCallback(
    (delta: number) => {
      const current = parseInt(repsInput) || 0;
      setRepsInput(Math.max(1, current + delta).toString());
    },
    [repsInput]
  );

  return {
    // Input state
    repsInput,
    setRepsInput,
    weightInput,
    setWeightInput,
    expandedSetIndex,
    setExpandedSetIndex,

    // Editing state
    editingSetIndex,
    setEditingSetIndex,
    editingWeight,
    setEditingWeight,
    editingReps,
    setEditingReps,

    // Computed values
    isComplete,
    progress,
    targetSets,
    avgWeight,
    allSets,

    // Helpers
    getEmptySetDefaults,

    // Handlers
    handleLogSet,
    handleCompleteSet,
    handleToggleSet,
    handleStartEditing,
    handleCancelEditing,
    handleFinishEditing,
    handleAddSet,
    adjustWeight,
    adjustReps,
  };
};
