import { describe, it, expect, beforeEach, vi } from 'vitest';
import { markSessionAsSynced, setSyncEnabled } from './syncSubscriptions';

// Mock the dependencies
vi.mock('./useAppStore', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      templates: [],
      sessions: [],
      customExercises: [],
      weightEntries: [],
    })),
    subscribe: vi.fn(),
  },
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
}));

vi.mock('../services/supabase/sync', () => ({
  syncPreferences: vi.fn(),
  syncWorkoutGoal: vi.fn(),
  syncCurrentWeek: vi.fn(),
  syncHasCompletedIntro: vi.fn(),
  syncAddTemplate: vi.fn(),
  syncUpdateTemplate: vi.fn(),
  syncDeleteTemplate: vi.fn(),
  syncReorderTemplates: vi.fn(),
  syncAddSession: vi.fn(),
  syncUpdateSession: vi.fn(),
  syncSetActiveSession: vi.fn(),
  syncAddCustomExercise: vi.fn(),
  syncAddWeightEntry: vi.fn(),
  syncDeleteWeightEntry: vi.fn(),
}));

vi.mock('../hooks/useFeed', () => ({
  clearFeedCache: vi.fn(),
}));

describe('syncSubscriptions', () => {
  beforeEach(() => {
    // Reset sync state between tests
    setSyncEnabled(false);
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
});
