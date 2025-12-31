import { useState, useEffect } from 'react';
import { WorkoutSession } from '../types';

interface UseWorkoutTimerReturn {
  elapsedSeconds: number;
}

export const useWorkoutTimer = (session: WorkoutSession | null): UseWorkoutTimerReturn => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session) return;

    const start = new Date(session.startedAt).getTime();
    setElapsedSeconds(Math.floor((Date.now() - start) / 1000));

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.startedAt]);

  return { elapsedSeconds };
};
