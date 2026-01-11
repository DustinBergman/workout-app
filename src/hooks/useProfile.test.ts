import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProfile } from './useProfile';

// Mock useAuth hook
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from './useAuth';

// Mock the profile service
vi.mock('../services/supabase/profiles', () => ({
  getPublicProfile: vi.fn(),
}));

// Mock the friends service
vi.mock('../services/supabase/friends', () => ({
  isFriend: vi.fn(),
  hasPendingRequest: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  cancelFriendRequest: vi.fn(),
  getPendingRequests: vi.fn(),
}));

import { getPublicProfile } from '../services/supabase/profiles';
import {
  isFriend,
  hasPendingRequest,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  getPendingRequests,
} from '../services/supabase/friends';

describe('useProfile', () => {
  const mockProfile = {
    id: 'user-123',
    first_name: 'John',
    last_name: 'Doe',
    username: 'johnd',
    avatar_url: null,
    experience_level: 'intermediate' as const,
    workout_goal: 'build' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'current-user-123' } as never,
      session: null,
      isLoading: false,
      isAuthenticated: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    });
    vi.mocked(getPublicProfile).mockResolvedValue({
      profile: mockProfile,
      error: null,
    });
    vi.mocked(isFriend).mockResolvedValue({
      isFriend: false,
      error: null,
    });
    vi.mocked(hasPendingRequest).mockResolvedValue({
      hasPending: false,
      direction: null,
      requestId: null,
      error: null,
    });
    vi.mocked(getPendingRequests).mockResolvedValue({
      requests: [],
      error: null,
    });
  });

  it('should load profile on mount', async () => {
    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(getPublicProfile).toHaveBeenCalledWith('user-123');
  });

  it('should set friendshipStatus to self when viewing own profile', async () => {
    const { result } = renderHook(() => useProfile('current-user-123'));

    await waitFor(() => {
      expect(result.current.friendshipStatus).toBe('self');
    });
  });

  it('should set friendshipStatus to friends when already friends', async () => {
    vi.mocked(isFriend).mockResolvedValue({
      isFriend: true,
      error: null,
    });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.friendshipStatus).toBe('friends');
    });
  });

  it('should set friendshipStatus to pending_sent when request sent', async () => {
    vi.mocked(hasPendingRequest).mockResolvedValue({
      hasPending: true,
      direction: 'sent',
      requestId: 'request-123',
      error: null,
    });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.friendshipStatus).toBe('pending_sent');
      expect(result.current.pendingRequestId).toBe('request-123');
    });
  });

  it('should set friendshipStatus to pending_received when request received', async () => {
    vi.mocked(hasPendingRequest).mockResolvedValue({
      hasPending: true,
      direction: 'received',
      requestId: null,
      error: null,
    });
    vi.mocked(getPendingRequests).mockResolvedValue({
      requests: [{ id: 'request-456', from_user_id: 'user-123' }] as never,
      error: null,
    });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.friendshipStatus).toBe('pending_received');
      expect(result.current.pendingRequestId).toBe('request-456');
    });
  });

  it('should send friend request', async () => {
    vi.mocked(sendFriendRequest).mockResolvedValue({ requestId: 'new-request', error: null });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    await act(async () => {
      await result.current.sendRequest();
    });

    expect(sendFriendRequest).toHaveBeenCalledWith('user-123');
    expect(result.current.friendshipStatus).toBe('pending_sent');
  });

  it('should accept friend request', async () => {
    vi.mocked(hasPendingRequest).mockResolvedValue({
      hasPending: true,
      direction: 'received',
      requestId: null,
      error: null,
    });
    vi.mocked(getPendingRequests).mockResolvedValue({
      requests: [{ id: 'request-456', from_user_id: 'user-123' }] as never,
      error: null,
    });
    vi.mocked(acceptFriendRequest).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.pendingRequestId).toBe('request-456');
    });

    await act(async () => {
      await result.current.acceptRequest();
    });

    expect(acceptFriendRequest).toHaveBeenCalledWith('request-456');
    expect(result.current.friendshipStatus).toBe('friends');
  });

  it('should cancel friend request', async () => {
    vi.mocked(hasPendingRequest).mockResolvedValue({
      hasPending: true,
      direction: 'sent',
      requestId: 'request-123',
      error: null,
    });
    vi.mocked(cancelFriendRequest).mockResolvedValue({ error: null });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.pendingRequestId).toBe('request-123');
    });

    await act(async () => {
      await result.current.cancelRequest();
    });

    expect(cancelFriendRequest).toHaveBeenCalledWith('request-123');
    expect(result.current.friendshipStatus).toBe('none');
  });

  it('should handle error loading profile', async () => {
    vi.mocked(getPublicProfile).mockResolvedValue({
      profile: null,
      error: new Error('Profile not found'),
    });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.error).toBe('Profile not found');
    });
  });

  it('should handle error sending request', async () => {
    vi.mocked(sendFriendRequest).mockResolvedValue({
      requestId: null,
      error: new Error('Request failed'),
    });

    const { result } = renderHook(() => useProfile('user-123'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.sendRequest();
    });

    expect(result.current.error).toBe('Request failed');
  });
});
