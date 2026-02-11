import { useEffect, useRef, useCallback, useState, FC } from 'react';
import { useCurrentWorkoutStore } from '../../store/currentWorkoutStore';
import { Button } from '../ui';

interface RestTimerProps {
  duration: number;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export const RestTimer: FC<RestTimerProps> = ({ duration, onComplete, onSkip, autoStart = false }) => {
  const hasStartedRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // Store state
  const timerEndTime = useCurrentWorkoutStore((state) => state.timerEndTime);
  const timerPaused = useCurrentWorkoutStore((state) => state.timerPaused);
  const timerRemainingWhenPaused = useCurrentWorkoutStore((state) => state.timerRemainingWhenPaused);
  const setTimerEndTime = useCurrentWorkoutStore((state) => state.setTimerEndTime);
  const pauseTimer = useCurrentWorkoutStore((state) => state.pauseTimer);
  const resumeTimer = useCurrentWorkoutStore((state) => state.resumeTimer);

  // Local display state
  const [seconds, setSeconds] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = useCallback(() => {
    // Sound is handled globally by GlobalTimerNotification
    onComplete?.();
  }, [onComplete]);

  // Initialize timer on mount
  useEffect(() => {
    if (autoStart && duration > 0 && !hasStartedRef.current) {
      hasStartedRef.current = true;

      // If timer is paused, use the remaining time from when it was paused
      if (timerPaused && timerRemainingWhenPaused !== null) {
        setSeconds(timerRemainingWhenPaused);
        return;
      }

      // If timer has an end time in the future, calculate remaining
      if (timerEndTime && timerEndTime > Date.now()) {
        const remaining = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
        setSeconds(remaining);
        return;
      }

      // Otherwise start a new timer
      const endTime = Date.now() + duration * 1000;
      setTimerEndTime(endTime);
      setSeconds(duration);
    }
  }, [autoStart, duration, timerEndTime, timerPaused, timerRemainingWhenPaused, setTimerEndTime]);

  // Update seconds countdown
  useEffect(() => {
    // If paused, just display the remaining time
    if (timerPaused) {
      if (timerRemainingWhenPaused !== null) {
        setSeconds(timerRemainingWhenPaused);
      }
      return;
    }

    // If no end time, nothing to do
    if (!timerEndTime) return;

    const updateSeconds = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((timerEndTime - now) / 1000));
      setSeconds(remaining);

      if (remaining <= 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setIsComplete(true);
        handleComplete();
      }
    };

    updateSeconds();
    const interval = setInterval(updateSeconds, 100);

    return () => clearInterval(interval);
  }, [timerEndTime, timerPaused, timerRemainingWhenPaused, handleComplete]);

  const handlePause = () => {
    pauseTimer();
  };

  const handleResume = () => {
    hasCompletedRef.current = false;
    resumeTimer();
  };

  const handleSkip = () => {
    setTimerEndTime(null);
    onSkip?.();
  };

  // Auto-hide timer when complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        onSkip?.();
      }, 2000); // Auto-hide after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isComplete, onSkip]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (seconds / duration) * 100 : 0;
  const isRunning = !timerPaused && !isComplete && timerEndTime !== null;

  return (
    <div
      className="fixed left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
    >
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700 w-full">
        <div
          className={`h-full transition-all duration-1000 ${
            isComplete ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Time Remaining */}
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${
            isComplete
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-gray-100'
          }`}>
            {isComplete ? 'Rest Complete!' : `Time Remaining: ${formatTime(seconds)}`}
          </span>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!isComplete && (
            <>
              {isRunning ? (
                <Button size="sm" variant="secondary" onClick={handlePause}>
                  Pause
                </Button>
              ) : seconds > 0 ? (
                <Button size="sm" variant="secondary" onClick={handleResume}>
                  Resume
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
