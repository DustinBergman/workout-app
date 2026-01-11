import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComments } from './useComments';

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'user-123',
      user_metadata: {
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
      },
    },
  })),
}));

// Mock the comments service
vi.mock('../services/supabase/comments', () => ({
  addComment: vi.fn(),
  deleteComment: vi.fn(),
  getWorkoutComments: vi.fn(),
}));

import {
  addComment,
  deleteComment,
  getWorkoutComments,
} from '../services/supabase/comments';

describe('useComments', () => {
  const mockComments = [
    {
      id: 'comment-1',
      workout_id: 'workout-123',
      user_id: 'user-1',
      content: 'Great workout!',
      created_at: '2024-01-01T00:00:00Z',
      user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd', avatar_url: null },
      like_count: 0,
      has_liked: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWorkoutComments).mockResolvedValue({
      comments: mockComments,
      error: null,
    });
  });

  it('should initialize with provided count', async () => {
    const { result } = renderHook(() => useComments('workout-123', 5));

    expect(result.current.commentCount).toBe(5);
  });

  it('should load comments on mount', async () => {
    const { result } = renderHook(() => useComments('workout-123'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    expect(getWorkoutComments).toHaveBeenCalledWith('workout-123');
    expect(result.current.commentCount).toBe(1);
  });

  it('should add a comment', async () => {
    vi.mocked(addComment).mockResolvedValue({ commentId: 'new-comment', error: null });

    const { result } = renderHook(() => useComments('workout-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.addComment('Nice work!');
    });

    expect(addComment).toHaveBeenCalledWith('workout-123', 'Nice work!');
    expect(result.current.comments).toHaveLength(2);
    expect(result.current.commentCount).toBe(2);
  });

  it('should delete a comment', async () => {
    vi.mocked(deleteComment).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useComments('workout-123'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteComment('comment-1');
    });

    expect(deleteComment).toHaveBeenCalledWith('comment-1');
    expect(result.current.comments).toHaveLength(0);
    expect(result.current.commentCount).toBe(0);
  });

  it('should revert deletion on error', async () => {
    vi.mocked(deleteComment).mockResolvedValue({ error: new Error('Delete failed') });

    const { result } = renderHook(() => useComments('workout-123'));

    await waitFor(() => {
      expect(result.current.comments).toHaveLength(1);
    });

    await act(async () => {
      await result.current.deleteComment('comment-1');
    });

    // Should revert to original state
    expect(result.current.comments).toHaveLength(1);
    expect(result.current.error).toBe('Delete failed');
  });

  it('should refresh comments', async () => {
    const { result } = renderHook(() => useComments('workout-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    vi.mocked(getWorkoutComments).mockResolvedValue({
      comments: [...mockComments, { ...mockComments[0], id: 'comment-2', like_count: 0, has_liked: false }],
      error: null,
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.comments).toHaveLength(2);
  });

  it('should handle loading error', async () => {
    vi.mocked(getWorkoutComments).mockResolvedValue({
      comments: [],
      error: new Error('Load failed'),
    });

    const { result } = renderHook(() => useComments('workout-123'));

    await waitFor(() => {
      expect(result.current.error).toBe('Load failed');
    });
  });

  it('should set isSubmitting while adding comment', async () => {
    let resolveAdd: (value: { commentId: string | null; error: Error | null }) => void;
    vi.mocked(addComment).mockImplementation(
      () => new Promise((resolve) => { resolveAdd = resolve; })
    );

    const { result } = renderHook(() => useComments('workout-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.addComment('Test');
    });

    expect(result.current.isSubmitting).toBe(true);

    await act(async () => {
      resolveAdd!({ commentId: 'new-comment', error: null });
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
