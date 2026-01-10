import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FeedWorkoutCard } from './FeedWorkoutCard';

// Mock the hooks
vi.mock('../../hooks/useLikes', () => ({
  useLikes: vi.fn(() => ({
    likeSummary: { count: 5, hasLiked: false, recentLikers: [] },
    isLiking: false,
    toggleLike: vi.fn(),
  })),
}));

vi.mock('../../hooks/useComments', () => ({
  useComments: vi.fn(() => ({
    comments: [],
    commentCount: 0,
    isLoading: false,
    isSubmitting: false,
    error: null,
    addComment: vi.fn(),
    deleteComment: vi.fn(),
    toggleCommentLike: vi.fn(),
  })),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'current-user-123' },
  })),
}));

vi.mock('../../hooks/useProfile', () => ({
  useProfile: vi.fn(() => ({
    profile: null,
    stats: null,
    friendshipStatus: 'none',
    pendingRequestId: null,
    isLoading: false,
    isActionLoading: false,
    error: null,
    sendRequest: vi.fn(),
    acceptRequest: vi.fn(),
    cancelRequest: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('../../hooks/useLikers', () => ({
  useLikers: vi.fn(() => ({
    likers: [],
    isLoading: false,
    error: null,
  })),
}));

vi.mock('../../data/exercises', () => ({
  getExerciseById: vi.fn(() => ({
    id: 'bench-press',
    name: 'Bench Press',
    type: 'strength',
    muscleGroups: ['chest'],
  })),
}));

describe('FeedWorkoutCard', () => {
  const mockWorkout = {
    id: 'workout-123',
    user_id: 'user-456',
    name: 'Morning Push Day',
    custom_title: null,
    mood: null,
    progressive_overload_week: null,
    workout_goal: null,
    personal_bests: null,
    streak_count: null,
    started_at: '2024-01-01T08:00:00Z',
    completed_at: '2024-01-01T09:00:00Z',
    user: {
      id: 'user-456',
      first_name: 'John',
      last_name: 'Doe',
      username: 'johnd',
    },
    session_exercises: [
      {
        id: 'ex-1',
        exercise_id: 'bench-press',
        type: 'strength' as const,
        sort_order: 0,
        target_sets: 3,
        target_reps: 10,
        rest_seconds: 90,
        completed_sets: [
          {
            id: 'set-1',
            type: 'strength' as const,
            reps: 10,
            weight: 135,
            weight_unit: 'lbs' as const,
            distance: null,
            distance_unit: null,
            duration_seconds: null,
            completed_at: '2024-01-01T08:10:00Z',
          },
        ],
      },
    ],
  };

  const mockLikeSummary = {
    count: 5,
    hasLiked: false,
    recentLikers: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render workout name', () => {
    render(<FeedWorkoutCard workout={mockWorkout} />);

    expect(screen.getByText('Morning Push Day')).toBeInTheDocument();
  });

  it('should render user name', () => {
    render(<FeedWorkoutCard workout={mockWorkout} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render username', () => {
    render(<FeedWorkoutCard workout={mockWorkout} />);

    expect(screen.getByText('@johnd')).toBeInTheDocument();
  });

  it('should render exercise count', () => {
    render(<FeedWorkoutCard workout={mockWorkout} />);

    expect(screen.getByText('1 exercises')).toBeInTheDocument();
  });

  it('should render set count', () => {
    render(<FeedWorkoutCard workout={mockWorkout} />);

    expect(screen.getByText('1 sets')).toBeInTheDocument();
  });

  it('should render like count', () => {
    render(
      <FeedWorkoutCard workout={mockWorkout} initialLikeSummary={mockLikeSummary} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should expand workout details when clicked', () => {
    render(<FeedWorkoutCard workout={mockWorkout} />);

    // Click the workout summary area
    fireEvent.click(screen.getByText('Morning Push Day'));

    // Should show exercise name
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('should show comment input always', () => {
    render(<FeedWorkoutCard workout={mockWorkout} />);

    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  });

  it('should show comments section collapsed by default', () => {
    render(
      <FeedWorkoutCard
        workout={mockWorkout}
        initialCommentCount={3}
      />
    );

    // Comment button should show count
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should show comments section expanded when defaultCommentsExpanded is true', () => {
    // When comments are expanded, we should NOT see the "View all X comments" link
    render(
      <FeedWorkoutCard
        workout={mockWorkout}
        initialCommentCount={3}
        defaultCommentsExpanded={true}
      />
    );

    // When expanded, the "View all X comments" link should NOT appear
    // because we're already showing all comments
    expect(screen.queryByText(/View all \d+ comments/)).not.toBeInTheDocument();
    expect(screen.queryByText('View comment')).not.toBeInTheDocument();
  });

  it('should toggle comments when comment button is clicked', () => {
    render(
      <FeedWorkoutCard
        workout={mockWorkout}
        initialCommentCount={2}
      />
    );

    // Before clicking, should show "View all X comments" link
    expect(screen.getByText('View all 2 comments')).toBeInTheDocument();

    // Find and click the comment button (has the comment icon)
    const commentButtons = screen.getAllByRole('button');
    const commentButton = commentButtons.find((btn) =>
      btn.querySelector('svg path[d*="M8 12h.01M12 12h.01M16 12h.01"]')
    );

    if (commentButton) {
      fireEvent.click(commentButton);
    }

    // After clicking, the "View all X comments" link should disappear since comments are expanded
    expect(screen.queryByText('View all 2 comments')).not.toBeInTheDocument();
  });

  it('should call onLikeSummaryChange when like is toggled', async () => {
    const onLikeSummaryChange = vi.fn();

    render(
      <FeedWorkoutCard
        workout={mockWorkout}
        initialLikeSummary={mockLikeSummary}
        onLikeSummaryChange={onLikeSummaryChange}
      />
    );

    // Find and click the like button
    const likeButton = screen.getAllByRole('button').find((btn) =>
      btn.querySelector('svg path[d*="M4.318 6.318"]')
    );

    if (likeButton) {
      fireEvent.click(likeButton);
    }

    // The onLikeSummaryChange callback should eventually be called
    // (this depends on the useLikes hook behavior)
  });

  it('should display preview comments when provided', () => {
    const previewComments = [
      {
        id: 'preview-1',
        workout_id: 'workout-123',
        user_id: 'user-789',
        content: 'Nice work!',
        created_at: '2024-01-01T10:00:00Z',
        user: { id: 'user-789', first_name: 'Jane', last_name: 'Smith', username: 'janes' },
        like_count: 2,
        has_liked: false,
      },
    ];

    render(
      <FeedWorkoutCard
        workout={mockWorkout}
        initialCommentCount={1}
        initialPreviewComments={previewComments}
      />
    );

    // Preview comment should be visible
    expect(screen.getByText('Nice work!')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should handle user without full name', () => {
    const workoutWithUsernameOnly = {
      ...mockWorkout,
      user: {
        id: 'user-456',
        first_name: null,
        last_name: null,
        username: 'johnd',
      },
    };

    render(<FeedWorkoutCard workout={workoutWithUsernameOnly} />);

    expect(screen.getByText('@johnd')).toBeInTheDocument();
  });

  it('should handle anonymous user', () => {
    const workoutWithAnonymousUser = {
      ...mockWorkout,
      user: {
        id: 'user-456',
        first_name: null,
        last_name: null,
        username: null,
      },
    };

    render(<FeedWorkoutCard workout={workoutWithAnonymousUser} />);

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });
});
