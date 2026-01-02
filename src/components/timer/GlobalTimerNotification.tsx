import { useEffect, useRef, FC } from 'react';
import { useCurrentWorkoutStore } from '../../store/currentWorkoutStore';

/**
 * Global component that monitors the rest timer and plays a notification sound
 * when the timer completes, regardless of which page the user is on.
 */
export const GlobalTimerNotification: FC = () => {
  const timerEndTime = useCurrentWorkoutStore((state) => state.timerEndTime);
  const timerPaused = useCurrentWorkoutStore((state) => state.timerPaused);
  const showTimer = useCurrentWorkoutStore((state) => state.showTimer);
  const hasPlayedRef = useRef(false);
  const lastEndTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset hasPlayed when a new timer starts (different endTime)
    if (timerEndTime !== lastEndTimeRef.current) {
      hasPlayedRef.current = false;
      lastEndTimeRef.current = timerEndTime;
    }

    // Don't do anything if timer isn't showing, no end time, or timer is paused
    if (!showTimer || !timerEndTime || timerPaused) {
      return;
    }

    const checkTimer = () => {
      const now = Date.now();
      if (timerEndTime <= now && !hasPlayedRef.current) {
        hasPlayedRef.current = true;
        playDingSound();
      }
    };

    // Check immediately
    checkTimer();

    // Also set up an interval to check (in case component mounts after timer started)
    const interval = setInterval(checkTimer, 500);

    return () => clearInterval(interval);
  }, [timerEndTime, timerPaused, showTimer]);

  return null; // This component doesn't render anything
};

const playDingSound = () => {
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
};
