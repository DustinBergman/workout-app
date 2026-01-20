import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from './useAuth';
import { getPTSummary, hasValidPTSummaryCache, PTSummaryResponse } from '../services/openai';
import {
  detectDeloadNeed,
  DeloadRecommendation,
  calculateWeeksSinceDeload,
} from '../services/deloadDetection';
import {
  WorkoutTemplate,
  WorkoutSession,
  UserPreferences,
  ProgressiveOverloadWeek,
  WorkoutGoal,
  GoalInfo,
  WeightEntry,
  WORKOUT_GOALS,
  Exercise,
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

  // Deload recommendation
  deloadRecommendation: DeloadRecommendation | null;
  dismissDeloadRecommendation: () => void;
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
  const cycleConfig = useAppStore((state) => state.cycleConfig);
  const cycleState = useAppStore((state) => state.cycleState);
  const advancePhase = useAppStore((state) => state.advancePhase);

  // Get member since date from user's created_at
  const memberSince = useMemo(() => user?.created_at || undefined, [user?.created_at]);

  // Local state
  const [ptSummary, setPTSummary] = useState<PTSummaryResponse | null>(null);
  const [loadingPTSummary, setLoadingPTSummary] = useState(false);
  const [deloadDismissed, setDeloadDismissed] = useState(false);

  const dismissDeloadRecommendation = useCallback(() => {
    setDeloadDismissed(true);
    // Reset dismiss after 24 hours (on next page load)
    const dismissedAt = Date.now();
    localStorage.setItem('deloadDismissedAt', String(dismissedAt));
  }, []);

  // Check if deload was dismissed recently (within 24 hours)
  useEffect(() => {
    const dismissedAt = localStorage.getItem('deloadDismissedAt');
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        setDeloadDismissed(true);
      } else {
        localStorage.removeItem('deloadDismissedAt');
      }
    }
  }, []);

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

  // Deload recommendation (only if not dismissed)
  const deloadRecommendation = useMemo<DeloadRecommendation | null>(() => {
    if (deloadDismissed) return null;

    // Need at least 5 completed sessions to make recommendations
    const completedSessions = sessions.filter(s => s.completedAt);
    if (completedSessions.length < 5) return null;

    // Check if current phase is a deload phase
    let currentPhaseIsDeload = false;
    if (cycleConfig && cycleState) {
      const currentPhase = cycleConfig.phases[cycleState.currentPhaseIndex];
      currentPhaseIsDeload = currentPhase.type === 'deload';
    } else {
      // Legacy system: week 4 (index 4) is deload
      currentPhaseIsDeload = currentWeek === 4;
    }

    // Calculate weeks since last deload
    const weeksSinceLastDeload = cycleConfig && cycleState
      ? calculateWeeksSinceDeload(
          sessions,
          cycleState.cycleStartDate,
          cycleState.currentPhaseIndex,
          cycleConfig.phases.map(p => ({ type: p.type, durationWeeks: p.durationWeeks })),
          cycleState.currentWeekInPhase
        )
      : calculateWeeksSinceDeload(sessions);

    const recommendation = detectDeloadNeed({
      sessions: completedSessions,
      customExercises: customExercises as Exercise[],
      weeksSinceLastDeload,
      currentPhaseIsDeload,
    });

    // Only return if should deload
    return recommendation.shouldDeload ? recommendation : null;
  }, [sessions, customExercises, cycleConfig, cycleState, currentWeek, deloadDismissed]);

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

  // Auto-advance week/phase if 7 days have passed (runs once on mount)
  useEffect(() => {
    // If using new cycle system
    if (cycleConfig && cycleState) {
      const cycleStart = new Date(cycleState.cycleStartDate);
      const now = new Date();

      // Calculate which week of the cycle we should be in
      const daysSinceCycleStart = Math.floor(
        (now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weeksSinceCycleStart = Math.floor(daysSinceCycleStart / 7);

      // Calculate current expected week position
      let expectedPhaseIndex = 0;
      let expectedWeekInPhase = 1;
      let weekCounter = 0;

      for (let i = 0; i < cycleConfig.phases.length; i++) {
        const phase = cycleConfig.phases[i];
        if (weekCounter + phase.durationWeeks > weeksSinceCycleStart) {
          expectedPhaseIndex = i;
          expectedWeekInPhase = weeksSinceCycleStart - weekCounter + 1;
          break;
        }
        weekCounter += phase.durationWeeks;

        // If we've gone past the end of the cycle, it should have reset
        if (i === cycleConfig.phases.length - 1) {
          // Cycle should reset - for now just keep current state
          return;
        }
      }

      // Advance if we're behind
      if (
        expectedPhaseIndex > cycleState.currentPhaseIndex ||
        (expectedPhaseIndex === cycleState.currentPhaseIndex &&
          expectedWeekInPhase > cycleState.currentWeekInPhase)
      ) {
        advancePhase();
      }
      return;
    }

    // Legacy system - advance week if 7 days have passed
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
          preferences.weeklyWorkoutGoal ?? 4,
          preferences.distanceUnit
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

    // Deload recommendation
    deloadRecommendation,
    dismissDeloadRecommendation,
  };
};
