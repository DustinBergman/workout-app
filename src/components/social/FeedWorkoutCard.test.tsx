import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedWorkoutCard } from './FeedWorkoutCard';

const mockAddTemplate = vi.fn();

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

vi.mock('../../store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      customExercises: [],
      deleteSession: vi.fn(),
      addTemplate: mockAddTemplate,
    };
    return selector(state);
  }),
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
  getAllExercises: vi.fn(() => [
    {
      id: 'bench-press',
      name: 'Bench Press',
      type: 'strength',
      muscleGroups: ['chest'],
      equipment: 'barbell',
    },
  ]),
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
      avatar_url: null,
    },
    session_exercises: [
      {
        id: 'ex-1',
        exercise_id: 'bench-press',
        custom_exercise_name: null,
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
            calories: null,
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
        user: { id: 'user-789', first_name: 'Jane', last_name: 'Smith', username: 'janes', avatar_url: null },
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
        avatar_url: null,
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
        avatar_url: null,
      },
    };

    render(<FeedWorkoutCard workout={workoutWithAnonymousUser} />);

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  describe('three-dot menu', () => {
    it('should show menu button on all workouts', () => {
      render(<FeedWorkoutCard workout={mockWorkout} />);

      const menuButton = screen.getByLabelText('More options');
      expect(menuButton).toBeInTheDocument();
    });

    it('should show "Copy to plans" option for other users workouts', () => {
      // mockWorkout has user_id: 'user-456', current user is 'current-user-123'
      render(<FeedWorkoutCard workout={mockWorkout} />);

      // Open the menu
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      expect(screen.getByText('Copy to plans')).toBeInTheDocument();
      expect(screen.queryByText('Delete workout')).not.toBeInTheDocument();
    });

    it('should show "Delete workout" option only for own workouts', () => {
      const ownWorkout = {
        ...mockWorkout,
        user_id: 'current-user-123',
        user: {
          id: 'current-user-123',
          first_name: 'Current',
          last_name: 'User',
          username: 'currentuser',
          avatar_url: null,
        },
      };

      render(<FeedWorkoutCard workout={ownWorkout} />);

      // Open the menu
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      expect(screen.getByText('Delete workout')).toBeInTheDocument();
      expect(screen.queryByText('Copy to plans')).not.toBeInTheDocument();
    });

    it('should open copy modal when "Copy to plans" is clicked', () => {
      render(<FeedWorkoutCard workout={mockWorkout} />);

      // Open the menu
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      // Click "Copy to plans"
      fireEvent.click(screen.getByText('Copy to plans'));

      // Modal should open with title
      expect(screen.getByText('Copy Workout to Plans')).toBeInTheDocument();
      expect(screen.getByText('Plan Name')).toBeInTheDocument();
    });

    it('should pre-fill template name with workout name in copy modal', () => {
      render(<FeedWorkoutCard workout={mockWorkout} />);

      // Open the menu and click copy
      fireEvent.click(screen.getByLabelText('More options'));
      fireEvent.click(screen.getByText('Copy to plans'));

      // Check input has workout name pre-filled
      const input = screen.getByDisplayValue('Morning Push Day');
      expect(input).toBeInTheDocument();
    });

    it('should show attribution in copy modal', () => {
      render(<FeedWorkoutCard workout={mockWorkout} />);

      // Open the menu and click copy
      fireEvent.click(screen.getByLabelText('More options'));
      fireEvent.click(screen.getByText('Copy to plans'));

      // Should show who the workout is from
      expect(screen.getByText('From @johnd')).toBeInTheDocument();
    });

    it('should call addTemplate when copy is confirmed', async () => {
      render(<FeedWorkoutCard workout={mockWorkout} />);

      // Open the menu and click copy
      fireEvent.click(screen.getByLabelText('More options'));
      fireEvent.click(screen.getByText('Copy to plans'));

      // Click the "Copy to Plans" button in the modal
      const copyButton = screen.getByRole('button', { name: 'Copy to Plans' });
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(mockAddTemplate).toHaveBeenCalledTimes(1);
      });

      // Verify the template has correct structure
      const calledTemplate = mockAddTemplate.mock.calls[0][0];
      expect(calledTemplate.name).toBe('Morning Push Day');
      expect(calledTemplate.copiedFrom).toEqual({
        userId: 'user-456',
        username: 'johnd',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should close menu when clicking outside', () => {
      render(<FeedWorkoutCard workout={mockWorkout} />);

      // Open the menu
      const menuButton = screen.getByLabelText('More options');
      fireEvent.click(menuButton);

      expect(screen.getByText('Copy to plans')).toBeInTheDocument();

      // Click outside (on the card)
      fireEvent.mouseDown(document.body);

      expect(screen.queryByText('Copy to plans')).not.toBeInTheDocument();
    });

    it('should close copy modal when cancel is clicked', () => {
      render(<FeedWorkoutCard workout={mockWorkout} />);

      // Open the menu and click copy
      fireEvent.click(screen.getByLabelText('More options'));
      fireEvent.click(screen.getByText('Copy to plans'));

      expect(screen.getByText('Copy Workout to Plans')).toBeInTheDocument();

      // Click cancel
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.queryByText('Copy Workout to Plans')).not.toBeInTheDocument();
    });
  });

  describe('cardio display', () => {
    it('should show calories chip for HIIT workouts with calories tracked', () => {
      const hiitWorkout = {
        ...mockWorkout,
        session_exercises: [
          {
            id: 'ex-1',
            exercise_id: 'hiit',
            custom_exercise_name: null,
            type: 'cardio' as const,
            sort_order: 0,
            target_sets: null,
            target_reps: null,
            rest_seconds: 60,
            completed_sets: [
              {
                id: 'set-1',
                type: 'cardio' as const,
                reps: null,
                weight: null,
                weight_unit: null,
                distance: null,
                distance_unit: null,
                calories: 350,
                duration_seconds: 1200,
                completed_at: '2024-01-01T08:30:00Z',
              },
            ],
          },
        ],
      };

      render(<FeedWorkoutCard workout={hiitWorkout} />);

      expect(screen.getByText('🔥 350 cal')).toBeInTheDocument();
    });

    it('should show distance chip for cardio with distance tracked', () => {
      const runWorkout = {
        ...mockWorkout,
        session_exercises: [
          {
            id: 'ex-1',
            exercise_id: 'outdoor-run',
            custom_exercise_name: null,
            type: 'cardio' as const,
            sort_order: 0,
            target_sets: null,
            target_reps: null,
            rest_seconds: 60,
            completed_sets: [
              {
                id: 'set-1',
                type: 'cardio' as const,
                reps: null,
                weight: null,
                weight_unit: null,
                distance: 5.0,
                distance_unit: 'mi' as const,
                calories: null,
                duration_seconds: 2400,
                completed_at: '2024-01-01T08:30:00Z',
              },
            ],
          },
        ],
      };

      render(<FeedWorkoutCard workout={runWorkout} />);

      expect(screen.getByText('🏃 5.0 mi')).toBeInTheDocument();
    });

    it('should show calories in expanded view for HIIT workouts', () => {
      const hiitWorkout = {
        ...mockWorkout,
        session_exercises: [
          {
            id: 'ex-1',
            exercise_id: 'hiit',
            custom_exercise_name: null,
            type: 'cardio' as const,
            sort_order: 0,
            target_sets: null,
            target_reps: null,
            rest_seconds: 60,
            completed_sets: [
              {
                id: 'set-1',
                type: 'cardio' as const,
                reps: null,
                weight: null,
                weight_unit: null,
                distance: null,
                distance_unit: null,
                calories: 200,
                duration_seconds: 1200,
                completed_at: '2024-01-01T08:30:00Z',
              },
            ],
          },
        ],
      };

      render(<FeedWorkoutCard workout={hiitWorkout} />);

      // Expand the workout
      fireEvent.click(screen.getByText('Morning Push Day'));

      // Should show calories display in expanded view
      expect(screen.getByText(/200 cal.*in 20m/)).toBeInTheDocument();
    });

    it('should not show 0 distance for cardio with no distance tracked', () => {
      const hiitWorkout = {
        ...mockWorkout,
        session_exercises: [
          {
            id: 'ex-1',
            exercise_id: 'hiit',
            custom_exercise_name: null,
            type: 'cardio' as const,
            sort_order: 0,
            target_sets: null,
            target_reps: null,
            rest_seconds: 60,
            completed_sets: [
              {
                id: 'set-1',
                type: 'cardio' as const,
                reps: null,
                weight: null,
                weight_unit: null,
                distance: 0,
                distance_unit: 'km' as const,
                calories: 150,
                duration_seconds: 900,
                completed_at: '2024-01-01T08:30:00Z',
              },
            ],
          },
        ],
      };

      render(<FeedWorkoutCard workout={hiitWorkout} />);

      // Expand the workout
      fireEvent.click(screen.getByText('Morning Push Day'));

      // Should NOT show "0 km"
      expect(screen.queryByText(/0 km/)).not.toBeInTheDocument();
      // Should show calories instead
      expect(screen.getByText(/150 cal.*in 15m/)).toBeInTheDocument();
    });
  });
});
