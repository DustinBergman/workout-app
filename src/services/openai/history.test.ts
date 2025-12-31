import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createHistoryContext, analyzeExercisePerformance } from './history';
import { WorkoutSession } from '../../types';

// Mock storage module
vi.mock('../storage', () => ({
  getCustomExercises: vi.fn(() => []),
}));

// Mock exercises data
vi.mock('../../data/exercises', () => ({
  getExerciseById: vi.fn((id: string) => ({ id, name: `Exercise ${id}` })),
}));

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

describe('History Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHistoryContext', () => {
    it('should return message when no sessions', () => {
      const result = createHistoryContext([]);
      expect(result).toBe('No workout history available yet.');
    });

    it('should format single session correctly', () => {
      const session = createMockSession({
        name: 'Push Day',
        startedAt: '2024-01-15T10:00:00.000Z',
        exercises: [
          {
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 8, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      });

      const result = createHistoryContext([session]);

      expect(result).toContain('Push Day');
      expect(result).toContain('Exercise bench-press');
      expect(result).toContain('135lbsx10');
      expect(result).toContain('135lbsx8');
    });

    it('should handle exercises with no sets', () => {
      const session = createMockSession({
        exercises: [
          {
            exerciseId: 'squats',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [],
          },
        ],
      });

      const result = createHistoryContext([session]);

      expect(result).toContain('no sets');
    });

    it('should limit to last 10 sessions', () => {
      const sessions = Array.from({ length: 15 }, (_, i) =>
        createMockSession({
          id: `session-${i}`,
          name: `Workout ${i}`,
          startedAt: new Date(Date.now() - i * 86400000).toISOString(),
        })
      );

      const result = createHistoryContext(sessions);

      // Most recent 10 sessions should be included
      expect(result).toContain('Workout 0');
      expect(result).toContain('Workout 9');
      expect(result).not.toContain('Workout 14');
    });

    it('should sort sessions by date descending', () => {
      const oldSession = createMockSession({
        id: 'old',
        name: 'Old Workout',
        startedAt: '2024-01-01T10:00:00.000Z',
      });
      const newSession = createMockSession({
        id: 'new',
        name: 'New Workout',
        startedAt: '2024-01-15T10:00:00.000Z',
      });

      const result = createHistoryContext([oldSession, newSession]);

      const newIndex = result.indexOf('New Workout');
      const oldIndex = result.indexOf('Old Workout');
      expect(newIndex).toBeLessThan(oldIndex);
    });
  });

  describe('analyzeExercisePerformance', () => {
    it('should return empty array for no sessions', () => {
      const result = analyzeExercisePerformance([]);
      expect(result).toEqual([]);
    });

    it('should skip exercises with less than 3 sets', () => {
      const session = createMockSession({
        exercises: [
          {
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      });

      const result = analyzeExercisePerformance([session]);
      expect(result).toHaveLength(0);
    });

    it('should analyze exercise with sufficient sets', () => {
      const session = createMockSession({
        exercises: [
          {
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 140, reps: 9, unit: 'lbs', completedAt: '' },
              { weight: 145, reps: 8, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      });

      const result = analyzeExercisePerformance([session]);

      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe('bench');
      expect(result[0].averageWeight).toBe(140);
      expect(result[0].averageReps).toBe(9);
    });

    it('should calculate trend as improving when volume increases', () => {
      // Create sessions with increasing volume over time
      const sessions = Array.from({ length: 3 }, (_, i) =>
        createMockSession({
          id: `session-${i}`,
          startedAt: new Date(Date.now() - (2 - i) * 86400000).toISOString(), // Oldest first
          exercises: [
            {
              exerciseId: 'bench',
              targetSets: 3,
              targetReps: 10,
              restSeconds: 90,
              sets: [
                { weight: 100 + i * 10, reps: 10, unit: 'lbs', completedAt: '' },
                { weight: 100 + i * 10, reps: 10, unit: 'lbs', completedAt: '' },
              ],
            },
          ],
        })
      );

      const result = analyzeExercisePerformance(sessions);

      expect(result).toHaveLength(1);
      expect(result[0].trend).toBe('improving');
    });

    it('should calculate trend as plateau when volume is stable', () => {
      const sessions = Array.from({ length: 3 }, (_, i) =>
        createMockSession({
          id: `session-${i}`,
          startedAt: new Date(Date.now() - i * 86400000).toISOString(),
          exercises: [
            {
              exerciseId: 'bench',
              targetSets: 3,
              targetReps: 10,
              restSeconds: 90,
              sets: [
                { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
                { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              ],
            },
          ],
        })
      );

      const result = analyzeExercisePerformance(sessions);

      expect(result).toHaveLength(1);
      expect(result[0].trend).toBe('plateau');
    });

    it('should return insufficient_data for less than 6 sets', () => {
      const session = createMockSession({
        exercises: [
          {
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      });

      const result = analyzeExercisePerformance([session]);

      expect(result[0].trend).toBe('insufficient_data');
    });

    it('should aggregate sets across multiple sessions', () => {
      const session1 = createMockSession({
        id: 'session-1',
        startedAt: '2024-01-15T10:00:00.000Z',
        exercises: [
          {
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      });
      const session2 = createMockSession({
        id: 'session-2',
        startedAt: '2024-01-16T10:00:00.000Z',
        exercises: [
          {
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [{ weight: 140, reps: 8, unit: 'lbs', completedAt: '' }],
          },
        ],
      });

      const result = analyzeExercisePerformance([session1, session2]);

      expect(result).toHaveLength(1);
      expect(result[0].recentSets).toHaveLength(3);
    });

    it('should limit recent sets to 5 in output', () => {
      const session = createMockSession({
        exercises: [
          {
            exerciseId: 'bench',
            targetSets: 10,
            targetReps: 10,
            restSeconds: 90,
            sets: Array.from({ length: 10 }, () => ({
              weight: 135,
              reps: 10,
              unit: 'lbs' as const,
              completedAt: '',
            })),
          },
        ],
      });

      const result = analyzeExercisePerformance([session]);

      expect(result[0].recentSets).toHaveLength(5);
    });
  });
});
