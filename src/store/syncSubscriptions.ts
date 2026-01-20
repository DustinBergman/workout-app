import { useAppStore } from './useAppStore';
import {
  syncPreferences,
  syncWorkoutGoal,
  syncCurrentWeek,
  syncHasCompletedIntro,
  syncDeleteTemplate,
  syncReorderTemplates,
  syncAddSession,
  syncUpdateSession,
  syncSetActiveSession,
  syncAddCustomExercise,
  syncAddWeightEntry,
  syncDeleteWeightEntry,
} from '../services/supabase/sync';
import { clearFeedCache } from '../hooks/useFeed';

// Track if sync is enabled (user is authenticated)
let syncEnabled = false;
// Flag to suppress sync during initial cloud load (prevents duplicate syncs)
let isSyncingFromCloud = false;
let previousSessionIds: string[] = [];
let previousExerciseIds: string[] = [];
let previousWeightDates: string[] = [];

/**
 * Enable/disable sync based on auth state
 */
export const setSyncEnabled = (enabled: boolean) => {
  syncEnabled = enabled;

  if (enabled) {
    // Capture current state for change detection
    const state = useAppStore.getState();
    previousSessionIds = state.sessions.map((s) => s.id);
    previousExerciseIds = state.customExercises.map((e) => e.id);
    previousWeightDates = state.weightEntries.map((e) => e.date);
  }
};

/**
 * Mark a session as already synced so the subscription won't try to sync it again
 */
export const markSessionAsSynced = (sessionId: string) => {
  if (!previousSessionIds.includes(sessionId)) {
    previousSessionIds.push(sessionId);
  }
};

/**
 * Set flag to suppress sync during cloud load
 * This prevents subscriptions from triggering syncs when cloud data is merged into the store
 */
export const setSyncingFromCloud = (syncing: boolean) => {
  console.log('[SyncSubscriptions] setSyncingFromCloud:', syncing);
  isSyncingFromCloud = syncing;
  if (!syncing) {
    // After cloud sync completes, update baselines with current state
    // This ensures we don't try to re-sync data that just came from the cloud
    const state = useAppStore.getState();
    previousSessionIds = state.sessions.map((s) => s.id);
    previousExerciseIds = state.customExercises.map((e) => e.id);
    previousWeightDates = state.weightEntries.map((e) => e.date);
    console.log('[SyncSubscriptions] Baselines updated after cloud sync');
  }
};

/**
 * Check if sync is enabled (user is authenticated and online)
 * This is a synchronous check - syncEnabled is managed by setSyncEnabled()
 * which is called from SyncContext when auth state changes
 * Also returns false if we're currently syncing FROM cloud (to prevent re-syncing cloud data)
 */
const isSyncEnabled = (): boolean => {
  const enabled = syncEnabled && !isSyncingFromCloud;
  if (!enabled && syncEnabled) {
    console.log('[SyncSubscriptions] Sync blocked - syncing from cloud in progress');
  }
  return enabled;
};

/**
 * Setup subscriptions for syncing store changes to Supabase
 */
export const setupSyncSubscriptions = () => {
  // Preferences sync
  useAppStore.subscribe(
    (state) => state.preferences,
    (preferences, prevPreferences) => {
      if (!isSyncEnabled()) return;
      if (JSON.stringify(preferences) === JSON.stringify(prevPreferences)) return;

      // Only sync the changed fields
      const changes: Partial<typeof preferences> = {};
      const keys = Object.keys(preferences) as Array<keyof typeof preferences>;

      for (const key of keys) {
        if (preferences[key] !== prevPreferences[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (changes as any)[key] = preferences[key];
        }
      }

      if (Object.keys(changes).length > 0) {
        syncPreferences(changes).catch(console.error);
      }
    }
  );

  // Workout goal sync
  useAppStore.subscribe(
    (state) => state.workoutGoal,
    (goal) => {
      if (!isSyncEnabled()) return;
      syncWorkoutGoal(goal).catch(console.error);
    }
  );

  // Current week sync
  useAppStore.subscribe(
    (state) => ({ week: state.currentWeek, startedAt: state.weekStartedAt }),
    ({ week, startedAt }) => {
      if (!isSyncEnabled()) return;
      syncCurrentWeek(week, startedAt).catch(console.error);
    }
  );

  // Has completed intro sync
  useAppStore.subscribe(
    (state) => state.hasCompletedIntro,
    (value) => {
      if (!isSyncEnabled()) return;
      syncHasCompletedIntro(value).catch(console.error);
    }
  );

  // Templates sync - only handles delete and reorder
  // Add/update are handled directly in useWorkoutPlans.ts to avoid subscription complexity
  useAppStore.subscribe(
    (state) => state.templates,
    (templates, prevTemplates) => {
      if (!isSyncEnabled()) return;

      const currentIds = templates.map((t) => t.id);
      const prevIds = prevTemplates.map((t) => t.id);

      // Check for deleted templates
      for (const prevTemplate of prevTemplates) {
        if (!currentIds.includes(prevTemplate.id)) {
          console.log('[SyncSubscriptions] Template deleted, syncing:', prevTemplate.id);
          syncDeleteTemplate(prevTemplate.id).catch(console.error);
        }
      }

      // Check for reordering (same templates, different order)
      if (
        currentIds.length === prevIds.length &&
        currentIds.every((id) => prevIds.includes(id)) &&
        JSON.stringify(currentIds) !== JSON.stringify(prevIds)
      ) {
        console.log('[SyncSubscriptions] Templates reordered, syncing');
        syncReorderTemplates(currentIds).catch(console.error);
      }
    }
  );

  // Sessions sync
  useAppStore.subscribe(
    (state) => state.sessions,
    (sessions, prevSessions) => {
      if (!isSyncEnabled()) return;

      const currentIds = sessions.map((s) => s.id);
      const prevIds = prevSessions.map((s) => s.id);

      // Check for added sessions
      for (const session of sessions) {
        if (!prevIds.includes(session.id) && !previousSessionIds.includes(session.id)) {
          // Sync session, then clear feed cache so newly completed workouts show up
          syncAddSession(session)
            .then(() => clearFeedCache())
            .catch(console.error);
        }
      }

      // Check for updated sessions
      for (const session of sessions) {
        const prevSession = prevSessions.find((s) => s.id === session.id);
        if (prevSession && JSON.stringify(session) !== JSON.stringify(prevSession)) {
          // If session was just completed, clear feed cache after sync
          const wasJustCompleted = !prevSession.completedAt && session.completedAt;
          syncUpdateSession(session)
            .then(() => {
              if (wasJustCompleted) clearFeedCache();
            })
            .catch(console.error);
        }
      }

      previousSessionIds = currentIds;
    }
  );

  // Active session sync
  useAppStore.subscribe(
    (state) => state.activeSession,
    (session, prevSession) => {
      if (!isSyncEnabled()) return;

      // Only sync significant changes
      if (JSON.stringify(session) !== JSON.stringify(prevSession)) {
        syncSetActiveSession(session).catch(console.error);
      }
    }
  );

  // Custom exercises sync
  useAppStore.subscribe(
    (state) => state.customExercises,
    (exercises, prevExercises) => {
      if (!isSyncEnabled()) return;

      const prevIds = prevExercises.map((e) => e.id);

      // Check for added exercises
      for (const exercise of exercises) {
        if (!prevIds.includes(exercise.id) && !previousExerciseIds.includes(exercise.id)) {
          syncAddCustomExercise(exercise).catch(console.error);
        }
      }

      previousExerciseIds = exercises.map((e) => e.id);
    }
  );

  // Weight entries sync
  useAppStore.subscribe(
    (state) => state.weightEntries,
    (entries, prevEntries) => {
      if (!isSyncEnabled()) return;

      const currentDates = entries.map((e) => e.date);
      const prevDates = prevEntries.map((e) => e.date);

      // Check for added entries
      for (const entry of entries) {
        if (!prevDates.includes(entry.date) && !previousWeightDates.includes(entry.date)) {
          syncAddWeightEntry(entry).catch(console.error);
        }
      }

      // Check for deleted entries
      for (const prevEntry of prevEntries) {
        if (!currentDates.includes(prevEntry.date)) {
          syncDeleteWeightEntry(prevEntry.date).catch(console.error);
        }
      }

      previousWeightDates = currentDates;
    }
  );
};
