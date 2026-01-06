import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LikersModal } from './LikersModal';

// Mock the likes service
vi.mock('../../services/supabase/likes', () => ({
  getWorkoutLikes: vi.fn(),
}));

import { getWorkoutLikes } from '../../services/supabase/likes';

describe('LikersModal', () => {
  const mockLikes = [
    {
      id: 'like-1',
      workout_id: 'workout-123',
      user_id: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      user: { id: 'user-1', first_name: 'John', last_name: 'Doe', username: 'johnd' },
    },
    {
      id: 'like-2',
      workout_id: 'workout-123',
      user_id: 'user-2',
      created_at: '2024-01-01T01:00:00Z',
      user: { id: 'user-2', first_name: 'Jane', last_name: 'Smith', username: 'janes' },
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnUserClick = vi.fn();

  const renderComponent = (isOpen = true) => {
    return render(
      <LikersModal
        isOpen={isOpen}
        onClose={mockOnClose}
        workoutId="workout-123"
        onUserClick={mockOnUserClick}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getWorkoutLikes).mockResolvedValue({
      likes: mockLikes,
      error: null,
    });
  });

  it('should load likes when opened', async () => {
    renderComponent();

    await waitFor(() => {
      expect(getWorkoutLikes).toHaveBeenCalledWith('workout-123');
    });
  });

  it('should display likers', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('should display usernames', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('@johnd')).toBeInTheDocument();
      expect(screen.getByText('@janes')).toBeInTheDocument();
    });
  });

  it('should call onUserClick and onClose when user is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click on the first user (the whole button row)
    const userButtons = screen.getAllByRole('button');
    const johnButton = userButtons.find((btn) => btn.textContent?.includes('John Doe'));
    fireEvent.click(johnButton!);

    expect(mockOnClose).toHaveBeenCalled();
    expect(mockOnUserClick).toHaveBeenCalledWith('user-1');
  });

  it('should show loading state', async () => {
    vi.mocked(getWorkoutLikes).mockImplementation(
      () => new Promise(() => { /* never resolves */ })
    );

    renderComponent();

    // Should show spinner while loading
    expect(screen.getByRole('heading', { name: 'Likes' })).toBeInTheDocument();
  });

  it('should show error message on error', async () => {
    vi.mocked(getWorkoutLikes).mockResolvedValue({
      likes: [],
      error: new Error('Failed to load'),
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('should show empty message when no likes', async () => {
    vi.mocked(getWorkoutLikes).mockResolvedValue({
      likes: [],
      error: null,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('No likes yet')).toBeInTheDocument();
    });
  });

  it('should not load when closed', () => {
    renderComponent(false);

    expect(getWorkoutLikes).not.toHaveBeenCalled();
  });
});
