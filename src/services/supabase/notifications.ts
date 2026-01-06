import { supabase } from '../../lib/supabase';

// Types
export type NotificationType = 'friend_request_received' | 'friend_request_accepted';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

/**
 * Get all notifications for the current user
 */
export const getNotifications = async (
  limit = 50
): Promise<{ notifications: Notification[]; error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { notifications: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return { notifications: [], error };
  }

  return { notifications: data || [], error: null };
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise<{
  count: number;
  error: Error | null;
}> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { count: 0, error: new Error('Not authenticated') };
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) {
    return { count: 0, error };
  }

  return { count: count || 0, error: null };
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (
  notificationId: string
): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  return { error };
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  return { error };
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  notificationId: string
): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', user.id);

  return { error };
};

/**
 * Delete all read notifications
 */
export const clearReadNotifications = async (): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)
    .eq('read', true);

  return { error };
};
