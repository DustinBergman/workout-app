import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getProgressiveOverloadRecommendations } from './recommendations';
import { WorkoutSession } from '../../types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock storage module
vi.mock('../storage', () => ({
  getCustomExercises: vi.fn(() => []),
}));

// Mock exercises data
vi.mock('../../data/exercises', () => ({
  getExerciseById: vi.fn((id: string) => ({ id, name: `Exercise ${id}` })),
}));

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

describe('getProgressiveOverloadRecommendations', () => {
  beforeEach(() => {
    mockFetch.mockReset();
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
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
            ],
          },
        ],
      }),
      createMockSession({
        id: 'session-2',
        exercises: [
          {
            exerciseId: 'bench',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
              { weight: 135, reps: 10, unit: 'lbs', completedAt: '' },
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
});
