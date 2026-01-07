import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommentItem } from './CommentItem';
import { WorkoutComment } from '../../services/supabase/comments';

describe('CommentItem', () => {
  const mockComment: WorkoutComment = {
    id: 'comment-123',
    workout_id: 'workout-123',
    user_id: 'user-123',
    content: 'Great workout!',
    created_at: new Date().toISOString(),
    user: {
      id: 'user-123',
      first_name: 'John',
      last_name: 'Doe',
      username: 'johnd',
    },
    like_count: 0,
    has_liked: false,
  };

  const mockOnDelete = vi.fn();
  const mockOnUserClick = vi.fn();

  const renderComponent = (comment = mockComment, isOwn = false) => {
    return render(
      <CommentItem
        comment={comment}
        isOwn={isOwn}
        onDelete={mockOnDelete}
        onUserClick={mockOnUserClick}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render comment content', () => {
    renderComponent();

    expect(screen.getByText('Great workout!')).toBeInTheDocument();
  });

  it('should display user full name when available', () => {
    renderComponent();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    // Username should also be shown alongside full name
    expect(screen.getByText('@johnd')).toBeInTheDocument();
  });

  it('should display username when full name is not available', () => {
    const commentWithUsernameOnly: WorkoutComment = {
      ...mockComment,
      user: {
        id: 'user-123',
        first_name: null,
        last_name: null,
        username: 'johnd',
      },
    };
    renderComponent(commentWithUsernameOnly);

    // Username is now shown with @ prefix
    expect(screen.getByText('@johnd')).toBeInTheDocument();
  });

  it('should display Anonymous when no name or username', () => {
    const anonymousComment: WorkoutComment = {
      ...mockComment,
      user: {
        id: 'user-123',
        first_name: null,
        last_name: null,
        username: null,
      },
    };
    renderComponent(anonymousComment);

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
  });

  it('should show delete button when isOwn is true', () => {
    renderComponent(mockComment, true);

    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should not show delete button when isOwn is false', () => {
    renderComponent(mockComment, false);

    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should call onDelete when delete button is clicked', () => {
    renderComponent(mockComment, true);

    fireEvent.click(screen.getByText('Delete'));

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it('should call onUserClick when avatar is clicked', () => {
    renderComponent();

    // The avatar is the button with the first letter
    const avatar = screen.getByText('J');
    fireEvent.click(avatar);

    expect(mockOnUserClick).toHaveBeenCalledTimes(1);
  });

  it('should call onUserClick when name is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByText('John Doe'));

    expect(mockOnUserClick).toHaveBeenCalledTimes(1);
  });

  it('should display relative time', () => {
    renderComponent();

    // Should show some time indicator like "less than a minute ago"
    expect(screen.getByText(/ago/i)).toBeInTheDocument();
  });
});
