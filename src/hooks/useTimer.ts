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

export const useTimer = (onComplete?: () => void): UseTimerReturn => {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Update displayed seconds based on timestamp
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isRunning && endTime) {
      const updateSeconds = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        setSeconds(remaining);

        if (remaining <= 0 && !hasCompletedRef.current) {
          hasCompletedRef.current = true;
          setIsRunning(false);
          setIsComplete(true);
          onCompleteRef.current?.();
        }
      };

      updateSeconds();
      interval = setInterval(updateSeconds, 100); // Update more frequently for accuracy
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, endTime]);

  const start = useCallback((duration: number) => {
    const now = Date.now();
    setEndTime(now + duration * 1000);
    setIsRunning(true);
    setIsComplete(false);
    hasCompletedRef.current = false;
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (endTime && Date.now() < endTime) {
      setIsRunning(true);
    }
  }, [endTime]);

  const reset = useCallback(() => {
    setEndTime(null);
    setSeconds(0);
    setIsRunning(false);
    setIsComplete(false);
    hasCompletedRef.current = false;
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
};
