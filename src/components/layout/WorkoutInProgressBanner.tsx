import { FC, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

export const WorkoutInProgressBanner: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeSession = useAppStore((state) => state.activeSession);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const isOnWorkoutPage = location.pathname === '/workout';
  const hasActiveWorkout = activeSession !== null;

  // Update elapsed time
  useEffect(() => {
    if (!hasActiveWorkout) return;

    const updateElapsed = () => {
      const startTime = new Date(activeSession.startedAt).getTime();
      const now = new Date().getTime();
      const seconds = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(seconds);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [hasActiveWorkout, activeSession]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (!hasActiveWorkout || isOnWorkoutPage) {
    return null;
  }

  return (
    <div
      className="fixed left-0 right-0 z-50 overflow-hidden cursor-pointer group bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-400 transition-all"
      style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      onClick={() => navigate('/workout')}
    >
      {/* Content */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Pulsing indicator */}
          <div className="relative flex items-center justify-center">
            <div className="absolute w-8 h-8 bg-white/40 rounded-full animate-ping" />
            <div className="relative w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-medium text-white/90 uppercase tracking-wider">
              In Progress
            </span>
            <span className="text-sm font-bold text-white">
              {activeSession?.name || 'Workout'}
            </span>
          </div>
        </div>

        {/* Timer pill */}
        <div className="flex items-center gap-2 bg-white/30 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-bold text-white tabular-nums">
            {formatTime(elapsedSeconds)}
          </span>
        </div>
      </div>
    </div>
  );
};
