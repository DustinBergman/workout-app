import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with 0 seconds', () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.seconds).toBe(0);
    });

    it('should start not running', () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.isRunning).toBe(false);
    });

    it('should start not complete', () => {
      const { result } = renderHook(() => useTimer());
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('start', () => {
    it('should set the timer duration', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      expect(result.current.seconds).toBe(60);
    });

    it('should set isRunning to true', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(60);
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('should reset isComplete when starting', () => {
      const { result } = renderHook(() => useTimer());

      // Run timer to completion
      act(() => {
        result.current.start(1);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isComplete).toBe(true);

      // Start again
      act(() => {
        result.current.start(10);
      });

      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('countdown', () => {
    it('should decrement seconds every second', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(5);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(4);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(3);
    });

    it('should stop at 0 and set isComplete', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(2);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.seconds).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });

    it('should call onComplete callback when timer finishes', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useTimer(onComplete));

      act(() => {
        result.current.start(1);
      });

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('pause', () => {
    it('should pause the timer', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.seconds).toBe(8);

      act(() => {
        result.current.pause();
      });

      expect(result.current.isRunning).toBe(false);

      // Advance time - should not decrement
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.seconds).toBe(8);
    });
  });

  describe('resume', () => {
    it('should resume a paused timer', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      act(() => {
        result.current.pause();
      });

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.seconds).toBe(7);
    });

    it('should not resume if seconds is 0', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.resume();
      });

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(10);
      });

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.seconds).toBe(0);
      expect(result.current.isRunning).toBe(false);
      expect(result.current.isComplete).toBe(false);
    });

    it('should reset after completion', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(1);
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isComplete).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isComplete).toBe(false);
    });
  });

  describe('callback updates', () => {
    it('should use updated callback reference', () => {
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      const { result, rerender } = renderHook(
        ({ callback }) => useTimer(callback),
        { initialProps: { callback: onComplete1 } }
      );

      act(() => {
        result.current.start(2);
      });

      // Update callback
      rerender({ callback: onComplete2 });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(onComplete1).not.toHaveBeenCalled();
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });
  });

  describe('timestamp-based persistence', () => {
    it('should continue counting down even if component unmounts and remounts', () => {
      const { result, unmount } = renderHook(() => useTimer());

      // Start timer
      act(() => {
        result.current.start(10);
      });

      // Advance time by 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.seconds).toBe(7);

      // Unmount and remount the hook
      unmount();
      const { result: result2 } = renderHook(() => useTimer());

      // Timer should be reset to initial state since it's a new hook instance
      expect(result2.current.seconds).toBe(0);
    });

    it('should accurately calculate remaining time from absolute timestamp', () => {
      const { result } = renderHook(() => useTimer());

      act(() => {
        result.current.start(5);
      });

      expect(result.current.seconds).toBe(5);

      // Advance by 1.5 seconds
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Should show 4 seconds remaining (5 - 1.5 rounded up)
      expect(result.current.seconds).toBe(4);

      // Advance by another 1.5 seconds
      act(() => {
        vi.advanceTimersByTime(1500);
      });

      // Should show 2 seconds remaining
      expect(result.current.seconds).toBe(2);
    });

    it('should not call onComplete multiple times even with updates', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useTimer(onComplete));

      act(() => {
        result.current.start(1);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);

      // Advance more time - should not call again
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
