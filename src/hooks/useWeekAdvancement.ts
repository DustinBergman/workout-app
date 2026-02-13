import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  checkAdvancementEligibility,
  WeekAdvancementEligibility,
} from '../utils/weekAdvancement';
import { getCurrentPhase } from '../types/cycles';

export interface AdvancementInfo {
  fromLabel: string;
  toLabel: string;
  sessionsCompleted: number;
  requiredSessions: number;
  isCycleReset: boolean;
}

export interface UseWeekAdvancementReturn {
  showAdvancementPrompt: boolean;
  advancementInfo: AdvancementInfo | null;
  acceptAdvancement: () => void;
  dismissAdvancement: () => void;
}

const DISMISS_KEY = 'weekAdvancementDismissedAt';

export const useWeekAdvancement = (): UseWeekAdvancementReturn => {
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const cycleConfig = useAppStore((state) => state.cycleConfig);
  const cycleState = useAppStore((state) => state.cycleState);
  const advancePhase = useAppStore((state) => state.advancePhase);

  const weeklyWorkoutGoal = preferences.weeklyWorkoutGoal ?? 4;

  const [dismissed, setDismissed] = useState(false);

  // Check if dismissed within last 24 hours
  useEffect(() => {
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const hoursSinceDismiss = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (hoursSinceDismiss < 24) {
        setDismissed(true);
      } else {
        localStorage.removeItem(DISMISS_KEY);
      }
    }
  }, []);

  const eligibility = useMemo<WeekAdvancementEligibility | null>(() => {
    return checkAdvancementEligibility(sessions, cycleConfig, cycleState, weeklyWorkoutGoal);
  }, [sessions, weeklyWorkoutGoal, cycleConfig, cycleState]);

  const advancementInfo = useMemo<AdvancementInfo | null>(() => {
    if (!eligibility?.isEligible) return null;

    const currentPhase = getCurrentPhase(cycleConfig, cycleState);
    const fromLabel = currentPhase
      ? `${currentPhase.name} (Week ${cycleState.currentWeekInPhase}/${currentPhase.durationWeeks})`
      : 'Current';

    // Determine the next position
    const isLastWeekInPhase =
      cycleState.currentWeekInPhase >= currentPhase!.durationWeeks;
    const isLastPhase =
      cycleState.currentPhaseIndex >= cycleConfig.phases.length - 1;
    const isCycleReset = isLastWeekInPhase && isLastPhase;

    let toLabel: string;
    if (isCycleReset) {
      toLabel = `${cycleConfig.phases[0].name} (New Cycle)`;
    } else if (isLastWeekInPhase) {
      const nextPhase = cycleConfig.phases[cycleState.currentPhaseIndex + 1];
      toLabel = `${nextPhase.name} (Week 1/${nextPhase.durationWeeks})`;
    } else {
      toLabel = `${currentPhase!.name} (Week ${cycleState.currentWeekInPhase + 1}/${currentPhase!.durationWeeks})`;
    }

    return {
      fromLabel,
      toLabel,
      sessionsCompleted: eligibility.sessionsInPeriod,
      requiredSessions: eligibility.requiredSessions,
      isCycleReset,
    };
  }, [eligibility, cycleConfig, cycleState]);

  const acceptAdvancement = useCallback(() => {
    advancePhase();
    setDismissed(true);
    localStorage.removeItem(DISMISS_KEY);
  }, [advancePhase]);

  const dismissAdvancement = useCallback(() => {
    setDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  }, []);

  return {
    showAdvancementPrompt: !dismissed && !!advancementInfo,
    advancementInfo,
    acceptAdvancement,
    dismissAdvancement,
  };
};
