import { FC, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Navigation, SyncIndicator, Button } from './components/ui';
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
import { ModalProvider } from './contexts';
import { NotificationBell } from './components/notifications';
import { ToastContainer } from './components/ui/ToastContainer';
import { useAuth } from './hooks/useAuth';
import { useSync } from './hooks/useSync';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Bottom banner for active workout
const WorkoutInProgressBanner: FC = () => {
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
      className="fixed bottom-16 left-0 right-0 z-40 overflow-hidden cursor-pointer group bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-400 hover:via-cyan-400 hover:to-blue-400 transition-all"
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

const HeaderContent: FC = () => {
  const location = useLocation();

  return (
    <div className="flex items-center justify-between px-4 h-14">
      <div className="flex items-center gap-3">
        <Link to="/" className="group flex items-center gap-2">
          {/* Weight plate - top down view, minimal */}
          <div className="relative w-7 h-7">
            <svg viewBox="0 0 28 28" className="w-full h-full">
              {/* Outer ring */}
              <circle
                cx="14"
                cy="14"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-fg-1"
              />
              {/* Inner cutout */}
              <circle
                cx="14"
                cy="14"
                r="4"
                fill="currentColor"
                className="text-fg-1"
              />
              {/* Accent arc - like a grip indent */}
              <path
                d="M 14 2 A 12 12 0 0 1 26 14"
                fill="none"
                stroke="url(#plate-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                className="group-hover:opacity-100 opacity-80 transition-opacity"
              />
              <defs>
                <linearGradient id="plate-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Text */}
          <span className="text-xl font-bold text-fg-1 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            overload
          </span>
        </Link>
        <SyncIndicator />
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Link to="/settings">
          <Button
            variant="ghost"
            className={`text-fg-1 p-2 ${location.pathname === '/settings' ? 'bg-bg-subtle' : ''}`}
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
          </Button>
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
  const { isInitialLoading } = useSync();
  const hasCompletedIntro = useAppStore((state) => state.hasCompletedIntro);

  // Redirect to /auth if not authenticated (except when already on /auth)
  useEffect(() => {
    if (!authLoading && !isAuthenticated && location.pathname !== '/auth') {
      navigate('/auth', { replace: true });
    }
  }, [isAuthenticated, authLoading, location.pathname, navigate]);

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
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border safe-area-pt">
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

        {/* Workout In Progress Banner */}
        <WorkoutInProgressBanner />

        {/* Bottom Navigation */}
        <Navigation />
      </div>
    </>
  );
};

const App: FC = () => {
  // Run migrations once on app startup
  useEffect(() => {
    migrateTemplates();
    migrateToUUIDs();
  }, []);

  // Setup native platform features (iOS/Android)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Set status bar style for dark theme
      StatusBar.setStyle({ style: Style.Dark }).catch(console.error);

      // Handle deep links for OAuth callbacks
      CapApp.addListener('appUrlOpen', (event) => {
        console.log('Deep link received:', event.url);
        // The URL will be handled by Supabase auth automatically
      });
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        CapApp.removeAllListeners();
      }
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <SyncProvider>
          <ModalProvider>
            <AppContent />
            <ToastContainer />
          </ModalProvider>
        </SyncProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
