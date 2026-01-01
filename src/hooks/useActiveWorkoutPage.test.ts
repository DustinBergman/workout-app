import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveWorkoutPage } from './useActiveWorkoutPage';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { WorkoutSession, StrengthSessionExercise } from '../types';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    state: { suggestions: [] },
  }),
}));

describe('useActiveWorkoutPage', () => {
  beforeEach(() => {
    useAppStore.getState().setActiveSession(null);
    useCurrentWorkoutStore.getState().reset();
  });

  describe('store state access', () => {
    it('should provide access to app store state', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(result.current.session).toEqual(session);
      expect(result.current.customExercises).toBeDefined();
      expect(result.current.sessions).toBeDefined();
      expect(result.current.weightUnit).toBeDefined();
      expect(result.current.distanceUnit).toBeDefined();
    });

    it('should provide access to current workout store state', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(result.current.expandedIndex).toBe(null);
      expect(result.current.showTimer).toBe(false);
      expect(result.current.showExercisePicker).toBe(false);
      expect(result.current.showFinishConfirm).toBe(false);
      expect(result.current.updatePlan).toBe(false);
    });

    it('should allow updating expanded index', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      act(() => {
        result.current.setExpandedIndex(2);
      });

      expect(useCurrentWorkoutStore.getState().expandedIndex).toBe(2);
    });

    it('should allow updating exercise search', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      act(() => {
        result.current.setExerciseSearch('bench');
      });

      expect(useCurrentWorkoutStore.getState().exerciseSearch).toBe('bench');
    });
  });

  describe('exercise management', () => {
    it('should provide exercise management functions', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.logSetForExercise).toBe('function');
      expect(typeof result.current.logCardioForExercise).toBe('function');
      expect(typeof result.current.removeLastSetForExercise).toBe('function');
      expect(typeof result.current.addExerciseToSession).toBe('function');
      expect(typeof result.current.removeExercise).toBe('function');
      expect(typeof result.current.updateTargetSets).toBe('function');
      expect(typeof result.current.reorderExercises).toBe('function');
    });

    it('should provide custom exercise functions', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.createExercise).toBe('function');
      expect(typeof result.current.setIsCreatingExercise).toBe('function');
      expect(typeof result.current.setNewExerciseName).toBe('function');
      expect(typeof result.current.setNewExerciseEquipment).toBe('function');
      expect(typeof result.current.toggleMuscleGroup).toBe('function');
      expect(typeof result.current.resetNewExerciseForm).toBe('function');
      expect(result.current.customExerciseState).toBeDefined();
    });
  });

  describe('rest timer', () => {
    it('should provide rest timer functions', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.handleStartTimer).toBe('function');
      expect(typeof result.current.hideTimer).toBe('function');
    });
  });

  describe('exercise history', () => {
    it('should provide exercise history functions', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.handleShowHistory).toBe('function');
      expect(typeof result.current.closeHistory).toBe('function');
      expect(result.current.historyExerciseId).toBeDefined();
      expect(result.current.historyExerciseName).toBeDefined();
    });
  });

  describe('workout session stats', () => {
    it('should provide workout session statistics', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.elapsedSeconds).toBe('number');
      expect(typeof result.current.totalSets).toBe('number');
      expect(typeof result.current.totalVolume).toBe('number');
      expect(typeof result.current.totalCardioDistance).toBe('number');
      expect(typeof result.current.hasDeviated).toBe('boolean');
    });

    it('should provide exercise filtering', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(Array.isArray(result.current.filteredExercises)).toBe(true);
      expect(typeof result.current.getSuggestionForExercise).toBe('function');
    });
  });

  describe('workout completion', () => {
    it('should provide workout completion functions', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.finishWorkout).toBe('function');
      expect(typeof result.current.cancelWorkout).toBe('function');
    });

    it('should provide scoring state', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.isScoring).toBe('boolean');
      expect(result.current.scoreResult).toBeDefined();
      expect(result.current.scoreError).toBeDefined();
      expect(typeof result.current.clearScoreResult).toBe('function');
    });
  });

  describe('custom exercise creation handler', () => {
    it('should handle custom exercise creation', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.handleCreateExercise).toBe('function');
    });
  });

  describe('drag and drop', () => {
    it('should provide DND sensors', () => {
      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(result.current.sensors).toBeDefined();
      expect(Array.isArray(result.current.sensors)).toBe(true);
    });

    it('should handle drag end events', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [
          {
            id: 'ex-0',
            type: 'strength' as const,
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [],
          },
          {
            id: 'ex-1',
            type: 'strength' as const,
            exerciseId: 'squat',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [],
          },
        ],
      };
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useActiveWorkoutPage());

      expect(typeof result.current.handleDragEnd).toBe('function');

      // Test that drag end handler calls reorderExercises
      act(() => {
        result.current.handleDragEnd({
          active: { id: 'ex-0' },
          over: { id: 'ex-1' },
        } as any);
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('ex-1');
      expect(updatedSession?.exercises[1].id).toBe('ex-0');
    });

    it('should not reorder when active and over are the same', () => {
      const exercises: StrengthSessionExercise[] = [
        {
          id: 'ex-0',
          type: 'strength',
          exerciseId: 'bench-press',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [],
        },
        {
          id: 'ex-1',
          type: 'strength',
          exerciseId: 'squat',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [],
        },
      ];
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises,
      };
      useAppStore.getState().setActiveSession(session);

      const { result } = renderHook(() => useActiveWorkoutPage());

      act(() => {
        result.current.handleDragEnd({
          active: { id: 'ex-0' },
          over: { id: 'ex-0' },
        } as any);
      });

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('ex-0');
      expect(updatedSession?.exercises[1].id).toBe('ex-1');
    });

    it('should skip auto-expand on drag end', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [
          {
            id: 'ex-0',
            type: 'strength' as const,
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [],
          },
          {
            id: 'ex-1',
            type: 'strength' as const,
            exerciseId: 'squat',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [],
          },
        ],
      };
      useAppStore.getState().setActiveSession(session);
      useCurrentWorkoutStore.getState().setExpandedIndex(1);

      const { result } = renderHook(() => useActiveWorkoutPage());

      act(() => {
        result.current.handleDragEnd({
          active: { id: 'ex-0' },
          over: { id: 'ex-1' },
        } as any);
      });

      // Verify that the exercises were reordered
      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('ex-1');
      expect(updatedSession?.exercises[1].id).toBe('ex-0');

      // Verify that expandedIndex was set to null
      expect(useCurrentWorkoutStore.getState().expandedIndex).toBe(null);
    });
  });

  describe('migration effect', () => {
    it('should migrate exercises without IDs', () => {
      const exercises: any[] = [
        {
          type: 'strength',
          exerciseId: 'bench-press',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [],
        },
        {
          type: 'strength',
          exerciseId: 'squat',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [],
        },
      ];
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: exercises as any,
      };
      useAppStore.getState().setActiveSession(session);

      renderHook(() => useActiveWorkoutPage());

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('migrated-test-session-0');
      expect(updatedSession?.exercises[1].id).toBe('migrated-test-session-1');
    });

    it('should not migrate exercises that already have IDs', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [
          {
            id: 'ex-0',
            type: 'strength' as const,
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [],
          },
        ],
      };
      useAppStore.getState().setActiveSession(session);

      renderHook(() => useActiveWorkoutPage());

      const updatedSession = useAppStore.getState().activeSession;
      expect(updatedSession?.exercises[0].id).toBe('ex-0');
    });
  });

  describe('scroll prevention', () => {
    it('should set up scroll prevention on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      renderHook(() => useActiveWorkoutPage());

      expect(addEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function), {
        passive: false,
      });
      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), {
        passive: true,
      });

      addEventListenerSpy.mockRestore();
    });

    it('should clean up scroll prevention on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useActiveWorkoutPage());
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });
  });
});
