import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRestTimer } from './useRestTimer';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';

describe('useRestTimer', () => {
  beforeEach(() => {
    // Reset store before each test
    useCurrentWorkoutStore.getState().reset();
  });

  describe('initial state', () => {
    it('should return showTimer as false initially', () => {
      const { result } = renderHook(() => useRestTimer());
      expect(result.current.showTimer).toBe(false);
    });

    it('should return default timer duration', () => {
      const { result } = renderHook(() => useRestTimer());
      expect(result.current.timerDuration).toBe(90);
    });
  });

  describe('handleStartTimer', () => {
    it('should set timer duration and show timer', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.handleStartTimer(60);
      });

      expect(result.current.timerDuration).toBe(60);
      expect(result.current.showTimer).toBe(true);
    });

    it('should update duration when called with different values', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.handleStartTimer(120);
      });

      expect(result.current.timerDuration).toBe(120);

      act(() => {
        result.current.handleStartTimer(45);
      });

      expect(result.current.timerDuration).toBe(45);
    });
  });

  describe('hideTimer', () => {
    it('should hide the timer', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.handleStartTimer(60);
      });

      expect(result.current.showTimer).toBe(true);

      act(() => {
        result.current.hideTimer();
      });

      expect(result.current.showTimer).toBe(false);
    });

    it('should not affect timer duration when hiding', () => {
      const { result } = renderHook(() => useRestTimer());

      act(() => {
        result.current.handleStartTimer(60);
      });

      act(() => {
        result.current.hideTimer();
      });

      expect(result.current.timerDuration).toBe(60);
    });
  });

  describe('memoization', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useRestTimer());

      const firstHandleStartTimer = result.current.handleStartTimer;
      const firstHideTimer = result.current.hideTimer;

      rerender();

      expect(result.current.handleStartTimer).toBe(firstHandleStartTimer);
      expect(result.current.hideTimer).toBe(firstHideTimer);
    });
  });
});
