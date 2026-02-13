import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkoutPlans } from './useWorkoutPlans';
import { useAppStore } from '../store/useAppStore';
import { createMockExercise } from '../test/fixtures/exercises';

// Helper to reset store between tests
const resetStore = () => {
  useAppStore.setState({
    templates: [],
    sessions: [],
    activeSession: null,
    preferences: {
      weightUnit: 'lbs',
      distanceUnit: 'mi',
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
    workoutGoal: 'build',
  });
};

describe('useWorkoutPlans', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('custom exercise editing', () => {
    it('should identify user own custom exercises', () => {
      const customExercise = createMockExercise({ id: 'custom-1', name: 'My Exercise' });
      useAppStore.getState().addCustomExercise(customExercise);

      const { result } = renderHook(() => useWorkoutPlans());

      expect(result.current.isOwnCustomExercise('custom-1')).toBe(true);
      expect(result.current.isOwnCustomExercise('bench-press')).toBe(false);
      expect(result.current.isOwnCustomExercise('non-existent')).toBe(false);
    });

    it('should open edit custom exercise modal', () => {
      const { result } = renderHook(() => useWorkoutPlans());

      expect(result.current.editingCustomExercise).toBeNull();

      act(() => {
        result.current.openEditCustomExercise('custom-1', 'My Exercise');
      });

      expect(result.current.editingCustomExercise).toEqual({
        id: 'custom-1',
        name: 'My Exercise',
      });
    });

    it('should close edit custom exercise modal', () => {
      const { result } = renderHook(() => useWorkoutPlans());

      act(() => {
        result.current.openEditCustomExercise('custom-1', 'My Exercise');
      });

      expect(result.current.editingCustomExercise).not.toBeNull();

      act(() => {
        result.current.closeEditCustomExercise();
      });

      expect(result.current.editingCustomExercise).toBeNull();
    });

    it('should save custom exercise name', () => {
      const customExercise = createMockExercise({ id: 'custom-1', name: 'Original Name' });
      useAppStore.getState().addCustomExercise(customExercise);

      const { result } = renderHook(() => useWorkoutPlans());

      act(() => {
        result.current.openEditCustomExercise('custom-1', 'Original Name');
      });

      act(() => {
        result.current.saveCustomExerciseName('custom-1', 'Updated Name');
      });

      // Check store was updated
      const state = useAppStore.getState();
      expect(state.customExercises[0].name).toBe('Updated Name');

      // Check modal was closed
      expect(result.current.editingCustomExercise).toBeNull();
    });

    it('should update exercise name in allExercises list', () => {
      const customExercise = createMockExercise({ id: 'custom-1', name: 'Original Name' });
      useAppStore.getState().addCustomExercise(customExercise);

      const { result, rerender } = renderHook(() => useWorkoutPlans());

      // Find exercise in allExercises
      const beforeUpdate = result.current.allExercises.find(e => e.id === 'custom-1');
      expect(beforeUpdate?.name).toBe('Original Name');

      act(() => {
        result.current.saveCustomExerciseName('custom-1', 'New Name');
      });

      // Re-render to get updated state
      rerender();

      const afterUpdate = result.current.allExercises.find(e => e.id === 'custom-1');
      expect(afterUpdate?.name).toBe('New Name');
    });

    it('should update getExerciseName result after editing', () => {
      const customExercise = createMockExercise({ id: 'custom-1', name: 'Original Name' });
      useAppStore.getState().addCustomExercise(customExercise);

      const { result, rerender } = renderHook(() => useWorkoutPlans());

      expect(result.current.getExerciseName('custom-1')).toBe('Original Name');

      act(() => {
        result.current.saveCustomExerciseName('custom-1', 'New Name');
      });

      rerender();

      expect(result.current.getExerciseName('custom-1')).toBe('New Name');
    });
  });
});
