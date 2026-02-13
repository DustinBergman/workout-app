import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHome } from './useHome';
import { useAppStore } from '../store/useAppStore';
import { WorkoutTemplate, WorkoutSession, BUILD_5_WEEK_CYCLE, LOSE_5_WEEK_CYCLE } from '../types';

// Mock openai service
vi.mock('../services/openai', () => ({
  getProgressiveOverloadRecommendations: vi.fn().mockResolvedValue([]),
  createSessionsHash: vi.fn((sessions) => sessions.map((s: { id: string }) => s.id).join('|')),
  hasValidRecommendationsCache: vi.fn().mockReturnValue(false),
}));

// Mock useAuth
vi.mock('./useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'test-user', created_at: '2024-01-01T00:00:00Z' },
    session: null,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  })),
}));

const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: `template-${Date.now()}-${Math.random()}`,
  name: 'Test Template',
  templateType: 'strength',
  exercises: [],
  inRotation: true,
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
    workoutGoal: 'build',
    hasCompletedIntro: false,
    cycleConfig: BUILD_5_WEEK_CYCLE,
    cycleState: {
      cycleConfigId: BUILD_5_WEEK_CYCLE.id,
      cycleStartDate: new Date().toISOString(),
      currentPhaseIndex: 0,
      currentWeekInPhase: 1,
    },
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

  describe('workoutGoal', () => {
    it('should return build goal', () => {
      useAppStore.setState({ workoutGoal: 'build' });
      const { result } = renderHook(() => useHome());
      expect(result.current.workoutGoal).toBe('build');
    });

    it('should return lose goal', () => {
      useAppStore.setState({
        workoutGoal: 'lose',
        cycleConfig: LOSE_5_WEEK_CYCLE,
        cycleState: {
          cycleConfigId: LOSE_5_WEEK_CYCLE.id,
          cycleStartDate: new Date().toISOString(),
          currentPhaseIndex: 0,
          currentWeekInPhase: 1,
        },
      });
      const { result } = renderHook(() => useHome());
      expect(result.current.workoutGoal).toBe('lose');
    });

    it('should return maintain goal', () => {
      useAppStore.setState({ workoutGoal: 'maintain' });
      const { result } = renderHook(() => useHome());
      expect(result.current.workoutGoal).toBe('maintain');
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
  });

  describe('cycle info', () => {
    it('should return cycle config and state', () => {
      const { result } = renderHook(() => useHome());
      expect(result.current.cycleConfig.id).toBe('build-5');
      expect(result.current.cycleState.currentPhaseIndex).toBe(0);
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
        workoutGoal: 'lose',
        cycleConfig: LOSE_5_WEEK_CYCLE,
        cycleState: {
          cycleConfigId: LOSE_5_WEEK_CYCLE.id,
          cycleStartDate: new Date().toISOString(),
          currentPhaseIndex: 2,
          currentWeekInPhase: 1,
        },
      });

      const { result } = renderHook(() => useHome());

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.sessions).toHaveLength(1);
      expect(result.current.activeSession?.id).toBe('active-session');
      expect(result.current.workoutGoal).toBe('lose');
      expect(result.current.cycleState.currentPhaseIndex).toBe(2);
    });
  });

  describe('goalInfo', () => {
    it('should return correct goal info for build', () => {
      useAppStore.setState({ workoutGoal: 'build' });
      const { result } = renderHook(() => useHome());
      expect(result.current.goalInfo.name).toBe('Build Muscle');
      expect(result.current.goalInfo.cycleName).toBe('Progressive Overload');
    });

    it('should return correct goal info for lose', () => {
      useAppStore.setState({ workoutGoal: 'lose' });
      const { result } = renderHook(() => useHome());
      expect(result.current.goalInfo.name).toBe('Lose Weight');
      expect(result.current.goalInfo.cycleName).toBe('Fatigue Management');
    });

    it('should return correct goal info for maintain', () => {
      useAppStore.setState({ workoutGoal: 'maintain' });
      const { result } = renderHook(() => useHome());
      expect(result.current.goalInfo.name).toBe('Maintain');
      expect(result.current.goalInfo.cycleName).toBe('Intensity Waves');
    });
  });
});
