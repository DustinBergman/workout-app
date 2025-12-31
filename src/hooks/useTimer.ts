import { useState, useEffect, useCallback, useRef } from 'react';

interface UseTimerReturn {
  seconds: number;
  isRunning: boolean;
  start: (duration: number) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  isComplete: boolean;
}

export function useTimer(onComplete?: () => void): UseTimerReturn {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            onCompleteRef.current?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, seconds]);

  const start = useCallback((duration: number) => {
    setSeconds(duration);
    setIsRunning(true);
    setIsComplete(false);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (seconds > 0) {
      setIsRunning(true);
    }
  }, [seconds]);

  const reset = useCallback(() => {
    setSeconds(0);
    setIsRunning(false);
    setIsComplete(false);
  }, []);

  return {
    seconds,
    isRunning,
    start,
    pause,
    resume,
    reset,
    isComplete,
  };
}
