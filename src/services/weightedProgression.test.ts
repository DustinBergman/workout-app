import { describe, it, expect, vi } from 'vitest';
import {
  calculateExponentialDecayBaseline,
  calculateAdaptiveIncrement,
  calculateSuccessRate,
  calculateConsistencyFactor,
  calculateRecoveryFactor,
  calculateBodyWeightFactor,
  calculateMoodFactor,
  calculatePersonalizedProgression,
} from './weightedProgression';
import { WeeklyPerformance, ExerciseAnalysis } from './openai/exerciseAnalysis';
import { WorkoutSession, WeightEntry } from '../types';

// Mock exercises data
vi.mock('../data/exercises', () => ({
  getExerciseById: (id: string) => {
    if (id === 'bench-press') {
      return {
        id: 'bench-press',
        name: 'Bench Press',
        type: 'strength',
        muscleGroups: ['chest', 'triceps', 'shoulders'],
        equipment: 'barbell',
      };
    }
    if (id === 'squat') {
      return {
        id: 'squat',
        name: 'Squat',
        type: 'strength',
        muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        equipment: 'barbell',
      };
    }
    if (id === 'tricep-pushdown') {
      return {
        id: 'tricep-pushdown',
        name: 'Tricep Pushdown',
        type: 'strength',
        muscleGroups: ['triceps'],
        equipment: 'cable',
      };
    }
    if (id === 'cardio-exercise') {
      return {
        id: 'cardio-exercise',
        name: 'Running',
        type: 'cardio',
        cardioType: 'running',
      };
    }
    return undefined;
  },
}));

// ── Exponential Decay Baseline ───────────────────────────────────────

describe('calculateExponentialDecayBaseline', () => {
  it('returns 0 for empty array', () => {
    expect(calculateExponentialDecayBaseline([])).toBe(0);
  });

  it('returns the single value for single-element array', () => {
    expect(calculateExponentialDecayBaseline([135])).toBe(135);
  });

  it('weights recent sessions more heavily', () => {
    // [150, 130, 130, 130, 130] — most recent is 150
    const result = calculateExponentialDecayBaseline([150, 130, 130, 130, 130]);
    // Should be closer to 150 than the median (130)
    expect(result).toBeGreaterThan(135);
    expect(result).toBeLessThan(150);
  });

  it('returns exact value when all weights are identical', () => {
    const result = calculateExponentialDecayBaseline([100, 100, 100, 100]);
    expect(result).toBeCloseTo(100, 5);
  });

  it('produces higher baseline when recent sessions are stronger', () => {
    const increasing = calculateExponentialDecayBaseline([200, 190, 180, 170, 160]);
    const decreasing = calculateExponentialDecayBaseline([160, 170, 180, 190, 200]);
    expect(increasing).toBeGreaterThan(decreasing);
  });
});

// ── Adaptive Increment ───────────────────────────────────────────────

describe('calculateAdaptiveIncrement', () => {
  const defaultIncrement = 2.5;

  it('falls back to default with fewer than 3 data points', () => {
    const weekly: WeeklyPerformance[] = [
      { weekAgo: 0, sessions: 1, avgWeight: 140, avgReps: 8, maxWeight: 140, totalSets: 3, estimated1RM: 177 },
      { weekAgo: 1, sessions: 1, avgWeight: 135, avgReps: 8, maxWeight: 135, totalSets: 3, estimated1RM: 171 },
    ];
    const { increment, isAdaptive } = calculateAdaptiveIncrement(weekly, defaultIncrement);
    expect(increment).toBe(defaultIncrement);
    expect(isAdaptive).toBe(false);
  });

  it('detects a clear linear progression', () => {
    // maxWeight increases by ~5 per week
    const weekly: WeeklyPerformance[] = [
      { weekAgo: 0, sessions: 1, avgWeight: 155, avgReps: 8, maxWeight: 155, totalSets: 3, estimated1RM: 196 },
      { weekAgo: 1, sessions: 1, avgWeight: 150, avgReps: 8, maxWeight: 150, totalSets: 3, estimated1RM: 190 },
      { weekAgo: 2, sessions: 1, avgWeight: 145, avgReps: 8, maxWeight: 145, totalSets: 3, estimated1RM: 184 },
      { weekAgo: 3, sessions: 1, avgWeight: 140, avgReps: 8, maxWeight: 140, totalSets: 3, estimated1RM: 177 },
      { weekAgo: 4, sessions: 1, avgWeight: 135, avgReps: 8, maxWeight: 135, totalSets: 3, estimated1RM: 171 },
    ];
    const { increment, isAdaptive } = calculateAdaptiveIncrement(weekly, defaultIncrement);
    expect(isAdaptive).toBe(true);
    expect(increment).toBeGreaterThan(0);
    // Should be clamped to max 2x default = 5
    expect(increment).toBeLessThanOrEqual(defaultIncrement * 2);
  });

  it('falls back to default for noisy data (low R²)', () => {
    // Erratic weights
    const weekly: WeeklyPerformance[] = [
      { weekAgo: 0, sessions: 1, avgWeight: 100, avgReps: 8, maxWeight: 100, totalSets: 3, estimated1RM: 127 },
      { weekAgo: 1, sessions: 1, avgWeight: 150, avgReps: 8, maxWeight: 150, totalSets: 3, estimated1RM: 190 },
      { weekAgo: 2, sessions: 1, avgWeight: 90, avgReps: 8, maxWeight: 90, totalSets: 3, estimated1RM: 114 },
      { weekAgo: 3, sessions: 1, avgWeight: 160, avgReps: 8, maxWeight: 160, totalSets: 3, estimated1RM: 203 },
    ];
    const { increment, isAdaptive } = calculateAdaptiveIncrement(weekly, defaultIncrement);
    expect(isAdaptive).toBe(false);
    expect(increment).toBe(defaultIncrement);
  });

  it('clamps to max 2x default increment', () => {
    // 20lbs per week progression (unrealistically fast)
    const weekly: WeeklyPerformance[] = [
      { weekAgo: 0, sessions: 1, avgWeight: 225, avgReps: 8, maxWeight: 225, totalSets: 3, estimated1RM: 285 },
      { weekAgo: 1, sessions: 1, avgWeight: 205, avgReps: 8, maxWeight: 205, totalSets: 3, estimated1RM: 260 },
      { weekAgo: 2, sessions: 1, avgWeight: 185, avgReps: 8, maxWeight: 185, totalSets: 3, estimated1RM: 234 },
      { weekAgo: 3, sessions: 1, avgWeight: 165, avgReps: 8, maxWeight: 165, totalSets: 3, estimated1RM: 209 },
    ];
    const { increment } = calculateAdaptiveIncrement(weekly, defaultIncrement);
    expect(increment).toBeLessThanOrEqual(defaultIncrement * 2);
  });

  it('handles flat progression (slope near zero)', () => {
    const weekly: WeeklyPerformance[] = [
      { weekAgo: 0, sessions: 1, avgWeight: 135, avgReps: 8, maxWeight: 135, totalSets: 3, estimated1RM: 171 },
      { weekAgo: 1, sessions: 1, avgWeight: 135, avgReps: 8, maxWeight: 135, totalSets: 3, estimated1RM: 171 },
      { weekAgo: 2, sessions: 1, avgWeight: 135, avgReps: 8, maxWeight: 135, totalSets: 3, estimated1RM: 171 },
      { weekAgo: 3, sessions: 1, avgWeight: 135, avgReps: 8, maxWeight: 135, totalSets: 3, estimated1RM: 171 },
    ];
    const { isAdaptive } = calculateAdaptiveIncrement(weekly, defaultIncrement);
    // Flat data → R² is 0 (no variance to explain) → falls back
    expect(isAdaptive).toBe(false);
  });
});

// ── Success Rate ─────────────────────────────────────────────────────

describe('calculateSuccessRate', () => {
  it('returns neutral multiplier for empty data', () => {
    const { multiplier } = calculateSuccessRate([], 10);
    expect(multiplier).toBe(1.0);
  });

  it('returns 1.2x when all sets hit target reps', () => {
    const sets = [
      [{ weight: 135, reps: 10 }, { weight: 135, reps: 10 }, { weight: 135, reps: 10 }],
      [{ weight: 135, reps: 10 }, { weight: 135, reps: 11 }, { weight: 135, reps: 10 }],
    ];
    const { multiplier, successRate } = calculateSuccessRate(sets, 10);
    expect(multiplier).toBe(1.2);
    expect(successRate).toBe(1.0);
  });

  it('returns 0.5x when success rate is very low', () => {
    const sets = [
      [{ weight: 135, reps: 5 }, { weight: 135, reps: 4 }, { weight: 135, reps: 3 }],
      [{ weight: 135, reps: 6 }, { weight: 135, reps: 5 }, { weight: 135, reps: 4 }],
    ];
    const { multiplier } = calculateSuccessRate(sets, 10);
    expect(multiplier).toBe(0.5);
  });

  it('ignores warm-up sets (< 90% of max weight)', () => {
    // Warm-up at 95, working sets at 135
    const sets = [
      [{ weight: 95, reps: 12 }, { weight: 135, reps: 6 }, { weight: 135, reps: 5 }],
    ];
    const { multiplier } = calculateSuccessRate(sets, 10);
    // Only working sets at 135 count, both miss target of 10
    expect(multiplier).toBe(0.5);
  });

  it('uses only first 5 sessions', () => {
    // 6 sessions, but should only use first 5
    const sets = Array(6).fill([
      { weight: 135, reps: 10 }, { weight: 135, reps: 10 },
    ]);
    const { multiplier } = calculateSuccessRate(sets, 10);
    expect(multiplier).toBe(1.2);
  });
});

// ── Consistency Factor ───────────────────────────────────────────────

describe('calculateConsistencyFactor', () => {
  const now = new Date();

  const makeSession = (daysAgo: number): WorkoutSession => ({
    id: `s-${daysAgo}`,
    name: 'Test',
    startedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    completedAt: new Date(now.getTime() - daysAgo * 86400000 + 3600000).toISOString(),
    exercises: [],
  });

  it('returns neutral when no workout goal set', () => {
    const { multiplier } = calculateConsistencyFactor([], undefined);
    expect(multiplier).toBe(1.0);
  });

  it('returns neutral when goal is 0', () => {
    const { multiplier } = calculateConsistencyFactor([], 0);
    expect(multiplier).toBe(1.0);
  });

  it('returns 1.05x for 100%+ adherence', () => {
    // Goal: 3/week, 2 weeks = 6 sessions needed
    const sessions = Array.from({ length: 7 }, (_, i) => makeSession(i * 2));
    const { multiplier, adherenceRate } = calculateConsistencyFactor(sessions, 3);
    expect(adherenceRate).toBeGreaterThanOrEqual(1.0);
    expect(multiplier).toBe(1.05);
  });

  it('returns 0.8x for very low adherence', () => {
    // Goal: 5/week, only 1 session in 2 weeks
    const sessions = [makeSession(1)];
    const { multiplier, adherenceRate } = calculateConsistencyFactor(sessions, 5);
    expect(adherenceRate).toBeLessThan(0.5);
    expect(multiplier).toBe(0.8);
  });

  it('ignores sessions older than 2 weeks', () => {
    // Sessions from 3 weeks ago don't count
    const sessions = [makeSession(21), makeSession(22), makeSession(23)];
    const { multiplier } = calculateConsistencyFactor(sessions, 3);
    expect(multiplier).toBe(0.8);
  });

  it('ignores incomplete sessions', () => {
    const incomplete: WorkoutSession = {
      id: 'incomplete',
      name: 'Test',
      startedAt: new Date(now.getTime() - 86400000).toISOString(),
      // no completedAt
      exercises: [],
    };
    const { multiplier } = calculateConsistencyFactor([incomplete], 3);
    expect(multiplier).toBe(0.8);
  });
});

// ── Recovery Factor ──────────────────────────────────────────────────

describe('calculateRecoveryFactor', () => {
  const now = new Date();

  const makeSessionWithExercise = (daysAgo: number, exerciseId: string): WorkoutSession => ({
    id: `s-${daysAgo}`,
    name: 'Test',
    startedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    completedAt: new Date(now.getTime() - daysAgo * 86400000 + 3600000).toISOString(),
    exercises: [{
      type: 'strength',
      exerciseId,
      targetSets: 3,
      targetReps: 10,
      restSeconds: 90,
      sets: [{ type: 'strength', reps: 10, weight: 135, unit: 'lbs', completedAt: now.toISOString() }],
    }],
  });

  it('returns neutral when exercise not found', () => {
    const { multiplier, daysSinceLastTrained } = calculateRecoveryFactor('unknown', []);
    expect(multiplier).toBe(1.0);
    expect(daysSinceLastTrained).toBeNull();
  });

  it('returns neutral for cardio exercises', () => {
    const { multiplier } = calculateRecoveryFactor('cardio-exercise', []);
    expect(multiplier).toBe(1.0);
  });

  it('returns 1.05x when muscle group was trained 6 days ago', () => {
    // Bench press targets chest/triceps/shoulders
    // Session 6 days ago also trained triceps (via tricep-pushdown)
    const sessions = [makeSessionWithExercise(6, 'tricep-pushdown')];
    const { multiplier, daysSinceLastTrained } = calculateRecoveryFactor('bench-press', sessions);
    expect(multiplier).toBe(1.05);
    expect(daysSinceLastTrained).toBeGreaterThanOrEqual(5);
  });

  it('returns 0.9x when muscle group was trained < 2 days ago', () => {
    const sessions = [makeSessionWithExercise(0.5, 'tricep-pushdown')];
    const { multiplier } = calculateRecoveryFactor('bench-press', sessions);
    expect(multiplier).toBe(0.9);
  });

  it('returns neutral when no overlapping muscle groups', () => {
    // Squat targets quads/glutes/hamstrings — no overlap with bench muscles
    const sessions = [makeSessionWithExercise(1, 'squat')];
    const { multiplier, daysSinceLastTrained } = calculateRecoveryFactor('bench-press', sessions);
    expect(multiplier).toBe(1.0);
    expect(daysSinceLastTrained).toBeNull();
  });
});

// ── Body Weight Factor ───────────────────────────────────────────────

describe('calculateBodyWeightFactor', () => {
  const now = new Date();

  const makeEntry = (daysAgo: number, weight: number): WeightEntry => ({
    date: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    weight,
    unit: 'lbs',
  });

  it('returns neutral for insufficient data', () => {
    const { multiplier, trend } = calculateBodyWeightFactor([], 'build');
    expect(multiplier).toBe(1.0);
    expect(trend).toBe('unknown');
  });

  it('returns neutral for only 1 entry', () => {
    const { multiplier } = calculateBodyWeightFactor([makeEntry(1, 180)], 'build');
    expect(multiplier).toBe(1.0);
  });

  it('detects gaining trend for build goal → 1.05x', () => {
    const entries = [
      makeEntry(50, 175),
      makeEntry(40, 176),
      makeEntry(30, 178),
      makeEntry(20, 180),
      makeEntry(10, 182),
      makeEntry(1, 184),
    ];
    const { multiplier, trend } = calculateBodyWeightFactor(entries, 'build');
    expect(trend).toBe('gaining');
    expect(multiplier).toBe(1.05);
  });

  it('detects losing trend for build goal → 0.9x', () => {
    const entries = [
      makeEntry(50, 185),
      makeEntry(40, 183),
      makeEntry(30, 181),
      makeEntry(20, 179),
      makeEntry(10, 177),
      makeEntry(1, 174),
    ];
    const { multiplier, trend } = calculateBodyWeightFactor(entries, 'build');
    expect(trend).toBe('losing');
    expect(multiplier).toBe(0.9);
  });

  it('detects losing trend for lose goal → neutral', () => {
    const entries = [
      makeEntry(50, 200),
      makeEntry(40, 197),
      makeEntry(30, 194),
      makeEntry(20, 191),
      makeEntry(10, 188),
      makeEntry(1, 185),
    ];
    const { multiplier, trend } = calculateBodyWeightFactor(entries, 'lose');
    expect(trend).toBe('losing');
    expect(multiplier).toBe(1.0);
  });

  it('detects stable weight for maintain goal → neutral', () => {
    const entries = [
      makeEntry(50, 180),
      makeEntry(40, 180.5),
      makeEntry(30, 179.5),
      makeEntry(20, 180),
      makeEntry(10, 180.2),
      makeEntry(1, 180),
    ];
    const { multiplier, trend } = calculateBodyWeightFactor(entries, 'maintain');
    expect(trend).toBe('stable');
    expect(multiplier).toBe(1.0);
  });

  it('ignores entries older than 60 days', () => {
    const entries = [
      makeEntry(90, 150), // too old
      makeEntry(80, 155), // too old
      makeEntry(5, 180),
      makeEntry(1, 180),
    ];
    const { trend } = calculateBodyWeightFactor(entries, 'build');
    // Only 2 recent entries, both around 180 → stable
    expect(trend).toBe('stable');
  });
});

// ── Mood Factor ──────────────────────────────────────────────────────

describe('calculateMoodFactor', () => {
  const now = new Date();

  const makeSessionWithMood = (daysAgo: number, mood: number): WorkoutSession => ({
    id: `s-${daysAgo}`,
    name: 'Test',
    mood: mood as 1 | 2 | 3 | 4 | 5,
    startedAt: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
    completedAt: new Date(now.getTime() - daysAgo * 86400000 + 3600000).toISOString(),
    exercises: [],
  });

  it('returns neutral when no sessions have mood', () => {
    const sessions: WorkoutSession[] = [{
      id: 's1',
      name: 'Test',
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
      exercises: [],
    }];
    const { multiplier, avgMood } = calculateMoodFactor(sessions);
    expect(multiplier).toBe(1.0);
    expect(avgMood).toBeNull();
  });

  it('returns 1.1x for high mood (≥4.0)', () => {
    const sessions = [
      makeSessionWithMood(1, 5),
      makeSessionWithMood(3, 4),
      makeSessionWithMood(5, 4),
    ];
    const { multiplier, avgMood } = calculateMoodFactor(sessions);
    expect(multiplier).toBe(1.1);
    expect(avgMood).toBeGreaterThanOrEqual(4.0);
  });

  it('returns neutral for average mood (3.0-3.9)', () => {
    const sessions = [
      makeSessionWithMood(1, 3),
      makeSessionWithMood(3, 3),
      makeSessionWithMood(5, 4),
    ];
    const { multiplier } = calculateMoodFactor(sessions);
    expect(multiplier).toBe(1.0);
  });

  it('returns 0.85x for low mood (2.0-2.9)', () => {
    const sessions = [
      makeSessionWithMood(1, 2),
      makeSessionWithMood(3, 2),
      makeSessionWithMood(5, 3),
    ];
    const { multiplier } = calculateMoodFactor(sessions);
    expect(multiplier).toBe(0.85);
  });

  it('returns 0.7x for very low mood (<2.0)', () => {
    const sessions = [
      makeSessionWithMood(1, 1),
      makeSessionWithMood(3, 1),
      makeSessionWithMood(5, 1),
    ];
    const { multiplier, avgMood } = calculateMoodFactor(sessions);
    expect(multiplier).toBe(0.7);
    expect(avgMood).toBe(1.0);
  });

  it('only uses last 5 sessions', () => {
    const sessions = [
      makeSessionWithMood(1, 5),
      makeSessionWithMood(2, 5),
      makeSessionWithMood(3, 5),
      makeSessionWithMood(4, 5),
      makeSessionWithMood(5, 5),
      makeSessionWithMood(6, 1), // This should be excluded
      makeSessionWithMood(7, 1), // This should be excluded
    ];
    const { avgMood } = calculateMoodFactor(sessions);
    expect(avgMood).toBe(5.0);
  });
});

// ── Orchestrator ─────────────────────────────────────────────────────

describe('calculatePersonalizedProgression', () => {
  const now = new Date();

  const makeAnalysis = (overrides: Partial<ExerciseAnalysis> = {}): ExerciseAnalysis => ({
    exerciseId: 'bench-press',
    exerciseName: 'Bench Press',
    weeklyPerformance: [
      { weekAgo: 0, sessions: 1, avgWeight: 140, avgReps: 8, maxWeight: 140, totalSets: 3, estimated1RM: 177 },
      { weekAgo: 1, sessions: 1, avgWeight: 137.5, avgReps: 8, maxWeight: 137.5, totalSets: 3, estimated1RM: 174 },
      { weekAgo: 2, sessions: 1, avgWeight: 135, avgReps: 8, maxWeight: 135, totalSets: 3, estimated1RM: 171 },
    ],
    progressStatus: 'improving',
    plateauSignals: { sameWeight3Sessions: false, failedRepTargets: false, stalled1RM: false },
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

  it('returns a valid config with all fields', () => {
    const config = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis(),
      recentSessionSets: makeRecentSets([140, 137.5, 135]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });

    expect(config).toHaveProperty('baseline');
    expect(config).toHaveProperty('increment');
    expect(config).toHaveProperty('compositeMultiplier');
    expect(config).toHaveProperty('factors');
    expect(config).toHaveProperty('confidence');
    expect(config.baseline).toBeGreaterThan(0);
    expect(config.increment).toBeGreaterThan(0);
    expect(config.compositeMultiplier).toBeGreaterThanOrEqual(0.5);
    expect(config.compositeMultiplier).toBeLessThanOrEqual(1.5);
  });

  it('uses exponential decay baseline (recent sessions weighted more)', () => {
    const config = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis(),
      recentSessionSets: makeRecentSets([150, 130, 130, 130, 130]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });

    // Baseline should be weighted toward 150 (most recent)
    expect(config.baseline).toBeGreaterThan(135);
  });

  it('clamps composite multiplier to [0.5, 1.5]', () => {
    // Low mood + low consistency + low success rate → should be clamped at 0.5
    const sessions: WorkoutSession[] = Array.from({ length: 5 }, (_, i) => ({
      id: `s-${i}`,
      name: 'Test',
      mood: 1 as const,
      startedAt: new Date(now.getTime() - i * 86400000).toISOString(),
      completedAt: new Date(now.getTime() - i * 86400000 + 3600000).toISOString(),
      exercises: [],
    }));

    const config = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis(),
      recentSessionSets: makeRecentSets([135, 135, 135], 5), // low reps vs target 10
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: sessions,
      weeklyWorkoutGoal: 5,
    });

    expect(config.compositeMultiplier).toBeGreaterThanOrEqual(0.5);
    expect(config.compositeMultiplier).toBeLessThanOrEqual(1.5);
  });

  it('defaults to neutral (1.0) when no personalization data available', () => {
    const config = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis({ weeklyPerformance: [] }),
      recentSessionSets: [],
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });

    expect(config.compositeMultiplier).toBe(1.0);
    expect(config.factors).toHaveLength(0);
    expect(config.confidence).toBe('low');
  });

  it('reports confidence based on data availability', () => {
    // Low confidence: no session data
    const lowConf = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis({ weeklyPerformance: [] }),
      recentSessionSets: makeRecentSets([135]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });
    expect(lowConf.confidence).toBe('low');

    // Medium confidence: 3-4 sessions
    const medConf = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis({ weeklyPerformance: [] }),
      recentSessionSets: makeRecentSets([135, 137.5, 140]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });
    expect(medConf.confidence).toBe('medium');

    // High confidence: 5+ sessions + 3+ weekly data points
    const highConf = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis(),
      recentSessionSets: makeRecentSets([135, 137.5, 140, 142.5, 145]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });
    expect(highConf.confidence).toBe('high');
  });

  it('blends adaptive and default increment based on confidence', () => {
    // Medium confidence → 70/30 blend
    const medConf = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis(),
      recentSessionSets: makeRecentSets([135, 137.5, 140]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });

    // Low confidence → fully default
    const lowConf = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis({ weeklyPerformance: [] }),
      recentSessionSets: makeRecentSets([135]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });

    expect(lowConf.increment).toBe(2.5); // Default for intermediate lbs
    expect(medConf.increment).toBeGreaterThan(0);
  });

  it('populates factors array with active factors only', () => {
    // Create scenario where success rate != 1.0 (should appear in factors)
    const config = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis(),
      recentSessionSets: makeRecentSets([135, 135, 135, 135, 135], 10), // 100% success
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });

    // Success rate is 100% → multiplier is 1.2 (not 1.0) → should appear
    const successFactor = config.factors.find((f) => f.name === 'Success Rate');
    expect(successFactor).toBeDefined();
    expect(successFactor!.value).toBe(1.2);
  });

  it('handles kg units correctly', () => {
    const config = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis({ weeklyPerformance: [] }),
      recentSessionSets: makeRecentSets([60]),
      targetReps: 10,
      experienceLevel: 'intermediate',
      weightUnit: 'kg',
      workoutGoal: 'build',
      allSessions: [],
    });

    expect(config.increment).toBe(1.25); // Default for intermediate kg
  });

  it('handles beginner experience level correctly', () => {
    const config = calculatePersonalizedProgression({
      exerciseId: 'bench-press',
      analysis: makeAnalysis({ weeklyPerformance: [] }),
      recentSessionSets: makeRecentSets([135]),
      targetReps: 10,
      experienceLevel: 'beginner',
      weightUnit: 'lbs',
      workoutGoal: 'build',
      allSessions: [],
    });

    expect(config.increment).toBe(5); // Default for beginner lbs
  });
});
