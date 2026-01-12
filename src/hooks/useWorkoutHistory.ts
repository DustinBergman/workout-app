import { useState, useMemo, useCallback, useRef, RefObject } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';
import { WorkoutSession } from '../types';

export interface GroupedSessions {
  [key: string]: WorkoutSession[];
}

export const formatSessionDuration = (session: WorkoutSession): string => {
  if (!session.completedAt) return 'In progress';
  const start = new Date(session.startedAt);
  const end = new Date(session.completedAt);
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
};

export const formatHistoryDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const useWorkoutHistory = () => {
  const { user } = useAuth();
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);

  // Get member since date from user's created_at
  const memberSince = useMemo(() => user?.created_at || undefined, [user?.created_at]);

  // State
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('heatmap');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sort sessions by date (newest first)
  const sortedSessions = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      ),
    [sessions]
  );

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const grouped: GroupedSessions = {};
    sortedSessions.forEach((session) => {
      const dateKey = new Date(session.startedAt).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(session);
    });
    return grouped;
  }, [sortedSessions]);

  // Filter sessions by selected date (for heatmap click)
  const filteredSessions = useMemo(
    () =>
      selectedDate
        ? sortedSessions.filter(
            (s) => new Date(s.startedAt).toDateString() === selectedDate.toDateString()
          )
        : sortedSessions,
    [selectedDate, sortedSessions]
  );

  // Handle heatmap day click
  const handleDayClick = useCallback(
    (date: Date, daySessions: WorkoutSession[]) => {
      if (daySessions.length > 0) {
        setSelectedDate(date);
        // Scroll list into view
        setTimeout(() => {
          listRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        setSelectedDate(null);
      }
    },
    []
  );

  // Clear date filter
  const clearDateFilter = useCallback(() => {
    setSelectedDate(null);
  }, []);

  return {
    // Store data
    preferences,
    memberSince,
    // State
    viewMode,
    selectedDate,
    listRef: listRef as RefObject<HTMLDivElement>,
    // Setters
    setViewMode,
    // Computed
    sortedSessions,
    groupedSessions,
    filteredSessions,
    // Actions
    handleDayClick,
    clearDateFilter,
  };
};
