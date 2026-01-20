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
  templateType: 'strength',
  exercises: [],
  inRotation: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

// Helper to create a mock fetch response for a single exercise
const createMockResponse = (exerciseId: string, weight: number, reps: number) => ({
  ok: true,
  json: () =>
    Promise.resolve({
      choices: [
        {
          message: {
            content: JSON.stringify({
              suggestion: {
                exerciseId,
                suggestedWeight: weight,
                suggestedReps: reps,
                reasoning: 'Based on your progress',
                confidence: 'high',
                progressStatus: 'improving',
              },
            }),
          },
        },
      ],
    }),
});

describe('getPreWorkoutSuggestions', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return suggestions on success', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('bench', 140, 10));

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    const result = await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('bench');
    expect(result[0].suggestedWeight).toBe(140);
    expect(result[0].confidence).toBe('high');
  });

  it('should make parallel calls for multiple exercises', async () => {
    mockFetch
      .mockResolvedValueOnce(createMockResponse('bench', 140, 10))
      .mockResolvedValueOnce(createMockResponse('squat', 200, 8));

    const template = createMockTemplate({
      exercises: [
        { type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 },
        { type: 'strength', exerciseId: 'squat', targetSets: 3, targetReps: 8, restSeconds: 120 },
      ],
    });

    const result = await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    expect(result).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    // Results should be in same order as template exercises
    expect(result[0].exerciseId).toBe('bench');
    expect(result[1].exerciseId).toBe('squat');
  });

  it('should include previous performance in context', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('bench', 140, 10));

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

    expect(userMessage.content).toContain('Last set: 135lbs x 10 reps');
  });

  it('should include week guidance for build goal', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('bench', 140, 8));

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs', 1, 'build');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Build Muscle');
    expect(userMessage.content).toContain('Week 2');
    expect(userMessage.content).toContain('Light Overload');
  });

  it('should include weight loss guidance for lose goal', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('bench', 135, 8));

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs', 0, 'lose');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Lose Weight');
    expect(userMessage.content).toContain('deficit');
    expect(userMessage.content).toContain('no increases');
  });

  it('should include maintenance guidance for maintain goal', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('bench', 135, 10));

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs', 0, 'maintain');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Maintain');
    expect(userMessage.content).toContain('intensity waves');
  });

  it('should default to build goal', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('bench', 140, 10));

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Build Muscle');
  });

  it('should use correct weight unit in system prompt', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse('bench', 60, 10));

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    await getPreWorkoutSuggestions('test-key', template, [], 'kg');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const systemMessage = requestBody.messages[0];

    expect(systemMessage.content).toContain('kg');
  });

  it('should return fallback suggestions when LLM returns invalid response', async () => {
    // Return invalid response that will fail validation
    mockFetch.mockResolvedValue({
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

    // Should return fallback suggestions (3 retries fail, then fallback)
    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('bench');
    expect(result[0].confidence).toBe('low');
    expect(result[0].progressStatus).toBe('new');
  });

  it('should return fallback suggestions on API failure instead of throwing', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
    });

    const template = createMockTemplate({
      exercises: [{ type: 'strength', exerciseId: 'bench', targetSets: 3, targetReps: 10, restSeconds: 90 }],
    });

    // Should NOT throw - returns fallback instead
    const result = await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    expect(result).toHaveLength(1);
    expect(result[0].exerciseId).toBe('bench');
    expect(result[0].confidence).toBe('low');
  });

  it('should return empty array for template with no strength exercises', async () => {
    const template = createMockTemplate({
      exercises: [],
    });

    const result = await getPreWorkoutSuggestions('test-key', template, [], 'lbs');

    expect(result).toHaveLength(0);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should validate suggestedReps is greater than 0', async () => {
    // Return response with 0 reps (should be corrected)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestion: {
                    exerciseId: 'bench',
                    suggestedWeight: 140,
                    suggestedReps: 0, // Invalid - should be corrected
                    reasoning: 'Test',
                    confidence: 'high',
                    progressStatus: 'improving',
                  },
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

    // 0 reps should fail validation, trigger retry, eventually return fallback
    expect(result[0].suggestedReps).toBeGreaterThan(0);
  });
});
