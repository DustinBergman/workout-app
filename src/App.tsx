import { FC, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from './components/ui';
import {
  Home,
  ExerciseLibrary,
  WorkoutPlans,
  AIWorkoutCreator,
  ActiveWorkout,
  History,
  You,
  Settings,
  Intro,
} from './pages';
import { useAppStore } from './store/useAppStore';

const HeaderContent: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
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

  if (hasActiveWorkout && !isOnWorkoutPage) {
    return (
      <div className="flex items-center justify-between px-4 h-14 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 hover:from-yellow-500/30 hover:to-amber-500/30 border-b border-yellow-500/50 transition-colors">
        <button
          onClick={() => navigate('/workout')}
          className="flex-1 flex items-center gap-3 cursor-pointer"
        >
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-yellow-400">
            Workout in Progress
          </span>
          <span className="text-sm text-yellow-300">
            {formatTime(elapsedSeconds)}
          </span>
        </button>
        <Link
          to="/settings"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 h-14">
      <Link to="/" className="text-xl font-bold text-primary">
        overload.ai
      </Link>
      <Link
        to="/settings"
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </Link>
    </div>
  );
};

const App: FC = () => {
  const hasCompletedIntro = useAppStore((state) => state.hasCompletedIntro);

  if (!hasCompletedIntro) {
    return <Intro />;
  }

  return (
    <BrowserRouter>
        <div className="min-h-screen">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
            <HeaderContent />
          </header>

          {/* Main Content */}
          <main className="pb-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/exercises" element={<ExerciseLibrary />} />
              <Route path="/plans" element={<WorkoutPlans />} />
              <Route path="/plans/create-with-ai" element={<AIWorkoutCreator />} />
              <Route path="/workout" element={<ActiveWorkout />} />
              <Route path="/history" element={<History />} />
              <Route path="/you" element={<You />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>

          {/* Bottom Navigation */}
          <Navigation />
        </div>
    </BrowserRouter>
  );
}

export default App;
