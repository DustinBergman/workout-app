import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasLocalStorageData,
  getMigrationSummary,
  migrateLocalStorageToSupabase,
  markMigrationComplete,
  isMigrationComplete,
} from './migration';

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const STORAGE_KEY = 'workout-app-storage';

const createMockStorageData = (overrides = {}) => ({
  state: {
    templates: [],
    sessions: [],
    preferences: {
      weightUnit: 'lbs',
      distanceUnit: 'mi',
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
    currentWeek: 0,
    weekStartedAt: null,
    workoutGoal: 'build',
    hasCompletedIntro: false,
    weightEntries: [],
    ...overrides,
  },
  version: 1,
});

describe('Migration Service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('hasLocalStorageData', () => {
    it('should return false when no data in localStorage', () => {
      expect(hasLocalStorageData()).toBe(false);
    });

    it('should return false when localStorage has empty data', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockStorageData()));
      expect(hasLocalStorageData()).toBe(false);
    });

    it('should return true when templates exist', () => {
      const data = createMockStorageData({
        templates: [{ id: '1', name: 'Test Template' }],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(hasLocalStorageData()).toBe(true);
    });

    it('should return true when sessions exist', () => {
      const data = createMockStorageData({
        sessions: [{ id: '1', name: 'Test Session' }],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(hasLocalStorageData()).toBe(true);
    });

    it('should return true when custom exercises exist', () => {
      const data = createMockStorageData({
        customExercises: [{ id: '1', name: 'Custom Exercise' }],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(hasLocalStorageData()).toBe(true);
    });

    it('should return true when weight entries exist', () => {
      const data = createMockStorageData({
        weightEntries: [{ date: '2024-01-01', weight: 150, unit: 'lbs' }],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(hasLocalStorageData()).toBe(true);
    });

    it('should return true when intro is completed', () => {
      const data = createMockStorageData({
        hasCompletedIntro: true,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(hasLocalStorageData()).toBe(true);
    });

    it('should return false on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(hasLocalStorageData()).toBe(false);
    });
  });

  describe('getMigrationSummary', () => {
    it('should return null when no data in localStorage', () => {
      expect(getMigrationSummary()).toBeNull();
    });

    it('should return correct counts', () => {
      const data = createMockStorageData({
        templates: [{ id: '1' }, { id: '2' }],
        sessions: [{ id: '1' }],
        customExercises: [{ id: '1' }, { id: '2' }, { id: '3' }],
        weightEntries: [{ date: '2024-01-01' }],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const summary = getMigrationSummary();

      expect(summary).toEqual({
        templates: 2,
        sessions: 1,
        customExercises: 3,
        weightEntries: 1,
      });
    });

    it('should return zero counts for empty arrays', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockStorageData()));

      const summary = getMigrationSummary();

      expect(summary).toEqual({
        templates: 0,
        sessions: 0,
        customExercises: 0,
        weightEntries: 0,
      });
    });

    it('should return null on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(getMigrationSummary()).toBeNull();
    });
  });

  describe('migrateLocalStorageToSupabase', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);

      const result = await migrateLocalStorageToSupabase();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Not authenticated');
      expect(result.migratedCounts).toEqual({
        templates: 0,
        sessions: 0,
        customExercises: 0,
        weightEntries: 0,
      });
    });

    it('should return success with zero counts when no localStorage data', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as never);

      const result = await migrateLocalStorageToSupabase();

      expect(result.success).toBe(true);
      expect(result.migratedCounts).toEqual({
        templates: 0,
        sessions: 0,
        customExercises: 0,
        weightEntries: 0,
      });
    });

    it('should migrate profile data', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
      };
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as never);

      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      vi.mocked(supabase.from).mockReturnValue({
        update: mockUpdate,
      } as never);

      const data = createMockStorageData({
        hasCompletedIntro: true,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      await migrateLocalStorageToSupabase();

      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  describe('markMigrationComplete', () => {
    it('should remove localStorage data', () => {
      const data = createMockStorageData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      markMigrationComplete();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should not throw when no localStorage data', () => {
      expect(() => markMigrationComplete()).not.toThrow();
    });

    it('should not throw on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(() => markMigrationComplete()).not.toThrow();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('isMigrationComplete', () => {
    it('should return true when no localStorage data', () => {
      expect(isMigrationComplete()).toBe(true);
    });

    it('should return false when data exists but not migrated', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockStorageData()));
      expect(isMigrationComplete()).toBe(false);
    });

    it('should return true when migrated flag is set', () => {
      const data = { ...createMockStorageData(), migrated: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      expect(isMigrationComplete()).toBe(true);
    });

    it('should return false on invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json');
      expect(isMigrationComplete()).toBe(false);
    });
  });
});
