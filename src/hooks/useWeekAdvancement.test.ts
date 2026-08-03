import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BUILD_5_WEEK_CYCLE } from '../types';
import { useAppStore } from '../store/useAppStore';
import { useWeekAdvancement } from './useWeekAdvancement';

vi.mock('../utils/weekAdvancement', () => ({
  checkAdvancementEligibility: vi.fn(() => ({
    isEligible: true,
    sessionsInPeriod: 4,
    requiredSessions: 4,
  })),
}));

describe('useWeekAdvancement', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      sessions: [],
      preferences: {
        weightUnit: 'lbs',
        distanceUnit: 'mi',
        defaultRestSeconds: 90,
        darkMode: false,
        weeklyWorkoutGoal: 4,
      },
      cycleConfig: BUILD_5_WEEK_CYCLE,
      cycleState: {
        cycleConfigId: BUILD_5_WEEK_CYCLE.id,
        cycleStartDate: new Date().toISOString(),
        currentPhaseIndex: 0,
        currentWeekInPhase: 1,
      },
    });
  });

  it('does not permanently dismiss prompts after accepting advancement', async () => {
    const { result } = renderHook(() => useWeekAdvancement());

    act(() => {
      result.current.acceptAdvancement();
    });

    await waitFor(() => {
      expect(result.current.showAdvancementPrompt).toBe(true);
    });
    expect(useAppStore.getState().cycleState).toEqual(
      expect.objectContaining({
        currentPhaseIndex: 1,
        currentWeekInPhase: 1,
      })
    );
  });
});
