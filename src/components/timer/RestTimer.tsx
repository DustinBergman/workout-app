import { useEffect, useRef, useCallback, FC } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { useCurrentWorkoutStore } from '../../store/currentWorkoutStore';
import { Button } from '../ui';

interface RestTimerProps {
  duration: number;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export const RestTimer: FC<RestTimerProps> = ({ duration, onComplete, onSkip, autoStart = false }) => {
  const hasPlayedRef = useRef(false);
  const hasStartedRef = useRef(false);
  const timerEndTime = useCurrentWorkoutStore((state) => state.timerEndTime);

  const handleComplete = useCallback(() => {
    // Play notification ding sound
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        // Play a pleasant double-ding notification
        const playDing = (time: number) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);

          oscillator.frequency.value = 1047; // C6 note - bright ding
          oscillator.type = 'sine';

          // Bell-like envelope with quick attack and decay
          gainNode.gain.setValueAtTime(0, time);
          gainNode.gain.linearRampToValueAtTime(0.4, time + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

          oscillator.start(time);
          oscillator.stop(time + 0.4);
        };

        const now = audioContext.currentTime;
        playDing(now);
        playDing(now + 0.2); // Second ding slightly after

        // Close audio context after sounds finish
        setTimeout(() => audioContext.close(), 1000);
      } catch (e) {
        console.log('Audio notification failed:', e);
      }
    }
    onComplete?.();
  }, [onComplete]);

  const { seconds, isRunning, start, pause, resume, reset, isComplete } = useTimer(handleComplete);

  useEffect(() => {
    // Only start the timer once per component instance
    if (autoStart && duration > 0 && !hasStartedRef.current) {
      hasPlayedRef.current = false;
      hasStartedRef.current = true;

      // Calculate the actual remaining time from the persisted endTime
      // If timerEndTime exists and is in the future, use that to calculate remaining time
      // Otherwise use the full duration
      let remainingDuration = duration;
      if (timerEndTime && timerEndTime > Date.now()) {
        remainingDuration = Math.max(0, Math.ceil((timerEndTime - Date.now()) / 1000));
      }

      start(remainingDuration);
    }
  }, [autoStart, duration, start, timerEndTime]);

  const handleSkip = () => {
    reset();
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

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
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
                <Button size="sm" variant="secondary" onClick={pause}>
                  Pause
                </Button>
              ) : seconds > 0 ? (
                <Button size="sm" variant="secondary" onClick={resume}>
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
