import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateEpley1RM,
  analyzeExercise10Weeks,
  buildExerciseAnalysisContext,
  ExerciseAnalysis,
  hasEnoughHistoryForPlateauDetection,
  getCachedAnalysis,
  cacheAnalysis,
  clearAnalysisCache,
} from './exerciseAnalysis';
import { WorkoutSession, StrengthSessionExercise, StrengthCompletedSet, Exercise } from '../../types';

// Mock storage module
vi.mock('../storage', () => ({
  getCustomExercises: vi.fn(() => []),
}));

// Mock exercises data
vi.mock('../../data/exercises', () => ({
  getExerciseById: vi.fn((id: string) => ({ id, name: `Exercise ${id}`, type: 'strength' })),
}));

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
  completedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

// Helper to create a session N days ago
const createSessionDaysAgo = (
  daysAgo: number,
  exerciseId: string,
  weight: number,
  reps: number,
  sessionId?: string
): WorkoutSession => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return createMockSession({
    id: sessionId || `session-${daysAgo}`,
    startedAt: date.toISOString(),
    completedAt: date.toISOString(),
    exercises: [
      createStrengthExercise(exerciseId, [
        createStrengthSet(weight, reps),
        createStrengthSet(weight, reps),
        createStrengthSet(weight, reps),
      ]),
    ],
  });
};

describe('Exercise Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAnalysisCache(); // Clear cache between tests
  });

  describe('calculateEpley1RM', () => {
    it('should return 0 for invalid inputs', () => {
      expect(calculateEpley1RM(0, 10)).toBe(0);
      expect(calculateEpley1RM(100, 0)).toBe(0);
      expect(calculateEpley1RM(-100, 10)).toBe(0);
      expect(calculateEpley1RM(100, -5)).toBe(0);
    });

    it('should return the weight itself for 1 rep', () => {
      expect(calculateEpley1RM(100, 1)).toBe(100);
      expect(calculateEpley1RM(225, 1)).toBe(225);
    });

    it('should calculate 1RM using Epley formula', () => {
      // 1RM = weight × (1 + reps/30)
      // 100 × (1 + 10/30) = 100 × 1.333... = 133.33...
      expect(calculateEpley1RM(100, 10)).toBeCloseTo(133.33, 1);

      // 135 × (1 + 8/30) = 135 × 1.266... = 171
      expect(calculateEpley1RM(135, 8)).toBeCloseTo(171, 0);

      // 200 × (1 + 5/30) = 200 × 1.166... = 233.33...
      expect(calculateEpley1RM(200, 5)).toBeCloseTo(233.33, 1);
    });
  });

  describe('analyzeExercise10Weeks', () => {
    it('should return insufficient_data for less than 2 sessions', () => {
      const result = analyzeExercise10Weeks('bench-press', [], []);
      expect(result.progressStatus).toBe('insufficient_data');
      expect(result.exerciseId).toBe('bench-press');
    });

    it('should return insufficient_data for single session', () => {
      const session = createSessionDaysAgo(1, 'bench-press', 135, 10);
      const result = analyzeExercise10Weeks('bench-press', [session], []);
      expect(result.progressStatus).toBe('insufficient_data');
    });

    it('should exclude incomplete sessions', () => {
      const incompleteSession = createMockSession({
        id: 'incomplete',
        startedAt: new Date().toISOString(),
        completedAt: undefined, // Not completed
        exercises: [
          createStrengthExercise('bench-press', [
            createStrengthSet(135, 10),
            createStrengthSet(135, 10),
            createStrengthSet(135, 10),
          ]),
        ],
      });

      const result = analyzeExercise10Weeks('bench-press', [incompleteSession], []);
      expect(result.progressStatus).toBe('insufficient_data');
    });

    it('should exclude sessions older than 10 weeks', () => {
      // Create sessions older than 10 weeks (70+ days)
      const oldSession1 = createSessionDaysAgo(75, 'bench-press', 135, 10, 'old-1');
      const oldSession2 = createSessionDaysAgo(80, 'bench-press', 140, 10, 'old-2');
      const oldSession3 = createSessionDaysAgo(85, 'bench-press', 145, 10, 'old-3');

      const result = analyzeExercise10Weeks('bench-press', [oldSession1, oldSession2, oldSession3], []);
      expect(result.progressStatus).toBe('insufficient_data');
      expect(result.weeklyPerformance).toHaveLength(0);
    });

    it('should detect plateau when same weight for 4+ sessions', () => {
      // Create 4 sessions with same weight
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 135, 10, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 135, 10, 'session-3'),
        createSessionDaysAgo(10, 'bench-press', 135, 10, 'session-4'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.plateauSignals.sameWeight3Sessions).toBe(true);
    });

    it('should not detect plateau for varying weights', () => {
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 145, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 140, 10, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 135, 10, 'session-3'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.plateauSignals.sameWeight3Sessions).toBe(false);
    });

    it('should detect failed rep targets for 2+ sessions', () => {
      // Create sessions where reps are below target (10)
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 145, 7, 'session-1'), // Below target - 1
        createSessionDaysAgo(4, 'bench-press', 145, 6, 'session-2'), // Below target - 1
        createSessionDaysAgo(7, 'bench-press', 145, 8, 'session-3'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.plateauSignals.failedRepTargets).toBe(true);
    });

    it('should not detect failed rep targets when meeting target', () => {
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 135, 11, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 135, 10, 'session-3'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.plateauSignals.failedRepTargets).toBe(false);
    });

    it('should detect stalled 1RM for 4+ sessions', () => {
      // Create sessions with same effective 1RM (same weight and reps)
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 135, 10, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 135, 10, 'session-3'),
        createSessionDaysAgo(10, 'bench-press', 135, 10, 'session-4'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.plateauSignals.stalled1RM).toBe(true);
    });

    it('should detect improving status when 1RM increases', () => {
      // Create sessions with increasing weight over time
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 155, 10, 'session-1'),  // Most recent - highest
        createSessionDaysAgo(14, 'bench-press', 145, 10, 'session-2'),
        createSessionDaysAgo(28, 'bench-press', 135, 10, 'session-3'), // Oldest - lowest
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.progressStatus).toBe('improving');
      expect(result.estimated1RMTrend).toBeGreaterThan(0);
    });

    it('should detect declining status when 1RM significantly decreases', () => {
      // Create sessions with decreasing weight over time (>5% decline)
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 120, 10, 'session-1'),  // Most recent - lowest
        createSessionDaysAgo(14, 'bench-press', 135, 10, 'session-2'),
        createSessionDaysAgo(28, 'bench-press', 150, 10, 'session-3'), // Oldest - highest
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.progressStatus).toBe('declining');
      expect(result.estimated1RMTrend).toBeLessThan(-5);
    });

    it('should detect plateau when 2+ signals are true and trend is flat/negative', () => {
      // Create sessions with same weight and stalled 1RM (2 signals) and flat trend
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 135, 10, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 135, 10, 'session-3'),
        createSessionDaysAgo(10, 'bench-press', 135, 10, 'session-4'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.progressStatus).toBe('plateau');
      // Both sameWeight3Sessions and stalled1RM should be true
      expect(result.plateauSignals.sameWeight3Sessions).toBe(true);
      expect(result.plateauSignals.stalled1RM).toBe(true);
    });

    it('should group sessions by week correctly', () => {
      // Create sessions in different weeks
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 145, 10, 'session-1'),   // This week (week 0)
        createSessionDaysAgo(8, 'bench-press', 140, 10, 'session-2'),   // Last week (week 1)
        createSessionDaysAgo(15, 'bench-press', 135, 10, 'session-3'),  // 2 weeks ago
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);

      // Should have weekly performance entries
      expect(result.weeklyPerformance.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate weight trend correctly', () => {
      // Create sessions with clear weight increase
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 150, 10, 'session-1'),   // Week 0
        createSessionDaysAgo(50, 'bench-press', 100, 10, 'session-2'),  // Week 7
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);

      // Weight trend should be positive (50% increase)
      expect(result.weightTrend).toBeGreaterThan(0);
    });

    it('should return recent sessions data', () => {
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 145, 10, 'session-1'),
        createSessionDaysAgo(3, 'bench-press', 140, 10, 'session-2'),
        createSessionDaysAgo(5, 'bench-press', 135, 10, 'session-3'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);

      expect(result.recentSessions.length).toBeGreaterThanOrEqual(1);
      expect(result.recentSessions[0]).toHaveProperty('date');
      expect(result.recentSessions[0]).toHaveProperty('maxWeight');
      expect(result.recentSessions[0]).toHaveProperty('avgReps');
      expect(result.recentSessions[0]).toHaveProperty('estimated1RM');
    });

    it('should handle exercises with no matching sessions', () => {
      const sessions = [
        createSessionDaysAgo(1, 'squat', 200, 10, 'session-1'),
        createSessionDaysAgo(3, 'squat', 195, 10, 'session-2'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, []);
      expect(result.progressStatus).toBe('insufficient_data');
    });

    it('should use custom exercises when provided', () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-exercise',
          name: 'Custom Bench Press',
          type: 'strength',
          muscleGroups: ['chest'],
          equipment: 'barbell',
        },
      ];

      const sessions = [
        createSessionDaysAgo(1, 'custom-exercise', 135, 10, 'session-1'),
        createSessionDaysAgo(3, 'custom-exercise', 135, 10, 'session-2'),
      ];

      const result = analyzeExercise10Weeks('custom-exercise', sessions, customExercises);
      expect(result.exerciseId).toBe('custom-exercise');
    });

    it('should allow 2.5% tolerance for same weight detection', () => {
      // 135 * 0.025 = 3.375, so weights within 3.375 lbs should be considered "same"
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 137, 10, 'session-2'), // Within 2.5% tolerance
        createSessionDaysAgo(7, 'bench-press', 136, 10, 'session-3'), // Within 2.5% tolerance
        createSessionDaysAgo(10, 'bench-press', 138, 10, 'session-4'), // Within 2.5% tolerance
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result.plateauSignals.sameWeight3Sessions).toBe(true);
    });
  });

  describe('buildExerciseAnalysisContext', () => {
    it('should return empty string for empty analyses', () => {
      const result = buildExerciseAnalysisContext([]);
      expect(result).toBe('');
    });

    it('should format analysis context correctly', () => {
      const analyses: ExerciseAnalysis[] = [
        {
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          weeklyPerformance: [
            {
              weekAgo: 0,
              sessions: 1,
              avgWeight: 135,
              avgReps: 10,
              maxWeight: 135,
              totalSets: 3,
              estimated1RM: 180,
            },
          ],
          progressStatus: 'improving',
          plateauSignals: {
            sameWeight3Sessions: false,
            failedRepTargets: false,
            stalled1RM: false,
          },
          weightTrend: 5,
          repsTrend: 2,
          estimated1RMTrend: 3.5,
          recentSessions: [],
        },
      ];

      const result = buildExerciseAnalysisContext(analyses);

      expect(result).toContain('EXERCISE ANALYSIS (10-week history)');
      expect(result).toContain('Bench Press');
      expect(result).toContain('bench-press');
      expect(result).toContain('IMPROVING');
      expect(result).toContain('+3.5%');
    });

    it('should include plateau signals when present', () => {
      const analyses: ExerciseAnalysis[] = [
        {
          exerciseId: 'squat',
          exerciseName: 'Squat',
          weeklyPerformance: [],
          progressStatus: 'plateau',
          plateauSignals: {
            sameWeight3Sessions: true,
            failedRepTargets: true,
            stalled1RM: false,
          },
          weightTrend: 0,
          repsTrend: -2,
          estimated1RMTrend: -1,
          recentSessions: [],
        },
      ];

      const result = buildExerciseAnalysisContext(analyses);

      expect(result).toContain('PLATEAU');
      expect(result).toContain('same weight 3+ sessions');
      expect(result).toContain('missed rep targets');
    });

    it('should format multiple exercises', () => {
      const analyses: ExerciseAnalysis[] = [
        {
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
          repsTrend: 2,
          estimated1RMTrend: 4,
          recentSessions: [],
        },
        {
          exerciseId: 'squat',
          exerciseName: 'Squat',
          weeklyPerformance: [],
          progressStatus: 'plateau',
          plateauSignals: {
            sameWeight3Sessions: true,
            failedRepTargets: false,
            stalled1RM: true,
          },
          weightTrend: 0,
          repsTrend: 0,
          estimated1RMTrend: 0,
          recentSessions: [],
        },
      ];

      const result = buildExerciseAnalysisContext(analyses);

      expect(result).toContain('Bench Press');
      expect(result).toContain('Squat');
      expect(result).toContain('IMPROVING');
      expect(result).toContain('PLATEAU');
    });

    it('should include weekly performance summaries', () => {
      const analyses: ExerciseAnalysis[] = [
        {
          exerciseId: 'bench-press',
          exerciseName: 'Bench Press',
          weeklyPerformance: [
            {
              weekAgo: 0,
              sessions: 2,
              avgWeight: 145,
              avgReps: 10,
              maxWeight: 150,
              totalSets: 6,
              estimated1RM: 200,
            },
            {
              weekAgo: 1,
              sessions: 2,
              avgWeight: 140,
              avgReps: 10,
              maxWeight: 145,
              totalSets: 6,
              estimated1RM: 193,
            },
          ],
          progressStatus: 'improving',
          plateauSignals: {
            sameWeight3Sessions: false,
            failedRepTargets: false,
            stalled1RM: false,
          },
          weightTrend: 3.5,
          repsTrend: 0,
          estimated1RMTrend: 3.6,
          recentSessions: [],
        },
      ];

      const result = buildExerciseAnalysisContext(analyses);

      expect(result).toContain('Week 0 ago');
      expect(result).toContain('Week 1 ago');
      expect(result).toContain('150lbs');
      expect(result).toContain('145lbs');
    });

    it('should show negative trend correctly', () => {
      const analyses: ExerciseAnalysis[] = [
        {
          exerciseId: 'deadlift',
          exerciseName: 'Deadlift',
          weeklyPerformance: [],
          progressStatus: 'declining',
          plateauSignals: {
            sameWeight3Sessions: false,
            failedRepTargets: false,
            stalled1RM: false,
          },
          weightTrend: -8,
          repsTrend: -5,
          estimated1RMTrend: -6.5,
          recentSessions: [],
        },
      ];

      const result = buildExerciseAnalysisContext(analyses);

      expect(result).toContain('DECLINING');
      expect(result).toContain('-6.5%');
    });
  });

  describe('hasEnoughHistoryForPlateauDetection', () => {
    it('should return false for empty sessions', () => {
      expect(hasEnoughHistoryForPlateauDetection([])).toBe(false);
    });

    it('should return false for less than 10 sessions', () => {
      const sessions = Array.from({ length: 9 }, (_, i) =>
        createSessionDaysAgo(i * 7, 'bench-press', 135, 10, `session-${i}`)
      );
      expect(hasEnoughHistoryForPlateauDetection(sessions)).toBe(false);
    });

    it('should return false if sessions do not span 8 weeks', () => {
      // Create 10 sessions all in the same week
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSessionDaysAgo(i, 'bench-press', 135, 10, `session-${i}`)
      );
      expect(hasEnoughHistoryForPlateauDetection(sessions)).toBe(false);
    });

    it('should return true with 10+ sessions spanning 8+ weeks', () => {
      // Create sessions across 10 weeks (one per week)
      const sessions = Array.from({ length: 10 }, (_, i) =>
        createSessionDaysAgo(i * 7, 'bench-press', 135, 10, `session-${i}`)
      );
      expect(hasEnoughHistoryForPlateauDetection(sessions)).toBe(true);
    });

    it('should return true with multiple sessions per week spanning 8+ weeks', () => {
      // Create 16 sessions (2 per week for 8 weeks)
      const sessions: WorkoutSession[] = [];
      for (let week = 0; week < 8; week++) {
        sessions.push(createSessionDaysAgo(week * 7, 'bench-press', 135, 10, `session-${week}-1`));
        sessions.push(createSessionDaysAgo(week * 7 + 2, 'bench-press', 135, 10, `session-${week}-2`));
      }
      expect(hasEnoughHistoryForPlateauDetection(sessions)).toBe(true);
    });

    it('should exclude incomplete sessions', () => {
      const completeSessions = Array.from({ length: 8 }, (_, i) =>
        createSessionDaysAgo(i * 7, 'bench-press', 135, 10, `session-${i}`)
      );
      const incompleteSessions = Array.from({ length: 4 }, (_, i) =>
        createMockSession({
          id: `incomplete-${i}`,
          startedAt: new Date(Date.now() - (i + 8) * 7 * 24 * 60 * 60 * 1000).toISOString(),
          completedAt: undefined, // Not completed
          exercises: [
            createStrengthExercise('bench-press', [createStrengthSet(135, 10)]),
          ],
        })
      );

      expect(hasEnoughHistoryForPlateauDetection([...completeSessions, ...incompleteSessions])).toBe(false);
    });

    it('should exclude sessions older than 10 weeks', () => {
      // Create sessions, but all older than 10 weeks
      const sessions = Array.from({ length: 12 }, (_, i) =>
        createSessionDaysAgo(80 + i * 7, 'bench-press', 135, 10, `session-${i}`)
      );
      expect(hasEnoughHistoryForPlateauDetection(sessions)).toBe(false);
    });
  });

  describe('Analysis Caching', () => {
    beforeEach(() => {
      clearAnalysisCache();
    });

    it('should return null for uncached exercise', () => {
      expect(getCachedAnalysis('bench-press', 5)).toBeNull();
    });

    it('should cache and retrieve analysis', () => {
      const analysis: ExerciseAnalysis = {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        weeklyPerformance: [],
        progressStatus: 'improving',
        plateauSignals: { sameWeight3Sessions: false, failedRepTargets: false, stalled1RM: false },
        weightTrend: 5,
        repsTrend: 2,
        estimated1RMTrend: 3,
        recentSessions: [],
      };

      cacheAnalysis(analysis, 10);
      const cached = getCachedAnalysis('bench-press', 10);

      expect(cached).not.toBeNull();
      expect(cached?.exerciseId).toBe('bench-press');
      expect(cached?.progressStatus).toBe('improving');
    });

    it('should invalidate cache when session count changes', () => {
      const analysis: ExerciseAnalysis = {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        weeklyPerformance: [],
        progressStatus: 'improving',
        plateauSignals: { sameWeight3Sessions: false, failedRepTargets: false, stalled1RM: false },
        weightTrend: 5,
        repsTrend: 2,
        estimated1RMTrend: 3,
        recentSessions: [],
      };

      cacheAnalysis(analysis, 10);
      expect(getCachedAnalysis('bench-press', 10)).not.toBeNull();

      // Cache should be invalidated when session count changes
      expect(getCachedAnalysis('bench-press', 11)).toBeNull();
    });

    it('should clear cache explicitly', () => {
      const analysis: ExerciseAnalysis = {
        exerciseId: 'bench-press',
        exerciseName: 'Bench Press',
        weeklyPerformance: [],
        progressStatus: 'improving',
        plateauSignals: { sameWeight3Sessions: false, failedRepTargets: false, stalled1RM: false },
        weightTrend: 5,
        repsTrend: 2,
        estimated1RMTrend: 3,
        recentSessions: [],
      };

      cacheAnalysis(analysis, 10);
      expect(getCachedAnalysis('bench-press', 10)).not.toBeNull();

      clearAnalysisCache();
      expect(getCachedAnalysis('bench-press', 10)).toBeNull();
    });

    it('should use cached analysis in analyzeExercise10Weeks', () => {
      clearAnalysisCache();

      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 140, 10, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 145, 10, 'session-3'),
      ];

      // First call should compute and cache
      const result1 = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result1.exerciseId).toBe('bench-press');

      // Second call should use cache
      const result2 = analyzeExercise10Weeks('bench-press', sessions, [], 10);
      expect(result2).toEqual(result1);
    });
  });

  describe('analyzeExercise10Weeks with enablePlateauDetection=false', () => {
    beforeEach(() => {
      clearAnalysisCache();
    });

    it('should skip plateau detection when disabled', () => {
      // Create sessions that would normally trigger plateau signals
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 135, 10, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 135, 10, 'session-3'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10, false);

      // With plateau detection disabled, all signals should be false
      expect(result.plateauSignals.sameWeight3Sessions).toBe(false);
      expect(result.plateauSignals.failedRepTargets).toBe(false);
      expect(result.plateauSignals.stalled1RM).toBe(false);
    });

    it('should not return plateau status when disabled', () => {
      // Create sessions that would normally trigger plateau
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 135, 10, 'session-1'),
        createSessionDaysAgo(4, 'bench-press', 135, 10, 'session-2'),
        createSessionDaysAgo(7, 'bench-press', 135, 10, 'session-3'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10, false);

      // Status should not be 'plateau' when detection is disabled
      expect(result.progressStatus).not.toBe('plateau');
      expect(result.progressStatus).toBe('improving');
    });

    it('should still calculate trends when plateau detection is disabled', () => {
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 150, 10, 'session-1'),
        createSessionDaysAgo(50, 'bench-press', 100, 10, 'session-2'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10, false);

      // Trends should still be calculated
      expect(result.weightTrend).toBeGreaterThan(0);
      expect(result.estimated1RMTrend).toBeGreaterThan(0);
    });

    it('should detect declining trend even when plateau detection is disabled', () => {
      // Need at least 3 sessions to avoid insufficient_data
      const sessions = [
        createSessionDaysAgo(1, 'bench-press', 100, 10, 'session-1'),
        createSessionDaysAgo(25, 'bench-press', 130, 10, 'session-2'),
        createSessionDaysAgo(50, 'bench-press', 150, 10, 'session-3'),
      ];

      const result = analyzeExercise10Weeks('bench-press', sessions, [], 10, false);

      // Should detect declining even without full plateau detection
      expect(result.progressStatus).toBe('declining');
    });
  });
});
