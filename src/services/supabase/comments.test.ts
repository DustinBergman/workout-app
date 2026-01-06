import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  addComment,
  deleteComment,
  getWorkoutComments,
  getCommentCount,
  getBatchCommentCounts,
} from './comments';

// Mock the supabase client
const mockRpc = vi.fn();
const mockDelete = vi.fn();
const mockSelect = vi.fn();

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
        })),
        in: vi.fn(() => mockSelect()),
      })),
    })),
  },
}));

import { supabase } from '../../lib/supabase';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
};

describe('Comments Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as never },
      error: null,
    });
  });

  describe('addComment', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await addComment('workout-123', 'Great workout!');

      expect(result.commentId).toBeNull();
      expect(result.error?.message).toBe('Not authenticated');
    });

    it('should return error for empty content', async () => {
      const result = await addComment('workout-123', '   ');

      expect(result.commentId).toBeNull();
      expect(result.error?.message).toBe('Comment must be between 1 and 500 characters');
    });

    it('should return error for content over 500 characters', async () => {
      const longContent = 'a'.repeat(501);
      const result = await addComment('workout-123', longContent);

      expect(result.commentId).toBeNull();
      expect(result.error?.message).toBe('Comment must be between 1 and 500 characters');
    });

    it('should call RPC with correct parameters', async () => {
      mockRpc.mockResolvedValue({ data: 'comment-123', error: null });

      const result = await addComment('workout-123', 'Great workout!');

      expect(mockRpc).toHaveBeenCalledWith('add_workout_comment', {
        p_workout_id: 'workout-123',
        p_content: 'Great workout!',
      });
      expect(result.commentId).toBe('comment-123');
      expect(result.error).toBeNull();
    });

    it('should trim content before sending', async () => {
      mockRpc.mockResolvedValue({ data: 'comment-123', error: null });

      await addComment('workout-123', '  Great workout!  ');

      expect(mockRpc).toHaveBeenCalledWith('add_workout_comment', {
        p_workout_id: 'workout-123',
        p_content: 'Great workout!',
      });
    });

    it('should return error when RPC fails', async () => {
      const error = new Error('RPC failed');
      mockRpc.mockResolvedValue({ data: null, error });

      const result = await addComment('workout-123', 'Great workout!');

      expect(result.commentId).toBeNull();
      expect(result.error).toBe(error);
    });
  });

  describe('deleteComment', () => {
    it('should return error when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await deleteComment('comment-123');

      expect(result.error?.message).toBe('Not authenticated');
    });

    it('should call delete with correct parameters', async () => {
      mockDelete.mockResolvedValue({ error: null });

      const result = await deleteComment('comment-123');

      expect(supabase.from).toHaveBeenCalledWith('workout_comments');
      expect(result.error).toBeNull();
    });
  });

  describe('getWorkoutComments', () => {
    it('should return comments with user data', async () => {
      const mockComments = [
        {
          id: 'comment-1',
          workout_id: 'workout-123',
          user_id: 'user-1',
          content: 'Great workout!',
          created_at: '2024-01-01T00:00:00Z',
          user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd' },
        },
      ];
      mockSelect.mockResolvedValue({ data: mockComments, error: null });

      const result = await getWorkoutComments('workout-123');

      expect(result.comments).toHaveLength(1);
      expect(result.comments[0].content).toBe('Great workout!');
      expect(result.comments[0].user.first_name).toBe('John');
      expect(result.error).toBeNull();
    });

    it('should return empty array on error', async () => {
      const error = new Error('Query failed');
      mockSelect.mockResolvedValue({ data: null, error });

      const result = await getWorkoutComments('workout-123');

      expect(result.comments).toEqual([]);
      expect(result.error).toBe(error);
    });
  });

  describe('getCommentCount', () => {
    it('should return count', async () => {
      mockSelect.mockResolvedValue({ count: 5, error: null });

      // Need to mock the select chain differently for count
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      } as never);

      const result = await getCommentCount('workout-123');

      expect(result.count).toBe(5);
      expect(result.error).toBeNull();
    });
  });

  describe('getBatchCommentCounts', () => {
    it('should return empty object for empty workoutIds array', async () => {
      const result = await getBatchCommentCounts([]);

      expect(result.counts).toEqual({});
      expect(result.error).toBeNull();
    });

    it('should count comments per workout', async () => {
      const mockData = [
        { workout_id: 'workout-1' },
        { workout_id: 'workout-1' },
        { workout_id: 'workout-2' },
      ];

      // Re-setup the mock with `.in()` method since previous test overwrote it
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      } as never);

      const result = await getBatchCommentCounts(['workout-1', 'workout-2', 'workout-3']);

      expect(result.counts['workout-1']).toBe(2);
      expect(result.counts['workout-2']).toBe(1);
      expect(result.counts['workout-3']).toBe(0);
      expect(result.error).toBeNull();
    });
  });
});
