import { createContext, FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAppStore } from '../store/useAppStore';
import {
  getProfile,
  getTemplates,
  getSessions,
  getActiveSession,
  getCustomExercises,
  getWeightEntries,
  profileToPreferences,
  hasLocalStorageData,
  isMigrationComplete,
} from '../services/supabase';
import { setupSyncSubscriptions, setSyncEnabled } from '../store/syncSubscriptions';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncContextType {
  status: SyncStatus;
  error: string | null;
  lastSyncedAt: Date | null;
  isInitialLoading: boolean;
  showMigrationPrompt: boolean;
  setShowMigrationPrompt: (show: boolean) => void;
  syncFromCloud: () => Promise<void>;
}

export const SyncContext = createContext<SyncContextType | null>(null);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: FC<SyncProviderProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const subscriptionsSetup = useRef(false);

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showMigrationPrompt, setShowMigrationPrompt] = useState(false);

  // Setup sync subscriptions once
  useEffect(() => {
    if (!subscriptionsSetup.current) {
      setupSyncSubscriptions();
      subscriptionsSetup.current = true;
    }
  }, []);

  // Enable/disable sync based on auth state
  useEffect(() => {
    setSyncEnabled(isAuthenticated && isOnline);
  }, [isAuthenticated, isOnline]);

  // Sync data from Supabase to Zustand store
  const syncFromCloud = useCallback(async () => {
    if (!isAuthenticated || !isOnline) {
      setStatus(isOnline ? 'idle' : 'offline');
      return;
    }

    setStatus('syncing');
    setError(null);

    try {
      // Fetch all data in parallel
      const [
        profileResult,
        templatesResult,
        sessionsResult,
        activeSessionResult,
        exercisesResult,
        weightEntriesResult,
      ] = await Promise.all([
        getProfile(),
        getTemplates(),
        getSessions(),
        getActiveSession(),
        getCustomExercises(),
        getWeightEntries(),
      ]);

      // Check for errors
      const errors = [
        profileResult.error,
        templatesResult.error,
        sessionsResult.error,
        activeSessionResult.error,
        exercisesResult.error,
        weightEntriesResult.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(errors[0]?.message || 'Failed to sync data');
      }

      // Update Zustand store with fetched data
      const store = useAppStore.getState();

      // Update preferences from profile
      if (profileResult.profile) {
        const prefs = profileToPreferences(profileResult.profile);
        store.updatePreferences(prefs);

        // Update goal and week
        if (profileResult.profile.workout_goal) {
          store.setWorkoutGoal(profileResult.profile.workout_goal);
        }
        if (profileResult.profile.current_week !== undefined) {
          store.setCurrentWeek(profileResult.profile.current_week);
        }
        if (profileResult.profile.has_completed_intro) {
          store.setHasCompletedIntro(true);
        }
      }

      // Update templates - replace entirely with cloud data
      if (templatesResult.templates.length > 0) {
        // Clear existing and add all from cloud
        useAppStore.setState({ templates: templatesResult.templates });
      }

      // Update sessions
      if (sessionsResult.sessions.length > 0) {
        useAppStore.setState({ sessions: sessionsResult.sessions });
      }

      // Update active session
      if (activeSessionResult.session) {
        store.setActiveSession(activeSessionResult.session);
      }

      // Update custom exercises
      if (exercisesResult.exercises.length > 0) {
        useAppStore.setState({ customExercises: exercisesResult.exercises });
      }

      // Update weight entries
      if (weightEntriesResult.entries.length > 0) {
        useAppStore.setState({ weightEntries: weightEntriesResult.entries });
      }

      setStatus('synced');
      setLastSyncedAt(new Date());
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Sync failed');
    }
  }, [isAuthenticated, isOnline]);

  // Initial sync when user authenticates
  useEffect(() => {
    const initSync = async () => {
      if (authLoading) return;

      if (isAuthenticated && isOnline) {
        // Check if user has local data that needs migration
        if (hasLocalStorageData() && !isMigrationComplete()) {
          setShowMigrationPrompt(true);
          setIsInitialLoading(false);
          return;
        }

        // Sync from cloud - wait for this to complete before showing app
        await syncFromCloud();
        setIsInitialLoading(false);
      } else if (!isAuthenticated) {
        // Not authenticated - no sync needed, will redirect to auth
        setIsInitialLoading(false);
      }
      // If authenticated but offline, keep isInitialLoading true until online
    };

    initSync();
  }, [isAuthenticated, isOnline, authLoading, syncFromCloud]);

  // Update status when going offline/online
  useEffect(() => {
    if (!isOnline) {
      setStatus('offline');
    } else if (status === 'offline' && isAuthenticated) {
      // Back online, trigger sync
      syncFromCloud();
    }
  }, [isOnline, isAuthenticated, status, syncFromCloud]);

  const value: SyncContextType = {
    status,
    error,
    lastSyncedAt,
    isInitialLoading,
    showMigrationPrompt,
    setShowMigrationPrompt,
    syncFromCloud,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
