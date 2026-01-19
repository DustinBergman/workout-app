import { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';
import { getPTSummary, hasValidPTSummaryCache, PTSummaryResponse } from '../services/openai';
import {
  WorkoutTemplate,
  WorkoutSession,
  UserPreferences,
  ProgressiveOverloadWeek,
  WorkoutGoal,
  GoalInfo,
  WeightEntry,
  WORKOUT_GOALS,
} from '../types';

export interface UseHomeReturn {
  // Store values (direct access)
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  preferences: UserPreferences;
  currentWeek: ProgressiveOverloadWeek;
  workoutGoal: WorkoutGoal;

  // Computed values
  hasApiKey: boolean;
  goalInfo: GoalInfo;
  recentSessions: WorkoutSession[];
  nextWorkout: WorkoutTemplate | null;
  memberSince?: string;

  // Weight tracking
  weightEntries: WeightEntry[];
  lastWeightEntry: WeightEntry | null;
  shouldShowWeightReminder: boolean;

  // PT Summary
  ptSummary: PTSummaryResponse | null;
  loadingPTSummary: boolean;
}

export const useHome = (): UseHomeReturn => {
  const { user } = useAuth();

  // Store values
  const templates = useAppStore((state) => state.templates);
  const sessions = useAppStore((state) => state.sessions);
  const activeSession = useAppStore((state) => state.activeSession);
  const preferences = useAppStore((state) => state.preferences);
  const currentWeek = useAppStore((state) => state.currentWeek);
  const workoutGoal = useAppStore((state) => state.workoutGoal);
  const weekStartedAt = useAppStore((state) => state.weekStartedAt);
  const advanceWeek = useAppStore((state) => state.advanceWeek);
  const weightEntries = useAppStore((state) => state.weightEntries);
  const customExercises = useAppStore((state) => state.customExercises);
  const experienceLevel = preferences.experienceLevel;

  // Get member since date from user's created_at
  const memberSince = useMemo(() => user?.created_at || undefined, [user?.created_at]);

  // Local state
  const [ptSummary, setPTSummary] = useState<PTSummaryResponse | null>(null);
  const [loadingPTSummary, setLoadingPTSummary] = useState(false);

  // Computed values
  const hasApiKey = !!preferences.openaiApiKey;
  const goalInfo = WORKOUT_GOALS[workoutGoal];

  // Weight tracking computed values
  const lastWeightEntry = useMemo(() => {
    if (weightEntries.length === 0) return null;
    return [...weightEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }, [weightEntries]);

  const shouldShowWeightReminder = useMemo(() => {
    if (!lastWeightEntry) return true; // Never logged weight
    const lastDate = new Date(lastWeightEntry.date);
    const now = new Date();
    const daysSinceLastEntry = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSinceLastEntry >= 2;
  }, [lastWeightEntry]);

  // Recent sessions (most recent 3)
  const recentSessions = useMemo(() => {
    return [...sessions]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 3);
  }, [sessions]);

  // Next workout suggestion based on template rotation
  const nextWorkout = useMemo(() => {
    if (templates.length === 0) return null;
    if (sessions.length === 0) return templates[0];

    // Find the most recent completed session with a template
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    const lastSessionWithTemplate = sortedSessions.find((s) => s.templateId);

    if (!lastSessionWithTemplate) return templates[0];

    // Find the index of the last used template
    const lastTemplateIndex = templates.findIndex(
      (t) => t.id === lastSessionWithTemplate.templateId
    );

    if (lastTemplateIndex === -1) return templates[0];

    // Get the next template (cycle back to start if at end)
    const nextIndex = (lastTemplateIndex + 1) % templates.length;
    return templates[nextIndex];
  }, [templates, sessions]);

  // Auto-advance week if 7 days have passed (runs once on mount)
  useEffect(() => {
    if (!weekStartedAt) return;

    const weekStart = new Date(weekStartedAt);
    const now = new Date();
    const daysSinceStart = Math.floor(
      (now.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceStart >= 7) {
      advanceWeek();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create stable sessions count for dependency tracking
  const completedSessionCount = useMemo(
    () => sessions.filter(s => s.completedAt).length,
    [sessions]
  );

  // Load PT Summary
  useEffect(() => {
    const loadPTSummary = async () => {
      if (!preferences.openaiApiKey || completedSessionCount < 2) return;

      // Only show loading spinner if cache is not valid (will actually fetch from AI)
      const hasCachedResults = hasValidPTSummaryCache(sessions);
      if (!hasCachedResults) {
        setLoadingPTSummary(true);
      }

      try {
        const summary = await getPTSummary(
          preferences.openaiApiKey,
          sessions,
          weightEntries,
          customExercises,
          preferences.firstName,
          experienceLevel || 'intermediate',
          workoutGoal,
          currentWeek,
          preferences.weeklyWorkoutGoal ?? 4
        );
        setPTSummary(summary);
      } catch (err) {
        console.error('Failed to load PT summary:', err);
      } finally {
        setLoadingPTSummary(false);
      }
    };

    loadPTSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferences.openaiApiKey, completedSessionCount, customExercises, experienceLevel, workoutGoal, currentWeek]);

  return {
    // Store values
    templates,
    sessions,
    activeSession,
    preferences,
    currentWeek,
    workoutGoal,

    // Computed values
    hasApiKey,
    goalInfo,
    recentSessions,
    nextWorkout,
    memberSince,

    // Weight tracking
    weightEntries,
    lastWeightEntry,
    shouldShowWeightReminder,

    // PT Summary
    ptSummary,
    loadingPTSummary,
  };
};
