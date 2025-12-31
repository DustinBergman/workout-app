import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHome } from './useHome';
import { useAppStore } from '../store/useAppStore';
import { WorkoutTemplate, WorkoutSession, ProgressiveOverloadWeek } from '../types';

// Mock openai service
vi.mock('../services/openai', () => ({
  getProgressiveOverloadRecommendations: vi.fn().mockResolvedValue([]),
}));

const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: `template-${Date.now()}-${Math.random()}`,
  name: 'Test Template',
  exercises: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: `session-${Date.now()}-${Math.random()}`,
  name: 'Test Session',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

// Helper to reset store between tests
const resetStore = () => {
  useAppStore.setState({
    templates: [],
    sessions: [],
    activeSession: null,
    preferences: {
      weightUnit: 'lbs',
      distanceUnit: 'mi',
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
    currentWeek: 0 as ProgressiveOverloadWeek,
    weekStartedAt: null,
    workoutGoal: 'build',
    hasCompletedIntro: false,
  });
};

describe('useHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  describe('hasApiKey', () => {
    it('should return false when no API key', () => {
      const { result } = renderHook(() => useHome());
      expect(result.current.hasApiKey).toBe(false);
    });

    it('should return true when API key exists', () => {
      useAppStore.setState({
        preferences: {
          weightUnit: 'lbs',
          distanceUnit: 'mi',
          defaultRestSeconds: 90,
          darkMode: false,
          openaiApiKey: 'sk-test-key',
        },
      });

      const { result } = renderHook(() => useHome());
      expect(result.current.hasApiKey).toBe(true);
    });
  });

  describe('showProgressiveOverload', () => {
    it('should return true for build goal', () => {
      useAppStore.setState({ workoutGoal: 'build' });
      const { result } = renderHook(() => useHome());
      expect(result.current.showProgressiveOverload).toBe(true);
    });

    it('should return false for lose goal', () => {
      useAppStore.setState({ workoutGoal: 'lose' });
      const { result } = renderHook(() => useHome());
      expect(result.current.showProgressiveOverload).toBe(false);
    });

    it('should return false for maintain goal', () => {
      useAppStore.setState({ workoutGoal: 'maintain' });
      const { result } = renderHook(() => useHome());
      expect(result.current.showProgressiveOverload).toBe(false);
    });
  });

  describe('recentSessions', () => {
    it('should return empty array when no sessions', () => {
      const { result } = renderHook(() => useHome());
      expect(result.current.recentSessions).toEqual([]);
    });

    it('should return most recent 3 sessions sorted by date', () => {
      const session1 = createMockSession({
        id: 'session-1',
        name: 'Session 1',
        startedAt: '2024-01-01T10:00:00Z',
      });
      const session2 = createMockSession({
        id: 'session-2',
        name: 'Session 2',
        startedAt: '2024-01-03T10:00:00Z',
      });
      const session3 = createMockSession({
        id: 'session-3',
        name: 'Session 3',
        startedAt: '2024-01-02T10:00:00Z',
      });
      const session4 = createMockSession({
        id: 'session-4',
        name: 'Session 4',
        startedAt: '2024-01-04T10:00:00Z',
      });

      useAppStore.setState({
        sessions: [session1, session2, session3, session4],
      });

      const { result } = renderHook(() => useHome());

      expect(result.current.recentSessions).toHaveLength(3);
      expect(result.current.recentSessions[0].id).toBe('session-4');
      expect(result.current.recentSessions[1].id).toBe('session-2');
      expect(result.current.recentSessions[2].id).toBe('session-3');
    });

    it('should return all sessions if less than 3', () => {
      const session1 = createMockSession({ id: 'session-1' });
      const session2 = createMockSession({ id: 'session-2' });

      useAppStore.setState({ sessions: [session1, session2] });

      const { result } = renderHook(() => useHome());
      expect(result.current.recentSessions).toHaveLength(2);
    });
  });

  describe('nextWorkout', () => {
    it('should return null when no templates', () => {
      const { result } = renderHook(() => useHome());
      expect(result.current.nextWorkout).toBeNull();
    });

    it('should return first template when no sessions', () => {
      const template1 = createMockTemplate({ id: 'template-1', name: 'Push' });
      const template2 = createMockTemplate({ id: 'template-2', name: 'Pull' });

      useAppStore.setState({ templates: [template1, template2] });

      const { result } = renderHook(() => useHome());
      expect(result.current.nextWorkout?.id).toBe('template-1');
    });

    it('should return next template in rotation', () => {
      const template1 = createMockTemplate({ id: 'template-1', name: 'Push' });
      const template2 = createMockTemplate({ id: 'template-2', name: 'Pull' });
      const template3 = createMockTemplate({ id: 'template-3', name: 'Legs' });

      const session = createMockSession({
        templateId: 'template-1',
        startedAt: '2024-01-01T10:00:00Z',
      });

      useAppStore.setState({
        templates: [template1, template2, template3],
        sessions: [session],
      });

      const { result } = renderHook(() => useHome());
      expect(result.current.nextWorkout?.id).toBe('template-2');
    });

    it('should cycle back to first template after last', () => {
      const template1 = createMockTemplate({ id: 'template-1', name: 'Push' });
      const template2 = createMockTemplate({ id: 'template-2', name: 'Pull' });

      const session = createMockSession({
        templateId: 'template-2',
        startedAt: '2024-01-01T10:00:00Z',
      });

      useAppStore.setState({
        templates: [template1, template2],
        sessions: [session],
      });

      const { result } = renderHook(() => useHome());
      expect(result.current.nextWorkout?.id).toBe('template-1');
    });

    it('should return first template when last session has no templateId', () => {
      const template1 = createMockTemplate({ id: 'template-1', name: 'Push' });

      const session = createMockSession({
        startedAt: '2024-01-01T10:00:00Z',
        // No templateId (quick workout)
      });

      useAppStore.setState({
        templates: [template1],
        sessions: [session],
      });

      const { result } = renderHook(() => useHome());
      expect(result.current.nextWorkout?.id).toBe('template-1');
    });

    it('should use most recent session with templateId', () => {
      const template1 = createMockTemplate({ id: 'template-1', name: 'Push' });
      const template2 = createMockTemplate({ id: 'template-2', name: 'Pull' });
      const template3 = createMockTemplate({ id: 'template-3', name: 'Legs' });

      const session1 = createMockSession({
        templateId: 'template-1',
        startedAt: '2024-01-01T10:00:00Z',
      });
      const session2 = createMockSession({
        templateId: 'template-2',
        startedAt: '2024-01-02T10:00:00Z',
      });
      const quickSession = createMockSession({
        // No templateId
        startedAt: '2024-01-03T10:00:00Z',
      });

      useAppStore.setState({
        templates: [template1, template2, template3],
        sessions: [session1, session2, quickSession],
      });

      const { result } = renderHook(() => useHome());
      // Most recent with templateId is session2 (template-2), so next is template-3
      expect(result.current.nextWorkout?.id).toBe('template-3');
    });
  });

  describe('auto-advance week', () => {
    it('should not advance when weekStartedAt is null', () => {
      const advanceWeekSpy = vi.fn();
      useAppStore.setState({
        weekStartedAt: null,
        advanceWeek: advanceWeekSpy,
      });

      renderHook(() => useHome());
      expect(advanceWeekSpy).not.toHaveBeenCalled();
    });

    it('should not advance when less than 7 days have passed', () => {
      const advanceWeekSpy = vi.fn();
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      useAppStore.setState({
        weekStartedAt: sixDaysAgo.toISOString(),
        advanceWeek: advanceWeekSpy,
      });

      renderHook(() => useHome());
      expect(advanceWeekSpy).not.toHaveBeenCalled();
    });

    it('should advance when 7 or more days have passed', () => {
      const advanceWeekSpy = vi.fn();
      const eightDaysAgo = new Date();
      eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

      useAppStore.setState({
        weekStartedAt: eightDaysAgo.toISOString(),
        advanceWeek: advanceWeekSpy,
      });

      renderHook(() => useHome());
      expect(advanceWeekSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('week selector', () => {
    it('should start with showWeekSelector as false', () => {
      const { result } = renderHook(() => useHome());
      expect(result.current.showWeekSelector).toBe(false);
    });

    it('should toggle showWeekSelector', () => {
      const { result } = renderHook(() => useHome());

      act(() => {
        result.current.setShowWeekSelector(true);
      });
      expect(result.current.showWeekSelector).toBe(true);

      act(() => {
        result.current.setShowWeekSelector(false);
      });
      expect(result.current.showWeekSelector).toBe(false);
    });

    it('should select week and close modal', () => {
      const { result } = renderHook(() => useHome());

      act(() => {
        result.current.setShowWeekSelector(true);
      });
      expect(result.current.showWeekSelector).toBe(true);

      act(() => {
        result.current.selectWeek(3 as ProgressiveOverloadWeek);
      });

      expect(result.current.showWeekSelector).toBe(false);
      expect(useAppStore.getState().currentWeek).toBe(3);
    });
  });

  describe('store values', () => {
    it('should return store values', () => {
      const template = createMockTemplate({ id: 'test-template' });
      const session = createMockSession({ id: 'test-session' });
      const activeSession = createMockSession({ id: 'active-session' });

      useAppStore.setState({
        templates: [template],
        sessions: [session],
        activeSession,
        currentWeek: 2 as ProgressiveOverloadWeek,
        workoutGoal: 'lose',
      });

      const { result } = renderHook(() => useHome());

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.activeSession?.id).toBe('active-session');
      expect(result.current.currentWeek).toBe(2);
      expect(result.current.workoutGoal).toBe('lose');
    });
  });

  describe('goalInfo', () => {
    it('should return correct goal info for build', () => {
      useAppStore.setState({ workoutGoal: 'build' });
      const { result } = renderHook(() => useHome());
      expect(result.current.goalInfo.name).toBe('Build Muscle');
      expect(result.current.goalInfo.useProgressiveOverload).toBe(true);
    });

    it('should return correct goal info for lose', () => {
      useAppStore.setState({ workoutGoal: 'lose' });
      const { result } = renderHook(() => useHome());
      expect(result.current.goalInfo.name).toBe('Lose Weight');
      expect(result.current.goalInfo.useProgressiveOverload).toBe(false);
    });

    it('should return correct goal info for maintain', () => {
      useAppStore.setState({ workoutGoal: 'maintain' });
      const { result } = renderHook(() => useHome());
      expect(result.current.goalInfo.name).toBe('Maintain');
      expect(result.current.goalInfo.useProgressiveOverload).toBe(false);
    });
  });
});
