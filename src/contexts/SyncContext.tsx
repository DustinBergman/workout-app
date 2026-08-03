import { createContext, FC, ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAppStore } from '../store/useAppStore';
import type {
  Exercise,
  TrainingCycleConfig,
  UserCycleState,
  UserPreferences,
  WeightEntry,
  WorkoutGoal,
  WorkoutSession,
  WorkoutTemplate,
} from '../types';
import { BUILD_5_WEEK_CYCLE, getDefaultCycleForGoal } from '../types';
import {
  getProfile,
  getTemplates,
  getSessions,
  getActiveSession,
  getCustomExercises,
  getWeightEntries,
  profileToPreferences,
  deduplicateTemplateExercises,
} from '../services/supabase';
import {
  flushPendingSync,
  getPendingSyncState,
  seedPendingSyncState,
  setupSyncSubscriptions,
  setSyncEnabled,
  setSyncingFromCloud,
  type PendingSyncState,
} from '../store/syncSubscriptions';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import {
  getCloudSyncGeneration,
  trackCloudSync,
} from '../services/syncCoordinator';

const ACCOUNT_STATE_PREFIX = 'workout-app-account-state-v2:';
const CURRENT_IDENTITY_KEY = 'workout-app-current-state-identity-v2';
const ANONYMOUS_IDENTITY = 'anonymous';

interface AccountState {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  preferences: UserPreferences;
  customExercises: Exercise[];
  workoutGoal: WorkoutGoal;
  hasCompletedIntro: boolean;
  weightEntries: WeightEntry[];
  cycleConfig: TrainingCycleConfig;
  cycleState: UserCycleState;
}

const createEmptyAccountState = (): AccountState => ({
  templates: [],
  sessions: [],
  activeSession: null,
  preferences: {
    weightUnit: 'lbs',
    distanceUnit: 'mi',
    defaultRestSeconds: 90,
    darkMode: false,
    experienceLevel: 'intermediate',
    weeklyWorkoutGoal: 4,
  },
  customExercises: [],
  workoutGoal: 'build',
  hasCompletedIntro: false,
  weightEntries: [],
  cycleConfig: BUILD_5_WEEK_CYCLE,
  cycleState: {
    cycleConfigId: BUILD_5_WEEK_CYCLE.id,
    cycleStartDate: new Date().toISOString(),
    currentPhaseIndex: 0,
    currentWeekInPhase: 1,
  },
});

const captureAccountState = (): AccountState => {
  const state = useAppStore.getState();
  return {
    templates: state.templates,
    sessions: state.sessions,
    activeSession: state.activeSession,
    preferences: state.preferences,
    customExercises: state.customExercises,
    workoutGoal: state.workoutGoal,
    hasCompletedIntro: state.hasCompletedIntro,
    weightEntries: state.weightEntries,
    cycleConfig: state.cycleConfig,
    cycleState: state.cycleState,
  };
};

const normalizeIdentityName = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const legacyStateMatchesUser = (
  state: AccountState,
  metadata: Record<string, unknown> | undefined
): boolean => {
  const stateFirstName = normalizeIdentityName(state.preferences.firstName);
  const metadataFirstName = normalizeIdentityName(metadata?.firstName);
  if (!stateFirstName || stateFirstName !== metadataFirstName) return false;

  const stateLastName = normalizeIdentityName(state.preferences.lastName);
  const metadataLastName = normalizeIdentityName(metadata?.lastName);
  return Boolean(
    stateLastName &&
    metadataLastName &&
    stateLastName === metadataLastName
  );
};

const saveAccountState = (identity: string, state: AccountState): void => {
  localStorage.setItem(`${ACCOUNT_STATE_PREFIX}${identity}`, JSON.stringify(state));
};

const loadAccountState = (identity: string): AccountState | null => {
  const serialized = localStorage.getItem(`${ACCOUNT_STATE_PREFIX}${identity}`);
  if (!serialized) return null;

  try {
    return JSON.parse(serialized) as AccountState;
  } catch (error) {
    console.error('[Sync] Invalid account-bound local state:', error);
    return null;
  }
};

const overlayPendingRecords = <T extends { id: string }>(
  cloudRecords: T[],
  pendingRecords: Record<string, { kind: 'delete' } | { kind: 'upsert'; value: T }>
): T[] => {
  const records = new Map(cloudRecords.map((record) => [record.id, record]));
  for (const [id, operation] of Object.entries(pendingRecords)) {
    if (operation.kind === 'delete') records.delete(id);
    else records.set(id, operation.value);
  }
  return [...records.values()];
};

const overlayPendingWeights = (
  cloudRecords: WeightEntry[],
  pendingRecords: PendingSyncState['weights']
): WeightEntry[] => {
  const records = new Map(cloudRecords.map((record) => [record.date, record]));
  for (const [date, operation] of Object.entries(pendingRecords)) {
    if (operation.kind === 'delete') records.delete(date);
    else records.set(date, operation.value);
  }
  return [...records.values()];
};

const applyPendingTemplateOrder = (
  templates: WorkoutTemplate[],
  order?: string[]
): WorkoutTemplate[] => {
  if (!order) return templates;
  const byId = new Map(templates.map((template) => [template.id, template]));
  const ordered = order
    .map((id) => byId.get(id))
    .filter((template): template is WorkoutTemplate => Boolean(template));
  const orderedIds = new Set(order);
  return [...ordered, ...templates.filter((template) => !orderedIds.has(template.id))];
};

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export interface SyncContextType {
  status: SyncStatus;
  error: string | null;
  lastSyncedAt: Date | null;
  isInitialLoading: boolean;
  syncFromCloud: () => Promise<void>;
}

export const SyncContext = createContext<SyncContextType | null>(null);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: FC<SyncProviderProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const userId = isAuthenticated ? user?.id ?? null : null;
  const userFirstName = user?.user_metadata?.firstName;
  const userLastName = user?.user_metadata?.lastName;
  const currentIdentityRef = useRef<string | null>(null);
  const syncGenerationRef = useRef(0);
  const syncInFlightRef = useRef<{ userId: string; promise: Promise<void> } | null>(null);

  const [identityVersion, setIdentityVersion] = useState(0);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => setupSyncSubscriptions(), []);

  useEffect(() => {
    if (authLoading) return;

    const nextIdentity = userId ?? ANONYMOUS_IDENTITY;
    const storedIdentity = localStorage.getItem(CURRENT_IDENTITY_KEY);
    if (storedIdentity !== nextIdentity) {
      useCurrentWorkoutStore.getState().reset();
    }
    syncGenerationRef.current += 1;
    setSyncEnabled(false, userId);
    setSyncingFromCloud(true);

    if (!storedIdentity) {
      if (nextIdentity === ANONYMOUS_IDENTITY) {
        saveAccountState(ANONYMOUS_IDENTITY, captureAccountState());
      } else {
        const legacyState = captureAccountState();
        if (legacyStateMatchesUser(legacyState, {
          firstName: userFirstName,
          lastName: userLastName,
        })) {
          saveAccountState(nextIdentity, legacyState);
          seedPendingSyncState(nextIdentity, legacyState);
        } else {
          saveAccountState(ANONYMOUS_IDENTITY, legacyState);
          useAppStore.setState(loadAccountState(nextIdentity) ?? createEmptyAccountState());
        }
      }
    } else if (storedIdentity !== nextIdentity) {
      saveAccountState(storedIdentity, captureAccountState());
      useAppStore.setState(loadAccountState(nextIdentity) ?? createEmptyAccountState());
    }

    localStorage.setItem(CURRENT_IDENTITY_KEY, nextIdentity);
    currentIdentityRef.current = userId;
    setSyncingFromCloud(false);
    setIdentityVersion((version) => version + 1);
    setIsInitialLoading(Boolean(userId));
    setError(null);
    if (!userId) setStatus('idle');
  }, [authLoading, userFirstName, userId, userLastName]);

  useEffect(() => {
    setSyncEnabled(Boolean(userId) && isOnline, userId);
  }, [identityVersion, isOnline, userId]);

  const syncFromCloud = useCallback(async (): Promise<void> => {
    const requestedUserId = userId;
    if (!requestedUserId || currentIdentityRef.current !== requestedUserId) {
      setStatus(isOnline ? 'idle' : 'offline');
      return;
    }
    if (!isOnline) {
      setStatus('offline');
      return;
    }

    const existing = syncInFlightRef.current;
    if (existing?.userId === requestedUserId) return existing.promise;

    const generation = syncGenerationRef.current;
    const cloudSyncGeneration = getCloudSyncGeneration();
    const isCurrent = (): boolean =>
      currentIdentityRef.current === requestedUserId &&
      syncGenerationRef.current === generation &&
      getCloudSyncGeneration() === cloudSyncGeneration &&
      isOnline;

    const promise = (async () => {
      setStatus('syncing');
      setError(null);
      // Keep observing local edits during the pull, but defer uploads so pending
      // snapshots cannot be cleared before they are overlaid onto fetched data.
      setSyncEnabled(false, requestedUserId);

      try {
        await flushPendingSync(requestedUserId, isCurrent);
        if (!isCurrent()) return;

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
        if (!isCurrent()) return;

        const firstError = [
          profileResult.error,
          templatesResult.error,
          sessionsResult.error,
          activeSessionResult.error,
          exercisesResult.error,
          weightEntriesResult.error,
        ].find(Boolean);
        if (firstError) throw new Error(firstError.message || 'Failed to sync data');

        const pending = getPendingSyncState(requestedUserId);
        const localState = useAppStore.getState();
        const cloudPreferences = profileResult.profile
          ? profileToPreferences(profileResult.profile)
          : createEmptyAccountState().preferences;
        const workoutGoal = pending.workoutGoal ??
          profileResult.profile?.workout_goal ??
          createEmptyAccountState().workoutGoal;
        const cycleState = pending.cycleState ??
          profileResult.profile?.cycle_state ??
          createEmptyAccountState().cycleState;
        const cycleConfig = localState.cycleConfig.id === cycleState.cycleConfigId
          ? localState.cycleConfig
          : getDefaultCycleForGoal(workoutGoal);

        setSyncingFromCloud(true);
        useAppStore.setState({
          preferences: { ...cloudPreferences, ...pending.preferences },
          workoutGoal,
          cycleState,
          cycleConfig,
          hasCompletedIntro: pending.hasCompletedIntro ??
            profileResult.profile?.has_completed_intro ??
            false,
          templates: applyPendingTemplateOrder(
            overlayPendingRecords(templatesResult.templates, pending.templates),
            pending.templateOrder
          ),
          sessions: overlayPendingRecords(sessionsResult.sessions, pending.sessions),
          activeSession: pending.activeSessionSet
            ? pending.activeSession ?? null
            : activeSessionResult.session,
          customExercises: overlayPendingRecords(
            exercisesResult.exercises,
            pending.customExercises
          ),
          weightEntries: overlayPendingWeights(weightEntriesResult.entries, pending.weights),
        });
        setSyncingFromCloud(false);

        await flushPendingSync(requestedUserId, isCurrent);
        if (!isCurrent()) return;

        const dedupeKey = `workout-app-dedupe-fix-v1:${requestedUserId}`;
        if (!localStorage.getItem(dedupeKey)) {
          const { fixed, error: dedupeError } = await deduplicateTemplateExercises();
          if (!isCurrent()) return;
          if (dedupeError) throw dedupeError;
          if (fixed > 0) {
            const refreshed = await getTemplates();
            if (refreshed.error) throw refreshed.error;
            if (isCurrent()) {
              const latestPending = getPendingSyncState(requestedUserId);
              useAppStore.setState({
                templates: applyPendingTemplateOrder(
                  overlayPendingRecords(refreshed.templates, latestPending.templates),
                  latestPending.templateOrder
                ),
              });
            }
          }
          localStorage.setItem(dedupeKey, 'true');
        }

        if (!isCurrent()) return;
        saveAccountState(requestedUserId, captureAccountState());
        setStatus('synced');
        setLastSyncedAt(new Date());
      } catch (syncError) {
        if (!isCurrent()) return;
        setStatus('error');
        setError(syncError instanceof Error ? syncError.message : 'Sync failed');
      } finally {
        if (isCurrent()) {
          setSyncingFromCloud(false);
          setSyncEnabled(true, requestedUserId);
        }
      }
    })();

    syncInFlightRef.current = { userId: requestedUserId, promise };
    trackCloudSync(promise);
    try {
      await promise;
    } finally {
      if (syncInFlightRef.current?.promise === promise) {
        syncInFlightRef.current = null;
      }
    }
  }, [isOnline, userId]);

  useEffect(() => {
    if (authLoading || currentIdentityRef.current !== userId) return;

    if (!userId) {
      setIsInitialLoading(false);
      return;
    }
    if (!isOnline) {
      setStatus('offline');
      setIsInitialLoading(false);
      return;
    }

    syncFromCloud().finally(() => {
      if (currentIdentityRef.current === userId) setIsInitialLoading(false);
    });
  }, [authLoading, identityVersion, isOnline, syncFromCloud, userId]);

  const value: SyncContextType = {
    status,
    error,
    lastSyncedAt,
    isInitialLoading,
    syncFromCloud,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};
