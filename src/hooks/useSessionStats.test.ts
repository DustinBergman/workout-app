import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionStats, calculateSessionStats } from './useSessionStats';
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
  sets: StrengthCompletedSet[],
  overrides: Partial<StrengthSessionExercise> = {}
): StrengthSessionExercise => ({
  type: 'strength',
  exerciseId,
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  sets,
  ...overrides,
});

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

describe('useSessionStats', () => {
  it('should return zeros for null session', () => {
    const { result } = renderHook(() => useSessionStats(null));

    expect(result.current).toEqual({
      totalSets: 0,
      totalVolume: 0,
      totalReps: 0,
      totalCardioDistance: 0,
      totalCardioDurationSeconds: 0,
      totalCardioCalories: 0,
    });
  });

  it('should return zeros for session with no exercises', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 0,
      totalVolume: 0,
      totalReps: 0,
      totalCardioDistance: 0,
      totalCardioDurationSeconds: 0,
      totalCardioCalories: 0,
    });
  });

  it('should calculate stats for session with exercises', () => {
    const session = createMockSession({
      exercises: [
        createStrengthExercise('bench-press', [
          createStrengthSet(100, 10),
          createStrengthSet(100, 8),
        ]),
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 2,
      totalVolume: 1800, // (100 * 10) + (100 * 8)
      totalReps: 18, // 10 + 8
      totalCardioDistance: 0,
      totalCardioDurationSeconds: 0,
      totalCardioCalories: 0,
    });
  });

  it('should calculate stats across multiple exercises', () => {
    const session = createMockSession({
      exercises: [
        createStrengthExercise('bench-press', [
          createStrengthSet(100, 10),
        ]),
        createStrengthExercise('squat', [
          createStrengthSet(200, 5),
          createStrengthSet(200, 5),
        ], { targetReps: 8, restSeconds: 120 }),
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 3, // 1 + 2
      totalVolume: 3000, // (100 * 10) + (200 * 5) + (200 * 5)
      totalReps: 20, // 10 + 5 + 5
      totalCardioDistance: 0,
      totalCardioDurationSeconds: 0,
      totalCardioCalories: 0,
    });
  });

  it('should handle exercises with no sets', () => {
    const session = createMockSession({
      exercises: [
        createStrengthExercise('bench-press', []),
        createStrengthExercise('squat', [
          createStrengthSet(200, 5),
        ], { targetReps: 8, restSeconds: 120 }),
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 1,
      totalVolume: 1000, // 200 * 5
      totalReps: 5,
      totalCardioDistance: 0,
      totalCardioDurationSeconds: 0,
      totalCardioCalories: 0,
    });
  });

  it('should handle zero weight or zero reps', () => {
    const session = createMockSession({
      exercises: [
        createStrengthExercise('bodyweight-pushups', [
          createStrengthSet(0, 20),
          createStrengthSet(0, 15),
        ], { targetReps: 20, restSeconds: 60 }),
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 2,
      totalVolume: 0,
      totalReps: 35,
      totalCardioDistance: 0,
      totalCardioDurationSeconds: 0,
      totalCardioCalories: 0,
    });
  });
});

describe('calculateSessionStats', () => {
  it('should calculate stats for a session', () => {
    const session = createMockSession({
      exercises: [
        createStrengthExercise('bench-press', [
          createStrengthSet(135, 10),
          createStrengthSet(135, 8),
          createStrengthSet(135, 6),
        ]),
      ],
    });

    const result = calculateSessionStats(session);

    expect(result).toEqual({
      totalSets: 3,
      totalVolume: 3240, // 135 * (10 + 8 + 6)
      totalReps: 24,
      totalCardioDistance: 0,
      totalCardioDurationSeconds: 0,
      totalCardioCalories: 0,
    });
  });
});
