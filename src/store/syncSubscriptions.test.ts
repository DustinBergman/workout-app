import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  flushPendingSync,
  getPendingSyncState,
  markSessionAsSynced,
  setSyncEnabled,
  setupSyncSubscriptions,
} from './syncSubscriptions';

// Store subscription callbacks for testing
type SubscribeCallback = (state: unknown, prevState: unknown) => void;
const subscriptionCallbacks: Map<string, SubscribeCallback> = new Map();

// Use vi.hoisted to define mocks that can be referenced in vi.mock factories
const {
  mockGetUser,
  mockSyncPreferences,
  mockSyncWorkoutGoal,
  mockSyncCurrentWeek,
  mockSyncHasCompletedIntro,
  mockSyncAddTemplate,
  mockSyncUpdateTemplate,
  mockSyncDeleteTemplate,
  mockSyncReorderTemplates,
  mockSyncAddSession,
  mockSyncUpdateSession,
  mockSyncDeleteSession,
  mockSyncSetActiveSession,
  mockSyncAddCustomExercise,
  mockSyncDeleteCustomExercise,
  mockSyncAddWeightEntry,
  mockSyncDeleteWeightEntry,
} = vi.hoisted(() => ({
  mockGetUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
  mockSyncPreferences: vi.fn().mockResolvedValue({}),
  mockSyncWorkoutGoal: vi.fn().mockResolvedValue({}),
  mockSyncCurrentWeek: vi.fn().mockResolvedValue({}),
  mockSyncHasCompletedIntro: vi.fn().mockResolvedValue({}),
  mockSyncAddTemplate: vi.fn().mockResolvedValue({}),
  mockSyncUpdateTemplate: vi.fn().mockResolvedValue({}),
  mockSyncDeleteTemplate: vi.fn().mockResolvedValue({}),
  mockSyncReorderTemplates: vi.fn().mockResolvedValue({}),
  mockSyncAddSession: vi.fn().mockResolvedValue({}),
  mockSyncUpdateSession: vi.fn().mockResolvedValue({}),
  mockSyncDeleteSession: vi.fn().mockResolvedValue({}),
  mockSyncSetActiveSession: vi.fn().mockResolvedValue({}),
  mockSyncAddCustomExercise: vi.fn().mockResolvedValue({}),
  mockSyncDeleteCustomExercise: vi.fn().mockResolvedValue({}),
  mockSyncAddWeightEntry: vi.fn().mockResolvedValue({}),
  mockSyncDeleteWeightEntry: vi.fn().mockResolvedValue({}),
}));

// Mock the dependencies
vi.mock('./useAppStore', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      templates: [],
      sessions: [],
      customExercises: [],
      weightEntries: [],
    })),
    subscribe: vi.fn((selector: (state: unknown) => unknown, callback: SubscribeCallback) => {
      // Store callback with a key based on what it selects
      const selectorStr = selector.toString();
      if (selectorStr.includes('preferences')) {
        subscriptionCallbacks.set('preferences', callback);
      } else if (selectorStr.includes('workoutGoal')) {
        subscriptionCallbacks.set('workoutGoal', callback);
      } else if (selectorStr.includes('currentWeek')) {
        subscriptionCallbacks.set('currentWeek', callback);
      } else if (selectorStr.includes('hasCompletedIntro')) {
        subscriptionCallbacks.set('hasCompletedIntro', callback);
      } else if (selectorStr.includes('templates')) {
        subscriptionCallbacks.set('templates', callback);
      } else if (selectorStr.includes('sessions') && !selectorStr.includes('activeSession')) {
        subscriptionCallbacks.set('sessions', callback);
      } else if (selectorStr.includes('activeSession')) {
        subscriptionCallbacks.set('activeSession', callback);
      } else if (selectorStr.includes('customExercises')) {
        subscriptionCallbacks.set('customExercises', callback);
      } else if (selectorStr.includes('weightEntries')) {
        subscriptionCallbacks.set('weightEntries', callback);
      }
      return vi.fn(); // Return unsubscribe function
    }),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: mockGetUser,
    },
  },
}));

vi.mock('../services/supabase/sync', () => ({
  syncPreferences: mockSyncPreferences,
  syncWorkoutGoal: mockSyncWorkoutGoal,
  syncCurrentWeek: mockSyncCurrentWeek,
  syncHasCompletedIntro: mockSyncHasCompletedIntro,
  syncAddTemplate: mockSyncAddTemplate,
  syncUpdateTemplate: mockSyncUpdateTemplate,
  syncDeleteTemplate: mockSyncDeleteTemplate,
  syncReorderTemplates: mockSyncReorderTemplates,
  syncAddSession: mockSyncAddSession,
  syncUpdateSession: mockSyncUpdateSession,
  syncDeleteSession: mockSyncDeleteSession,
  syncSetActiveSession: mockSyncSetActiveSession,
  syncAddCustomExercise: mockSyncAddCustomExercise,
  syncDeleteCustomExercise: mockSyncDeleteCustomExercise,
  syncAddWeightEntry: mockSyncAddWeightEntry,
  syncDeleteWeightEntry: mockSyncDeleteWeightEntry,
}));

vi.mock('../hooks/useFeed', () => ({
  clearFeedCache: vi.fn(),
}));

import { useAppStore } from './useAppStore';
import { useToastStore } from './toastStore';

describe('syncSubscriptions', () => {
  beforeEach(() => {
    // Reset sync state between tests
    setSyncEnabled(false, null);
    localStorage.clear();
    useToastStore.getState().clearToasts();
    // Clear all mocks
    vi.clearAllMocks();
    // Clear subscription callbacks
    subscriptionCallbacks.clear();
  });

  describe('markSessionAsSynced', () => {
    it('should add session ID to previousSessionIds when not already present', () => {
      // Enable sync to initialize the previousSessionIds array
      setSyncEnabled(true);

      const sessionId = 'test-session-123';

      // This should not throw and should add the ID
      expect(() => markSessionAsSynced(sessionId)).not.toThrow();
    });

    it('should not throw when called with same ID multiple times', () => {
      setSyncEnabled(true);

      const sessionId = 'test-session-456';

      // Call multiple times - should not throw
      expect(() => {
        markSessionAsSynced(sessionId);
        markSessionAsSynced(sessionId);
        markSessionAsSynced(sessionId);
      }).not.toThrow();
    });

    it('should handle multiple different session IDs', () => {
      setSyncEnabled(true);

      expect(() => {
        markSessionAsSynced('session-1');
        markSessionAsSynced('session-2');
        markSessionAsSynced('session-3');
      }).not.toThrow();
    });

    it('should work even when sync is disabled', () => {
      setSyncEnabled(false);

      // markSessionAsSynced should still work (it's just tracking)
      expect(() => markSessionAsSynced('session-offline')).not.toThrow();
    });
  });

  describe('setSyncEnabled', () => {
    it('should not throw when enabling sync', () => {
      expect(() => setSyncEnabled(true)).not.toThrow();
    });

    it('should not throw when disabling sync', () => {
      setSyncEnabled(true);
      expect(() => setSyncEnabled(false)).not.toThrow();
    });

    it('should handle multiple enable/disable cycles', () => {
      expect(() => {
        setSyncEnabled(true);
        setSyncEnabled(false);
        setSyncEnabled(true);
        setSyncEnabled(false);
      }).not.toThrow();
    });
  });

  describe('sync without network auth calls', () => {
    beforeEach(() => {
      // Setup subscriptions
      setupSyncSubscriptions();
    });

    it('should NOT call supabase.auth.getUser when preferences change', () => {
      setSyncEnabled(true);

      const callback = subscriptionCallbacks.get('preferences');
      expect(callback).toBeDefined();

      // Simulate preference change
      callback!(
        { weightUnit: 'kg', distanceUnit: 'km' },
        { weightUnit: 'lbs', distanceUnit: 'mi' }
      );

      // Should NOT have called supabase.auth.getUser
      expect(mockGetUser).not.toHaveBeenCalled();
      // Should have called syncPreferences
      expect(mockSyncPreferences).toHaveBeenCalled();
    });

    it('should NOT call supabase.auth.getUser when workout goal changes', () => {
      setSyncEnabled(true);

      const callback = subscriptionCallbacks.get('workoutGoal');
      expect(callback).toBeDefined();

      // Simulate workout goal change
      callback!('strength', 'hypertrophy');

      // Should NOT have called supabase.auth.getUser
      expect(mockGetUser).not.toHaveBeenCalled();
      // Should have called syncWorkoutGoal
      expect(mockSyncWorkoutGoal).toHaveBeenCalled();
    });

    it('should NOT call supabase.auth.getUser when hasCompletedIntro changes', () => {
      setSyncEnabled(true);

      const callback = subscriptionCallbacks.get('hasCompletedIntro');
      expect(callback).toBeDefined();

      // Simulate intro completion
      callback!(true, false);

      // Should NOT have called supabase.auth.getUser
      expect(mockGetUser).not.toHaveBeenCalled();
      // Should have called syncHasCompletedIntro
      expect(mockSyncHasCompletedIntro).toHaveBeenCalled();
    });

    it('should NOT call supabase.auth.getUser when active session changes', () => {
      setSyncEnabled(true);

      const callback = subscriptionCallbacks.get('activeSession');
      expect(callback).toBeDefined();

      // Simulate active session change
      callback!(
        { id: 'session-1', name: 'Test' },
        null
      );

      // Should NOT have called supabase.auth.getUser
      expect(mockGetUser).not.toHaveBeenCalled();
      // Should have called syncSetActiveSession
      expect(mockSyncSetActiveSession).toHaveBeenCalled();
    });

    it('should not sync when syncEnabled is false', () => {
      setSyncEnabled(false);

      const callback = subscriptionCallbacks.get('preferences');
      expect(callback).toBeDefined();

      // Simulate preference change
      callback!(
        { weightUnit: 'kg', distanceUnit: 'km' },
        { weightUnit: 'lbs', distanceUnit: 'mi' }
      );

      // Should NOT have called any sync function
      expect(mockSyncPreferences).not.toHaveBeenCalled();
      // And definitely no auth calls
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('should sync preferences when enabled, not when disabled', () => {
      // Start disabled
      setSyncEnabled(false);

      const callback = subscriptionCallbacks.get('preferences');
      expect(callback).toBeDefined();

      // Change while disabled - should not sync
      callback!(
        { weightUnit: 'kg', distanceUnit: 'km' },
        { weightUnit: 'lbs', distanceUnit: 'mi' }
      );
      expect(mockSyncPreferences).not.toHaveBeenCalled();

      // Enable sync
      setSyncEnabled(true);

      // Change while enabled - should sync
      callback!(
        { weightUnit: 'lbs', distanceUnit: 'mi' },
        { weightUnit: 'kg', distanceUnit: 'km' }
      );
      expect(mockSyncPreferences).toHaveBeenCalled();

      // Still no auth network calls
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('should coalesce multiple rapid state changes to the newest values', async () => {
      setSyncEnabled(true);

      const prefsCallback = subscriptionCallbacks.get('preferences');
      const goalCallback = subscriptionCallbacks.get('workoutGoal');
      const introCallback = subscriptionCallbacks.get('hasCompletedIntro');

      // Simulate rapid state changes (like during app initialization)
      prefsCallback!({ weightUnit: 'kg' }, { weightUnit: 'lbs' });
      goalCallback!('strength', null);
      introCallback!(true, false);
      prefsCallback!({ weightUnit: 'lbs' }, { weightUnit: 'kg' });
      goalCallback!('hypertrophy', 'strength');

      await vi.waitFor(() => {
        expect(mockSyncPreferences).toHaveBeenCalledTimes(2);
        expect(mockSyncWorkoutGoal).toHaveBeenCalledTimes(1);
      });
      expect(mockSyncWorkoutGoal).toHaveBeenLastCalledWith(
        'hypertrophy',
        '__authenticated__',
        expect.any(AbortSignal)
      );
      expect(mockSyncHasCompletedIntro).toHaveBeenCalledTimes(1);

      // But NO auth network calls should have been made
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('persists offline changes and flushes them for the same identity', async () => {
      setSyncEnabled(false, 'offline-user');
      const callback = subscriptionCallbacks.get('preferences');

      callback!({ weightUnit: 'kg' }, { weightUnit: 'lbs' });

      expect(getPendingSyncState('offline-user').preferences).toEqual({ weightUnit: 'kg' });
      expect(mockSyncPreferences).not.toHaveBeenCalled();

      setSyncEnabled(true, 'offline-user');
      await flushPendingSync('offline-user');

      expect(mockSyncPreferences).toHaveBeenCalledWith(
        { weightUnit: 'kg' },
        'offline-user',
        expect.any(AbortSignal)
      );
      expect(getPendingSyncState('offline-user').preferences).toBeUndefined();
    });

    it('syncs custom exercise updates, not only additions', async () => {
      setSyncEnabled(true, 'exercise-user');
      const callback = subscriptionCallbacks.get('customExercises');
      const previous = { id: 'exercise-1', name: 'Old name', type: 'strength' };
      const updated = { ...previous, name: 'New name' };

      callback!([updated], [previous]);

      await vi.waitFor(() => {
        expect(mockSyncAddCustomExercise).toHaveBeenCalledWith(
          updated,
          'exercise-user',
          expect.any(AbortSignal)
        );
      });
    });

    it('persists deletion tombstones until the cloud delete succeeds', async () => {
      setSyncEnabled(false, 'delete-user');
      const callback = subscriptionCallbacks.get('templates');
      const deleted = { id: 'template-1', name: 'Deleted template', exercises: [] };

      callback!([], [deleted]);

      expect(getPendingSyncState('delete-user').templates['template-1']).toEqual({
        kind: 'delete',
      });
      setSyncEnabled(true, 'delete-user');
      await flushPendingSync('delete-user');

      expect(mockSyncDeleteTemplate).toHaveBeenCalledWith(
        'template-1',
        'delete-user',
        expect.any(AbortSignal)
      );
      expect(getPendingSyncState('delete-user').templates['template-1']).toBeUndefined();
    });

    it('enqueues a toast when a background flush fails', async () => {
      setupSyncSubscriptions();
      setSyncEnabled(true, 'toast-user');
      mockSyncPreferences.mockRejectedValueOnce(new Error('Network unavailable'));
      const callback = subscriptionCallbacks.get('preferences');

      callback!({ weightUnit: 'kg' }, { weightUnit: 'lbs' });

      await vi.waitFor(() => {
        const toasts = useToastStore.getState().toasts;
        expect(toasts[toasts.length - 1]?.message).toBe(
          'Unable to sync recent changes. They remain saved on this device.'
        );
      });
    });

    it('returns a cleanup that unsubscribes every store listener', () => {
      const unsubscribe = vi.fn();
      vi.mocked(useAppStore.subscribe).mockReturnValue(unsubscribe);

      const cleanup = setupSyncSubscriptions();
      cleanup();

      expect(unsubscribe).toHaveBeenCalledTimes(9);
    });
  });
});
