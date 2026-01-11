import { useState, useEffect, useCallback } from 'react';
import {
  getPublicProfile,
  PublicProfile,
} from '../services/supabase/profiles';
import {
  isFriend,
  hasPendingRequest,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  getPendingRequests,
} from '../services/supabase/friends';
import { sendEmailNotification } from '../services/supabase/emailNotifications';
import { getUserStats, PublicUserStats } from '../services/supabase/userStats';
import { useAuth } from './useAuth';
import { useAppStore } from '../store/useAppStore';

export type FriendshipStatus = 'friends' | 'pending_sent' | 'pending_received' | 'none' | 'self';

interface UseProfileReturn {
  profile: PublicProfile | null;
  stats: PublicUserStats | null;
  friendshipStatus: FriendshipStatus;
  pendingRequestId: string | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  sendRequest: () => Promise<void>;
  acceptRequest: () => Promise<void>;
  cancelRequest: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useProfile = (userId: string): UseProfileReturn => {
  const { user } = useAuth();
  const customExercises = useAppStore((state) => state.customExercises);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [stats, setStats] = useState<PublicUserStats | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('none');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Check if viewing own profile
      if (userId === user.id) {
        const [profileResult, statsResult] = await Promise.all([
          getPublicProfile(userId),
          getUserStats(userId, customExercises),
        ]);
        if (profileResult.error) throw profileResult.error;
        setProfile(profileResult.profile);
        setStats(statsResult.stats);
        setFriendshipStatus('self');
        setIsLoading(false);
        return;
      }

      // Load profile, friendship status, and stats in parallel
      const [profileResult, friendResult, pendingResult, statsResult] = await Promise.all([
        getPublicProfile(userId),
        isFriend(userId),
        hasPendingRequest(userId),
        getUserStats(userId, customExercises),
      ]);

      if (profileResult.error) throw profileResult.error;
      if (friendResult.error) throw friendResult.error;
      if (pendingResult.error) throw pendingResult.error;

      setProfile(profileResult.profile);
      setStats(statsResult.stats);

      // Determine friendship status
      if (friendResult.isFriend) {
        setFriendshipStatus('friends');
      } else if (pendingResult.direction === 'sent') {
        setFriendshipStatus('pending_sent');
        setPendingRequestId(pendingResult.requestId || null);
      } else if (pendingResult.direction === 'received') {
        setFriendshipStatus('pending_received');
        // Need to find the request ID for accepting
        const { requests } = await getPendingRequests();
        const request = requests.find((r) => r.from_user_id === userId);
        setPendingRequestId(request?.id || null);
      } else {
        setFriendshipStatus('none');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId, user, customExercises]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const sendRequest = useCallback(async () => {
    if (!user) return;

    setIsActionLoading(true);
    setError(null);

    try {
      const { requestId, error: sendError } = await sendFriendRequest(userId);
      if (sendError) throw sendError;

      setFriendshipStatus('pending_sent');

      // Send email notification (fire-and-forget)
      if (requestId) {
        sendEmailNotification({
          type: 'friend_request_received',
          recipientUserId: userId,
          actorUserId: user.id,
          friendRequestId: requestId,
        }).catch(() => {}); // Silently ignore errors
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request');
    } finally {
      setIsActionLoading(false);
    }
  }, [userId, user]);

  const acceptRequest = useCallback(async () => {
    if (!pendingRequestId || !user) return;

    setIsActionLoading(true);
    setError(null);

    try {
      const { error: acceptError } = await acceptFriendRequest(pendingRequestId);
      if (acceptError) throw acceptError;

      setFriendshipStatus('friends');
      setPendingRequestId(null);

      // Send email notification to the person who sent the request (fire-and-forget)
      // userId is the profile being viewed, which is the original sender
      sendEmailNotification({
        type: 'friend_request_accepted',
        recipientUserId: userId,
        actorUserId: user.id,
        friendRequestId: pendingRequestId,
      }).catch(() => {}); // Silently ignore errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setIsActionLoading(false);
    }
  }, [pendingRequestId, userId, user]);

  const cancelRequestFn = useCallback(async () => {
    if (!pendingRequestId) return;

    setIsActionLoading(true);
    setError(null);

    try {
      const { error: cancelError } = await cancelFriendRequest(pendingRequestId);
      if (cancelError) throw cancelError;

      setFriendshipStatus('none');
      setPendingRequestId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setIsActionLoading(false);
    }
  }, [pendingRequestId]);

  return {
    profile,
    stats,
    friendshipStatus,
    pendingRequestId,
    isLoading,
    isActionLoading,
    error,
    sendRequest,
    acceptRequest,
    cancelRequest: cancelRequestFn,
    refresh: loadProfile,
  };
};
