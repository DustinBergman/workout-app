import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSessionStats, calculateSessionStats } from './useSessionStats';
import { WorkoutSession } from '../types';

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
    });
  });

  it('should return zeros for session with no exercises', () => {
    const session = createMockSession();
    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 0,
      totalVolume: 0,
      totalReps: 0,
    });
  });

  it('should calculate stats for session with exercises', () => {
    const session = createMockSession({
      exercises: [
        {
          exerciseId: 'bench-press',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [
            { weight: 100, reps: 10, unit: 'lbs', completedAt: new Date().toISOString() },
            { weight: 100, reps: 8, unit: 'lbs', completedAt: new Date().toISOString() },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 2,
      totalVolume: 1800, // (100 * 10) + (100 * 8)
      totalReps: 18, // 10 + 8
    });
  });

  it('should calculate stats across multiple exercises', () => {
    const session = createMockSession({
      exercises: [
        {
          exerciseId: 'bench-press',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [
            { weight: 100, reps: 10, unit: 'lbs', completedAt: new Date().toISOString() },
          ],
        },
        {
          exerciseId: 'squat',
          targetSets: 3,
          targetReps: 8,
          restSeconds: 120,
          sets: [
            { weight: 200, reps: 5, unit: 'lbs', completedAt: new Date().toISOString() },
            { weight: 200, reps: 5, unit: 'lbs', completedAt: new Date().toISOString() },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 3, // 1 + 2
      totalVolume: 3000, // (100 * 10) + (200 * 5) + (200 * 5)
      totalReps: 20, // 10 + 5 + 5
    });
  });

  it('should handle exercises with no sets', () => {
    const session = createMockSession({
      exercises: [
        {
          exerciseId: 'bench-press',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [],
        },
        {
          exerciseId: 'squat',
          targetSets: 3,
          targetReps: 8,
          restSeconds: 120,
          sets: [
            { weight: 200, reps: 5, unit: 'lbs', completedAt: new Date().toISOString() },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 1,
      totalVolume: 1000, // 200 * 5
      totalReps: 5,
    });
  });

  it('should handle zero weight or zero reps', () => {
    const session = createMockSession({
      exercises: [
        {
          exerciseId: 'bodyweight-pushups',
          targetSets: 3,
          targetReps: 20,
          restSeconds: 60,
          sets: [
            { weight: 0, reps: 20, unit: 'lbs', completedAt: new Date().toISOString() },
            { weight: 0, reps: 15, unit: 'lbs', completedAt: new Date().toISOString() },
          ],
        },
      ],
    });

    const { result } = renderHook(() => useSessionStats(session));

    expect(result.current).toEqual({
      totalSets: 2,
      totalVolume: 0,
      totalReps: 35,
    });
  });
});

describe('calculateSessionStats', () => {
  it('should calculate stats for a session', () => {
    const session = createMockSession({
      exercises: [
        {
          exerciseId: 'bench-press',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [
            { weight: 135, reps: 10, unit: 'lbs', completedAt: new Date().toISOString() },
            { weight: 135, reps: 8, unit: 'lbs', completedAt: new Date().toISOString() },
            { weight: 135, reps: 6, unit: 'lbs', completedAt: new Date().toISOString() },
          ],
        },
      ],
    });

    const result = calculateSessionStats(session);

    expect(result).toEqual({
      totalSets: 3,
      totalVolume: 3240, // 135 * (10 + 8 + 6)
      totalReps: 24,
    });
  });
});
