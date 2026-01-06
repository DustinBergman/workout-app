import { useState, useEffect, useCallback } from 'react';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  FriendProfile,
  FriendRequest,
} from '../services/supabase/friends';
import { searchUsers } from '../services/supabase/profiles';

interface UseFriendsReturn {
  friends: FriendProfile[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  isLoading: boolean;
  error: string | null;
  searchResults: Array<{ id: string; first_name: string | null; last_name: string | null; username: string | null }>;
  isSearching: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sendRequest: (toUserId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  declineRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  unfriend: (friendId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useFriends = (): UseFriendsReturn => {
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<Array<{ id: string; first_name: string | null; last_name: string | null; username: string | null }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [friendsResult, pendingResult, sentResult] = await Promise.all([
        getFriends(),
        getPendingRequests(),
        getSentRequests(),
      ]);

      if (friendsResult.error) throw friendsResult.error;
      if (pendingResult.error) throw pendingResult.error;
      if (sentResult.error) throw sentResult.error;

      setFriends(friendsResult.friends);
      setPendingRequests(pendingResult.requests);
      setSentRequests(sentResult.requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Search users when query changes
  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const { users, error } = await searchUsers(searchQuery);
      setIsSearching(false);

      if (!error) {
        // Filter out existing friends and users with pending requests
        const friendIds = new Set(friends.map((f) => f.id));
        const pendingToIds = new Set(sentRequests.map((r) => r.to_user_id));
        const pendingFromIds = new Set(pendingRequests.map((r) => r.from_user_id));

        const filtered = users.filter(
          (u) => !friendIds.has(u.id) && !pendingToIds.has(u.id) && !pendingFromIds.has(u.id)
        );
        setSearchResults(filtered);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, friends, sentRequests, pendingRequests]);

  const sendRequest = useCallback(async (toUserId: string) => {
    const { error } = await sendFriendRequest(toUserId);
    if (error) {
      setError(error.message);
      return;
    }
    // Refresh to get updated sent requests
    await loadData();
    setSearchQuery('');
    setSearchResults([]);
  }, [loadData]);

  const acceptRequest = useCallback(async (requestId: string) => {
    const { error } = await acceptFriendRequest(requestId);
    if (error) {
      setError(error.message);
      return;
    }
    await loadData();
  }, [loadData]);

  const declineRequest = useCallback(async (requestId: string) => {
    const { error } = await declineFriendRequest(requestId);
    if (error) {
      setError(error.message);
      return;
    }
    await loadData();
  }, [loadData]);

  const cancelRequestFn = useCallback(async (requestId: string) => {
    const { error } = await cancelFriendRequest(requestId);
    if (error) {
      setError(error.message);
      return;
    }
    await loadData();
  }, [loadData]);

  const unfriend = useCallback(async (friendId: string) => {
    const { error } = await removeFriend(friendId);
    if (error) {
      setError(error.message);
      return;
    }
    await loadData();
  }, [loadData]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    isLoading,
    error,
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    sendRequest,
    acceptRequest,
    declineRequest,
    cancelRequest: cancelRequestFn,
    unfriend,
    refresh: loadData,
  };
};
