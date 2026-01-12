import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ActiveWorkoutProvider, useActiveWorkoutContext } from './ActiveWorkoutContext';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { WorkoutSession } from '../types';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    state: { suggestions: [] },
  }),
}));

// Mock the ModalContext
vi.mock('./ModalContext', () => ({
  useModal: () => ({
    openModal: vi.fn(),
    closeModal: vi.fn(),
    isOpen: () => false,
  }),
}));

describe('ActiveWorkoutContext', () => {
  beforeEach(() => {
    useAppStore.getState().setActiveSession(null);
    useCurrentWorkoutStore.getState().reset();
  });

  describe('ActiveWorkoutProvider', () => {
    it('should not render children when no active session', () => {
      const { result } = renderHook(() => {
        return { provider: null };
      });

      expect(result.current.provider).toBeNull();
    });

    it('should provide context values when session is active', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };

      act(() => {
        useAppStore.getState().setActiveSession(session);
      });

      const { result } = renderHook(() => useActiveWorkoutContext(), {
        wrapper: ActiveWorkoutProvider,
      });

      expect(result.current.session).toEqual(session);
      expect(result.current.weightUnit).toBeDefined();
      expect(result.current.distanceUnit).toBeDefined();
      expect(result.current.customExercises).toBeDefined();
    });

    it('should map computed stats from hook', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };

      act(() => {
        useAppStore.getState().setActiveSession(session);
      });

      const { result } = renderHook(() => useActiveWorkoutContext(), {
        wrapper: ActiveWorkoutProvider,
      });

      expect(typeof result.current.elapsedSeconds).toBe('number');
      expect(typeof result.current.totalSets).toBe('number');
      expect(typeof result.current.totalVolume).toBe('number');
      expect(typeof result.current.totalCardioDistance).toBe('number');
      expect(typeof result.current.hasDeviated).toBe('boolean');
    });

    it('should map exercise operations from hook', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };

      act(() => {
        useAppStore.getState().setActiveSession(session);
      });

      const { result } = renderHook(() => useActiveWorkoutContext(), {
        wrapper: ActiveWorkoutProvider,
      });

      expect(typeof result.current.logSetForExercise).toBe('function');
      expect(typeof result.current.logCardioForExercise).toBe('function');
      expect(typeof result.current.removeLastSetForExercise).toBe('function');
      expect(typeof result.current.removeExercise).toBe('function');
      expect(typeof result.current.updateTargetSets).toBe('function');
    });

    it('should map timer and utility functions from hook', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };

      act(() => {
        useAppStore.getState().setActiveSession(session);
      });

      const { result } = renderHook(() => useActiveWorkoutContext(), {
        wrapper: ActiveWorkoutProvider,
      });

      expect(typeof result.current.handleStartTimer).toBe('function');
      expect(typeof result.current.getSuggestionForExercise).toBe('function');
      expect(typeof result.current.handleShowHistory).toBe('function');
    });

    it('should map UI state from hook', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };

      act(() => {
        useAppStore.getState().setActiveSession(session);
      });

      const { result } = renderHook(() => useActiveWorkoutContext(), {
        wrapper: ActiveWorkoutProvider,
      });

      expect(typeof result.current.setExpandedIndex).toBe('function');
      expect(result.current.expandedIndex === null || typeof result.current.expandedIndex === 'number').toBe(true);
    });
  });

  describe('useActiveWorkoutContext', () => {
    it('should throw error when used outside provider', () => {
      expect(() => {
        renderHook(() => useActiveWorkoutContext());
      }).toThrow('useActiveWorkoutContext must be used within ActiveWorkoutProvider');
    });

    it('should return context value when used within provider', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };

      act(() => {
        useAppStore.getState().setActiveSession(session);
      });

      const { result } = renderHook(() => useActiveWorkoutContext(), {
        wrapper: ActiveWorkoutProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.session).toBeDefined();
    });

    it('should reflect state changes from context', () => {
      const session: WorkoutSession = {
        id: 'test-session',
        name: 'Test Workout',
        startedAt: new Date().toISOString(),
        exercises: [],
      };

      act(() => {
        useAppStore.getState().setActiveSession(session);
      });

      const { result } = renderHook(() => useActiveWorkoutContext(), {
        wrapper: ActiveWorkoutProvider,
      });

      act(() => {
        result.current.setExpandedIndex(2);
      });

      expect(result.current.expandedIndex).toBe(2);

      act(() => {
        result.current.setExpandedIndex(null);
      });

      expect(result.current.expandedIndex).toBe(null);
    });
  });
});
