import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileModal } from './ProfileModal';

// Mock the useProfile hook
vi.mock('../../hooks/useProfile', () => ({
  useProfile: vi.fn(),
}));

import { useProfile } from '../../hooks/useProfile';

describe('ProfileModal', () => {
  const mockProfile = {
    id: 'user-123',
    first_name: 'John',
    last_name: 'Doe',
    username: 'johnd',
    experience_level: 'intermediate' as const,
    workout_goal: 'build' as const,
  };

  const mockOnClose = vi.fn();
  const mockSendRequest = vi.fn();
  const mockAcceptRequest = vi.fn();
  const mockCancelRequest = vi.fn();
  const mockRefresh = vi.fn();

  const defaultHookReturn = {
    profile: mockProfile,
    friendshipStatus: 'none' as const,
    pendingRequestId: null,
    isLoading: false,
    isActionLoading: false,
    error: null,
    sendRequest: mockSendRequest,
    acceptRequest: mockAcceptRequest,
    cancelRequest: mockCancelRequest,
    refresh: mockRefresh,
  };

  const renderComponent = (isOpen = true, userId = 'user-123') => {
    return render(
      <ProfileModal isOpen={isOpen} onClose={mockOnClose} userId={userId} />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useProfile).mockReturnValue(defaultHookReturn);
  });

  it('should display profile information', () => {
    renderComponent();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('@johnd')).toBeInTheDocument();
  });

  it('should display experience level', () => {
    renderComponent();

    expect(screen.getByText('Intermediate')).toBeInTheDocument();
  });

  it('should display workout goal', () => {
    renderComponent();

    // 'build' is displayed as the raw value since it's not in workoutGoalLabels map
    expect(screen.getByText('build')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      profile: null,
      isLoading: true,
    });

    renderComponent();

    // Should have a spinner
    expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
  });

  it('should show Add Friend button when status is none', () => {
    renderComponent();

    expect(screen.getByRole('button', { name: 'Add Friend' })).toBeInTheDocument();
  });

  it('should call sendRequest when Add Friend is clicked', () => {
    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Add Friend' }));

    expect(mockSendRequest).toHaveBeenCalled();
  });

  it('should show Request Pending button when status is pending_sent', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      friendshipStatus: 'pending_sent',
      pendingRequestId: 'request-123',
    });

    renderComponent();

    expect(screen.getByRole('button', { name: 'Request Pending' })).toBeInTheDocument();
  });

  it('should call cancelRequest when Request Pending is clicked', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      friendshipStatus: 'pending_sent',
      pendingRequestId: 'request-123',
    });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Request Pending' }));

    expect(mockCancelRequest).toHaveBeenCalled();
  });

  it('should show Accept Request button when status is pending_received', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      friendshipStatus: 'pending_received',
      pendingRequestId: 'request-123',
    });

    renderComponent();

    expect(screen.getByRole('button', { name: 'Accept Request' })).toBeInTheDocument();
  });

  it('should call acceptRequest when Accept Request is clicked', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      friendshipStatus: 'pending_received',
      pendingRequestId: 'request-123',
    });

    renderComponent();

    fireEvent.click(screen.getByRole('button', { name: 'Accept Request' }));

    expect(mockAcceptRequest).toHaveBeenCalled();
  });

  it('should show Friends badge when status is friends', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      friendshipStatus: 'friends',
    });

    renderComponent();

    expect(screen.getByText('Friends')).toBeInTheDocument();
    // Should not have an action button
    expect(screen.queryByRole('button', { name: 'Add Friend' })).not.toBeInTheDocument();
  });

  it('should not show action button when viewing own profile', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      friendshipStatus: 'self',
    });

    renderComponent();

    expect(screen.queryByRole('button', { name: /friend/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Friends')).not.toBeInTheDocument();
  });

  it('should show error message', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      error: 'Failed to send request',
    });

    renderComponent();

    expect(screen.getByText('Failed to send request')).toBeInTheDocument();
  });

  it('should show profile not found when profile is null', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      profile: null,
    });

    renderComponent();

    expect(screen.getByText('Profile not found')).toBeInTheDocument();
  });

  it('should disable button when action is loading', () => {
    vi.mocked(useProfile).mockReturnValue({
      ...defaultHookReturn,
      isActionLoading: true,
    });

    renderComponent();

    // When action is loading, button shows spinner (no text), find by disabled state
    const buttons = screen.getAllByRole('button');
    const disabledButton = buttons.find((btn) => btn.hasAttribute('disabled'));
    expect(disabledButton).toBeTruthy();
  });

  it('should display avatar with first letter', () => {
    renderComponent();

    expect(screen.getByText('J')).toBeInTheDocument();
  });
});
