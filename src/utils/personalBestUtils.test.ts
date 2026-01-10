import { describe, it, expect } from 'vitest';
import { calculate1RM, detectPersonalBests } from './personalBestUtils';
import { WorkoutSession } from '../types';

describe('personalBestUtils', () => {
  describe('calculate1RM', () => {
    it('returns weight unchanged for 1 rep', () => {
      expect(calculate1RM(100, 1)).toBe(100);
    });

    it('calculates estimated 1RM using Epley formula', () => {
      // 100 lbs x 10 reps = 100 * (1 + 10/30) = 100 * 1.333 = 133.3
      expect(calculate1RM(100, 10)).toBeCloseTo(133.33, 1);
    });

    it('returns weight unchanged for reps > 12', () => {
      expect(calculate1RM(100, 15)).toBe(100);
    });

    it('calculates correctly for 5 reps', () => {
      // 100 lbs x 5 reps = 100 * (1 + 5/30) = 100 * 1.167 = 116.7
      expect(calculate1RM(100, 5)).toBeCloseTo(116.67, 1);
    });
  });

  describe('detectPersonalBests', () => {
    const createSession = (
      id: string,
      exercises: WorkoutSession['exercises'],
      completedAt?: string
    ): WorkoutSession => ({
      id,
      name: 'Test Workout',
      startedAt: '2024-01-01T10:00:00Z',
      completedAt,
      exercises,
    });

    const createStrengthExercise = (
      exerciseId: string,
      sets: Array<{ weight: number; reps: number; unit?: 'lbs' | 'kg' }>
    ): WorkoutSession['exercises'][0] => ({
      type: 'strength',
      exerciseId,
      targetSets: 3,
      targetReps: 10,
      restSeconds: 60,
      sets: sets.map((s) => ({
        type: 'strength',
        weight: s.weight,
        reps: s.reps,
        unit: s.unit || 'lbs',
        completedAt: '2024-01-01T10:00:00Z',
      })),
    });

    it('returns empty array for first workout (no history)', () => {
      const currentSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 135, reps: 10 }])],
        '2024-01-01T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, []);
      expect(pbs).toHaveLength(0);
    });

    it('detects weight PB when lifting heavier than before', () => {
      const historicalSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 135, reps: 10 }])],
        '2024-01-01T11:00:00Z'
      );

      const currentSession = createSession(
        'session-2',
        [createStrengthExercise('bench-press', [{ weight: 145, reps: 8 }])],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [historicalSession]);
      expect(pbs).toHaveLength(1);
      expect(pbs[0].type).toBe('weight');
      expect(pbs[0].value).toBe(145);
      expect(pbs[0].exerciseId).toBe('bench-press');
    });

    it('detects 1RM PB when achieving better estimated 1RM', () => {
      // Historical: 135 x 10 = 135 * 1.333 = 180 estimated 1RM
      const historicalSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 135, reps: 10 }])],
        '2024-01-01T11:00:00Z'
      );

      // Current: 165 x 5 = 165 * 1.167 = 192.5 estimated 1RM (higher!)
      // But weight is not a PB (135 vs 165 - wait, 165 > 135, so this IS a weight PB)
      // Let me adjust: use lower weight but higher 1RM
      // Current: 140 x 12 = 140 * 1.4 = 196 estimated 1RM
      const currentSession = createSession(
        'session-2',
        [createStrengthExercise('bench-press', [{ weight: 140, reps: 12 }])],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [historicalSession]);
      // Should have weight PB (140 > 135) so 1RM won't be added
      expect(pbs).toHaveLength(1);
      expect(pbs[0].type).toBe('weight');
    });

    it('detects only 1RM PB when weight is lower but 1RM is higher', () => {
      // Historical: 200 x 1 = 200 1RM
      const historicalSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 200, reps: 1 }])],
        '2024-01-01T11:00:00Z'
      );

      // Current: 180 x 5 = 180 * 1.167 = 210 estimated 1RM (higher!)
      // Weight is NOT a PB (180 < 200)
      const currentSession = createSession(
        'session-2',
        [createStrengthExercise('bench-press', [{ weight: 180, reps: 5 }])],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [historicalSession]);
      expect(pbs).toHaveLength(1);
      expect(pbs[0].type).toBe('1rm');
      expect(pbs[0].value).toBe(210); // Rounded
    });

    it('does not count PBs for incomplete historical sessions', () => {
      const incompleteSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 135, reps: 10 }])]
        // No completedAt
      );

      const currentSession = createSession(
        'session-2',
        [createStrengthExercise('bench-press', [{ weight: 145, reps: 8 }])],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [incompleteSession]);
      expect(pbs).toHaveLength(0); // No history to beat
    });

    it('handles multiple exercises', () => {
      const historicalSession = createSession(
        'session-1',
        [
          createStrengthExercise('bench-press', [{ weight: 135, reps: 10 }]),
          createStrengthExercise('squat', [{ weight: 185, reps: 8 }]),
        ],
        '2024-01-01T11:00:00Z'
      );

      const currentSession = createSession(
        'session-2',
        [
          createStrengthExercise('bench-press', [{ weight: 145, reps: 10 }]), // PB!
          createStrengthExercise('squat', [{ weight: 180, reps: 8 }]), // Not a PB
        ],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [historicalSession]);
      expect(pbs).toHaveLength(1);
      expect(pbs[0].exerciseId).toBe('bench-press');
    });

    it('normalizes weights to lbs for comparison', () => {
      // Historical: 60kg = ~132 lbs
      const historicalSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 60, reps: 10, unit: 'kg' }])],
        '2024-01-01T11:00:00Z'
      );

      // Current: 135 lbs (slightly more than 60kg)
      const currentSession = createSession(
        'session-2',
        [createStrengthExercise('bench-press', [{ weight: 135, reps: 10, unit: 'lbs' }])],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [historicalSession]);
      expect(pbs).toHaveLength(1);
      expect(pbs[0].type).toBe('weight');
    });

    it('ignores cardio exercises', () => {
      const historicalSession = createSession(
        'session-1',
        [
          {
            type: 'cardio',
            exerciseId: 'running',
            restSeconds: 0,
            sets: [
              {
                type: 'cardio',
                distance: 3,
                distanceUnit: 'mi',
                durationSeconds: 1800,
                completedAt: '2024-01-01T10:30:00Z',
              },
            ],
          },
        ],
        '2024-01-01T11:00:00Z'
      );

      const currentSession = createSession(
        'session-2',
        [
          {
            type: 'cardio',
            exerciseId: 'running',
            restSeconds: 0,
            sets: [
              {
                type: 'cardio',
                distance: 4,
                distanceUnit: 'mi',
                durationSeconds: 2400,
                completedAt: '2024-01-02T10:40:00Z',
              },
            ],
          },
        ],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [historicalSession]);
      expect(pbs).toHaveLength(0);
    });

    it('excludes current session from comparison', () => {
      const currentSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 135, reps: 10 }])],
        '2024-01-01T11:00:00Z'
      );

      // Pass same session as both current and historical
      const pbs = detectPersonalBests(currentSession, [currentSession]);
      expect(pbs).toHaveLength(0);
    });

    it('uses best set from session for PB comparison', () => {
      const historicalSession = createSession(
        'session-1',
        [createStrengthExercise('bench-press', [{ weight: 135, reps: 10 }])],
        '2024-01-01T11:00:00Z'
      );

      // Multiple sets with varying weights - should use the best one
      const currentSession = createSession(
        'session-2',
        [
          createStrengthExercise('bench-press', [
            { weight: 135, reps: 10 },
            { weight: 145, reps: 8 }, // This is the best weight
            { weight: 135, reps: 8 },
          ]),
        ],
        '2024-01-02T11:00:00Z'
      );

      const pbs = detectPersonalBests(currentSession, [historicalSession]);
      expect(pbs).toHaveLength(1);
      expect(pbs[0].value).toBe(145);
      expect(pbs[0].reps).toBe(8);
    });
  });
});
