import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WorkoutTemplate } from '../../types';

// Mock supabase
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

// Mock authHelper
vi.mock('./authHelper', () => ({
  getAuthUser: vi.fn(() => Promise.resolve({ id: 'test-user-id' })),
}));

// Import after mocks
import { syncAddTemplate, syncUpdateTemplate } from './sync';
import { supabase } from '../../lib/supabase';

describe('sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        '[Sync] BLOCKED: Template has too many exercises:',
        51
      );

      consoleSpy.mockRestore();
    });

    it('should block update with more than 3 duplicates of same exercise', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const template = createTemplate(20, 5);

      await syncUpdateTemplate(template);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Sync] BLOCKED: Template has too many duplicate exercises:',
        5
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
        '[Sync] BLOCKED: Template has too many exercises:',
        126
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
  });
});
