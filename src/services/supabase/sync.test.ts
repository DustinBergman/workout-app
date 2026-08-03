import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WorkoutSession, WorkoutTemplate } from '../../types';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => {
      const builder: Record<string, ReturnType<typeof vi.fn>> = {};
      builder.select = vi.fn(() => builder);
      builder.eq = vi.fn(() => builder);
      builder.abortSignal = vi.fn(() => builder);
      builder.insert = vi.fn(() => builder);
      builder.update = vi.fn(() => builder);
      builder.delete = vi.fn(() => builder);
      builder.upsert = vi.fn(() => builder);
      builder.maybeSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
      builder.single = vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }));
      return builder;
    }),
  },
}));

// Mock authHelper
vi.mock('./authHelper', () => ({
  getAuthUser: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
}));

// Import after mocks
import {
  syncAddTemplate,
  syncSetActiveSession,
  syncUpdateTemplate,
  waitForQueuedSyncs,
} from './sync';
import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';

describe('sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'test-user-id' } as never);
  });

  describe('syncAddTemplate - corruption guard', () => {
    const createTemplate = (exerciseCount: number, duplicateCount = 1): WorkoutTemplate => {
      const exercises = [];
      const uniqueExercises = Math.ceil(exerciseCount / duplicateCount);

      for (let i = 0; i < uniqueExercises; i++) {
        for (let j = 0; j < duplicateCount && exercises.length < exerciseCount; j++) {
          exercises.push({
            type: 'strength' as const,
            exerciseId: `exercise-${i}`,
            targetSets: 3,
            targetReps: 10,
          });
        }
      }

      return {
        id: 'test-template-id',
        name: 'Test Template',
        templateType: 'strength',
        exercises,
        inRotation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    };

    it('should allow template with normal exercise count', async () => {
      const template = createTemplate(10);

      await syncAddTemplate(template);

      expect(supabase.from).toHaveBeenCalled();
    });

    it('should block template with more than 50 exercises', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const template = createTemplate(51);

      await syncAddTemplate(template);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] Detected corrupted template data, skipping sync:',
        expect.objectContaining({
          exerciseCount: 51,
        })
      );
      // Should not attempt to insert into database
      expect(supabase.from).not.toHaveBeenCalledWith('workout_templates');

      consoleSpy.mockRestore();
    });

    it('should block template with more than 3 duplicates of same exercise', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // 4 copies of 3 unique exercises = 12 total, but 4 duplicates of each
      const template = createTemplate(12, 4);

      await syncAddTemplate(template);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] Detected corrupted template data, skipping sync:',
        expect.objectContaining({
          maxDuplicates: 4,
        })
      );

      consoleSpy.mockRestore();
    });

    it('should allow template with exactly 50 exercises', async () => {
      const template = createTemplate(50);

      await syncAddTemplate(template);

      expect(supabase.from).toHaveBeenCalled();
    });

    it('should allow template with up to 3 duplicates of same exercise', async () => {
      // 3 copies of 5 unique exercises = 15 total
      const template = createTemplate(15, 3);

      await syncAddTemplate(template);

      expect(supabase.from).toHaveBeenCalled();
    });

    it('should block template with 126 exercises (the actual bug case)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Simulate the actual bug: 7 unique exercises, each duplicated 18 times
      const template = createTemplate(126, 18);

      await syncAddTemplate(template);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] Detected corrupted template data, skipping sync:',
        expect.objectContaining({
          exerciseCount: 126,
          maxDuplicates: 18,
        })
      );

      consoleSpy.mockRestore();
    });
  });

  describe('syncUpdateTemplate - corruption guard', () => {
    const createTemplate = (exerciseCount: number, duplicateCount = 1): WorkoutTemplate => {
      const exercises = [];
      const uniqueExercises = Math.ceil(exerciseCount / duplicateCount);

      for (let i = 0; i < uniqueExercises; i++) {
        for (let j = 0; j < duplicateCount && exercises.length < exerciseCount; j++) {
          exercises.push({
            type: 'strength' as const,
            exerciseId: `exercise-${i}`,
            targetSets: 3,
            targetReps: 10,
          });
        }
      }

      return {
        id: 'test-template-id',
        name: 'Test Template',
        templateType: 'strength',
        exercises,
        inRotation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    };

    it('should allow update with normal exercise count', async () => {
      const template = createTemplate(10);

      await syncUpdateTemplate(template);

      expect(supabase.from).toHaveBeenCalledWith('workout_templates');
    });

    it('should block update with more than 50 exercises', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const template = createTemplate(51);

      await syncUpdateTemplate(template);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] Detected corrupted template data, skipping sync:',
        expect.objectContaining({ exerciseCount: 51 })
      );

      consoleSpy.mockRestore();
    });

    it('should block update with more than 3 duplicates of same exercise', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const template = createTemplate(20, 5);

      await syncUpdateTemplate(template);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] Detected corrupted template data, skipping sync:',
        expect.objectContaining({ maxDuplicates: 5 })
      );

      consoleSpy.mockRestore();
    });

    it('should block update simulating the 18x duplication bug', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      // Simulate: 7 exercises × 18 duplicates = 126
      const template = createTemplate(126, 18);

      await syncUpdateTemplate(template);

      // Should first hit the "too many exercises" check
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] Detected corrupted template data, skipping sync:',
        expect.objectContaining({ exerciseCount: 126 })
      );
      // Should NOT call update on the database
      expect(supabase.from).not.toHaveBeenCalledWith('workout_templates');

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty exercises array', async () => {
      const template: WorkoutTemplate = {
        id: 'test-template-id',
        name: 'Empty Template',
        templateType: 'strength',
        exercises: [],
        inRotation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await syncAddTemplate(template);

      expect(supabase.from).toHaveBeenCalled();
    });

    it('should handle template with single exercise', async () => {
      const template: WorkoutTemplate = {
        id: 'test-template-id',
        name: 'Single Exercise Template',
        templateType: 'strength',
        exercises: [{
          type: 'strength',
          exerciseId: 'bench-press',
          targetSets: 3,
          targetReps: 10,
        }],
        inRotation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await syncAddTemplate(template);

      expect(supabase.from).toHaveBeenCalled();
    });

    it('should correctly count duplicates with mixed exercise types', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const template: WorkoutTemplate = {
        id: 'test-template-id',
        name: 'Mixed Template',
        templateType: 'strength',
        exercises: [
          // 4 copies of same strength exercise (should trigger guard)
          { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
          { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
          { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
          { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
          // Different exercises
          { type: 'strength', exerciseId: 'squat', targetSets: 3, targetReps: 10 },
        ],
        inRotation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await syncAddTemplate(template);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] Detected corrupted template data, skipping sync:',
        expect.objectContaining({
          maxDuplicates: 4,
        })
      );

      consoleSpy.mockRestore();
    });

    describe('write serialization', () => {
      it('coalesces a later template snapshot instead of dropping it', async () => {
        let releaseAuth: ((user: { id: string }) => void) | undefined;
        vi.mocked(getAuthUser)
          .mockImplementationOnce(() => new Promise((resolve) => {
            releaseAuth = resolve;
          }) as never)
          .mockResolvedValue({ id: 'test-user-id' } as never);
        const original: WorkoutTemplate = {
          id: 'queued-template',
          name: 'Original',
          templateType: 'strength',
          exercises: [],
          inRotation: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };
        const newest = { ...original, name: 'Newest' };

        const first = syncUpdateTemplate(original);
        const second = syncUpdateTemplate(newest);
        releaseAuth?.({ id: 'test-user-id' });
        await Promise.all([first, second]);

        const templateBuilders = vi.mocked(supabase.from).mock.results
          .filter((_, index) => vi.mocked(supabase.from).mock.calls[index][0] === 'workout_templates')
          .map((result) => result.value as { insert: ReturnType<typeof vi.fn> });
        const insertedNames = templateBuilders.flatMap((builder) =>
          builder.insert.mock.calls.map((call) => (call[0] as { name: string }).name)
        );
        expect(insertedNames).toContain('Newest');
      });

      it('evicts a timed-out resource queue so the next write can retry', async () => {
        vi.useFakeTimers();
        vi.mocked(getAuthUser).mockImplementationOnce(
          () => new Promise(() => {}) as never
        );
        const template: WorkoutTemplate = {
          id: 'timeout-template',
          name: 'Timed out',
          templateType: 'strength',
          exercises: [],
          inRotation: true,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        };

        const timedOutWrite = syncUpdateTemplate(template);
        const rejection = expect(timedOutWrite).rejects.toThrow(
          'Template synchronization timed out'
        );
        await vi.advanceTimersByTimeAsync(15000);
        await rejection;
        await waitForQueuedSyncs();

        vi.mocked(getAuthUser).mockResolvedValue({ id: 'test-user-id' } as never);
        await expect(
          syncUpdateTemplate({ ...template, name: 'Retry' })
        ).resolves.toBeUndefined();
        vi.useRealTimers();
      });

      it('upserts a new active session parent row', async () => {
        const session: WorkoutSession = {
          id: 'active-session',
          name: 'Active workout',
          startedAt: '2026-01-01T00:00:00.000Z',
          exercises: [{
            id: 'session-exercise',
            exerciseId: 'bench-press',
            type: 'strength',
            targetSets: 3,
            targetReps: 8,
            restSeconds: 90,
            sets: [],
          }],
        };

        await syncSetActiveSession(session);

        const workoutBuilders = vi.mocked(supabase.from).mock.results
          .filter((_, index) => vi.mocked(supabase.from).mock.calls[index][0] === 'workout_sessions')
          .map((result) => result.value as { insert: ReturnType<typeof vi.fn> });
        expect(workoutBuilders.some((builder) => builder.insert.mock.calls.some(
          (call) => {
            const inserted = call[0] as { id?: string; is_active?: boolean };
            return inserted.id === 'active-session' && inserted.is_active === true;
          }
        ))).toBe(true);
      });

      it('creates an empty active quick-workout parent row', async () => {
        const session: WorkoutSession = {
          id: 'quick-session',
          name: 'Quick Workout',
          startedAt: '2026-01-01T00:00:00.000Z',
          exercises: [],
        };

        await syncSetActiveSession(session);

        expect(supabase.from).toHaveBeenCalledWith('workout_sessions');
      });
    });
  });
});
