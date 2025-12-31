import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWorkoutScore } from './scoring';
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

describe('getWorkoutScore', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return workout score on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 85,
                  grade: 'A-',
                  summary: 'Great workout! You hit all your targets.',
                  highlights: ['Completed all sets', 'Good form'],
                  improvements: ['Could increase weight next time'],
                }),
              },
            },
          ],
        }),
    });

    const session = createMockSession({
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
    });

    const result = await getWorkoutScore('test-key', session, [], 'lbs');

    expect(result.score).toBe(85);
    expect(result.grade).toBe('A-');
    expect(result.summary).toContain('Great workout');
    expect(result.highlights).toContain('Completed all sets');
    expect(result.improvements).toContain('Could increase weight next time');
  });

  it('should include completed workout in prompt', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 80,
                  grade: 'B+',
                  summary: 'Good workout',
                  highlights: [],
                  improvements: [],
                }),
              },
            },
          ],
        }),
    });

    const session = createMockSession({
      exercises: [
        {
          type: 'strength',
          exerciseId: 'squat',
          targetSets: 3,
          targetReps: 8,
          restSeconds: 120,
          sets: [{ type: 'strength', weight: 225, reps: 8, unit: 'lbs', completedAt: '' }],
        },
      ],
    });

    await getWorkoutScore('test-key', session, [], 'lbs');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Exercise squat');
    expect(userMessage.content).toContain('225');
  });

  it('should include previous sessions with same template', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 75,
                  grade: 'B',
                  summary: 'Solid effort',
                  highlights: [],
                  improvements: [],
                }),
              },
            },
          ],
        }),
    });

    const completedSession = createMockSession({
      id: 'current',
      templateId: 'template-1',
      exercises: [
        {
          type: 'strength',
          exerciseId: 'bench',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [{ type: 'strength', weight: 140, reps: 10, unit: 'lbs', completedAt: '' }],
        },
      ],
    });

    const previousSession = createMockSession({
      id: 'previous',
      templateId: 'template-1',
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

    await getWorkoutScore('test-key', completedSession, [previousSession], 'lbs');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Relevant Previous Workouts');
    expect(userMessage.content).toContain('135');
  });

  it('should use correct weight unit', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 70,
                  grade: 'B',
                  summary: 'Good',
                  highlights: [],
                  improvements: [],
                }),
              },
            },
          ],
        }),
    });

    const session = createMockSession();

    await getWorkoutScore('test-key', session, [], 'kg');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userMessage = requestBody.messages[1];

    expect(userMessage.content).toContain('Use kg');
  });

  it('should return default score on malformed JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Invalid response' } }],
        }),
    });

    const session = createMockSession();

    const result = await getWorkoutScore('test-key', session, [], 'lbs');

    expect(result.score).toBe(70);
    expect(result.grade).toBe('B');
    expect(result.summary).toContain('Unable to generate detailed analysis');
  });

  it('should fill missing fields with defaults', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 90,
                  // Missing other fields
                }),
              },
            },
          ],
        }),
    });

    const session = createMockSession();

    const result = await getWorkoutScore('test-key', session, [], 'lbs');

    expect(result.score).toBe(90);
    expect(result.grade).toBe('B'); // Default
    expect(result.summary).toContain('Unable to generate'); // Default
    expect(result.highlights).toHaveLength(1); // Default
    expect(result.improvements).toHaveLength(1); // Default
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: { message: 'Server error' } }),
    });

    const session = createMockSession();

    await expect(getWorkoutScore('test-key', session, [], 'lbs')).rejects.toThrow('Server error');
  });

  it('should use supportive system message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  score: 80,
                  grade: 'B+',
                  summary: 'Nice work',
                  highlights: [],
                  improvements: [],
                }),
              },
            },
          ],
        }),
    });

    const session = createMockSession();

    await getWorkoutScore('test-key', session, [], 'lbs');

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const systemMessage = requestBody.messages[0];

    expect(systemMessage.content).toContain('supportive fitness coach');
  });
});
