import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getPTSummary,
  hasValidPTSummaryCache,
  clearPTSummaryCache,
  aggregatePTSummaryData,
  PTSummaryResponse,
  StatCardComponent,
  ProgressIndicatorComponent,
  HighlightBadgeComponent,
  TipComponent,
} from './ptSummary';
import {
  WorkoutSession,
  Exercise,
  WeightEntry,
  ExperienceLevel,
  WorkoutGoal,
  ProgressiveOverloadWeek,
} from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock getExerciseById
vi.mock('../../data/exercises', () => ({
  getExerciseById: (id: string, customExercises: Exercise[] = []) => {
    const custom = customExercises.find((e) => e.id === id);
    if (custom) return custom;
    // Default exercises for testing
    const defaultExercises: Record<string, { id: string; name: string; muscleGroups?: string[]; type: string }> = {
      'bench-press': { id: 'bench-press', name: 'Bench Press', muscleGroups: ['chest'], type: 'strength' },
      'squat': { id: 'squat', name: 'Squat', muscleGroups: ['quadriceps'], type: 'strength' },
      'deadlift': { id: 'deadlift', name: 'Deadlift', muscleGroups: ['back'], type: 'strength' },
      'bicep-curl': { id: 'bicep-curl', name: 'Bicep Curl', muscleGroups: ['biceps'], type: 'strength' },
      'running': { id: 'running', name: 'Running', type: 'cardio' },
    };
    return defaultExercises[id] || { id, name: `Exercise ${id}`, muscleGroups: [], type: 'strength' };
  },
}));

// Mock analyzeExercise10Weeks
vi.mock('./exerciseAnalysis', () => ({
  analyzeExercise10Weeks: vi.fn((exerciseId: string) => ({
    exerciseId,
    exerciseName: `Exercise ${exerciseId}`,
    weeklyPerformance: [],
    progressStatus: 'improving',
    plateauSignals: { sameWeight3Sessions: false, failedRepTargets: false, stalled1RM: false },
    weightTrend: 5,
    repsTrend: 2,
    estimated1RMTrend: 6,
    recentSessions: [],
  })),
}));

// Mock streakUtils
vi.mock('../../utils/streakUtils', () => ({
  calculateStreak: vi.fn(() => 3),
}));

const PT_SUMMARY_CACHE_KEY = 'workout-app-pt-summary-cache';

// Helper to create a mock session
const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => {
  const now = new Date();
  return {
    id: `session-${Math.random().toString(36).slice(2, 11)}`,
    name: 'Test Workout',
    startedAt: now.toISOString(),
    completedAt: now.toISOString(),
    exercises: [],
    ...overrides,
  };
};

// Helper to create a mock session with exercises
const createMockSessionWithExercises = (
  daysAgo: number,
  exerciseIds: string[] = ['bench-press'],
  overrides: Partial<WorkoutSession> = {}
): WorkoutSession => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  return {
    id: `session-${daysAgo}-${Math.random().toString(36).slice(2, 11)}`,
    name: `Workout ${daysAgo} days ago`,
    startedAt: date.toISOString(),
    completedAt: date.toISOString(),
    exercises: exerciseIds.map((exerciseId) => ({
      type: 'strength' as const,
      exerciseId,
      targetSets: 3,
      targetReps: 10,
      restSeconds: 90,
      sets: [
        { type: 'strength' as const, weight: 135, reps: 10, unit: 'lbs' as const, completedAt: date.toISOString() },
        { type: 'strength' as const, weight: 135, reps: 10, unit: 'lbs' as const, completedAt: date.toISOString() },
        { type: 'strength' as const, weight: 135, reps: 10, unit: 'lbs' as const, completedAt: date.toISOString() },
      ],
    })),
    ...overrides,
  };
};

// Helper to create mock weight entries
// By default creates a downward trend (recent weights are lower)
const createMockWeightEntries = (
  count: number,
  startWeight: number = 180,
  direction: 'down' | 'up' | 'stable' = 'down'
): WeightEntry[] => {
  const entries: WeightEntry[] = [];
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    let weight = startWeight;
    if (direction === 'down') {
      // Recent weights are lower (user is losing weight)
      // Most recent (i=0) is startWeight - total change
      // Oldest is startWeight
      weight = startWeight - (count - 1 - i) * 0.5;
    } else if (direction === 'up') {
      // Recent weights are higher (user is gaining weight)
      weight = startWeight + (count - 1 - i) * 0.5;
    }
    // For 'stable', weight stays at startWeight
    entries.push({
      date: date.toISOString(),
      weight,
      unit: 'lbs',
    });
  }
  return entries;
};

describe('ptSummary', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.removeItem(PT_SUMMARY_CACHE_KEY);
    clearPTSummaryCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('hasValidPTSummaryCache', () => {
    it('should return false when no cache exists', () => {
      const sessions = [createMockSession(), createMockSession()];
      expect(hasValidPTSummaryCache(sessions)).toBe(false);
    });

    it('should return true when valid cache exists', () => {
      const sessions = [
        createMockSession({ id: 'session-1', exercises: [] }),
        createMockSession({ id: 'session-2', exercises: [] }),
      ];

      // Create cache with matching hash
      const cache = {
        summary: { summary: 'Test', components: [] },
        timestamp: Date.now(),
        sessionsHash: 'session-1:0|session-2:0',
      };
      localStorage.setItem(PT_SUMMARY_CACHE_KEY, JSON.stringify(cache));

      expect(hasValidPTSummaryCache(sessions)).toBe(true);
    });

    it('should return false when cache is expired (> 24 hours)', () => {
      const sessions = [
        createMockSession({ id: 'session-1', exercises: [] }),
        createMockSession({ id: 'session-2', exercises: [] }),
      ];

      // Create expired cache (25 hours ago)
      const cache = {
        summary: { summary: 'Test', components: [] },
        timestamp: Date.now() - 25 * 60 * 60 * 1000,
        sessionsHash: 'session-1:0|session-2:0',
      };
      localStorage.setItem(PT_SUMMARY_CACHE_KEY, JSON.stringify(cache));

      expect(hasValidPTSummaryCache(sessions)).toBe(false);
    });

    it('should return false when sessions hash does not match', () => {
      const sessions = [
        createMockSession({ id: 'session-1', exercises: [] }),
        createMockSession({ id: 'session-2', exercises: [] }),
      ];

      // Create cache with different hash
      const cache = {
        summary: { summary: 'Test', components: [] },
        timestamp: Date.now(),
        sessionsHash: 'different-hash',
      };
      localStorage.setItem(PT_SUMMARY_CACHE_KEY, JSON.stringify(cache));

      expect(hasValidPTSummaryCache(sessions)).toBe(false);
    });

    it('should return false for malformed cache data', () => {
      localStorage.setItem(PT_SUMMARY_CACHE_KEY, 'not valid json');
      const sessions = [createMockSession(), createMockSession()];
      expect(hasValidPTSummaryCache(sessions)).toBe(false);
    });
  });

  describe('clearPTSummaryCache', () => {
    it('should remove cache from localStorage', () => {
      const cache = {
        summary: { summary: 'Test', components: [] },
        timestamp: Date.now(),
        sessionsHash: 'test-hash',
      };
      localStorage.setItem(PT_SUMMARY_CACHE_KEY, JSON.stringify(cache));

      expect(localStorage.getItem(PT_SUMMARY_CACHE_KEY)).not.toBeNull();

      clearPTSummaryCache();

      expect(localStorage.getItem(PT_SUMMARY_CACHE_KEY)).toBeNull();
    });

    it('should not throw when cache does not exist', () => {
      expect(() => clearPTSummaryCache()).not.toThrow();
    });
  });

  describe('aggregatePTSummaryData', () => {
    const defaultParams = {
      firstName: 'John',
      experienceLevel: 'intermediate' as ExperienceLevel,
      workoutGoal: 'build' as WorkoutGoal,
      currentWeek: 2 as ProgressiveOverloadWeek,
    };

    it('should return basic activity metrics', () => {
      const sessions = [
        createMockSessionWithExercises(0),
        createMockSessionWithExercises(1),
        createMockSessionWithExercises(3),
        createMockSessionWithExercises(7),
        createMockSessionWithExercises(14),
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.firstName).toBe('John');
      expect(result.experienceLevel).toBe('intermediate');
      expect(result.workoutGoal).toBe('build');
      expect(result.currentWeek).toBe(2);
      expect(result.totalWorkoutsLast10Weeks).toBe(5);
      expect(result.workoutsPerWeek).toBe(0.5);
    });

    it('should calculate workout frequency correctly', () => {
      // Create 20 sessions over 10 weeks (2 per week average)
      const sessions: WorkoutSession[] = [];
      for (let i = 0; i < 20; i++) {
        sessions.push(createMockSessionWithExercises(i * 3)); // Every 3 days
      }

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        undefined,
        'beginner',
        'maintain',
        0
      );

      expect(result.totalWorkoutsLast10Weeks).toBe(20);
      expect(result.workoutsPerWeek).toBe(2);
    });

    it('should exclude sessions older than 10 weeks', () => {
      const sessions = [
        createMockSessionWithExercises(0),
        createMockSessionWithExercises(65), // Within 10 weeks
        createMockSessionWithExercises(75), // Outside 10 weeks
        createMockSessionWithExercises(100), // Way outside
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.totalWorkoutsLast10Weeks).toBe(2);
    });

    it('should calculate body weight trend when entries exist', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];
      const weightEntries = createMockWeightEntries(8, 180, 'down'); // 8 days of weight entries, losing weight

      const result = aggregatePTSummaryData(
        sessions,
        weightEntries,
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.bodyWeightTrend).toBeDefined();
      expect(result.bodyWeightTrend?.direction).toBe('down');
      expect(result.bodyWeightTrend?.changePercent).toBeLessThan(0);
    });

    it('should not include body weight trend when less than 2 entries', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];
      const weightEntries = createMockWeightEntries(1);

      const result = aggregatePTSummaryData(
        sessions,
        weightEntries,
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.bodyWeightTrend).toBeUndefined();
    });

    it('should handle sessions with mood data', () => {
      const sessions = [
        createMockSessionWithExercises(0, ['bench-press'], { mood: 5 }),
        createMockSessionWithExercises(1, ['bench-press'], { mood: 4 }),
        createMockSessionWithExercises(2, ['bench-press'], { mood: 4 }),
        createMockSessionWithExercises(3, ['bench-press'], { mood: 3 }),
        createMockSessionWithExercises(4, ['bench-press'], { mood: 3 }),
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.averageMoodLast5Workouts).toBeDefined();
      expect(result.moodTrend).toBeDefined();
    });

    it('should not include mood data when less than 3 sessions with mood', () => {
      const sessions = [
        createMockSessionWithExercises(0, ['bench-press'], { mood: 5 }),
        createMockSessionWithExercises(1, ['bench-press'], { mood: 4 }),
        createMockSessionWithExercises(2, ['bench-press']), // No mood
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.averageMoodLast5Workouts).toBeUndefined();
      expect(result.moodTrend).toBeUndefined();
    });

    it('should find recent PRs from sessions', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const sessions = [
        createMockSessionWithExercises(5, ['bench-press'], {
          personalBests: [{ exerciseId: 'bench-press', exerciseName: 'Bench Press', type: 'weight', value: 200, unit: 'lbs', reps: 5 }],
        }),
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.recentPRs.length).toBeGreaterThan(0);
      expect(result.recentPRs[0].exerciseName).toBe('Bench Press');
    });

    it('should exclude PRs older than 30 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);

      const sessions = [
        createMockSessionWithExercises(35, ['bench-press'], {
          personalBests: [{ exerciseId: 'bench-press', exerciseName: 'Bench Press', type: 'weight', value: 200, unit: 'lbs', reps: 5 }],
        }),
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.recentPRs.length).toBe(0);
    });

    it('should handle custom exercises', () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-1',
          name: 'My Custom Exercise',
          muscleGroups: ['chest'],
          equipment: 'barbell',
          type: 'strength',
        },
      ];

      const sessions = [
        createMockSessionWithExercises(0, ['custom-1']),
        createMockSessionWithExercises(1, ['custom-1']),
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        customExercises,
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      // Should not throw and should process sessions
      expect(result.totalWorkoutsLast10Weeks).toBe(2);
    });

    it('should handle sessions without completed exercises', () => {
      const sessions = [
        createMockSession({ id: 'session-1', exercises: [] }),
        createMockSession({ id: 'session-2', exercises: [] }),
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        defaultParams.firstName,
        defaultParams.experienceLevel,
        defaultParams.workoutGoal,
        defaultParams.currentWeek
      );

      expect(result.muscleGroupProgress).toEqual([]);
      expect(result.exercisesOnPlateau).toEqual([]);
      expect(result.exercisesImproving).toEqual([]);
    });
  });

  describe('getPTSummary', () => {
    const defaultApiKey = 'test-api-key';
    const defaultSessions = [
      createMockSessionWithExercises(0),
      createMockSessionWithExercises(1),
    ];
    const defaultWeightEntries: WeightEntry[] = [];
    const defaultCustomExercises: Exercise[] = [];

    const mockAIResponse: PTSummaryResponse = {
      summary: "You're doing great! Your consistency over the past week shows real dedication.",
      components: [
        { type: 'stat_card', label: 'Workouts', value: '5', trend: 'up', subtitle: 'this week' },
        { type: 'progress_indicator', area: 'Upper Body', status: 'improving', detail: 'Strong gains' },
      ],
      nextSessionFocus: 'Keep pushing on bench press',
    };

    it('should return null when less than 2 completed sessions', async () => {
      const result = await getPTSummary(
        defaultApiKey,
        [createMockSession({ completedAt: undefined })],
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for empty sessions array', async () => {
      const result = await getPTSummary(
        defaultApiKey,
        [],
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return null for single completed session', async () => {
      const result = await getPTSummary(
        defaultApiKey,
        [createMockSession()],
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result).toBeNull();
    });

    it('should call OpenAI API and return parsed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
          }),
      });

      const result = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result).not.toBeNull();
      expect(result?.summary).toBe(mockAIResponse.summary);
      expect(result?.components).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should use cached response on subsequent calls', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
          }),
      });

      // First call
      const result1 = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      // Second call with same sessions
      const result2 = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result1).toEqual(result2);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should fetch fresh data when sessions change', async () => {
      const response1: PTSummaryResponse = {
        summary: 'First summary',
        components: [],
      };
      const response2: PTSummaryResponse = {
        summary: 'Second summary',
        components: [],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(response1) } }] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ choices: [{ message: { content: JSON.stringify(response2) } }] }),
        });

      // First call
      const result1 = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      // Clear cache and call with different sessions
      clearPTSummaryCache();
      const newSessions = [
        ...defaultSessions,
        createMockSessionWithExercises(2),
      ];

      const result2 = await getPTSummary(
        defaultApiKey,
        newSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result1?.summary).toBe('First summary');
      expect(result2?.summary).toBe('Second summary');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return null on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      });

      const result = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result).toBeNull();
    });

    it('should handle malformed JSON response gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: 'Not valid JSON at all' } }],
          }),
      });

      const result = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      // Should return fallback response
      expect(result).not.toBeNull();
      expect(result?.summary).toBeDefined();
      expect(result?.components).toEqual([]);
    });

    it('should validate and filter invalid components', async () => {
      const responseWithInvalidComponents = {
        summary: 'Test summary',
        components: [
          { type: 'stat_card', label: 'Valid', value: '5' }, // Valid
          { type: 'stat_card' }, // Invalid - missing required fields
          { type: 'progress_indicator', area: 'Legs', status: 'improving' }, // Valid
          { type: 'unknown_type', data: 'test' }, // Invalid type
          { type: 'highlight_badge', icon: 'trophy', title: 'Achievement' }, // Valid
          null, // Invalid
          { type: 'tip', category: 'recovery', message: 'Rest well' }, // Valid
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(responseWithInvalidComponents) } }],
          }),
      });

      const result = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result).not.toBeNull();
      // Should only include valid components (max 4)
      expect(result?.components.length).toBeLessThanOrEqual(4);
      result?.components.forEach((comp) => {
        expect(['stat_card', 'progress_indicator', 'highlight_badge', 'tip']).toContain(comp.type);
      });
    });

    it('should limit components to 4', async () => {
      const responseWithManyComponents: PTSummaryResponse = {
        summary: 'Test summary',
        components: [
          { type: 'stat_card', label: '1', value: '1' },
          { type: 'stat_card', label: '2', value: '2' },
          { type: 'stat_card', label: '3', value: '3' },
          { type: 'stat_card', label: '4', value: '4' },
          { type: 'stat_card', label: '5', value: '5' },
          { type: 'stat_card', label: '6', value: '6' },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(responseWithManyComponents) } }],
          }),
      });

      const result = await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result?.components.length).toBe(4);
    });

    it('should include correct parameters in API request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
          }),
      });

      await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'advanced',
        'lose',
        4
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('John');
      expect(userMessage).toContain('advanced');
      expect(userMessage).toContain('Week 4');
    });

    it('should use temperature 0.6 for variety', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify(mockAIResponse) } }],
          }),
      });

      await getPTSummary(
        defaultApiKey,
        defaultSessions,
        defaultWeightEntries,
        defaultCustomExercises,
        'John',
        'intermediate',
        'build',
        2
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.temperature).toBe(0.6);
    });
  });

  describe('component type validation', () => {
    it('should validate StatCardComponent structure', () => {
      const validStatCard: StatCardComponent = {
        type: 'stat_card',
        label: 'Workouts',
        value: '5',
        trend: 'up',
        subtitle: 'this week',
      };

      expect(validStatCard.type).toBe('stat_card');
      expect(validStatCard.label).toBeDefined();
      expect(validStatCard.value).toBeDefined();
    });

    it('should validate ProgressIndicatorComponent structure', () => {
      const validProgressIndicator: ProgressIndicatorComponent = {
        type: 'progress_indicator',
        area: 'Upper Body',
        status: 'improving',
        detail: 'Great progress',
      };

      expect(validProgressIndicator.type).toBe('progress_indicator');
      expect(['improving', 'maintaining', 'plateau', 'declining']).toContain(validProgressIndicator.status);
    });

    it('should validate HighlightBadgeComponent structure', () => {
      const validHighlightBadge: HighlightBadgeComponent = {
        type: 'highlight_badge',
        icon: 'trophy',
        title: '5-Day Streak!',
        description: 'Your longest this month',
      };

      expect(validHighlightBadge.type).toBe('highlight_badge');
      expect(['trophy', 'fire', 'star', 'medal', 'target', 'lightning']).toContain(validHighlightBadge.icon);
    });

    it('should validate TipComponent structure', () => {
      const validTip: TipComponent = {
        type: 'tip',
        category: 'recovery',
        message: 'Make sure to get enough sleep',
      };

      expect(validTip.type).toBe('tip');
      expect(['technique', 'recovery', 'progression', 'variety', 'mindset']).toContain(validTip.category);
    });
  });

  describe('prompt content', () => {
    it('should include guideline about not suggesting variety without plateaus', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ summary: 'Test', components: [] }) } }],
          }),
      });

      await getPTSummary(
        'test-key',
        [createMockSessionWithExercises(0), createMockSessionWithExercises(1)],
        [],
        [],
        'John',
        'intermediate',
        'build',
        2
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemMessage = requestBody.messages[0].content;

      expect(systemMessage).toContain('ONLY suggest adding variety');
      expect(systemMessage).toContain('PLATEAUS');
    });

    it('should include guideline about not using emdashes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ summary: 'Test', components: [] }) } }],
          }),
      });

      await getPTSummary(
        'test-key',
        [createMockSessionWithExercises(0), createMockSessionWithExercises(1)],
        [],
        [],
        'John',
        'intermediate',
        'build',
        2
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemMessage = requestBody.messages[0].content;

      expect(systemMessage).toContain('NEVER use emdashes');
    });

    it('should include guideline about nextSessionFocus being optional', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ summary: 'Test', components: [] }) } }],
          }),
      });

      await getPTSummary(
        'test-key',
        [createMockSessionWithExercises(0), createMockSessionWithExercises(1)],
        [],
        [],
        'John',
        'intermediate',
        'build',
        2
      );

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const systemMessage = requestBody.messages[0].content;

      expect(systemMessage).toContain('OMIT the nextSessionFocus field');
    });
  });

  describe('edge cases', () => {
    it('should handle sessions with only cardio exercises', () => {
      const sessions = [
        createMockSessionWithExercises(0, ['running']),
        createMockSessionWithExercises(1, ['running']),
      ];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result.totalWorkoutsLast10Weeks).toBe(2);
      // Cardio exercises shouldn't appear in strength-based muscle group progress
    });

    it('should handle undefined firstName', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];

      const result = aggregatePTSummaryData(
        sessions,
        [],
        [],
        undefined,
        'intermediate',
        'build',
        2
      );

      expect(result.firstName).toBeUndefined();
    });

    it('should handle all experience levels', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];
      const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

      levels.forEach((level) => {
        const result = aggregatePTSummaryData(
          sessions,
          [],
          [],
          'John',
          level,
          'build',
          2
        );
        expect(result.experienceLevel).toBe(level);
      });
    });

    it('should handle all workout goals', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];
      const goals: WorkoutGoal[] = ['build', 'lose', 'maintain'];

      goals.forEach((goal) => {
        const result = aggregatePTSummaryData(
          sessions,
          [],
          [],
          'John',
          'intermediate',
          goal,
          2
        );
        expect(result.workoutGoal).toBe(goal);
      });
    });

    it('should handle all progressive overload weeks', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];
      const weeks: ProgressiveOverloadWeek[] = [0, 1, 2, 3, 4];

      weeks.forEach((week) => {
        const result = aggregatePTSummaryData(
          sessions,
          [],
          [],
          'John',
          'intermediate',
          'build',
          week
        );
        expect(result.currentWeek).toBe(week);
      });
    });

    it('should handle weight entries showing stable weight', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];
      const stableWeightEntries = createMockWeightEntries(8, 180, 'stable');

      const result = aggregatePTSummaryData(
        sessions,
        stableWeightEntries,
        [],
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result.bodyWeightTrend?.direction).toBe('stable');
    });

    it('should handle weight entries showing weight gain', () => {
      const sessions = [createMockSessionWithExercises(0), createMockSessionWithExercises(1)];
      const gainWeightEntries = createMockWeightEntries(8, 180, 'up');

      const result = aggregatePTSummaryData(
        sessions,
        gainWeightEntries,
        [],
        'John',
        'intermediate',
        'build',
        2
      );

      expect(result.bodyWeightTrend?.direction).toBe('up');
    });
  });
});
