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
    it('should set migration complete flag', () => {
      markMigrationComplete();

      expect(localStorage.getItem('workout-app-migration-complete')).toBe('true');
    });

    it('should not throw when called multiple times', () => {
      expect(() => markMigrationComplete()).not.toThrow();
      expect(() => markMigrationComplete()).not.toThrow();
    });

    it('should not affect the main storage key', () => {
      const data = createMockStorageData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      markMigrationComplete();

      // Main storage key should still exist (Zustand uses it)
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
      // Migration flag should be set
      expect(localStorage.getItem('workout-app-migration-complete')).toBe('true');
    });
  });

  describe('isMigrationComplete', () => {
    it('should return false when migration flag not set', () => {
      expect(isMigrationComplete()).toBe(false);
    });

    it('should return false when data exists but migration flag not set', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockStorageData()));
      expect(isMigrationComplete()).toBe(false);
    });

    it('should return true when migration flag is set', () => {
      localStorage.setItem('workout-app-migration-complete', 'true');
      expect(isMigrationComplete()).toBe(true);
    });

    it('should return true even when storage data exists if migration flag is set', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(createMockStorageData()));
      localStorage.setItem('workout-app-migration-complete', 'true');
      expect(isMigrationComplete()).toBe(true);
    });
  });

  describe('Custom exercise ID mapping during migration', () => {
    const mockSession = {
      user: { id: 'user-123' },
      access_token: 'token',
    };

    it('should map old custom exercise IDs to new UUIDs in templates', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as never);

      // Track the exercise IDs that get inserted into template_exercises
      const insertedTemplateExercises: { exercise_id: string }[] = [];

      // Track insert count outside the mock to persist across calls
      let customExerciseInsertCount = 0;

      // Create comprehensive mock for all Supabase operations
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'custom_exercises') {
          // Return new UUID for each custom exercise insert
          return {
            insert: vi.fn().mockImplementation(() => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockImplementation(() => {
                  customExerciseInsertCount++;
                  return Promise.resolve({
                    data: { id: `new-uuid-${customExerciseInsertCount}` },
                    error: null,
                  });
                }),
              }),
            })),
          };
        }
        if (table === 'workout_templates') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'template-uuid-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'template_exercises') {
          return {
            insert: vi.fn().mockImplementation((exercises: { exercise_id: string }[]) => {
              insertedTemplateExercises.push(...exercises);
              return Promise.resolve({ error: null });
            }),
          };
        }
        if (table === 'weight_entries') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      // Set up localStorage with custom exercises and a template that uses them
      const data = createMockStorageData({
        customExercises: [
          { id: 'custom-1234567890', name: 'My Custom Exercise', type: 'strength', muscleGroups: ['chest'], equipment: 'dumbbell' },
          { id: 'custom-9876543210', name: 'Another Custom', type: 'strength', muscleGroups: ['back'], equipment: 'barbell' },
        ],
        templates: [
          {
            id: 'template-1',
            name: 'Test Template',
            templateType: 'strength',
            exercises: [
              { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
              { type: 'strength', exerciseId: 'custom-1234567890', targetSets: 3, targetReps: 10 }, // Custom exercise
              { type: 'strength', exerciseId: 'custom-9876543210', targetSets: 3, targetReps: 8 }, // Another custom
            ],
          },
        ],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const result = await migrateLocalStorageToSupabase();

      expect(result.success).toBe(true);
      expect(result.migratedCounts.customExercises).toBe(2);
      expect(result.migratedCounts.templates).toBe(1);

      // Verify template exercises were inserted with mapped UUIDs, not old IDs
      expect(insertedTemplateExercises).toHaveLength(3);

      // The built-in exercise should keep its ID
      expect(insertedTemplateExercises[0].exercise_id).toBe('bench-press');

      // Custom exercises should be mapped to new UUIDs
      expect(insertedTemplateExercises[1].exercise_id).toBe('new-uuid-1');
      expect(insertedTemplateExercises[2].exercise_id).toBe('new-uuid-2');

      // Verify old IDs are NOT present
      expect(insertedTemplateExercises.some(e => e.exercise_id === 'custom-1234567890')).toBe(false);
      expect(insertedTemplateExercises.some(e => e.exercise_id === 'custom-9876543210')).toBe(false);
    });

    it('should map old custom exercise IDs to new UUIDs in sessions', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as never);

      // Track the exercise IDs that get inserted into session_exercises
      const insertedSessionExercises: { exercise_id: string }[] = [];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'custom_exercises') {
          return {
            insert: vi.fn().mockImplementation(() => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'new-uuid-1' },
                  error: null,
                }),
              }),
            })),
          };
        }
        if (table === 'workout_sessions') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'session-uuid-1' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'session_exercises') {
          return {
            insert: vi.fn().mockImplementation((exercises: { exercise_id: string }[]) => {
              insertedSessionExercises.push(...exercises);
              return {
                select: vi.fn().mockResolvedValue({
                  data: exercises.map((_, i) => ({ id: `session-ex-${i}` })),
                  error: null,
                }),
              };
            }),
          };
        }
        if (table === 'completed_sets') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        if (table === 'weight_entries') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const data = createMockStorageData({
        customExercises: [
          { id: 'custom-1111111111', name: 'Custom Curl', type: 'strength', muscleGroups: ['biceps'], equipment: 'dumbbell' },
        ],
        sessions: [
          {
            id: 'session-1',
            name: 'Workout Session',
            startedAt: '2024-01-01T10:00:00Z',
            completedAt: '2024-01-01T11:00:00Z',
            exercises: [
              { type: 'strength', exerciseId: 'squat', targetSets: 3, targetReps: 10, sets: [], restSeconds: 90 },
              { type: 'strength', exerciseId: 'custom-1111111111', targetSets: 3, targetReps: 12, sets: [], restSeconds: 90 },
            ],
          },
        ],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      const result = await migrateLocalStorageToSupabase();

      expect(result.success).toBe(true);
      expect(result.migratedCounts.customExercises).toBe(1);
      expect(result.migratedCounts.sessions).toBe(1);

      // Verify session exercises were inserted with mapped UUIDs
      expect(insertedSessionExercises).toHaveLength(2);
      expect(insertedSessionExercises[0].exercise_id).toBe('squat');
      expect(insertedSessionExercises[1].exercise_id).toBe('new-uuid-1');

      // Verify old ID is NOT present
      expect(insertedSessionExercises.some(e => e.exercise_id === 'custom-1111111111')).toBe(false);
    });

    it('should preserve built-in exercise IDs while mapping custom ones', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as never);

      const insertedTemplateExercises: { exercise_id: string }[] = [];

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ error: null }),
            }),
          };
        }
        if (table === 'custom_exercises') {
          return {
            insert: vi.fn().mockImplementation(() => ({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'mapped-uuid' },
                  error: null,
                }),
              }),
            })),
          };
        }
        if (table === 'workout_templates') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'template-uuid' },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === 'template_exercises') {
          return {
            insert: vi.fn().mockImplementation((exercises: { exercise_id: string }[]) => {
              insertedTemplateExercises.push(...exercises);
              return Promise.resolve({ error: null });
            }),
          };
        }
        if (table === 'weight_entries') {
          return {
            upsert: vi.fn().mockResolvedValue({ error: null }),
          };
        }
        return {};
      });

      vi.mocked(supabase.from).mockImplementation(mockFrom);

      const data = createMockStorageData({
        customExercises: [
          { id: 'custom-999', name: 'My Exercise', type: 'strength', muscleGroups: ['chest'], equipment: 'other' },
        ],
        templates: [
          {
            id: 'tpl-1',
            name: 'Mixed Template',
            templateType: 'strength',
            exercises: [
              { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
              { type: 'strength', exerciseId: 'deadlift', targetSets: 3, targetReps: 5 },
              { type: 'strength', exerciseId: 'custom-999', targetSets: 4, targetReps: 8 },
              { type: 'strength', exerciseId: 'lat-pulldown', targetSets: 3, targetReps: 12 },
            ],
          },
        ],
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      await migrateLocalStorageToSupabase();

      // Built-in exercises keep their IDs
      expect(insertedTemplateExercises[0].exercise_id).toBe('bench-press');
      expect(insertedTemplateExercises[1].exercise_id).toBe('deadlift');
      expect(insertedTemplateExercises[3].exercise_id).toBe('lat-pulldown');

      // Custom exercise gets mapped to new UUID
      expect(insertedTemplateExercises[2].exercise_id).toBe('mapped-uuid');
    });
  });
});
