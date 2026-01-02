import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getPreWorkoutSuggestions } from './suggestions';
import { WorkoutSession, WorkoutTemplate } from '../../types';

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

const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: 'template-1',
  name: 'Test Template',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

describe('getPreWorkoutSuggestions', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return suggestions on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    {
                      exerciseId: 'bench',
                      suggestedWeight: 140,
                      suggestedReps: 10,
                      reasoning: 'Based on your progress',
                      confidence: 'high',
                    },
                  ],
                }),
              },
            },
          ],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    const result = await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('bench');
    expect(result[0].suggestedWeight).toBe(140);
    expect(result[0].confidence).toBe('high');
  });

  it('should include previous performance in context', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"suggestions": []}' } }],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    const session = createMockSession({
      exercises: [
        {
          type: 'strength',
          exerciseId: 'bench',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [{ type: 'strength', weight: 135, reps: 10, unit: 'lbs', completedAt: '' }],
        },
      ],
    });

    await getPreWorkoutSuggestions('test-key', template, [session], 'lbs');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('recentPerformance');
    expect(userMessage.content).toContain('135');
  });

  it('should include week guidance for build goal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"suggestions": []}' } }],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs', 1, 'build');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Progressive Overload Week 2');
    expect(userMessage.content).toContain('Light Overload');
  });

  it('should include weight loss guidance for lose goal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"suggestions": []}' } }],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs', 0, 'lose');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Lose Weight');
    expect(userMessage.content).toContain('Fatigue Management');
    expect(userMessage.content).toContain('DO NOT suggest weight increases');
  });

  it('should include maintenance guidance for maintain goal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"suggestions": []}' } }],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs', 0, 'maintain');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Maintain');
    expect(userMessage.content).toContain('Intensity Waves');
    expect(userMessage.content).toContain('intensity week-to-week');
  });

  it('should default to build goal', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"suggestions": []}' } }],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Build Muscle');
  });

  it('should use correct weight unit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: '{"suggestions": []}' } }],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'kg');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Use kg for weights');
  });

  it('should return empty array for malformed JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Invalid response' } }],
        }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    const result = await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    expect(result).toEqual([]);
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await expect(getPreWorkoutSuggestions('test-key', template, [], 'lbs')).rejects.toThrow(
      'Unauthorized'
    );
  });
});
