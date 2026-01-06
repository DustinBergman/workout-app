import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProgressiveOverloadRecommendations, clearRecommendationsCache } from './recommendations';
import { WorkoutSession, Exercise } from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock storage module
vi.mock('../storage', () => ({
  getCustomExercises: vi.fn(() => []),
}));

// Create a mock for getExerciseById that we can customize per test
const mockGetExerciseById = vi.fn((id: string, customExercises: Exercise[] = []) => {
  // Check custom exercises first
  const custom = customExercises.find(e => e.id === id);
  if (custom) return custom;
  // Default behavior
  return { id, name: `Exercise ${id}` };
});

// Mock exercises data
vi.mock('../../data/exercises', () => ({
  getExerciseById: (id: string, customExercises: Exercise[] = []) => mockGetExerciseById(id, customExercises),
}));

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

const CACHE_KEY = 'workout-app-recommendations-cache';

describe('getProgressiveOverloadRecommendations', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockGetExerciseById.mockClear();
    localStorage.removeItem(CACHE_KEY);
    clearRecommendationsCache();
  });

  it('should return empty array when less than 2 sessions', async () => {
    const result = await getProgressiveOverloadRecommendations('test-key', [], 'lbs');
    expect(result).toEqual([]);

    const result2 = await getProgressiveOverloadRecommendations(
      'test-key',
      [createMockSession()],
      'lbs'
    );
    expect(result2).toEqual([]);
  });

  it('should return recommendations on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  recommendations: [
                    {
                      exerciseId: 'bench',
                      exerciseName: 'Bench Press',
                      currentWeight: 135,
                      recommendedWeight: 140,
                      currentReps: 10,
                      recommendedReps: 8,
                      reason: 'Ready to progress',
                      type: 'increase',
                    },
                  ],
                }),
              },
            },
          ],
        }),
    });

    const sessions = [
      createMockSession({
        id: 'session-1',
        exercises: [
          {
            type: 'strength',
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { type: 'strength', weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { type: 'strength', weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { type: 'strength', weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      }),
      createMockSession({
        id: 'session-2',
        exercises: [
          {
            type: 'strength',
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { type: 'strength', weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { type: 'strength', weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { type: 'strength', weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      }),
    ];

    const result = await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');

    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('bench');
    expect(result[0].recommendedWeight).toBe(140);
    expect(result[0].type).toBe('increase');
  });

  it('should use correct weight unit in prompt', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"recommendations": []}' } }],
        }),
    });

    const sessions = [createMockSession(), createMockSession({ id: 'session-2' })];

    await getProgressiveOverloadRecommendations('test-key', sessions, 'kg');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('kg');
  });

  it('should return empty array for malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Not valid JSON' } }],
        }),
    });

    const sessions = [createMockSession(), createMockSession({ id: 'session-2' })];

    const result = await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');

    expect(result).toEqual([]);
  });

  it('should return empty array when recommendations key is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"data": []}' } }],
        }),
    });

    const sessions = [createMockSession(), createMockSession({ id: 'session-2' })];

    const result = await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');

    expect(result).toEqual([]);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: 'Server error' } }),
    });

    const sessions = [createMockSession(), createMockSession({ id: 'session-2' })];

    await expect(
      getProgressiveOverloadRecommendations('test-key', sessions, 'lbs')
    ).rejects.toThrow('Server error');
  });

  describe('caching', () => {
    const mockRecommendations = [
      {
        exerciseId: 'bench',
        exerciseName: 'Bench Press',
        currentWeight: 135,
        recommendedWeight: 140,
        currentReps: 10,
        recommendedReps: 8,
        reason: 'Ready to progress',
        type: 'increase',
      },
    ];

    const sessions = [
      createMockSession({ id: 'session-1', exercises: [] }),
      createMockSession({ id: 'session-2', exercises: [] }),
    ];

    it('should cache recommendations after fetching', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ recommendations: mockRecommendations }) } }],
          }),
      });

      await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');

      const cached = localStorage.getItem(CACHE_KEY);
      expect(cached).not.toBeNull();

      const parsed = JSON.parse(cached!);
      expect(parsed.recommendations).toHaveLength(1);
      expect(parsed.recommendations[0].exerciseId).toBe('bench');
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.sessionsHash).toBeDefined();
    });

    it('should return cached data without making API call', async () => {
      // First call - should make API request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ recommendations: mockRecommendations }) } }],
          }),
      });

      const result1 = await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result1).toHaveLength(1);

      // Second call with same sessions - should use cache
      const result2 = await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call
      expect(result2).toHaveLength(1);
      expect(result2[0].exerciseId).toBe('bench');
    });

    it('should fetch fresh data when cache is expired', async () => {
      // Set up expired cache (25 hours ago)
      const expiredCache = {
        recommendations: mockRecommendations,
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        sessionsHash: 'session-1:0|session-2:0',
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(expiredCache));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ recommendations: [{ ...mockRecommendations[0], recommendedWeight: 145 }] }) } }],
          }),
      });

      const result = await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result[0].recommendedWeight).toBe(145); // Fresh data
    });

    it('should fetch fresh data when sessions have changed', async () => {
      // Set up cache with different sessions hash
      const cachedWithDifferentSessions = {
        recommendations: mockRecommendations,
        timestamp: Date.now(),
        sessionsHash: 'old-session-1:0|old-session-2:0', // Different hash
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedWithDifferentSessions));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: JSON.stringify({ recommendations: [{ ...mockRecommendations[0], recommendedWeight: 150 }] }) } }],
          }),
      });

      const result = await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result[0].recommendedWeight).toBe(150); // Fresh data
    });

    it('should clear cache with clearRecommendationsCache', async () => {
      // Set up valid cache
      const validCache = {
        recommendations: mockRecommendations,
        timestamp: Date.now(),
        sessionsHash: 'session-1:0|session-2:0',
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(validCache));

      expect(localStorage.getItem(CACHE_KEY)).not.toBeNull();

      clearRecommendationsCache();

      expect(localStorage.getItem(CACHE_KEY)).toBeNull();
    });
  });

  describe('custom exercise name resolution', () => {
    it('should resolve custom exercise names in recommendations', async () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-12345',
          name: 'My Custom Press',
          muscleGroups: ['chest'],
          equipment: 'barbell',
          type: 'strength',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    recommendations: [
                      {
                        exerciseId: 'custom-12345',
                        exerciseName: 'custom-12345', // AI might return raw ID
                        currentWeight: 100,
                        recommendedWeight: 105,
                        currentReps: 10,
                        recommendedReps: 10,
                        reason: 'Ready to progress',
                        type: 'increase',
                      },
                    ],
                  }),
                },
              },
            ],
          }),
      });

      const sessions = [
        createMockSession({
          id: 'session-1',
          exercises: [
            {
              type: 'strength',
              exerciseId: 'custom-12345',
              targetSets: 3,
              targetReps: 10,
              restSeconds: 90,
              sets: [],
            },
          ],
        }),
        createMockSession({ id: 'session-2', exercises: [] }),
      ];

      const result = await getProgressiveOverloadRecommendations(
        'test-key',
        sessions,
        'lbs',
        customExercises
      );

      expect(result[0].exerciseName).toBe('My Custom Press');
    });
  });

  describe('experience level guidance', () => {
    const sessions = [
      createMockSession({ id: 'session-1' }),
      createMockSession({ id: 'session-2' }),
    ];

    it('should include beginner guidance in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"recommendations": []}' } }],
          }),
      });

      await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs', [], 'beginner');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('EXPERIENCE LEVEL: Beginner');
      expect(userMessage).toContain('5-10% weight increases');
    });

    it('should include intermediate guidance in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"recommendations": []}' } }],
          }),
      });

      await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs', [], 'intermediate');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('EXPERIENCE LEVEL: Intermediate');
      expect(userMessage).toContain('2-5% weight increases');
    });

    it('should include advanced guidance in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"recommendations": []}' } }],
          }),
      });

      await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs', [], 'advanced');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('EXPERIENCE LEVEL: Advanced');
      expect(userMessage).toContain('1-2.5% weight increases');
    });
  });

  describe('workout goal guidance', () => {
    const sessions = [
      createMockSession({ id: 'session-1' }),
      createMockSession({ id: 'session-2' }),
    ];

    it('should include build muscle guidance in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"recommendations": []}' } }],
          }),
      });

      await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs', [], 'intermediate', 'build');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('TRAINING GOAL:');
      expect(userMessage).toContain('Progressive overload is the priority');
    });

    it('should include lose weight guidance with no-increase warning', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"recommendations": []}' } }],
          }),
      });

      await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs', [], 'intermediate', 'lose');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('TRAINING GOAL:');
      expect(userMessage).toContain('Do NOT recommend weight increases');
      expect(userMessage).toContain('MAINTAINING current weights');
      expect(userMessage).toContain('caloric deficit');
    });

    it('should include maintain guidance in prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: '{"recommendations": []}' } }],
          }),
      });

      await getProgressiveOverloadRecommendations('test-key', sessions, 'lbs', [], 'intermediate', 'maintain');

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const userMessage = requestBody.messages[1].content;

      expect(userMessage).toContain('TRAINING GOAL:');
      expect(userMessage).toContain('maintaining current performance');
      expect(userMessage).toContain('no aggressive changes');
    });
  });
});
