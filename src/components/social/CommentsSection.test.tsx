import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommentsSection } from './CommentsSection';

// Mock the hooks
vi.mock('../../hooks/useComments', () => ({
  useComments: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'current-user-123' },
  })),
}));

import { useComments } from '../../hooks/useComments';

describe('CommentsSection', () => {
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
    {
      id: 'comment-2',
      workout_id: 'workout-123',
      user_id: 'current-user-123',
      content: 'Thanks!',
      created_at: '2024-01-01T01:00:00Z',
      user: { id: 'current-user-123', first_name: 'Test', last_name: 'User', username: 'testuser', avatar_url: null },
      like_count: 0,
      has_liked: false,
    },
  ];

  const mockAddComment = vi.fn();
  const mockDeleteComment = vi.fn();
  const mockToggleCommentLike = vi.fn();
  const mockRefresh = vi.fn();
  const mockOnUserClick = vi.fn();
  const mockOnCommentCountChange = vi.fn();

  const defaultHookReturn = {
    comments: mockComments,
    commentCount: 2,
    isLoading: false,
    isSubmitting: false,
    error: null,
    addComment: mockAddComment,
    deleteComment: mockDeleteComment,
    toggleCommentLike: mockToggleCommentLike,
    refresh: mockRefresh,
  };

  const renderComponent = (isExpanded = true, initialCount = 2) => {
    return render(
      <CommentsSection
        workoutId="workout-123"
        initialCount={initialCount}
        isExpanded={isExpanded}
        onUserClick={mockOnUserClick}
        onCommentCountChange={mockOnCommentCountChange}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useComments).mockReturnValue(defaultHookReturn);
  });

  it('should show input but not full comments when not expanded', () => {
    renderComponent(false);

    // Input should always be visible
    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
    // Full comments list is not shown when not expanded (unless preview comments are passed)
    expect(screen.queryByText('Great workout!')).not.toBeInTheDocument();
  });

  it('should render comments when expanded', () => {
    renderComponent();

    expect(screen.getByText('Great workout!')).toBeInTheDocument();
    expect(screen.getByText('Thanks!')).toBeInTheDocument();
  });

  it('should show comment input', () => {
    renderComponent();

    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
  });

  it('should submit comment when form is submitted', async () => {
    renderComponent();

    const input = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(input, { target: { value: 'New comment' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    expect(mockAddComment).toHaveBeenCalledWith('New comment');
  });

  it('should not submit empty comment', () => {
    renderComponent();

    const postButton = screen.getByRole('button', { name: 'Post' });
    fireEvent.click(postButton);

    expect(mockAddComment).not.toHaveBeenCalled();
  });

  it('should disable post button when submitting', () => {
    vi.mocked(useComments).mockReturnValue({
      ...defaultHookReturn,
      comments: [], // No comments to avoid extra buttons
      isSubmitting: true,
    });

    const { container } = renderComponent();

    // When submitting, the post button shows a spinner and is disabled
    const submitButton = container.querySelector('button[type="submit"]');
    expect(submitButton).toBeDisabled();
  });

  it('should show loading state', () => {
    vi.mocked(useComments).mockReturnValue({
      ...defaultHookReturn,
      comments: [],
      isLoading: true,
    });

    renderComponent();

    // Should show spinner
    expect(screen.queryByText('Great workout!')).not.toBeInTheDocument();
  });

  it('should show only input form when no comments and expanded', () => {
    vi.mocked(useComments).mockReturnValue({
      ...defaultHookReturn,
      comments: [],
      commentCount: 0,
    });

    renderComponent();

    // Should still show the input form
    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument();
    // But no comments displayed
    expect(screen.queryByText('Great workout!')).not.toBeInTheDocument();
  });

  it('should show error message', () => {
    vi.mocked(useComments).mockReturnValue({
      ...defaultHookReturn,
      error: 'Failed to load comments',
    });

    renderComponent();

    expect(screen.getByText('Failed to load comments')).toBeInTheDocument();
  });

  it('should call onUserClick when user is clicked', () => {
    renderComponent();

    // Click on the first user's name
    fireEvent.click(screen.getByText('John Doe'));

    expect(mockOnUserClick).toHaveBeenCalledWith('user-1');
  });

  it('should show delete button for own comments', () => {
    renderComponent();

    // The second comment is from current user, should have delete
    const deleteButtons = screen.getAllByText('Delete');
    expect(deleteButtons).toHaveLength(1); // Only one delete button for current user's comment
  });

  it('should call deleteComment when delete is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByText('Delete'));

    expect(mockDeleteComment).toHaveBeenCalledWith('comment-2');
  });

  it('should call onCommentCountChange when comment is added', async () => {
    mockAddComment.mockResolvedValue(undefined);

    renderComponent();

    const input = screen.getByPlaceholderText('Add a comment...');
    fireEvent.change(input, { target: { value: 'New comment' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(mockOnCommentCountChange).toHaveBeenCalledWith(3);
    });
  });

  it('should clear input after submitting', async () => {
    mockAddComment.mockResolvedValue(undefined);

    renderComponent();

    const input = screen.getByPlaceholderText('Add a comment...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New comment' } });
    fireEvent.click(screen.getByRole('button', { name: 'Post' }));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
