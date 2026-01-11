import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLikes } from './useLikes';

// Mock the likes service
vi.mock('../services/supabase/likes', () => ({
  likeWorkout: vi.fn(),
  unlikeWorkout: vi.fn(),
  getLikeSummary: vi.fn(),
}));

// Mock the auth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-123' },
    isAuthenticated: true,
  })),
}));

// Mock the email notifications service
vi.mock('../services/supabase/emailNotifications', () => ({
  sendEmailNotification: vi.fn(() => Promise.resolve()),
}));

import {
  likeWorkout,
  unlikeWorkout,
  getLikeSummary,
} from '../services/supabase/likes';

describe('useLikes', () => {
  const mockSummary = {
    count: 5,
    hasLiked: false,
    recentLikers: [
      { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with provided summary', () => {
    const { result } = renderHook(() => useLikes('workout-123', mockSummary));

    expect(result.current.likeSummary).toEqual(mockSummary);
    expect(result.current.isLiking).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should initialize with null when no summary provided', () => {
    const { result } = renderHook(() => useLikes('workout-123'));

    expect(result.current.likeSummary).toBeNull();
  });

  it('should refresh like summary', async () => {
    vi.mocked(getLikeSummary).mockResolvedValue({
      summary: { ...mockSummary, count: 10 },
      error: null,
    });

    const { result } = renderHook(() => useLikes('workout-123', mockSummary));

    await act(async () => {
      await result.current.refresh();
    });

    expect(getLikeSummary).toHaveBeenCalledWith('workout-123');
    expect(result.current.likeSummary?.count).toBe(10);
  });

  it('should set error on refresh failure', async () => {
    vi.mocked(getLikeSummary).mockResolvedValue({
      summary: null,
      error: new Error('Failed to fetch'),
    });

    const { result } = renderHook(() => useLikes('workout-123', mockSummary));

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBe('Failed to fetch');
  });

  it('should toggle like (like)', async () => {
    vi.mocked(likeWorkout).mockResolvedValue({ likeId: 'like-123', error: null });

    const { result } = renderHook(() => useLikes('workout-123', mockSummary));

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(likeWorkout).toHaveBeenCalledWith('workout-123');
    // Optimistic update should have happened
    expect(result.current.likeSummary?.hasLiked).toBe(true);
    expect(result.current.likeSummary?.count).toBe(6);
  });

  it('should toggle like (unlike)', async () => {
    vi.mocked(unlikeWorkout).mockResolvedValue({ error: null });

    const likedSummary = { ...mockSummary, hasLiked: true };
    const { result } = renderHook(() => useLikes('workout-123', likedSummary));

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(unlikeWorkout).toHaveBeenCalledWith('workout-123');
    expect(result.current.likeSummary?.hasLiked).toBe(false);
    expect(result.current.likeSummary?.count).toBe(4);
  });

  it('should revert optimistic update on error', async () => {
    vi.mocked(likeWorkout).mockResolvedValue({
      likeId: null,
      error: new Error('Failed to like'),
    });

    const { result } = renderHook(() => useLikes('workout-123', mockSummary));

    await act(async () => {
      await result.current.toggleLike();
    });

    // Should revert to original state
    expect(result.current.likeSummary?.hasLiked).toBe(false);
    expect(result.current.likeSummary?.count).toBe(5);
    expect(result.current.error).toBe('Failed to like');
  });

  it('should not toggle when already liking', async () => {
    vi.mocked(likeWorkout).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ likeId: 'like-123', error: null }), 100))
    );

    const { result } = renderHook(() => useLikes('workout-123', mockSummary));

    // Start first toggle
    act(() => {
      result.current.toggleLike();
    });

    // Try second toggle immediately
    await act(async () => {
      await result.current.toggleLike();
    });

    // Should only have been called once
    expect(likeWorkout).toHaveBeenCalledTimes(1);
  });

  it('should not toggle when likeSummary is null', async () => {
    const { result } = renderHook(() => useLikes('workout-123'));

    await act(async () => {
      await result.current.toggleLike();
    });

    expect(likeWorkout).not.toHaveBeenCalled();
    expect(unlikeWorkout).not.toHaveBeenCalled();
  });
});
