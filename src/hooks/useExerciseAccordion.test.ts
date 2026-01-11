import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExerciseAccordion, UseExerciseAccordionProps } from './useExerciseAccordion';
import { StrengthSessionExercise, ExerciseSuggestion, StrengthCompletedSet } from '../types';

const createMockSet = (weight: number, reps: number): StrengthCompletedSet => ({
  type: 'strength',
  weight,
  unit: 'lbs',
  reps,
  completedAt: new Date().toISOString(),
});

const createMockExercise = (
  overrides?: Partial<StrengthSessionExercise>
): StrengthSessionExercise => ({
  id: 'exercise-1',
  type: 'strength',
  exerciseId: 'bench-press',
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  sets: [],
  ...overrides,
});

const createMockSuggestion = (
  overrides?: Partial<ExerciseSuggestion>
): ExerciseSuggestion => ({
  exerciseId: 'bench-press',
  suggestedWeight: 135,
  suggestedReps: 8,
  reasoning: 'Based on your progress',
  confidence: 'high',
  ...overrides,
});

const createDefaultProps = (
  overrides?: Partial<UseExerciseAccordionProps>
): UseExerciseAccordionProps => ({
  exercise: createMockExercise(),
  index: 0,
  isExpanded: false,
  suggestion: undefined,
  weightUnit: 'lbs',
  onLogSet: vi.fn(),
  onRemoveExercise: vi.fn(),
  onRemoveSet: vi.fn(),
  onUpdateSet: vi.fn(),
  onUpdateTargetSets: vi.fn(),
  onStartTimer: vi.fn(),
  ...overrides,
});

describe('useExerciseAccordion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('computed values', () => {
    it('calculates isComplete correctly when sets >= targetSets', () => {
      const exercise = createMockExercise({
        targetSets: 3,
        sets: [
          createMockSet(135, 10),
          createMockSet(135, 10),
          createMockSet(135, 10),
        ],
      });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ exercise }))
      );

      expect(result.current.isComplete).toBe(true);
    });

    it('calculates isComplete as false when sets < targetSets', () => {
      const exercise = createMockExercise({
        targetSets: 3,
        sets: [createMockSet(135, 10)],
      });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ exercise }))
      );

      expect(result.current.isComplete).toBe(false);
    });

    it('calculates progress string correctly', () => {
      const exercise = createMockExercise({
        targetSets: 3,
        sets: [createMockSet(135, 10)],
      });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ exercise }))
      );

      expect(result.current.progress).toBe('1/3');
    });

    it('calculates avgWeight correctly', () => {
      const exercise = createMockExercise({
        sets: [createMockSet(100, 10), createMockSet(150, 10)],
      });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ exercise }))
      );

      expect(result.current.avgWeight).toBe(125);
    });

    it('generates allSets array with completed and empty sets', () => {
      const exercise = createMockExercise({
        targetSets: 3,
        sets: [createMockSet(135, 10)],
      });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ exercise }))
      );

      expect(result.current.allSets).toHaveLength(3);
      expect(result.current.allSets[0].type).toBe('completed');
      expect(result.current.allSets[1].type).toBe('empty');
      expect(result.current.allSets[2].type).toBe('empty');
    });
  });

  describe('getEmptySetDefaults', () => {
    it('returns AI suggested values when no sets and suggestion available', () => {
      const suggestion = createMockSuggestion({
        suggestedWeight: 145,
        suggestedReps: 8,
      });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ suggestion }))
      );

      const defaults = result.current.getEmptySetDefaults();
      expect(defaults.lastSetWeight).toBe(145);
      expect(defaults.targetReps).toBe(8);
    });

    it('returns last set weight when sets exist', () => {
      const exercise = createMockExercise({
        sets: [createMockSet(155, 10)],
      });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ exercise }))
      );

      const defaults = result.current.getEmptySetDefaults();
      expect(defaults.lastSetWeight).toBe(155);
    });

    it('returns exercise targetReps when sets exist (ignores suggestion)', () => {
      const exercise = createMockExercise({
        targetReps: 12,
        sets: [createMockSet(155, 10)],
      });
      const suggestion = createMockSuggestion({ suggestedReps: 8 });

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ exercise, suggestion }))
      );

      const defaults = result.current.getEmptySetDefaults();
      expect(defaults.targetReps).toBe(12);
    });
  });

  describe('input state management', () => {
    it('adjustWeight adds delta to current weight', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.setWeightInput('100');
      });

      act(() => {
        result.current.adjustWeight(10);
      });

      expect(result.current.weightInput).toBe('110');
    });

    it('adjustWeight prevents negative values', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.setWeightInput('5');
      });

      act(() => {
        result.current.adjustWeight(-10);
      });

      expect(result.current.weightInput).toBe('0');
    });

    it('adjustReps adds delta to current reps', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.setRepsInput('10');
      });

      act(() => {
        result.current.adjustReps(2);
      });

      expect(result.current.repsInput).toBe('12');
    });

    it('adjustReps prevents values below 1', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.setRepsInput('2');
      });

      act(() => {
        result.current.adjustReps(-5);
      });

      expect(result.current.repsInput).toBe('1');
    });
  });

  describe('set toggling', () => {
    it('handleToggleSet expands set when collapsed', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      expect(result.current.expandedSetIndex).toBeNull();

      act(() => {
        result.current.handleToggleSet(1);
      });

      expect(result.current.expandedSetIndex).toBe(1);
    });

    it('handleToggleSet collapses set when expanded', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.handleToggleSet(1);
      });

      expect(result.current.expandedSetIndex).toBe(1);

      act(() => {
        result.current.handleToggleSet(1);
      });

      expect(result.current.expandedSetIndex).toBeNull();
    });
  });

  describe('editing state', () => {
    it('handleStartEditing sets editing state', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.handleStartEditing(0, 135, 10);
      });

      expect(result.current.editingSetIndex).toBe(0);
      expect(result.current.editingWeight).toBe(135);
      expect(result.current.editingReps).toBe(10);
    });

    it('handleCancelEditing clears editing state', () => {
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.handleStartEditing(0, 135, 10);
      });

      act(() => {
        result.current.handleCancelEditing();
      });

      expect(result.current.editingSetIndex).toBeNull();
      expect(result.current.editingWeight).toBeNull();
      expect(result.current.editingReps).toBeNull();
    });

    it('handleFinishEditing calls onUpdateSet and clears state', () => {
      const onUpdateSet = vi.fn();
      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.handleStartEditing(0, 135, 10);
        result.current.setEditingWeight(140);
        result.current.setEditingReps(12);
      });

      act(() => {
        result.current.handleFinishEditing(0, 10, 135, onUpdateSet);
      });

      expect(onUpdateSet).toHaveBeenCalledWith(0, 12, 140);
      expect(result.current.editingSetIndex).toBeNull();
    });
  });

  describe('handleCompleteSet', () => {
    it('calls onLogSet and onStartTimer with correct values', () => {
      const onLogSet = vi.fn();
      const onStartTimer = vi.fn();

      const { result } = renderHook(() =>
        useExerciseAccordion(
          createDefaultProps({
            exercise: createMockExercise({ restSeconds: 120 }),
            onLogSet,
            onStartTimer,
          })
        )
      );

      act(() => {
        result.current.setRepsInput('10');
        result.current.setWeightInput('135');
      });

      act(() => {
        result.current.handleCompleteSet();
      });

      expect(onLogSet).toHaveBeenCalledWith(10, 135);
      expect(onStartTimer).toHaveBeenCalledWith(120);
      expect(result.current.expandedSetIndex).toBeNull();
      expect(result.current.repsInput).toBe('');
      expect(result.current.weightInput).toBe('');
    });

    it('does not call onLogSet if reps is 0', () => {
      const onLogSet = vi.fn();

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps({ onLogSet }))
      );

      act(() => {
        result.current.setRepsInput('0');
        result.current.setWeightInput('135');
      });

      act(() => {
        result.current.handleCompleteSet();
      });

      expect(onLogSet).not.toHaveBeenCalled();
    });
  });

  describe('handleAddSet', () => {
    it('calls onUpdateTargetSets and expands new set', () => {
      const onUpdateTargetSets = vi.fn();

      const { result } = renderHook(() =>
        useExerciseAccordion(createDefaultProps())
      );

      act(() => {
        result.current.setRepsInput('10');
        result.current.setWeightInput('135');
      });

      act(() => {
        result.current.handleAddSet(onUpdateTargetSets);
      });

      expect(onUpdateTargetSets).toHaveBeenCalledWith(1);
      // expandedSetIndex is set to targetSets (default 3)
      expect(result.current.expandedSetIndex).toBe(3);
    });
  });
});
