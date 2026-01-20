import { useState, useCallback, useMemo, createElement } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useModal } from '../contexts/ModalContext';
import { useUserStats, TimePeriod } from './useUserStats';
import { useAvatar, updateCachedAvatar } from './useAvatar';
import { useAuth } from './useAuth';
import { WeightLogModalWrapper, AvatarEditModalWrapper } from '../components/modals';
import { MuscleGroup } from '../types';
import { PieChartDataItem } from '../components/you/MuscleGroupChart';

const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f97316',
  biceps: '#8b5cf6',
  triceps: '#a855f7',
  forearms: '#ec4899',
  core: '#eab308',
  quadriceps: '#22c55e',
  hamstrings: '#14b8a6',
  glutes: '#06b6d4',
  calves: '#84cc16',
  traps: '#6366f1',
  lats: '#0ea5e9',
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatMuscleGroup = (mg: MuscleGroup): string => {
  return mg.charAt(0).toUpperCase() + mg.slice(1);
};

export const useYouPage = () => {
  const { openModal } = useModal();
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  // Use the avatar hook for current user
  const { avatarUrl, refresh: refreshAvatar } = useAvatar(user?.id);

  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const customExercises = useAppStore((state) => state.customExercises);
  const weightEntries = useAppStore((state) => state.weightEntries);

  const stats = useUserStats(sessions, timePeriod, customExercises, weightEntries, preferences.distanceUnit);

  // Update avatar and cache when changed
  const updateAvatarUrl = useCallback((url: string | null) => {
    if (user?.id) {
      updateCachedAvatar(user.id, url);
      refreshAvatar();
    }
  }, [user?.id, refreshAvatar]);

  // Modal handlers
  const openWeightModal = useCallback(() => {
    openModal(createElement(WeightLogModalWrapper));
  }, [openModal]);

  const openAvatarEditModal = useCallback(() => {
    openModal(createElement(AvatarEditModalWrapper, { onAvatarChange: updateAvatarUrl }));
  }, [openModal, updateAvatarUrl]);

  // Computed values
  const pieChartData = useMemo<PieChartDataItem[]>(() =>
    stats.muscleGroupBreakdown.map((item) => ({
      name: formatMuscleGroup(item.muscleGroup),
      value: item.setCount,
      percentage: item.percentage,
      color: MUSCLE_GROUP_COLORS[item.muscleGroup],
    })),
    [stats.muscleGroupBreakdown]
  );

  const hasEnoughData = stats.totalSessions >= 1;

  const completedWorkoutsCount = useMemo(() =>
    sessions.filter(s => s.completedAt).length,
    [sessions]
  );

  const displayName = useMemo(() => {
    if (preferences.firstName && preferences.lastName) {
      return `${preferences.firstName} ${preferences.lastName}`;
    }
    return preferences.firstName || 'User';
  }, [preferences.firstName, preferences.lastName]);

  return {
    // State
    timePeriod,
    setTimePeriod,
    avatarUrl,
    // Store data
    preferences,
    weightEntries,
    sessions,
    customExercises,
    // Stats
    stats,
    // Computed
    pieChartData,
    hasEnoughData,
    completedWorkoutsCount,
    displayName,
    // Actions
    openWeightModal,
    openAvatarEditModal,
  };
};
