import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExerciseManagement } from './useExerciseManagement';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { WorkoutSession, StrengthSessionExercise } from '../types';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

describe('useExerciseManagement - Drag and Drop', () => {
  beforeEach(() => {
    useAppStore.getState().setActiveSession(null);
    useCurrentWorkoutStore.getState().reset();
  });

  // Helper to create a test session with exercises
  const createTestSession = (count: number): WorkoutSession => {
    const exercises: StrengthSessionExercise[] = Array.from({ length: count }, (_, i) => ({
      id: `exercise-${i}`,
      type: 'strength' as const,
      exerciseId: `bench-press-${i}`,
      targetSets: 3,
      targetReps: 10,
      restSeconds: 90,
      sets: [],
    }));

    return {
      id: 'test-session',
      name: 'Test Workout',
      startedAt: new Date().toISOString(),
      exercises,
    };
  };

  describe('reorderExercises', () => {
    it('should reorder exercise when dragging from index 0 to index 1', () => {
      const session = createTestSession(3);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-1');
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-1');
      expect(updatedSession?.exercises[1].id).toBe('exercise-0');
      expect(updatedSession?.exercises[2].id).toBe('exercise-2');
    });

    it('should reorder exercise when dragging from index 2 to index 0', () => {
      const session = createTestSession(3);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-2', 'exercise-0');
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-2');
      expect(updatedSession?.exercises[1].id).toBe('exercise-0');
      expect(updatedSession?.exercises[2].id).toBe('exercise-1');
    });

    it('should reorder exercise from first to last position', () => {
      const session = createTestSession(4);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-3');
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-1');
      expect(updatedSession?.exercises[1].id).toBe('exercise-2');
      expect(updatedSession?.exercises[2].id).toBe('exercise-3');
      expect(updatedSession?.exercises[3].id).toBe('exercise-0');
    });

    it('should reorder exercise from last to first position', () => {
      const session = createTestSession(4);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-3', 'exercise-0');
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-3');
      expect(updatedSession?.exercises[1].id).toBe('exercise-0');
      expect(updatedSession?.exercises[2].id).toBe('exercise-1');
      expect(updatedSession?.exercises[3].id).toBe('exercise-2');
    });

    it('should not reorder when active and over are the same', () => {
      const session = createTestSession(3);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-0');
      });

      const updatedSession = useAppStore.getState().activeSession;
      // Should remain in same order
      expect(updatedSession?.exercises[0].id).toBe('exercise-0');
      expect(updatedSession?.exercises[1].id).toBe('exercise-1');
      expect(updatedSession?.exercises[2].id).toBe('exercise-2');
    });

    it('should not reorder when active or over IDs do not exist', () => {
      const session = createTestSession(3);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      const originalSession = useAppStore.getState().activeSession;

      act(() => {
        result.current.reorderExercises('non-existent', 'exercise-1');
      });

      const updatedSession = useAppStore.getState().activeSession;
      // Should remain unchanged
      expect(updatedSession?.exercises).toEqual(originalSession?.exercises);
    });

    it('should handle multiple consecutive reorders correctly', () => {
      const session = createTestSession(4);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      // First reorder: move 0 to position of 1
      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-1');
      });

      let updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-1');
      expect(updatedSession?.exercises[1].id).toBe('exercise-0');

      // Second reorder: move the item at position 3 to position 0
      act(() => {
        result.current.reorderExercises('exercise-3', 'exercise-1');
      });

      updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-3');
    });

    it('should preserve exercise data (sets, targetSets, etc) during reorder', () => {
      const session = createTestSession(2);
      // Add a completed set to the first exercise
      const firstExercise = session.exercises[0] as StrengthSessionExercise;
      firstExercise.sets = [
        {
          type: 'strength' as const,
          reps: 10,
          weight: 135,
          unit: 'lbs' as const,
          completedAt: new Date().toISOString(),
        },
      ];
      firstExercise.targetSets = 5;
      firstExercise.targetReps = 12;

      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-1');
      });

      const updatedSession = useAppStore.getState().activeSession;
      const movedExercise = updatedSession?.exercises[1] as StrengthSessionExercise | undefined;

      expect(movedExercise?.sets.length).toBe(1);
      expect((movedExercise?.sets[0] as any)?.reps).toBe(10);
      expect((movedExercise?.sets[0] as any)?.weight).toBe(135);
      expect(movedExercise?.targetSets).toBe(5);
      expect(movedExercise?.targetReps).toBe(12);
    });
  });

  describe('reorderExercises with expandedIndex', () => {
    it('should not modify expandedIndex (handled elsewhere)', () => {
      const session = createTestSession(3);
      useAppStore.getState().setActiveSession(session);
      useCurrentWorkoutStore.getState().setExpandedIndex(1);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-2');
      });

      // expandedIndex should remain unchanged (reorderExercises doesn't touch it)
      const expandedIndex = useCurrentWorkoutStore.getState().expandedIndex;
      expect(expandedIndex).toBe(1);
    });
  });

  describe('reorderExercises edge cases', () => {
    it('should handle reordering with single exercise', () => {
      const session = createTestSession(1);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-0');
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises.length).toBe(1);
      expect(updatedSession?.exercises[0].id).toBe('exercise-0');
    });

    it('should handle reordering with two exercises in both directions', () => {
      const session = createTestSession(2);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      // Move 0 to 1
      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-1');
      });

      let updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-1');
      expect(updatedSession?.exercises[1].id).toBe('exercise-0');

      // Move back to original position
      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-1');
      });

      updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-0');
      expect(updatedSession?.exercises[1].id).toBe('exercise-1');
    });

    it('should handle reordering with many exercises (10+)', () => {
      const session = createTestSession(10);
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useExerciseManagement());

      act(() => {
        result.current.reorderExercises('exercise-0', 'exercise-9');
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('exercise-1');
      expect(updatedSession?.exercises[9].id).toBe('exercise-0');
      expect(updatedSession?.exercises.length).toBe(10);
    });
  });
});
