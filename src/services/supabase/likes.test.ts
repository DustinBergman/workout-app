import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  likeWorkout,
  unlikeWorkout,
  getWorkoutLikes,
  getLikeSummary,
  getBatchLikeSummaries,
} from './likes';

// Mock the supabase client
const mockRpc = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: mockDelete,
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => mockSelect()),
          eq: vi.fn(() => ({
            maybeSingle: mockMaybeSingle,
          })),
          limit: mockLimit,
        })),
        in: vi.fn(() => ({
          order: mockOrder,
        })),
      })),
    })),
  },
}));

import { supabase } from '../../lib/supabase';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('Likes Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
  });

  describe('likeWorkout', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await likeWorkout('workout-123');

      expect(result.likeId).toBeNull();
      expect(result.error?.message).toBe('Not authenticated');
    });

    it('should call RPC with correct parameters', async () => {
      mockRpc.mockResolvedValue({ data: 'like-123', error: null });

      const result = await likeWorkout('workout-123');

      expect(mockRpc).toHaveBeenCalledWith('like_workout', {
        p_workout_id: 'workout-123',
      });
      expect(result.likeId).toBe('like-123');
      expect(result.error).toBeNull();
    });

    it('should return error when RPC fails', async () => {
      const error = new Error('RPC failed');
      mockRpc.mockResolvedValue({ data: null, error });

      const result = await likeWorkout('workout-123');

      expect(result.likeId).toBeNull();
      expect(result.error).toBe(error);
    });
  });

  describe('unlikeWorkout', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await unlikeWorkout('workout-123');

      expect(result.error?.message).toBe('Not authenticated');
    });

    it('should call delete with correct parameters', async () => {
      mockDelete.mockResolvedValue({ error: null });

      const result = await unlikeWorkout('workout-123');

      expect(supabase.from).toHaveBeenCalledWith('workout_likes');
      expect(result.error).toBeNull();
    });
  });

  describe('getWorkoutLikes', () => {
    it('should return likes with user data', async () => {
      const mockLikes = [
        {
          id: 'like-1',
          workout_id: 'workout-123',
          user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd' },
        },
      ];
      mockSelect.mockResolvedValue({ data: mockLikes, error: null });

      const result = await getWorkoutLikes('workout-123');

      expect(result.likes).toHaveLength(1);
      expect(result.likes[0].user.first_name).toBe('John');
      expect(result.error).toBeNull();
    });

    it('should return empty array on error', async () => {
      const error = new Error('Query failed');
      mockSelect.mockResolvedValue({ data: null, error });

      const result = await getWorkoutLikes('workout-123');

      expect(result.likes).toEqual([]);
      expect(result.error).toBe(error);
    });
  });

  describe('getLikeSummary', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await getLikeSummary('workout-123');

      expect(result.summary).toBeNull();
      expect(result.error?.message).toBe('Not authenticated');
    });
  });

  describe('getBatchLikeSummaries', () => {
    it('should return empty object for empty workoutIds array', async () => {
      const result = await getBatchLikeSummaries([]);

      expect(result.summaries).toEqual({});
      expect(result.error).toBeNull();
    });

    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await getBatchLikeSummaries(['workout-123']);

      expect(result.summaries).toEqual({});
      expect(result.error?.message).toBe('Not authenticated');
    });
  });
});
