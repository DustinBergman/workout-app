import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Feed } from './Feed';

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

// Mock the useFeed hook
vi.mock('../hooks/useFeed', () => ({
  useFeed: vi.fn(),
}));

// Mock FeedWorkoutCard to avoid needing all its dependencies
vi.mock('../components/social/FeedWorkoutCard', () => ({
  FeedWorkoutCard: ({ workout }: { workout: { name: string } }) => (
    <div data-testid="workout-card">{workout.name}</div>
  ),
}));

import { useFeed } from '../hooks/useFeed';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Feed', () => {
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
      user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd' },
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
      user: { id: 'user-2', first_name: 'Jane', last_name: 'Smith', username: 'janes' },
      session_exercises: [],
    },
  ];

  const mockRefresh = vi.fn();
  const mockLoadMore = vi.fn();
  const mockUpdateLikeSummary = vi.fn();
  const mockUpdateCommentCount = vi.fn();
  const mockUpdatePreviewComments = vi.fn();
  const mockRemoveWorkout = vi.fn();

  const defaultHookReturn = {
    workouts: mockWorkouts,
    likeSummaries: {},
    commentCounts: {},
    previewComments: {},
    isLoading: false,
    isLoadingMore: false,
    isRefreshing: false,
    error: null,
    hasMore: true,
    loadMore: mockLoadMore,
    refresh: mockRefresh,
    updateLikeSummary: mockUpdateLikeSummary,
    updateCommentCount: mockUpdateCommentCount,
    updatePreviewComments: mockUpdatePreviewComments,
    removeWorkout: mockRemoveWorkout,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useFeed).mockReturnValue(defaultHookReturn);
  });

  it('should render loading state', () => {
    vi.mocked(useFeed).mockReturnValue({
      ...defaultHookReturn,
      workouts: [],
      isLoading: true,
    });

    renderWithRouter(<Feed />);

    expect(screen.getByText('Loading feed...')).toBeInTheDocument();
  });

  it('should render feed title', () => {
    renderWithRouter(<Feed />);

    expect(screen.getByText('Activity Feed')).toBeInTheDocument();
  });

  it('should render workouts', () => {
    renderWithRouter(<Feed />);

    expect(screen.getByText('Morning Workout')).toBeInTheDocument();
    expect(screen.getByText('Evening Workout')).toBeInTheDocument();
  });

  it('should show empty state when no workouts', () => {
    vi.mocked(useFeed).mockReturnValue({
      ...defaultHookReturn,
      workouts: [],
    });

    renderWithRouter(<Feed />);

    expect(screen.getByText('No workouts yet')).toBeInTheDocument();
    expect(screen.getByText("When your friends complete workouts, they'll appear here")).toBeInTheDocument();
    expect(screen.getByText('Find Friends')).toBeInTheDocument();
  });

  it('should show error message', () => {
    vi.mocked(useFeed).mockReturnValue({
      ...defaultHookReturn,
      error: 'Failed to load feed',
    });

    renderWithRouter(<Feed />);

    expect(screen.getByText('Failed to load feed')).toBeInTheDocument();
  });

  it('should not have refresh button (removed)', () => {
    renderWithRouter(<Feed />);

    // The refresh button should no longer exist
    const refreshButton = screen.queryByLabelText('Refresh');
    expect(refreshButton).not.toBeInTheDocument();
  });

  it('should show refreshing state', () => {
    vi.mocked(useFeed).mockReturnValue({
      ...defaultHookReturn,
      isRefreshing: true,
    });

    renderWithRouter(<Feed />);

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('should show "all caught up" message when no more workouts', () => {
    vi.mocked(useFeed).mockReturnValue({
      ...defaultHookReturn,
      hasMore: false,
    });

    renderWithRouter(<Feed />);

    expect(screen.getByText("You've seen all recent workouts")).toBeInTheDocument();
  });

  it('should show loading more indicator', () => {
    vi.mocked(useFeed).mockReturnValue({
      ...defaultHookReturn,
      isLoadingMore: true,
    });

    renderWithRouter(<Feed />);

    // Should have a spinner for loading more
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  describe('Pull to refresh', () => {
    it('should show pull indicator when pulling down', () => {
      renderWithRouter(<Feed />);

      const container = document.querySelector('.overflow-y-auto');
      expect(container).toBeInTheDocument();

      // Simulate touch start at the top
      fireEvent.touchStart(container!, {
        touches: [{ clientY: 100 }],
      });

      // Simulate pulling down
      fireEvent.touchMove(container!, {
        touches: [{ clientY: 200 }],
      });

      // Should show pull indicator text
      expect(screen.getByText('Pull to refresh')).toBeInTheDocument();
    });

    it('should show "Release to refresh" when pulled past threshold', () => {
      renderWithRouter(<Feed />);

      const container = document.querySelector('.overflow-y-auto');

      // Simulate touch start
      fireEvent.touchStart(container!, {
        touches: [{ clientY: 0 }],
      });

      // Simulate pulling down past threshold (80px * 2 for resistance)
      fireEvent.touchMove(container!, {
        touches: [{ clientY: 200 }],
      });

      expect(screen.getByText('Release to refresh')).toBeInTheDocument();
    });

    it('should call refresh when released after pulling past threshold', async () => {
      renderWithRouter(<Feed />);

      const container = document.querySelector('.overflow-y-auto');

      // Simulate touch start
      fireEvent.touchStart(container!, {
        touches: [{ clientY: 0 }],
      });

      // Simulate pulling down past threshold
      fireEvent.touchMove(container!, {
        touches: [{ clientY: 200 }],
      });

      // Release
      fireEvent.touchEnd(container!);

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      });
    });

    it('should not call refresh when released before threshold', async () => {
      renderWithRouter(<Feed />);

      const container = document.querySelector('.overflow-y-auto');

      // Simulate touch start
      fireEvent.touchStart(container!, {
        touches: [{ clientY: 100 }],
      });

      // Simulate pulling down but not past threshold
      fireEvent.touchMove(container!, {
        touches: [{ clientY: 130 }],
      });

      // Release
      fireEvent.touchEnd(container!);

      // Small delay to ensure async operations complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  it('should render Find Friends link in empty state', () => {
    vi.mocked(useFeed).mockReturnValue({
      ...defaultHookReturn,
      workouts: [],
    });

    renderWithRouter(<Feed />);

    const findFriendsLink = screen.getByRole('link', { name: /find friends/i });
    expect(findFriendsLink).toHaveAttribute('href', '/friends');
  });
});
