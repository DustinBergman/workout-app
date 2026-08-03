import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { WorkoutSession } from '../types';
import { getWorkoutScore } from '../services/openai';
import { getAuthUser } from '../services/supabase/authHelper';
import { useWorkoutScoring } from './useWorkoutScoring';

vi.mock('../services/openai', () => ({
  getWorkoutScore: vi.fn(),
}));

vi.mock('../services/supabase/authHelper', () => ({
  getAuthUser: vi.fn().mockResolvedValue({ id: 'user-1' }),
}));

const session: WorkoutSession = {
  id: 'session-1',
  name: 'Workout',
  startedAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
  exercises: [],
};

describe('useWorkoutScoring', () => {
  beforeEach(() => {
    vi.mocked(getAuthUser).mockReset();
    vi.mocked(getAuthUser).mockResolvedValue({ id: 'user-1' } as never);
    useCurrentWorkoutStore.getState().reset();
    useAppStore.setState({
      sessions: [],
      activeSession: null,
      preferences: {
        weightUnit: 'lbs',
        distanceUnit: 'mi',
        defaultRestSeconds: 90,
        darkMode: false,
        openaiApiKey: 'test-key',
      },
    });
  });

  it('stores score results outside the finishing modal lifecycle', async () => {
    const score = {
      score: 90,
      grade: 'A',
      summary: 'Strong workout',
      highlights: ['Completed every set'],
      improvements: [],
    };
    vi.mocked(getWorkoutScore).mockResolvedValue(score);
    const { result } = renderHook(() => useWorkoutScoring());

    await act(async () => {
      await result.current.scoreWorkout(session);
    });

    expect(useCurrentWorkoutStore.getState().scoreResult).toEqual(score);
    expect(result.current.scoreResult).toEqual(score);
  });

  it('discards a score that completes after the authenticated user changes', async () => {
    vi.mocked(getAuthUser)
      .mockResolvedValueOnce({ id: 'user-1' } as never)
      .mockResolvedValueOnce({ id: 'user-2' } as never);
    vi.mocked(getWorkoutScore).mockResolvedValue({
      score: 90,
      grade: 'A',
      summary: 'Strong workout',
      highlights: [],
      improvements: [],
    });
    const { result } = renderHook(() => useWorkoutScoring());

    await act(async () => {
      await result.current.scoreWorkout(session);
    });

    expect(useCurrentWorkoutStore.getState().scoreResult).toBeNull();
  });
});
