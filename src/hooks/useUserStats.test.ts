import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUserStats, TimePeriod } from './useUserStats';
import { WorkoutSession, StrengthSessionExercise, StrengthCompletedSet } from '../types';

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
        averageWeightChangePerWeek: 0,
        totalSessions: 0,
        isCardioPrimary: false,
        cardio: {
          totalDistance: 0,
          distanceUnit: 'mi',
          averagePace: null,
          paceImprovement: 0,
          totalCalories: 0,
          sessionCount: 0,
          averageDuration: 0,
        },
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
      expect(result.current.averageStrengthIncrease).toBeCloseTo(10, 1);
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

    it('should calculate negative strength change (regression)', () => {
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
              createStrengthSet(90, 10), // 10% decrease
            ]),
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageStrengthIncrease).toBeCloseTo(-10, 1);
    });

    it('should return 0 when weight stays the same', () => {
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
              createStrengthSet(100, 10), // Same weight
            ]),
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      expect(result.current.averageStrengthIncrease).toBeCloseTo(0, 1);
    });

    it('should average progress across multiple exercises', () => {
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
            createStrengthExercise('bench-press', [createStrengthSet(100, 10)]),
            createStrengthExercise('squat', [createStrengthSet(200, 10)]),
          ],
        },
        {
          id: 'session-2',
          name: 'Workout 2',
          startedAt: newDate.toISOString(),
          completedAt: newDate.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [createStrengthSet(120, 10)]), // +20%
            createStrengthExercise('squat', [createStrengthSet(210, 10)]), // +5%
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // Average of 20% and 5% = 12.5%
      expect(result.current.averageStrengthIncrease).toBeCloseTo(12.5, 1);
    });

    it('should handle mixed positive and negative changes', () => {
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
            createStrengthExercise('bench-press', [createStrengthSet(100, 10)]),
            createStrengthExercise('squat', [createStrengthSet(200, 10)]),
          ],
        },
        {
          id: 'session-2',
          name: 'Workout 2',
          startedAt: newDate.toISOString(),
          completedAt: newDate.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [createStrengthSet(110, 10)]), // +10%
            createStrengthExercise('squat', [createStrengthSet(180, 10)]), // -10%
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // Average of +10% and -10% = 0%
      expect(result.current.averageStrengthIncrease).toBeCloseTo(0, 1);
    });

    it('should use best estimated 1RM when multiple sets per exercise', () => {
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
              createStrengthSet(100, 10),
              createStrengthSet(100, 10),
            ]), // best e1RM = 100 * (1 + 10/30) = 133.33
          ],
        },
        {
          id: 'session-2',
          name: 'Workout 2',
          startedAt: newDate.toISOString(),
          completedAt: newDate.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(100, 10),
              createStrengthSet(110, 10),
              createStrengthSet(120, 10),
            ]), // best e1RM = 120 * (1 + 10/30) = 160
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // e1RM: 133.33 -> 160 = 20% increase
      expect(result.current.averageStrengthIncrease).toBeCloseTo(20, 1);
    });

    it('should detect strength gain when same weight but more reps (progressive overload)', () => {
      const week1Date = new Date();
      week1Date.setDate(week1Date.getDate() - 21);
      const week2Date = new Date();
      week2Date.setDate(week2Date.getDate() - 14);
      const week3Date = new Date();

      const sessions: WorkoutSession[] = [
        {
          id: 'session-1',
          name: 'Week 1 - Baseline',
          startedAt: week1Date.toISOString(),
          completedAt: week1Date.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(100, 10), // e1RM = 100 * (1 + 10/30) = 133.33
            ]),
          ],
        },
        {
          id: 'session-2',
          name: 'Week 2 - Higher weight, lower reps',
          startedAt: week2Date.toISOString(),
          completedAt: week2Date.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(110, 8), // e1RM = 110 * (1 + 8/30) = 139.33
            ]),
          ],
        },
        {
          id: 'session-3',
          name: 'Week 3 - Same weight, more reps',
          startedAt: week3Date.toISOString(),
          completedAt: week3Date.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(110, 10), // e1RM = 110 * (1 + 10/30) = 146.67
            ]),
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // Compares first (133.33) to latest (146.67) = ~10% increase
      // This correctly shows progress even though Week 2 had lower reps
      expect(result.current.averageStrengthIncrease).toBeCloseTo(10, 0);
    });

    it('should show minimal progress when weight increases but reps decrease proportionally', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14);
      const newDate = new Date();

      // Note: calculate1RM returns weight unchanged for reps === 1
      // So 120×5 → e1RM = 140, and 140×1 → e1RM = 140 (same!)
      // This correctly shows that lifting the same e1RM is NOT progress
      const sessions: WorkoutSession[] = [
        {
          id: 'session-1',
          name: 'Workout 1',
          startedAt: oldDate.toISOString(),
          completedAt: oldDate.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [
              createStrengthSet(120, 5), // e1RM = 120 * (1 + 5/30) = 140
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
              createStrengthSet(140, 1), // e1RM = 140 (unchanged for 1 rep)
            ]),
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // Both sessions have e1RM of 140, so 0% change
      expect(result.current.averageStrengthIncrease).toBeCloseTo(0, 1);
    });

    it('should compare first and last session for exercise (not max)', () => {
      const date1 = new Date();
      date1.setDate(date1.getDate() - 30);
      const date2 = new Date();
      date2.setDate(date2.getDate() - 15);
      const date3 = new Date();

      const sessions: WorkoutSession[] = [
        {
          id: 'session-1',
          name: 'Workout 1',
          startedAt: date1.toISOString(),
          completedAt: date1.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [createStrengthSet(100, 10)]),
          ],
        },
        {
          id: 'session-2',
          name: 'Workout 2',
          startedAt: date2.toISOString(),
          completedAt: date2.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [createStrengthSet(120, 10)]), // Peak
          ],
        },
        {
          id: 'session-3',
          name: 'Workout 3',
          startedAt: date3.toISOString(),
          completedAt: date3.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [createStrengthSet(105, 10)]), // Latest
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // Compares first (100) to latest (105) = 5% increase, not peak (120)
      expect(result.current.averageStrengthIncrease).toBeCloseTo(5, 1);
    });

    it('should only include exercises with 2+ data points', () => {
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
            createStrengthExercise('bench-press', [createStrengthSet(100, 10)]),
            createStrengthExercise('squat', [createStrengthSet(200, 10)]),
          ],
        },
        {
          id: 'session-2',
          name: 'Workout 2',
          startedAt: newDate.toISOString(),
          completedAt: newDate.toISOString(),
          exercises: [
            createStrengthExercise('bench-press', [createStrengthSet(110, 10)]), // +10%
            // squat not done - only 1 data point, should be excluded
            createStrengthExercise('deadlift', [createStrengthSet(300, 5)]), // Only 1 data point
          ],
        },
      ];

      const { result } = renderHook(() => useUserStats(sessions, 'all'));
      // Only bench press has 2+ data points, so average = 10%
      expect(result.current.averageStrengthIncrease).toBeCloseTo(10, 1);
    });
  });

  describe('weight change per week', () => {
    it('should calculate positive weight gain per week', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 14); // 2 weeks ago
      const newDate = new Date();

      const weightEntries = [
        { weight: 150, date: oldDate.toISOString(), unit: 'lbs' as const },
        { weight: 152, date: newDate.toISOString(), unit: 'lbs' as const }, // +2 lbs over 2 weeks
      ];

      // Need at least one session for weight change to be calculated
      const sessions = [createMockSession({}, 0)];

      const { result } = renderHook(() =>
        useUserStats(sessions, 'all', [], weightEntries)
      );
      // (152-150)/150 * 100 = 1.33% over 2 weeks = 0.67% per week
      expect(result.current.averageWeightChangePerWeek).toBeCloseTo(0.67, 1);
    });

    it('should calculate negative weight loss per week', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 7); // 1 week ago
      const newDate = new Date();

      const weightEntries = [
        { weight: 200, date: oldDate.toISOString(), unit: 'lbs' as const },
        { weight: 198, date: newDate.toISOString(), unit: 'lbs' as const }, // -2 lbs over 1 week
      ];

      // Need at least one session for weight change to be calculated
      const sessions = [createMockSession({}, 0)];

      const { result } = renderHook(() =>
        useUserStats(sessions, 'all', [], weightEntries)
      );
      // (198-200)/200 * 100 = -1% over 1 week = -1% per week
      expect(result.current.averageWeightChangePerWeek).toBeCloseTo(-1, 1);
    });

    it('should return 0 with only one weight entry', () => {
      const weightEntries = [
        { weight: 150, date: new Date().toISOString(), unit: 'lbs' as const },
      ];

      const sessions = [createMockSession({}, 0)];

      const { result } = renderHook(() =>
        useUserStats(sessions, 'all', [], weightEntries)
      );
      expect(result.current.averageWeightChangePerWeek).toBe(0);
    });

    it('should return 0 with no weight entries', () => {
      const sessions = [createMockSession({}, 0)];

      const { result } = renderHook(() =>
        useUserStats(sessions, 'all', [], [])
      );
      expect(result.current.averageWeightChangePerWeek).toBe(0);
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
