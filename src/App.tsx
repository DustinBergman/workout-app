import { FC, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navigation, SyncIndicator } from './components/ui';
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
  Auth,
  Feed,
  Friends,
  WorkoutDetail,
} from './pages';
import { useAppStore, migrateTemplates, migrateToUUIDs } from './store/useAppStore';
import { GlobalTimerNotification } from './components/timer/GlobalTimerNotification';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import { MigrationPrompt } from './components/auth';
import { NotificationBell } from './components/notifications';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { markMigrationComplete } from './services/supabase';

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
      <div className="flex items-center gap-3">
        <Link to="/" className="text-xl font-bold text-primary">
          overload.ai
        </Link>
        <SyncIndicator />
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell />
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
    </div>
  );
};

// Inner component that can use useSync (must be inside SyncProvider)
const AppContent: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { showMigrationPrompt, setShowMigrationPrompt, syncFromCloud, isInitialLoading } = useSync();
  const hasCompletedIntro = useAppStore((state) => state.hasCompletedIntro);

  // Redirect to /auth if not authenticated (except when already on /auth)
  useEffect(() => {
    if (!authLoading && !isAuthenticated && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, authLoading, location.pathname, navigate]);

  const handleMigrationComplete = () => {
    markMigrationComplete();
    setShowMigrationPrompt(false);
    // Sync from cloud after migration
    syncFromCloud();
  };

  const handleMigrationSkip = () => {
    setShowMigrationPrompt(false);
    // Sync from cloud (will load any existing cloud data)
    syncFromCloud();
  };

  // Show loading while checking auth or doing initial sync
  if (authLoading || isInitialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page without header/nav if not authenticated
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // Show intro wizard if not completed (check AFTER sync so we have latest from Supabase)
  if (!hasCompletedIntro) {
    return <Intro />;
  }

  return (
    <>
      <div className="min-h-screen">
        {/* Global Timer Notification - plays ding on any page */}
        <GlobalTimerNotification />

        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <HeaderContent />
        </header>

        {/* Main Content */}
        <main className="pt-14 pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/exercises" element={<ExerciseLibrary />} />
            <Route path="/plans" element={<WorkoutPlans />} />
            <Route path="/plans/create-with-ai" element={<AIWorkoutCreator />} />
            <Route path="/workout" element={<ActiveWorkout />} />
            <Route path="/history" element={<History />} />
            <Route path="/you" element={<You />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/feed/workout/:workoutId" element={<WorkoutDetail />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        {/* Bottom Navigation */}
        <Navigation />
      </div>

      {/* Migration Prompt Modal */}
      {showMigrationPrompt && (
        <MigrationPrompt
          onComplete={handleMigrationComplete}
          onSkip={handleMigrationSkip}
        />
      )}
    </>
  );
};

const App: FC = () => {
  // Run migrations once on app startup
  useEffect(() => {
    migrateTemplates();
    migrateToUUIDs();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <SyncProvider>
          <AppContent />
        </SyncProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
