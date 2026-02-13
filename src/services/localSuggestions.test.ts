import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateLocalSuggestion, getLocalSuggestions } from './localSuggestions';
import { ExerciseAnalysis } from './openai/exerciseAnalysis';
import { WorkoutTemplate, WorkoutSession } from '../types';

// Mock storage
vi.mock('./storage', () => ({
  getCustomExercises: () => [],
}));

// Mock exercises data
vi.mock('../data/exercises', () => ({
  getExerciseById: (id: string) => ({ id, name: `Exercise ${id}`, type: 'strength' }),
  getAllExercises: () => [],
}));

const makeAnalysis = (
  overrides: Partial<ExerciseAnalysis> = {}
): ExerciseAnalysis => ({
  exerciseId: 'bench-press',
  exerciseName: 'Bench Press',
  weeklyPerformance: [],
  progressStatus: 'improving',
  plateauSignals: {
    sameWeight3Sessions: false,
    failedRepTargets: false,
    stalled1RM: false,
  },
  weightTrend: 5,
  repsTrend: 0,
  estimated1RMTrend: 5,
  recentSessions: [],
  ...overrides,
});

const makeRecentSets = (weights: number[], reps: number = 8) =>
  weights.map((w) => [
    { weight: w, reps },
    { weight: w, reps },
    { weight: w, reps },
  ]);

const baseContext = {
  experienceLevel: 'intermediate' as const,
  workoutGoal: 'build' as const,
  weightUnit: 'lbs' as const,
  currentPhase: undefined,
};

describe('calculateLocalSuggestion', () => {
  describe('progression by status', () => {
    it('adds weight when improving (beginner)', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'improving' }),
        { ...baseContext, experienceLevel: 'beginner' },
        10,
        makeRecentSets([135, 135, 135])
      );
      expect(result.suggestedWeight).toBe(140); // 135 + 5 = 140
    });

    it('adds weight when improving (intermediate)', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'improving' }),
        baseContext,
        10,
        makeRecentSets([135, 135, 135])
      );
      expect(result.suggestedWeight).toBe(137.5); // 135 + 2.5
    });

    it('adds reps when improving (advanced)', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'improving' }),
        { ...baseContext, experienceLevel: 'advanced' },
        10,
        makeRecentSets([135, 135, 135])
      );
      expect(result.suggestedWeight).toBe(135); // weight stays
      expect(result.suggestedReps).toBe(9); // reps go up by 1
    });

    it('reduces weight and increases reps on plateau', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'plateau' }),
        baseContext,
        10,
        makeRecentSets([200, 200, 200])
      );
      // 200 * 0.9 = 180, rounded to nearest 2.5 = 180
      expect(result.suggestedWeight).toBe(180);
      expect(result.suggestedReps).toBeGreaterThan(8);
    });

    it('reduces weight on decline', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'declining' }),
        baseContext,
        10,
        makeRecentSets([200, 200, 200])
      );
      // 200 * 0.875 = 175
      expect(result.suggestedWeight).toBe(175);
    });

    it('keeps weight as-is for insufficient_data', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'insufficient_data' }),
        baseContext,
        10,
        makeRecentSets([135])
      );
      expect(result.suggestedWeight).toBe(135);
      expect(result.progressStatus).toBe('new');
    });
  });

  describe('week/phase modifiers', () => {
    it('reduces weight for deload phase', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'improving' }),
        {
          ...baseContext,
          currentPhase: {
            type: 'deload',
            name: 'Recovery',
            description: 'Deload',
            durationWeeks: 1,
            repRangeMin: 10,
            repRangeMax: 15,
            intensityDescription: 'Light',
            aiGuidance: 'Light weights',
          },
        },
        10,
        makeRecentSets([200, 200, 200])
      );
      // Improving adds 2.5 -> 202.5, then deload * 0.7 = 141.75, round to 142.5
      expect(result.suggestedWeight).toBeLessThan(150);
    });
  });

  describe('weight rounding', () => {
    it('rounds to nearest 2.5 lbs', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'declining' }),
        baseContext,
        10,
        makeRecentSets([133, 133, 133])
      );
      // 133 * 0.875 = 116.375, round to 117.5
      expect(result.suggestedWeight % 2.5).toBe(0);
    });

    it('rounds to nearest 1.25 kg', () => {
      const result = calculateLocalSuggestion(
        'bench-press',
        makeAnalysis({ progressStatus: 'improving' }),
        { ...baseContext, weightUnit: 'kg' },
        10,
        makeRecentSets([60, 60, 60])
      );
      // 60 + 1.25 = 61.25
      expect(result.suggestedWeight % 1.25).toBe(0);
    });
  });

  it('never returns negative weight', () => {
    const result = calculateLocalSuggestion(
      'bench-press',
      makeAnalysis({ progressStatus: 'declining' }),
      baseContext,
      10,
      makeRecentSets([5, 5, 5])
    );
    expect(result.suggestedWeight).toBeGreaterThanOrEqual(0);
  });

  it('returns low confidence for no history', () => {
    const result = calculateLocalSuggestion(
      'bench-press',
      makeAnalysis({ progressStatus: 'insufficient_data' }),
      baseContext,
      10,
      []
    );
    expect(result.confidence).toBe('low');
    expect(result.suggestedWeight).toBe(0);
  });
});

describe('getLocalSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for template with no strength exercises', () => {
    const template: WorkoutTemplate = {
      id: 't1',
      name: 'Cardio',
      templateType: 'cardio',
      exercises: [
        { type: 'cardio', exerciseId: 'running', cardioCategory: 'distance' as const, restSeconds: 60, targetDistance: 5 },
      ],
      inRotation: true,
      createdAt: '',
      updatedAt: '',
    };

    const result = getLocalSuggestions(template, [], 'lbs');
    expect(result).toEqual([]);
  });

  it('returns suggestions for each strength exercise', () => {
    const template: WorkoutTemplate = {
      id: 't1',
      name: 'Push Day',
      templateType: 'strength',
      exercises: [
        { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
        { type: 'strength', exerciseId: 'ohp', targetSets: 3, targetReps: 8 },
      ],
      inRotation: true,
      createdAt: '',
      updatedAt: '',
    };

    const sessions: WorkoutSession[] = [];
    const result = getLocalSuggestions(template, sessions, 'lbs');
    expect(result).toHaveLength(2);
    expect(result[0].exerciseId).toBe('bench-press');
    expect(result[1].exerciseId).toBe('ohp');
  });

  it('handles empty history gracefully', () => {
    const template: WorkoutTemplate = {
      id: 't1',
      name: 'Push Day',
      templateType: 'strength',
      exercises: [
        { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10 },
      ],
      inRotation: true,
      createdAt: '',
      updatedAt: '',
    };

    const result = getLocalSuggestions(template, [], 'lbs');
    expect(result).toHaveLength(1);
    expect(result[0].confidence).toBe('low');
    expect(result[0].progressStatus).toBe('new');
  });
});
