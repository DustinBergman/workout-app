import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { GlobalTimerNotification } from './GlobalTimerNotification';
import { useCurrentWorkoutStore } from '../../store/currentWorkoutStore';

// Mock AudioContext
const mockClose = vi.fn();
const mockCreateOscillator = vi.fn(() => ({
  connect: vi.fn(),
  frequency: { value: 0 },
  type: '',
  start: vi.fn(),
  stop: vi.fn(),
}));
const mockCreateGain = vi.fn(() => ({
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
}));

// Create a proper class mock for AudioContext
class MockAudioContextClass {
  currentTime = 0;
  destination = {};
  createOscillator = mockCreateOscillator;
  createGain = mockCreateGain;
  close = mockClose;
}

const MockAudioContext = vi.fn().mockImplementation(() => new MockAudioContextClass());

(window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;

// Helper to reset store between tests
const resetStore = () => {
  useCurrentWorkoutStore.setState({
    showTimer: false,
    timerDuration: 90,
    timerEndTime: null,
    timerPaused: false,
    timerRemainingWhenPaused: null,
  });
};

describe('GlobalTimerNotification', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    resetStore();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStore();
  });

  it('should render nothing (returns null)', () => {
    const { container } = render(<GlobalTimerNotification />);
    expect(container.firstChild).toBeNull();
  });

  it('should not play sound when timer is not showing', async () => {
    // Set end time in the past but timer not showing
    act(() => {
      useCurrentWorkoutStore.setState({
        showTimer: false,
        timerEndTime: Date.now() - 1000,
      });
    });

    render(<GlobalTimerNotification />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(MockAudioContext).not.toHaveBeenCalled();
  });

  it('should not play sound when no end time', async () => {
    act(() => {
      useCurrentWorkoutStore.setState({
        showTimer: true,
        timerEndTime: null,
      });
    });

    render(<GlobalTimerNotification />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(MockAudioContext).not.toHaveBeenCalled();
  });

  it('should not play sound when timer is paused', async () => {
    // Set end time in the past but timer is paused
    act(() => {
      useCurrentWorkoutStore.setState({
        showTimer: true,
        timerEndTime: Date.now() - 1000,
        timerPaused: true,
        timerRemainingWhenPaused: 30,
      });
    });

    render(<GlobalTimerNotification />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(MockAudioContext).not.toHaveBeenCalled();
  });

  it('should play sound when timer expires', async () => {
    // Set end time in the past
    act(() => {
      useCurrentWorkoutStore.setState({
        showTimer: true,
        timerEndTime: Date.now() - 1000,
        timerPaused: false,
      });
    });

    render(<GlobalTimerNotification />);

    // Wait for interval to check
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600);
    });

    expect(MockAudioContext).toHaveBeenCalled();
  });

  it('should only play sound once per timer', async () => {
    act(() => {
      useCurrentWorkoutStore.setState({
        showTimer: true,
        timerEndTime: Date.now() - 1000,
        timerPaused: false,
      });
    });

    render(<GlobalTimerNotification />);

    // Wait for first check
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(MockAudioContext).toHaveBeenCalledTimes(1);

    // Wait for more interval checks
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    // Should still only be called once
    expect(MockAudioContext).toHaveBeenCalledTimes(1);
  });

  it('should reset and play sound for new timer', async () => {
    const firstEndTime = Date.now() - 1000;
    act(() => {
      useCurrentWorkoutStore.setState({
        showTimer: true,
        timerEndTime: firstEndTime,
        timerPaused: false,
      });
    });

    const { rerender } = render(<GlobalTimerNotification />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(MockAudioContext).toHaveBeenCalledTimes(1);

    // Start a new timer
    const newEndTime = Date.now() - 500;
    act(() => {
      useCurrentWorkoutStore.setState({
        timerEndTime: newEndTime,
      });
    });

    rerender(<GlobalTimerNotification />);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    // Should have played for the new timer too
    expect(MockAudioContext).toHaveBeenCalledTimes(2);
  });

  it('should not play sound when timer is still running', async () => {
    // Set end time 10 seconds in the future
    act(() => {
      useCurrentWorkoutStore.setState({
        showTimer: true,
        timerEndTime: Date.now() + 10000,
        timerPaused: false,
      });
    });

    render(<GlobalTimerNotification />);

    // Wait a bit but not enough for timer to expire
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(MockAudioContext).not.toHaveBeenCalled();
  });
});
