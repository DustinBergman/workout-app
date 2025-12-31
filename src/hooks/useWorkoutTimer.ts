import { useState, useEffect } from 'react';
import { WorkoutSession } from '../types';

interface UseWorkoutTimerReturn {
  elapsedSeconds: number;
}

type TimerInput = WorkoutSession | { startedAt: string } | null;

export const useWorkoutTimer = (input: TimerInput): UseWorkoutTimerReturn => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const startedAt = input?.startedAt;

  useEffect(() => {
    if (!startedAt) return;

    const start = new Date(startedAt).getTime();
    setElapsedSeconds(Math.floor((Date.now() - start) / 1000));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  return { elapsedSeconds };
};
