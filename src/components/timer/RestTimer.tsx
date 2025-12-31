import { useEffect, useRef, useCallback, FC } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { Button } from '../ui';

interface RestTimerProps {
  duration: number;
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export const RestTimer: FC<RestTimerProps> = ({ duration, onComplete, onSkip, autoStart = false }) => {
  const hasPlayedRef = useRef(false);

  const handleComplete = useCallback(() => {
    // Play notification sound
    if (!hasPlayedRef.current) {
      hasPlayedRef.current = true;
      try {
        // Create a simple beep using Web Audio API
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 880; // A5 note
        oscillator.type = 'sine';
        gainNode.gain.value = 0.3;

        oscillator.start();
        setTimeout(() => {
          oscillator.stop();
          audioContext.close();
        }, 300);
      } catch (e) {
        // Fallback if Web Audio API fails
        console.log('Audio notification failed:', e);
      }
    }
    onComplete?.();
  }, [onComplete]);

  const { seconds, isRunning, start, pause, resume, reset, isComplete } = useTimer(handleComplete);

  useEffect(() => {
    if (autoStart && duration > 0) {
      hasPlayedRef.current = false;
      start(duration);
    }
  }, [autoStart, duration, start]);

  const handleSkip = () => {
    reset();
    onSkip?.();
  };

  const handleRestart = () => {
    hasPlayedRef.current = false;
    start(duration);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (seconds / duration) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-sm w-full text-center">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          {isComplete ? 'Rest Complete!' : 'Rest Timer'}
        </h2>

        {/* Circular Progress */}
        <div className="relative w-48 h-48 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              className="fill-none stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              className={`fill-none transition-all duration-1000 ${
                isComplete ? 'stroke-green-500' : 'stroke-blue-500'
              }`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress / 100)}`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-5xl font-bold ${
              isComplete
                ? 'text-green-500'
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {isComplete ? 'GO!' : formatTime(seconds)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          {!isComplete && (
            <>
              {isRunning ? (
                <Button variant="secondary" onClick={pause}>
                  Pause
                </Button>
              ) : seconds > 0 ? (
                <Button variant="secondary" onClick={resume}>
                  Resume
                </Button>
              ) : null}
              <Button variant="ghost" onClick={handleSkip}>
                Skip
              </Button>
            </>
          )}
          {isComplete && (
            <>
              <Button onClick={handleSkip}>
                Continue
              </Button>
              <Button variant="secondary" onClick={handleRestart}>
                +{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
