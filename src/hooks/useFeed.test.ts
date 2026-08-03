import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock the services before importing useFeed
vi.mock('../services/supabase/feed', () => ({
  getFriendWorkouts: vi.fn(),
}));

vi.mock('../services/supabase/likes', () => ({
  getBatchLikeSummaries: vi.fn(),
}));

vi.mock('../services/supabase/comments', () => ({
  getBatchCommentCounts: vi.fn(),
  getBatchPreviewComments: vi.fn(),
}));

vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

import { getFriendWorkouts } from '../services/supabase/feed';
import { getBatchLikeSummaries } from '../services/supabase/likes';
import { getBatchCommentCounts, getBatchPreviewComments } from '../services/supabase/comments';
import { useAuth } from './useAuth';
import { useFeed, clearFeedCache } from './useFeed';

describe('useFeed', () => {
  const mockWorkouts = [
    {
      id: 'workout-1',
      user_id: 'user-1',
      name: 'Morning Workout',
      custom_title: null,
      mood: null,
      progressive_overload_week: null,
      workout_goal: null,
      personal_bests: null,
      streak_count: null,
      started_at: '2024-01-01T08:00:00Z',
      completed_at: '2024-01-01T09:00:00Z',
      user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd', avatar_url: null },
      session_exercises: [],
    },
    {
      id: 'workout-2',
      user_id: 'user-2',
      name: 'Evening Workout',
      custom_title: null,
      mood: null,
      progressive_overload_week: null,
      workout_goal: null,
      personal_bests: null,
      streak_count: null,
      started_at: '2024-01-01T18:00:00Z',
      completed_at: '2024-01-01T19:00:00Z',
      user: { id: 'user-2', first_name: 'Jane', last_name: 'Smith', username: 'janes', avatar_url: null },
      session_exercises: [],
    },
  ];

  const mockLikeSummaries = {
    'workout-1': { count: 5, hasLiked: true, recentLikers: [] },
    'workout-2': { count: 3, hasLiked: false, recentLikers: [] },
  };

  const mockCommentCounts = {
    'workout-1': 2,
    'workout-2': 1,
  };

  const mockPreviewComments = {
    'workout-1': [
      {
        id: 'comment-1',
        workout_id: 'workout-1',
        user_id: 'user-2',
        content: 'Great workout!',
        created_at: '2024-01-01T10:00:00Z',
        user: { id: 'user-2', first_name: 'Jane', last_name: 'Smith', username: 'janes', avatar_url: null },
        like_count: 0,
        has_liked: false,
      },
    ],
    'workout-2': [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearFeedCache();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'viewer-1' },
    } as never);

    vi.mocked(getFriendWorkouts).mockResolvedValue({
      workouts: mockWorkouts,
      error: null,
    });

    vi.mocked(getBatchLikeSummaries).mockResolvedValue({
      summaries: mockLikeSummaries,
      error: null,
    });

    vi.mocked(getBatchCommentCounts).mockResolvedValue({
      counts: mockCommentCounts,
      error: null,
    });

    vi.mocked(getBatchPreviewComments).mockResolvedValue({
      previews: mockPreviewComments,
      error: null,
    });
  });

  it('should load workouts on mount', async () => {
    const { result } = renderHook(() => useFeed());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.workouts).toHaveLength(2);
    expect(result.current.workouts[0].name).toBe('Morning Workout');
    expect(getFriendWorkouts).toHaveBeenCalledWith(20, 0);
  });

  it('should load engagement data (likes, comments) with workouts', async () => {
    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.likeSummaries['workout-1']).toEqual(mockLikeSummaries['workout-1']);
    expect(result.current.commentCounts['workout-1']).toBe(2);
    expect(result.current.previewComments['workout-1']).toHaveLength(1);
  });

  it('should use cached data on subsequent renders', async () => {
    // First render - loads data
    const { result: result1, unmount } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
    });

    expect(getFriendWorkouts).toHaveBeenCalledTimes(1);
    unmount();

    // Second render - should use cache
    const { result: result2 } = renderHook(() => useFeed());

    // Should not be loading since cache is valid
    expect(result2.current.isLoading).toBe(false);
    expect(result2.current.workouts).toHaveLength(2);

    // Should not have called the API again
    expect(getFriendWorkouts).toHaveBeenCalledTimes(1);
  });

  it('should force refresh when refresh(true) is called', async () => {
    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(getFriendWorkouts).toHaveBeenCalledTimes(1);

    // Force refresh
    await act(async () => {
      await result.current.refresh(true);
    });

    expect(getFriendWorkouts).toHaveBeenCalledTimes(2);
  });

  it('should set isRefreshing when refreshing with existing data', async () => {
    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Start refresh
    let refreshPromise: Promise<void>;
    act(() => {
      refreshPromise = result.current.refresh(true);
    });

    // Should be refreshing, not loading
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      await refreshPromise;
    });

    expect(result.current.isRefreshing).toBe(false);
  });

  it('should load more workouts when loadMore is called', async () => {
    // Override mock to return 20 workouts so hasMore is true
    const initialWorkouts = Array.from({ length: 20 }, (_, i) => ({
      id: `workout-${i}`,
      user_id: 'user-1',
      name: `Workout ${i}`,
      custom_title: null,
      mood: null,
      progressive_overload_week: null,
      workout_goal: null,
      personal_bests: null,
      streak_count: null,
      started_at: '2024-01-01T08:00:00Z',
      completed_at: '2024-01-01T09:00:00Z',
      user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd', avatar_url: null },
      session_exercises: [],
    }));

    const moreWorkouts = [
      {
        id: 'workout-20',
        user_id: 'user-1',
        name: 'Third Workout',
        custom_title: null,
        mood: null,
        progressive_overload_week: null,
        workout_goal: null,
        personal_bests: null,
        streak_count: null,
        started_at: '2024-01-02T08:00:00Z',
        completed_at: '2024-01-02T09:00:00Z',
        user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd', avatar_url: null },
        session_exercises: [],
      },
    ];

    vi.mocked(getFriendWorkouts)
      .mockResolvedValueOnce({ workouts: initialWorkouts, error: null })
      .mockResolvedValueOnce({ workouts: moreWorkouts, error: null });

    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(true);
    expect(result.current.workouts).toHaveLength(20);

    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.workouts).toHaveLength(21);
    expect(result.current.workouts[20].name).toBe('Third Workout');
  });

  it('should coalesce concurrent loadMore calls and deduplicate workout IDs', async () => {
    const initialWorkouts = Array.from({ length: 20 }, (_, i) => ({
      ...mockWorkouts[0],
      id: `workout-${i}`,
    }));
    let resolvePage: ((value: { workouts: typeof mockWorkouts; error: null }) => void) | undefined;
    vi.mocked(getFriendWorkouts)
      .mockResolvedValueOnce({ workouts: initialWorkouts, error: null })
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolvePage = resolve as typeof resolvePage;
      }));

    const { result } = renderHook(() => useFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let first: Promise<void>;
    let second: Promise<void>;
    act(() => {
      first = result.current.loadMore();
      second = result.current.loadMore();
    });
    expect(getFriendWorkouts).toHaveBeenCalledTimes(2);

    resolvePage?.({
      workouts: [
        initialWorkouts[19],
        { ...mockWorkouts[0], id: 'workout-20' },
      ],
      error: null,
    });
    await act(async () => {
      await Promise.all([first, second]);
    });

    expect(result.current.workouts).toHaveLength(21);
    expect(new Set(result.current.workouts.map((workout) => workout.id)).size).toBe(21);
  });

  it('does not expose cached workouts after the authenticated user changes', async () => {
    const { result, unmount } = renderHook(() => useFeed());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.workouts).toHaveLength(2);
    unmount();

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'viewer-2' },
    } as never);
    vi.mocked(getFriendWorkouts).mockResolvedValueOnce({ workouts: [], error: null });

    const secondRender = renderHook(() => useFeed());
    expect(secondRender.result.current.workouts).toEqual([]);
    await waitFor(() => expect(secondRender.result.current.isLoading).toBe(false));
    expect(getFriendWorkouts).toHaveBeenLastCalledWith(20, 0);
  });

  it('does not recreate an invalidated cache after engagement loading finishes', async () => {
    let resolveLikes: ((value: {
      summaries: typeof mockLikeSummaries;
      error: null;
    }) => void) | undefined;
    vi.mocked(getBatchLikeSummaries).mockImplementationOnce(
      () => new Promise((resolve) => {
        resolveLikes = resolve;
      })
    );

    const firstRender = renderHook(() => useFeed());
    await waitFor(() => expect(firstRender.result.current.workouts).toHaveLength(2));
    clearFeedCache();
    resolveLikes?.({ summaries: mockLikeSummaries, error: null });
    await waitFor(() => expect(firstRender.result.current.isLoading).toBe(false));
    firstRender.unmount();

    renderHook(() => useFeed());

    await waitFor(() => expect(getFriendWorkouts).toHaveBeenCalledTimes(2));
  });

  it('should handle errors gracefully', async () => {
    // Clear and reset the mock to return an error
    vi.mocked(getFriendWorkouts).mockReset();
    vi.mocked(getFriendWorkouts).mockResolvedValue({
      workouts: [],
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.workouts).toHaveLength(0);
  });

  it('should update like summary optimistically', async () => {
    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newSummary = { count: 6, hasLiked: false, recentLikers: [] };

    act(() => {
      result.current.updateLikeSummary('workout-1', newSummary);
    });

    expect(result.current.likeSummaries['workout-1']).toEqual(newSummary);
  });

  it('should update comment count optimistically', async () => {
    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.updateCommentCount('workout-1', 5);
    });

    expect(result.current.commentCounts['workout-1']).toBe(5);
  });

  it('should update preview comments optimistically', async () => {
    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const newComments = [
      {
        id: 'comment-new',
        workout_id: 'workout-1',
        user_id: 'user-3',
        content: 'New comment!',
        created_at: '2024-01-01T12:00:00Z',
        user: { id: 'user-3', first_name: 'Bob', last_name: 'Wilson', username: 'bobw', avatar_url: null },
        like_count: 0,
        has_liked: false,
      },
    ];

    act(() => {
      result.current.updatePreviewComments('workout-1', newComments);
    });

    expect(result.current.previewComments['workout-1']).toEqual(newComments);
  });

  it('should set hasMore to false when fewer than PAGE_SIZE workouts returned', async () => {
    // Return fewer than 20 workouts
    vi.mocked(getFriendWorkouts).mockResolvedValueOnce({
      workouts: mockWorkouts, // Only 2 workouts
      error: null,
    });

    const { result } = renderHook(() => useFeed());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);
  });
});
