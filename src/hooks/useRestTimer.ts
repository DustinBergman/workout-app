import { useCallback } from 'react';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';

interface UseRestTimerReturn {
  showTimer: boolean;
  timerDuration: number;
  handleStartTimer: (duration: number) => void;
  hideTimer: () => void;
}

export const useRestTimer = (): UseRestTimerReturn => {
  const showTimer = useCurrentWorkoutStore((state) => state.showTimer);
  const timerDuration = useCurrentWorkoutStore((state) => state.timerDuration);
  const setShowTimer = useCurrentWorkoutStore((state) => state.setShowTimer);
  const setTimerDuration = useCurrentWorkoutStore((state) => state.setTimerDuration);
  const setTimerEndTime = useCurrentWorkoutStore((state) => state.setTimerEndTime);

  const handleStartTimer = useCallback((duration: number) => {
    setTimerDuration(duration);
    // Calculate and store the end time (absolute timestamp) so timer persists across app restarts
    const endTime = Date.now() + duration * 1000;
    setTimerEndTime(endTime);
    setShowTimer(true);
  }, [setTimerDuration, setTimerEndTime, setShowTimer]);

  const hideTimer = useCallback(() => {
    setShowTimer(false);
  }, [setShowTimer]);

  return {
    showTimer,
    timerDuration,
    handleStartTimer,
    hideTimer,
  };
};
