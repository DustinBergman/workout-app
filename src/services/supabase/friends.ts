import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';

// Types
export interface FriendProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface FriendRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  responded_at: string | null;
  from_user?: FriendProfile;
  to_user?: FriendProfile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: FriendProfile;
}

/**
 * Send a friend request using the database function
 */
export const sendFriendRequest = async (
  toUserId: string
): Promise<{ requestId: string | null; error: Error | null }> => {
  const { data, error } = await supabase.rpc('send_friend_request', {
    to_user_id: toUserId,
  });

  if (error) {
    return { requestId: null, error: new Error(error.message) };
  }

  return { requestId: data, error: null };
};

/**
 * Accept a friend request using the database function
 */
export const acceptFriendRequest = async (
  requestId: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase.rpc('accept_friend_request', {
    request_id: requestId,
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
};

/**
 * Decline a friend request using the database function
 */
export const declineFriendRequest = async (
  requestId: string
): Promise<{ error: Error | null }> => {
  const { error } = await supabase.rpc('decline_friend_request', {
    request_id: requestId,
  });

  if (error) {
    return { error: new Error(error.message) };
  }

  return { error: null };
};

/**
 * Get pending friend requests received by the current user
 */
export const getPendingRequests = async (): Promise<{
  requests: FriendRequest[];
  error: Error | null;
}> => {
  const user = await getAuthUser();
  if (!user) {
    return { requests: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      from_user:profiles!friend_requests_from_user_id_fkey (
        id, first_name, last_name, username, avatar_url
      )
    `)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { requests: [], error };
  }

  return { requests: data || [], error: null };
};

/**
 * Get friend requests sent by the current user
 */
export const getSentRequests = async (): Promise<{
  requests: FriendRequest[];
  error: Error | null;
}> => {
  const user = await getAuthUser();
  if (!user) {
    return { requests: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      *,
      to_user:profiles!friend_requests_to_user_id_fkey (
        id, first_name, last_name, username, avatar_url
      )
    `)
    .eq('from_user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    return { requests: [], error };
  }

  return { requests: data || [], error: null };
};

/**
 * Cancel a sent friend request
 */
export const cancelFriendRequest = async (
  requestId: string
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId)
    .eq('from_user_id', user.id);

  return { error };
};

/**
 * Get all friends of the current user
 */
export const getFriends = async (): Promise<{
  friends: FriendProfile[];
  error: Error | null;
}> => {
  const user = await getAuthUser();
  if (!user) {
    return { friends: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('friendships')
    .select(`
      friend:profiles!friendships_friend_id_fkey (
        id, first_name, last_name, username, avatar_url
      )
    `)
    .eq('user_id', user.id);

  if (error) {
    return { friends: [], error };
  }

  // Extract friend profiles from the nested structure
  const friends = (data || [])
    .map((f) => f.friend as unknown as FriendProfile)
    .filter(Boolean);

  return { friends, error: null };
};

/**
 * Remove a friend (unfriend)
 */
export const removeFriend = async (
  friendId: string
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  // Delete both directions of the friendship
  const { error: error1 } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', user.id)
    .eq('friend_id', friendId);

  if (error1) {
    return { error: error1 };
  }

  const { error: error2 } = await supabase
    .from('friendships')
    .delete()
    .eq('user_id', friendId)
    .eq('friend_id', user.id);

  return { error: error2 };
};

/**
 * Check if a user is already a friend
 */
export const isFriend = async (
  userId: string
): Promise<{ isFriend: boolean; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { isFriend: false, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_id', user.id)
    .eq('friend_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { isFriend: false, error };
  }

  return { isFriend: !!data, error: null };
};

/**
 * Check if there's a pending friend request to/from a user
 */
export const hasPendingRequest = async (
  userId: string
): Promise<{ hasPending: boolean; direction: 'sent' | 'received' | null; requestId: string | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { hasPending: false, direction: null, requestId: null, error: new Error('Not authenticated') };
  }

  // Check for sent request
  const { data: sentData } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('from_user_id', user.id)
    .eq('to_user_id', userId)
    .eq('status', 'pending')
    .single();

  if (sentData) {
    return { hasPending: true, direction: 'sent', requestId: sentData.id, error: null };
  }

  // Check for received request
  const { data: receivedData } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('from_user_id', userId)
    .eq('to_user_id', user.id)
    .eq('status', 'pending')
    .single();

  if (receivedData) {
    return { hasPending: true, direction: 'received', requestId: receivedData.id, error: null };
  }

  return { hasPending: false, direction: null, requestId: null, error: null };
};

// Leaderboard types
export interface LeaderboardEntry {
  user: FriendProfile & { isCurrentUser?: boolean };
  workoutCount: number;
}

/**
 * Get weekly leaderboard of friends + current user
 */
export const getWeeklyLeaderboard = async (): Promise<{
  leaderboard: LeaderboardEntry[];
  error: Error | null;
}> => {
  const user = await getAuthUser();
  if (!user) {
    return { leaderboard: [], error: new Error('Not authenticated') };
  }

  // Get start of current week (Monday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  // Get friends
  const { friends, error: friendsError } = await getFriends();
  if (friendsError) {
    return { leaderboard: [], error: friendsError };
  }

  if (friends.length === 0) {
    return { leaderboard: [], error: null };
  }

  // Get all user IDs (friends + current user)
  const allUserIds = [...friends.map(f => f.id), user.id];

  // Get workout counts for this week
  const { data: workouts, error: workoutsError } = await supabase
    .from('workout_sessions')
    .select('user_id')
    .in('user_id', allUserIds)
    .not('completed_at', 'is', null)
    .gte('completed_at', weekStart.toISOString());

  if (workoutsError) {
    return { leaderboard: [], error: workoutsError };
  }

  // Count workouts per user
  const workoutCounts = new Map<string, number>();
  for (const workout of workouts || []) {
    const count = workoutCounts.get(workout.user_id) || 0;
    workoutCounts.set(workout.user_id, count + 1);
  }

  // Get current user profile
  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username, avatar_url')
    .eq('id', user.id)
    .single();

  // Build leaderboard
  const leaderboard: LeaderboardEntry[] = [];

  // Add current user
  if (currentUserProfile) {
    leaderboard.push({
      user: { ...currentUserProfile, isCurrentUser: true },
      workoutCount: workoutCounts.get(user.id) || 0,
    });
  }

  // Add friends
  for (const friend of friends) {
    leaderboard.push({
      user: friend,
      workoutCount: workoutCounts.get(friend.id) || 0,
    });
  }

  // Sort by workout count (descending)
  leaderboard.sort((a, b) => b.workoutCount - a.workoutCount);

  return { leaderboard, error: null };
};
