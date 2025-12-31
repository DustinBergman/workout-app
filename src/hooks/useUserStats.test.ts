import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserStats, TimePeriod } from './useUserStats';
import { WorkoutSession, StrengthSessionExercise, StrengthCompletedSet, Exercise } from '../types';

const createStrengthSet = (weight: number, reps: number): StrengthCompletedSet => ({
  type: 'strength',
  weight,
  reps,
  unit: 'lbs',
  completedAt: new Date().toISOString(),
});

const createStrengthExercise = (
  exerciseId: string,
  sets: StrengthCompletedSet[]
): StrengthSessionExercise => ({
  type: 'strength',
  exerciseId,
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  sets,
});

const createMockSession = (
  overrides: Partial<WorkoutSession> = {},
  daysAgo: number = 0
): WorkoutSession => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const completedDate = new Date(date);
  completedDate.setHours(completedDate.getHours() + 1);

  return {
    id: `session-${Math.random().toString(36).substring(2, 9)}`,
    name: 'Test Workout',
    startedAt: date.toISOString(),
    completedAt: completedDate.toISOString(),
    exercises: [],
    ...overrides,
  };
};

describe('useUserStats', () => {
  describe('empty state', () => {
    it('should return zeros for empty sessions array', () => {
      const { result } = renderHook(() => useUserStats([], 'all'));

      expect(result.current).toEqual({
        averageStrengthIncrease: 0,
        muscleGroupBreakdown: [],
        averageSessionDuration: 0,
        averageSessionsPerWeek: 0,
        averageVolumePerSession: 0,
        totalSessions: 0,
      });
    });
  });

  describe('time period filtering', () => {
    it('should return all sessions for "all" period', () => {
      const sessions = [
        createMockSession({}, 0),
        createMockSession({}, 60),
        createMockSession({}, 120),
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.totalSessions).toBe(3);
    });

    it('should filter sessions for last 30 days', () => {
      const sessions = [
        createMockSession({}, 0),
        createMockSession({}, 15),
        createMockSession({}, 45), // Outside 30 days
      ];

      const { result } = renderHook(() => useUserStats(sessions, '30'));
      expect(result.current.totalSessions).toBe(2);
    });

    it('should filter sessions for last 90 days', () => {
      const sessions = [
        createMockSession({}, 0),
        createMockSession({}, 60),
        createMockSession({}, 100), // Outside 90 days
      ];

      const { result } = renderHook(() => useUserStats(sessions, '90'));
      expect(result.current.totalSessions).toBe(2);
    });
  });

  describe('session duration', () => {
    it('should calculate average session duration', () => {
      const sessions = [
        createMockSession({}, 0), // 1 hour duration
        createMockSession({}, 1), // 1 hour duration
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageSessionDuration).toBe(60); // 60 minutes
    });

    it('should only count completed sessions for duration', () => {
      const sessions = [
        createMockSession({}, 0), // 1 hour duration
        createMockSession({ completedAt: undefined }, 1), // Not completed
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageSessionDuration).toBe(60);
    });
  });

  describe('sessions per week', () => {
    it('should calculate sessions per week', () => {
      const sessions = [
        createMockSession({}, 0),
        createMockSession({}, 7),
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // 2 sessions over 1 week = 2 per week
      expect(result.current.averageSessionsPerWeek).toBeCloseTo(2, 1);
    });

    it('should handle single session', () => {
      const sessions = [createMockSession({}, 0)];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageSessionsPerWeek).toBe(1);
    });
  });

  describe('volume calculation', () => {
    it('should calculate average volume per session', () => {
      const sessions = [
        createMockSession({
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(100, 10), // 1000 volume
            ]),
          ],
        }, 0),
        createMockSession({
          exercises: [
            createStrengthExercise('squat', [
              createStrengthSet(200, 10), // 2000 volume
            ]),
          ],
        }, 1),
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageVolumePerSession).toBe(1500); // (1000 + 2000) / 2
    });
  });

  describe('strength progress', () => {
    it('should calculate strength increase for exercises with progress', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 30);
      const newDate = new Date();

      const sessions: WorkoutSession[] = [
        {
          id: 'session-1',
          name: 'Workout 1',
          startedAt: oldDate.toISOString(),
          completedAt: oldDate.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(100, 10),
            ]),
          ],
        },
        {
          id: 'session-2',
          name: 'Workout 2',
          startedAt: newDate.toISOString(),
          completedAt: newDate.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(110, 10), // 10% increase
            ]),
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageStrengthIncrease).toBe(10);
    });

    it('should return 0 for exercises without progress', () => {
      const sessions = [
        createMockSession({
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(100, 10),
            ]),
          ],
        }, 0),
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageStrengthIncrease).toBe(0);
    });
  });

  describe('memoization', () => {
    it('should return stable result for unchanged inputs', () => {
      const sessions = [createMockSession({}, 0)];
      const period: TimePeriod = 'all';

      const { result, rerender } = renderHook(
        ({ sessions, period }) => useUserStats(sessions, period),
        { initialProps: { sessions, period } }
      );

      const firstTotalSessions = result.current.totalSessions;
      const firstAvgDuration = result.current.averageSessionDuration;

      rerender({ sessions, period });

      // Values should remain the same when inputs don't change
      expect(result.current.totalSessions).toBe(firstTotalSessions);
      expect(result.current.averageSessionDuration).toBe(firstAvgDuration);
    });
  });
});
