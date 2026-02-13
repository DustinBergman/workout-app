import { describe, it, expect } from 'vitest';
import { checkAdvancementEligibility } from './weekAdvancement';
import type { WorkoutSession } from '../types';
import type { TrainingCycleConfig, UserCycleState } from '../types/cycles';

const makeSession = (completedDaysAgo: number): WorkoutSession => {
  const date = new Date();
  date.setDate(date.getDate() - completedDaysAgo);
  return {
    id: `session-${Math.random()}`,
    name: 'Test',
    startedAt: date.toISOString(),
    completedAt: date.toISOString(),
    exercises: [],
  };
};

const makeCycleConfig = (phaseDurations: number[]): TrainingCycleConfig => ({
  id: 'test-cycle',
  name: 'Test Cycle',
  description: 'Test',
  cycleType: 'strength',
  totalWeeks: phaseDurations.reduce((a, b) => a + b, 0),
  recommendedForExperience: ['intermediate'],
  recommendedForGoals: ['build'],
  phases: phaseDurations.map((dur, i) => ({
    type: i === phaseDurations.length - 1 ? 'deload' as const : 'accumulation' as const,
    name: `Phase ${i + 1}`,
    description: `Phase ${i + 1}`,
    durationWeeks: dur,
    repRangeMin: 6,
    repRangeMax: 12,
    intensityDescription: 'Moderate',
    aiGuidance: 'Test',
  })),
});

describe('checkAdvancementEligibility', () => {
  it('returns not eligible when fewer than 7 days in current period', () => {
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - 3);

    const cycleState: UserCycleState = {
      cycleConfigId: 'test-cycle',
      cycleStartDate: cycleStart.toISOString(),
      currentPhaseIndex: 0,
      currentWeekInPhase: 1,
    };

    const result = checkAdvancementEligibility(
      [makeSession(1), makeSession(2), makeSession(3)],
      makeCycleConfig([2, 1]),
      cycleState,
      4,
    );

    expect(result.isEligible).toBe(false);
    expect(result.daysSincePeriodStart).toBe(3);
  });

  it('returns eligible when 7+ days and enough sessions in first phase', () => {
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - 8);

    const cycleState: UserCycleState = {
      cycleConfigId: 'test-cycle',
      cycleStartDate: cycleStart.toISOString(),
      currentPhaseIndex: 0,
      currentWeekInPhase: 1,
    };

    const sessions = [makeSession(1), makeSession(3), makeSession(5)];
    const result = checkAdvancementEligibility(
      sessions,
      makeCycleConfig([2, 1]),
      cycleState,
      4,
    );

    expect(result.isEligible).toBe(true);
    expect(result.sessionsInPeriod).toBe(3);
  });

  it('calculates period start correctly for later phase', () => {
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - 22);

    const cycleState: UserCycleState = {
      cycleConfigId: 'test-cycle',
      cycleStartDate: cycleStart.toISOString(),
      currentPhaseIndex: 1,
      currentWeekInPhase: 1,
    };

    const sessions = [makeSession(1), makeSession(3), makeSession(5)];
    const result = checkAdvancementEligibility(
      sessions,
      makeCycleConfig([2, 2, 1]),
      cycleState,
      4,
    );

    expect(result.daysSincePeriodStart).toBe(8);
    expect(result.isEligible).toBe(true);
  });

  it('calculates period start correctly for week 2 within a phase', () => {
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - 16);

    const cycleState: UserCycleState = {
      cycleConfigId: 'test-cycle',
      cycleStartDate: cycleStart.toISOString(),
      currentPhaseIndex: 1,
      currentWeekInPhase: 2,
    };

    const sessions = [makeSession(1)];
    const result = checkAdvancementEligibility(
      sessions,
      makeCycleConfig([1, 3, 1]),
      cycleState,
      4,
    );

    expect(result.daysSincePeriodStart).toBe(2);
    expect(result.isEligible).toBe(false);
  });

  it('returns not eligible when sessions are outside the period window', () => {
    const cycleStart = new Date();
    cycleStart.setDate(cycleStart.getDate() - 8);

    const cycleState: UserCycleState = {
      cycleConfigId: 'test-cycle',
      cycleStartDate: cycleStart.toISOString(),
      currentPhaseIndex: 0,
      currentWeekInPhase: 1,
    };

    const sessions = [makeSession(10), makeSession(12), makeSession(14)];
    const result = checkAdvancementEligibility(
      sessions,
      makeCycleConfig([2, 1]),
      cycleState,
      4,
    );

    expect(result.sessionsInPeriod).toBe(0);
    expect(result.isEligible).toBe(false);
  });
});
