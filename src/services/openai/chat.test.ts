import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendChatMessage } from './chat';
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

describe('sendChatMessage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return AI response on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: 'Great question! Progressive overload means...',
              },
            },
          ],
        }),
    });

    const result = await sendChatMessage(
      'test-api-key',
      [{ role: 'user', content: 'What is progressive overload?' }],
      []
    );

    expect(result).toBe('Great question! Progressive overload means...');
  });

  it('should include workout history in system message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Response' } }],
        }),
    });

    const session = createMockSession({
      name: 'Push Day',
      exercises: [
        {
          exerciseId: 'bench',
          targetSets: 3,
          targetReps: 10,
          restSeconds: 90,
          sets: [{ weight: 135, reps: 10, unit: 'lbs', completedAt: '' }],
        },
      ],
    });

    await sendChatMessage(
      'test-api-key',
      [{ role: 'user', content: 'How am I doing?' }],
      [session]
    );

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const systemMessage = requestBody.messages[0];

    expect(systemMessage.role).toBe('system');
    expect(systemMessage.content).toContain('Push Day');
    expect(systemMessage.content).toContain('Exercise bench');
  });

  it('should use higher temperature for chat', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Response' } }],
        }),
    });

    await sendChatMessage('test-api-key', [{ role: 'user', content: 'Hello' }], []);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.temperature).toBe(0.7);
  });

  it('should include system guidelines', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [{ message: { content: 'Response' } }],
        }),
    });

    await sendChatMessage('test-api-key', [{ role: 'user', content: 'Hello' }], []);

    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    const systemMessage = requestBody.messages[0];

    expect(systemMessage.content).toContain('fitness coach');
    expect(systemMessage.content).toContain('progressive overload');
  });

  it('should throw error on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () =>
        Promise.resolve({
          error: { message: 'Invalid API key' },
        }),
    });

    await expect(
      sendChatMessage('invalid-key', [{ role: 'user', content: 'Hello' }], [])
    ).rejects.toThrow('Invalid API key');
  });
});
