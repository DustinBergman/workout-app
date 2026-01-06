import { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  Notification,
} from '../services/supabase/notifications';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  removeNotification: (notificationId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [notificationsResult, countResult] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);

      if (notificationsResult.error) throw notificationsResult.error;
      if (countResult.error) throw countResult.error;

      setNotifications(notificationsResult.notifications);
      setUnreadCount(countResult.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const { count, error } = await getUnreadCount();
      if (!error) {
        setUnreadCount(count);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    const { error } = await markAsRead(notificationId);
    if (error) {
      setError(error.message);
      return;
    }
    // Update local state
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    const { error } = await markAllAsRead();
    if (error) {
      setError(error.message);
      return;
    }
    // Update local state
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const removeNotification = useCallback(async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    const { error } = await deleteNotification(notificationId);
    if (error) {
      setError(error.message);
      return;
    }
    // Update local state
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    removeNotification,
    refresh: loadData,
  };
};
