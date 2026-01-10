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
import {
  syncAddSession,
  syncAddTemplate,
  syncAddCustomExercise,
  syncAddWeightEntry,
} from '../services/supabase/sync';

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

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

      // Update templates - merge cloud with local (cloud wins for conflicts, local-only preserved)
      if (templatesResult.templates.length > 0) {
        const localTemplates = useAppStore.getState().templates;
        const cloudTemplateIds = new Set(templatesResult.templates.map(t => t.id));
        // Keep local-only templates (not in cloud yet) + all cloud templates
        const localOnlyTemplates = localTemplates.filter(t => !cloudTemplateIds.has(t.id));
        const mergedTemplates = [...templatesResult.templates, ...localOnlyTemplates];
        useAppStore.setState({ templates: mergedTemplates });
      }

      // Update sessions - merge cloud with local (cloud wins for conflicts, local-only preserved)
      if (sessionsResult.sessions.length > 0) {
        const localSessions = useAppStore.getState().sessions;
        const cloudSessionIds = new Set(sessionsResult.sessions.map(s => s.id));
        // Keep local-only sessions (not in cloud yet) + all cloud sessions
        const localOnlySessions = localSessions.filter(s => !cloudSessionIds.has(s.id));
        const mergedSessions = [...sessionsResult.sessions, ...localOnlySessions];
        useAppStore.setState({ sessions: mergedSessions });
      } else {
        // No cloud sessions - keep local sessions as-is (don't clear them)
      }

      // Update active session
      if (activeSessionResult.session) {
        store.setActiveSession(activeSessionResult.session);
      }

      // Update custom exercises - merge cloud with local
      if (exercisesResult.exercises.length > 0) {
        const localExercises = useAppStore.getState().customExercises;
        const cloudExerciseIds = new Set(exercisesResult.exercises.map(e => e.id));
        const localOnlyExercises = localExercises.filter(e => !cloudExerciseIds.has(e.id));
        const mergedExercises = [...exercisesResult.exercises, ...localOnlyExercises];
        useAppStore.setState({ customExercises: mergedExercises });
      }

      // Update weight entries - merge cloud with local (by date)
      if (weightEntriesResult.entries.length > 0) {
        const localEntries = useAppStore.getState().weightEntries;
        const cloudDates = new Set(weightEntriesResult.entries.map(e => e.date));
        const localOnlyEntries = localEntries.filter(e => !cloudDates.has(e.date));
        const mergedEntries = [...weightEntriesResult.entries, ...localOnlyEntries];
        useAppStore.setState({ weightEntries: mergedEntries });
      }

      // After merge, sync any local-only data TO the cloud (fire and forget)
      // This ensures data that failed to sync previously eventually makes it to the cloud
      const currentState = useAppStore.getState();

      // Sync local-only sessions (skip invalid UUIDs from legacy data)
      {
        const cloudIds = new Set(sessionsResult.sessions.map(s => s.id));
        const localOnly = currentState.sessions.filter(s => !cloudIds.has(s.id) && isValidUUID(s.id));
        for (const session of localOnly) {
          syncAddSession(session).catch(console.error);
        }
      }

      // Sync local-only templates (skip invalid UUIDs from legacy data)
      {
        const cloudIds = new Set(templatesResult.templates.map(t => t.id));
        const localOnly = currentState.templates.filter(t => !cloudIds.has(t.id) && isValidUUID(t.id));
        for (const template of localOnly) {
          syncAddTemplate(template).catch(console.error);
        }
      }

      // Sync local-only custom exercises (skip invalid UUIDs from legacy data)
      {
        const cloudIds = new Set(exercisesResult.exercises.map(e => e.id));
        const localOnly = currentState.customExercises.filter(e => !cloudIds.has(e.id) && isValidUUID(e.id));
        for (const exercise of localOnly) {
          syncAddCustomExercise(exercise).catch(console.error);
        }
      }

      // Sync local-only weight entries
      {
        const cloudIds = new Set(weightEntriesResult.entries.map(e => e.date));
        const localOnly = currentState.weightEntries.filter(e => !cloudIds.has(e.date));
        for (const entry of localOnly) {
          syncAddWeightEntry(entry).catch(console.error);
        }
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
