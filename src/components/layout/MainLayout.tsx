import { FC, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Navigation } from '../ui';
import { GlobalTimerNotification } from '../timer/GlobalTimerNotification';
import { useAppStore } from '../../store/useAppStore';
import { useAuth } from '../../hooks/useAuth';
import { useSync } from '../../hooks/useSync';
import { Auth, Intro } from '../../pages';
import { Header } from './Header';
import { AppRoutes } from './AppRoutes';
import { WorkoutInProgressBanner } from './WorkoutInProgressBanner';

export const MainLayout: FC = () => {
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
          <Header />
        </header>

        {/* Main Content */}
        <main className="pt-14 pb-16">
          <AppRoutes />
        </main>

        {/* Workout In Progress Banner */}
        <WorkoutInProgressBanner />

        {/* Bottom Navigation */}
        <Navigation />
      </div>
    </>
  );
};
