import { describe, expect, it, vi } from 'vitest';
import { WorkoutSession } from '../../types';
import { aggregateCycleRecommendationData } from './cycleRecommendation';

vi.mock('./exerciseAnalysis', () => ({
  analyzeExercise10Weeks: vi.fn(() => ({
    progressStatus: 'insufficient_data',
  })),
}));

const createSession = (
  overrides: Partial<WorkoutSession> = {}
): WorkoutSession => ({
  id: crypto.randomUUID(),
  name: 'Workout',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

describe('aggregateCycleRecommendationData', () => {
  it('counts explicit personal bests instead of mood ratings', () => {
    const sessions = [
      createSession({ mood: 5 }),
      createSession({
        mood: 3,
        personalBests: [
          {
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            type: 'weight',
            value: 100,
            unit: 'kg',
          },
          {
            exerciseId: 'squat',
            exerciseName: 'Squat',
            type: '1rm',
            value: 160,
            unit: 'kg',
          },
        ],
      }),
    ];

    const result = aggregateCycleRecommendationData(
      sessions,
      'intermediate',
      'build'
    );

    expect(result.recentPRCount).toBe(2);
  });
});
