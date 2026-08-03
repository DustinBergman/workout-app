import type {
  Exercise,
  UserCycleState,
  UserPreferences,
  WeightEntry,
  WorkoutGoal,
  WorkoutSession,
  WorkoutTemplate,
} from '../types';
import { useAppStore } from './useAppStore';
import {
  syncPreferences,
  syncWorkoutGoal,
  syncCycleState,
  syncHasCompletedIntro,
  syncDeleteTemplate,
  syncReorderTemplates,
  syncAddTemplate,
  syncAddSession,
  syncDeleteSession,
  syncSetActiveSession,
  syncAddCustomExercise,
  syncDeleteCustomExercise,
  syncAddWeightEntry,
  syncDeleteWeightEntry,
} from '../services/supabase/sync';
import { clearFeedCache } from '../hooks/useFeed';
import { withAbortableTimeout } from '../services/asyncTimeout';
import { enqueueErrorToast } from '../services/errorToast';

type PendingUpsert<T> = { kind: 'upsert'; value: T };
type PendingDelete = { kind: 'delete' };
type PendingRecord<T> = PendingUpsert<T> | PendingDelete;

export interface PendingSyncState {
  preferences?: Partial<UserPreferences>;
  workoutGoal?: WorkoutGoal;
  cycleState?: UserCycleState;
  hasCompletedIntro?: boolean;
  templates: Record<string, PendingRecord<WorkoutTemplate>>;
  templateOrder?: string[];
  sessions: Record<string, PendingRecord<WorkoutSession>>;
  activeSessionSet?: boolean;
  activeSession?: WorkoutSession | null;
  customExercises: Record<string, PendingRecord<Exercise>>;
  weights: Record<string, PendingRecord<WeightEntry>>;
}

export interface PendingSyncSeed {
  preferences: UserPreferences;
  workoutGoal: WorkoutGoal;
  cycleState: UserCycleState;
  hasCompletedIntro: boolean;
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  customExercises: Exercise[];
  weightEntries: WeightEntry[];
}

export interface SyncPauseState {
  enabled: boolean;
  identity: string | null;
  syncingFromCloud: boolean;
}

const PENDING_KEY_PREFIX = 'workout-app-pending-sync-v2:';
const emptyPendingState = (): PendingSyncState => ({
  templates: {},
  sessions: {},
  customExercises: {},
  weights: {},
});

let syncEnabled = false;
let syncIdentity: string | null = null;
let isSyncingFromCloud = false;
let previousSessionIds: string[] = [];
const flushesInFlight = new Map<string, Promise<void>>();
const PENDING_OPERATION_TIMEOUT_MS = 15000;

const pendingKey = (userId: string): string => `${PENDING_KEY_PREFIX}${userId}`;
const valuesEqual = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right);
const runPendingOperation = <T>(
  operation: (signal: AbortSignal) => Promise<T>,
  description: string
): Promise<T> => withAbortableTimeout(
  operation,
  PENDING_OPERATION_TIMEOUT_MS,
  `${description} timed out`
);

export const getPendingSyncState = (userId: string): PendingSyncState => {
  const serialized = localStorage.getItem(pendingKey(userId));
  if (!serialized) return emptyPendingState();

  try {
    return { ...emptyPendingState(), ...JSON.parse(serialized) as PendingSyncState };
  } catch (error) {
    console.error('[SyncSubscriptions] Invalid pending synchronization state:', error);
    return emptyPendingState();
  }
};

const hasPendingOperations = (pending: PendingSyncState): boolean =>
  Boolean(
    pending.preferences ||
    pending.workoutGoal !== undefined ||
    pending.cycleState ||
    pending.hasCompletedIntro !== undefined ||
    Object.keys(pending.templates).length ||
    pending.templateOrder ||
    Object.keys(pending.sessions).length ||
    pending.activeSessionSet ||
    Object.keys(pending.customExercises).length ||
    Object.keys(pending.weights).length
  );

const savePending = (userId: string, pending: PendingSyncState): void => {
  if (hasPendingOperations(pending)) {
    localStorage.setItem(pendingKey(userId), JSON.stringify(pending));
  } else {
    localStorage.removeItem(pendingKey(userId));
  }
};

export const clearPendingSyncState = (userId: string): void => {
  localStorage.removeItem(pendingKey(userId));
};

export const seedPendingSyncState = (
  userId: string,
  state: PendingSyncSeed
): void => {
  const pending = emptyPendingState();
  pending.preferences = state.preferences;
  pending.workoutGoal = state.workoutGoal;
  pending.cycleState = state.cycleState;
  pending.hasCompletedIntro = state.hasCompletedIntro;
  pending.templateOrder = state.templates.map((template) => template.id);
  for (const template of state.templates) {
    pending.templates[template.id] = { kind: 'upsert', value: template };
  }
  for (const session of state.sessions) {
    pending.sessions[session.id] = { kind: 'upsert', value: session };
  }
  pending.activeSessionSet = true;
  pending.activeSession = state.activeSession;
  for (const exercise of state.customExercises) {
    pending.customExercises[exercise.id] = { kind: 'upsert', value: exercise };
  }
  for (const entry of state.weightEntries) {
    pending.weights[entry.date] = { kind: 'upsert', value: entry };
  }
  savePending(userId, pending);
};

const updatePending = (
  userId: string,
  update: (pending: PendingSyncState) => void
): void => {
  const pending = getPendingSyncState(userId);
  update(pending);
  savePending(userId, pending);
};

const updateBaselines = (): void => {
  const state = useAppStore.getState();
  previousSessionIds = state.sessions.map((session) => session.id);
};

export const setSyncEnabled = (enabled: boolean, userId?: string | null): void => {
  const nextIdentity = userId === undefined
    ? (enabled ? syncIdentity ?? '__authenticated__' : syncIdentity)
    : userId;
  const identityChanged = nextIdentity !== syncIdentity;
  syncIdentity = nextIdentity;
  syncEnabled = enabled && Boolean(syncIdentity);

  if (identityChanged || syncEnabled) {
    updateBaselines();
  }
  if (syncEnabled && syncIdentity) {
    const enabledIdentity = syncIdentity;
    queueMicrotask(() => {
      if (syncEnabled && syncIdentity === enabledIdentity) {
        flushPendingSync(enabledIdentity).catch((error) => {
          reportPendingSyncError(
            '[SyncSubscriptions] Failed to flush pending changes:',
            error
          );
        });
      }
    });
  }
};

export const markSessionAsSynced = (sessionId: string): void => {
  if (!previousSessionIds.includes(sessionId)) {
    previousSessionIds.push(sessionId);
  }
};

export const setSyncingFromCloud = (syncing: boolean): void => {
  isSyncingFromCloud = syncing;
  if (!syncing) updateBaselines();
};

export const pauseSyncForDataClear = async (
  userId: string
): Promise<SyncPauseState> => {
  const previous = {
    enabled: syncEnabled,
    identity: syncIdentity,
    syncingFromCloud: isSyncingFromCloud,
  };
  setSyncEnabled(false, userId);
  setSyncingFromCloud(true);
  const activeFlush = flushesInFlight.get(userId);
  if (activeFlush) {
    try {
      await activeFlush;
    } catch (error) {
      console.warn('[SyncSubscriptions] Discarding failed writes before clearing data:', error);
    }
  }
  clearPendingSyncState(userId);
  return previous;
};

export const resumeSyncAfterDataClear = (previous: SyncPauseState): void => {
  setSyncingFromCloud(previous.syncingFromCloud);
  setSyncEnabled(previous.enabled, previous.identity);
};

const clearIfUnchanged = (
  userId: string,
  matches: (pending: PendingSyncState) => boolean,
  clear: (pending: PendingSyncState) => void
): void => {
  updatePending(userId, (pending) => {
    if (matches(pending)) clear(pending);
  });
};

const performPendingFlush = async (
  userId: string,
  isCurrent: () => boolean
): Promise<void> => {
  while (isCurrent()) {
    const pending = getPendingSyncState(userId);
    if (!hasPendingOperations(pending)) return;

    if (pending.preferences) {
      const snapshot = pending.preferences;
      await runPendingOperation(
        (signal) => syncPreferences(snapshot, userId, signal),
        'Preference synchronization'
      );
      clearIfUnchanged(userId, (current) => valuesEqual(current.preferences, snapshot), (current) => {
        delete current.preferences;
      });
    }
    if (!isCurrent()) return;

    if (pending.workoutGoal !== undefined) {
      const snapshot = pending.workoutGoal;
      await runPendingOperation(
        (signal) => syncWorkoutGoal(snapshot, userId, signal),
        'Workout goal synchronization'
      );
      clearIfUnchanged(userId, (current) => current.workoutGoal === snapshot, (current) => {
        delete current.workoutGoal;
      });
    }

    if (pending.cycleState) {
      const snapshot = pending.cycleState;
      await runPendingOperation(
        (signal) => syncCycleState(snapshot, userId, signal),
        'Training cycle synchronization'
      );
      clearIfUnchanged(userId, (current) => valuesEqual(current.cycleState, snapshot), (current) => {
        delete current.cycleState;
      });
    }

    if (pending.hasCompletedIntro !== undefined) {
      const snapshot = pending.hasCompletedIntro;
      await runPendingOperation(
        (signal) => syncHasCompletedIntro(snapshot, userId, signal),
        'Introduction state synchronization'
      );
      clearIfUnchanged(userId, (current) => current.hasCompletedIntro === snapshot, (current) => {
        delete current.hasCompletedIntro;
      });
    }

    for (const [id, operation] of Object.entries(pending.templates)) {
      if (!isCurrent()) return;
      if (operation.kind === 'delete') {
        await runPendingOperation(
          (signal) => syncDeleteTemplate(id, userId, signal),
          'Template deletion'
        );
      } else {
        await runPendingOperation(
          () => syncAddTemplate(operation.value, userId),
          'Template synchronization'
        );
      }
      clearIfUnchanged(userId, (current) => valuesEqual(current.templates[id], operation), (current) => {
        delete current.templates[id];
      });
    }

    if (pending.templateOrder) {
      const snapshot = pending.templateOrder;
      await runPendingOperation(
        (signal) => syncReorderTemplates(snapshot, userId, signal),
        'Template order synchronization'
      );
      clearIfUnchanged(userId, (current) => valuesEqual(current.templateOrder, snapshot), (current) => {
        delete current.templateOrder;
      });
    }

    for (const [id, operation] of Object.entries(pending.sessions)) {
      if (!isCurrent()) return;
      if (operation.kind === 'delete') {
        await runPendingOperation(
          (signal) => syncDeleteSession(id, userId, signal),
          'Session deletion'
        );
      } else {
        await runPendingOperation(
          () => syncAddSession(operation.value, userId),
          'Session synchronization'
        );
        if (operation.value.completedAt) clearFeedCache();
      }
      clearIfUnchanged(userId, (current) => valuesEqual(current.sessions[id], operation), (current) => {
        delete current.sessions[id];
      });
    }

    if (pending.activeSessionSet) {
      const snapshot = pending.activeSession ?? null;
      await runPendingOperation(
        (signal) => syncSetActiveSession(snapshot, userId, signal),
        'Active session synchronization'
      );
      clearIfUnchanged(
        userId,
        (current) => Boolean(current.activeSessionSet) && valuesEqual(current.activeSession ?? null, snapshot),
        (current) => {
          delete current.activeSessionSet;
          delete current.activeSession;
        }
      );
    }

    for (const [id, operation] of Object.entries(pending.customExercises)) {
      if (!isCurrent()) return;
      if (operation.kind === 'delete') {
        await runPendingOperation(
          (signal) => syncDeleteCustomExercise(id, userId, signal),
          'Custom exercise deletion'
        );
      } else {
        await runPendingOperation(
          (signal) => syncAddCustomExercise(operation.value, userId, signal),
          'Custom exercise synchronization'
        );
      }
      clearIfUnchanged(
        userId,
        (current) => valuesEqual(current.customExercises[id], operation),
        (current) => {
          delete current.customExercises[id];
        }
      );
    }

    for (const [date, operation] of Object.entries(pending.weights)) {
      if (!isCurrent()) return;
      if (operation.kind === 'delete') {
        await runPendingOperation(
          (signal) => syncDeleteWeightEntry(date, userId, signal),
          'Weight entry deletion'
        );
      } else {
        await runPendingOperation(
          (signal) => syncAddWeightEntry(operation.value, userId, signal),
          'Weight entry synchronization'
        );
      }
      clearIfUnchanged(userId, (current) => valuesEqual(current.weights[date], operation), (current) => {
        delete current.weights[date];
      });
    }
  }
};

export const flushPendingSync = (
  userId: string,
  isCurrent: () => boolean = () => syncIdentity === userId
): Promise<void> => {
  const existing = flushesInFlight.get(userId);
  if (existing) return existing;

  const promise = performPendingFlush(userId, isCurrent).finally(() => {
    flushesInFlight.delete(userId);
    if (
      syncEnabled &&
      syncIdentity === userId &&
      hasPendingOperations(getPendingSyncState(userId))
    ) {
      queueMicrotask(() => {
        flushPendingSync(userId).catch((error) => {
          reportPendingSyncError(
            '[SyncSubscriptions] Failed to flush queued changes:',
            error
          );
        });
      });
    }
  });
  flushesInFlight.set(userId, promise);
  return promise;
};

const queueFlush = (): void => {
  if (!syncEnabled || !syncIdentity || isSyncingFromCloud) return;
  flushPendingSync(syncIdentity).catch((error) => {
    reportPendingSyncError(
      '[SyncSubscriptions] Failed to synchronize local change:',
      error
    );
  });
};

const getTrackingIdentity = (): string | null =>
  isSyncingFromCloud ? null : syncIdentity;

const reportPendingSyncError = (message: string, error: unknown): void => {
  console.error(message, error);
  enqueueErrorToast(
    error,
    'Unable to sync recent changes. They remain saved on this device.'
  );
};

export const setupSyncSubscriptions = (): (() => void) => {
  const unsubscribers = [
    useAppStore.subscribe(
      (state) => state.preferences,
      (preferences, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || valuesEqual(preferences, previous)) return;
        const changes: Partial<UserPreferences> = {};
        for (const key of Object.keys(preferences) as Array<keyof UserPreferences>) {
          if (preferences[key] !== previous[key]) {
            Object.assign(changes, { [key]: preferences[key] });
          }
        }
        updatePending(userId, (pending) => {
          pending.preferences = { ...pending.preferences, ...changes };
        });
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.workoutGoal,
      (goal, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || goal === previous) return;
        updatePending(userId, (pending) => {
          pending.workoutGoal = goal;
        });
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.cycleState,
      (cycleState, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || valuesEqual(cycleState, previous)) return;
        updatePending(userId, (pending) => {
          pending.cycleState = cycleState;
        });
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.hasCompletedIntro,
      (value, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || value === previous) return;
        updatePending(userId, (pending) => {
          pending.hasCompletedIntro = value;
        });
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.templates,
      (templates, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || valuesEqual(templates, previous)) return;
        const currentIds = new Set(templates.map((template) => template.id));
        updatePending(userId, (pending) => {
          for (const template of previous) {
            if (!currentIds.has(template.id)) pending.templates[template.id] = { kind: 'delete' };
          }
          for (const template of templates) {
            const prior = previous.find((candidate) => candidate.id === template.id);
            if (!prior || !valuesEqual(template, prior)) {
              pending.templates[template.id] = { kind: 'upsert', value: template };
            }
          }
          pending.templateOrder = templates.map((template) => template.id);
        });
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.sessions,
      (sessions, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || valuesEqual(sessions, previous)) return;
        const currentIds = new Set(sessions.map((session) => session.id));
        updatePending(userId, (pending) => {
          for (const session of previous) {
            if (!currentIds.has(session.id)) pending.sessions[session.id] = { kind: 'delete' };
          }
          for (const session of sessions) {
            const prior = previous.find((candidate) => candidate.id === session.id);
            if (!prior || !valuesEqual(session, prior)) {
              pending.sessions[session.id] = { kind: 'upsert', value: session };
            }
          }
        });
        previousSessionIds = sessions.map((session) => session.id);
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.activeSession,
      (session, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || valuesEqual(session, previous)) return;
        updatePending(userId, (pending) => {
          pending.activeSessionSet = true;
          pending.activeSession = session;
        });
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.customExercises,
      (exercises, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || valuesEqual(exercises, previous)) return;
        const currentIds = new Set(exercises.map((exercise) => exercise.id));
        updatePending(userId, (pending) => {
          for (const exercise of previous) {
            if (!currentIds.has(exercise.id)) {
              pending.customExercises[exercise.id] = { kind: 'delete' };
            }
          }
          for (const exercise of exercises) {
            const prior = previous.find((candidate) => candidate.id === exercise.id);
            if (!prior || !valuesEqual(exercise, prior)) {
              pending.customExercises[exercise.id] = { kind: 'upsert', value: exercise };
            }
          }
        });
        queueFlush();
      }
    ),
    useAppStore.subscribe(
      (state) => state.weightEntries,
      (entries, previous) => {
        const userId = getTrackingIdentity();
        if (!userId || valuesEqual(entries, previous)) return;
        const currentDates = new Set(entries.map((entry) => entry.date));
        updatePending(userId, (pending) => {
          for (const entry of previous) {
            if (!currentDates.has(entry.date)) pending.weights[entry.date] = { kind: 'delete' };
          }
          for (const entry of entries) {
            const prior = previous.find((candidate) => candidate.date === entry.date);
            if (!prior || !valuesEqual(entry, prior)) {
              pending.weights[entry.date] = { kind: 'upsert', value: entry };
            }
          }
        });
        queueFlush();
      }
    ),
  ];

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
  };
};
