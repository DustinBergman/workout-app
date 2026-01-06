import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LikeButton } from './LikeButton';
import { LikeSummary } from '../../services/supabase/likes';

describe('LikeButton', () => {
  const defaultSummary: LikeSummary = {
    count: 5,
    hasLiked: false,
    recentLikers: [],
  };

  const mockOnToggleLike = vi.fn();
  const mockOnShowLikers = vi.fn();

  const renderComponent = (summary: LikeSummary | null = defaultSummary, isLiking = false) => {
    return render(
      <LikeButton
        likeSummary={summary}
        isLiking={isLiking}
        onToggleLike={mockOnToggleLike}
        onShowLikers={mockOnShowLikers}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render like button', () => {
    renderComponent();

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toBeInTheDocument();
  });

  it('should show like count when count > 0', () => {
    renderComponent();

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should not show like count when count is 0', () => {
    renderComponent({ ...defaultSummary, count: 0 });

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('should call onToggleLike when like button is clicked', () => {
    renderComponent();

    const likeButton = screen.getByRole('button', { name: /like/i });
    fireEvent.click(likeButton);

    expect(mockOnToggleLike).toHaveBeenCalledTimes(1);
  });

  it('should call onShowLikers when count is clicked', () => {
    renderComponent();

    const countButton = screen.getByText('5');
    fireEvent.click(countButton);

    expect(mockOnShowLikers).toHaveBeenCalledTimes(1);
  });

  it('should disable like button when isLiking is true', () => {
    renderComponent(defaultSummary, true);

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toBeDisabled();
  });

  it('should show unlike button when hasLiked is true', () => {
    renderComponent({ ...defaultSummary, hasLiked: true });

    const unlikeButton = screen.getByRole('button', { name: /unlike/i });
    expect(unlikeButton).toBeInTheDocument();
  });

  it('should handle null likeSummary', () => {
    renderComponent(null);

    const likeButton = screen.getByRole('button', { name: /like/i });
    expect(likeButton).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
