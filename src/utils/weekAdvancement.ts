import type { WorkoutSession } from '../types';
import type { TrainingCycleConfig, UserCycleState } from '../types/cycles';

export interface WeekAdvancementEligibility {
  isEligible: boolean;
  sessionsInPeriod: number;
  requiredSessions: number;
  daysSincePeriodStart: number;
}

export const checkAdvancementEligibility = (
  sessions: WorkoutSession[],
  cycleConfig: TrainingCycleConfig,
  cycleState: UserCycleState,
  weeklyWorkoutGoal: number,
): WeekAdvancementEligibility => {
  const cycleStart = new Date(cycleState.cycleStartDate);

  // Calculate how many weeks of prior phases have elapsed
  let priorWeeks = 0;
  for (let i = 0; i < cycleState.currentPhaseIndex; i++) {
    priorWeeks += cycleConfig.phases[i].durationWeeks;
  }

  // Period start = cycle start + prior phase weeks + (currentWeekInPhase - 1) weeks
  const periodStartMs =
    cycleStart.getTime() + (priorWeeks + cycleState.currentWeekInPhase - 1) * 7 * 24 * 60 * 60 * 1000;
  const periodStart = new Date(periodStartMs);
  const now = new Date();

  const daysSincePeriodStart = Math.floor(
    (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
  );

  const requiredSessions = Math.ceil(weeklyWorkoutGoal * 0.75);

  const sessionsInPeriod = sessions.filter((s) => {
    if (!s.completedAt) return false;
    const completedAt = new Date(s.completedAt);
    return completedAt >= periodStart && completedAt <= now;
  }).length;

  return {
    isEligible: daysSincePeriodStart >= 7 && sessionsInPeriod >= requiredSessions,
    sessionsInPeriod,
    requiredSessions,
    daysSincePeriodStart,
  };
};
