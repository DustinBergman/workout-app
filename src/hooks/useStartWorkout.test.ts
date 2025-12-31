import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStartWorkout } from './useStartWorkout';
import { useAppStore } from '../store/useAppStore';
import { WorkoutTemplate } from '../types';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock openai service
vi.mock('../services/openai', () => ({
  getPreWorkoutSuggestions: vi.fn().mockResolvedValue([]),
}));

const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: 'template-1',
  name: 'Test Template',
  exercises: [
    {
      exerciseId: 'bench-press',
      targetSets: 3,
      targetReps: 10,
      restSeconds: 90,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
    currentWeek: 0,
  });
};

describe('useStartWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('should return isLoadingSuggestions as false initially', () => {
    const { result } = renderHook(() => useStartWorkout());

    expect(result.current.isLoadingSuggestions).toBe(false);
  });

  it('should start a workout from template', async () => {
    const template = createMockTemplate();
    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      await result.current.startWorkout(template);
    });

    // Check that activeSession was set in store
    const activeSession = useAppStore.getState().activeSession;
    expect(activeSession).not.toBeNull();
    expect(activeSession?.templateId).toBe('template-1');
    expect(activeSession?.name).toBe('Test Template');

    // Check that navigate was called
    expect(mockNavigate).toHaveBeenCalledWith('/workout', { state: { suggestions: [] } });
  });

  it('should start a quick workout', async () => {
    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      result.current.startQuickWorkout();
    });

    // Check that activeSession was set
    const activeSession = useAppStore.getState().activeSession;
    expect(activeSession).not.toBeNull();
    expect(activeSession?.name).toBe('Quick Workout');
    expect(activeSession?.exercises).toEqual([]);

    // Check that navigate was called
    expect(mockNavigate).toHaveBeenCalledWith('/workout');
  });

  it('should create session with correct structure from template', async () => {
    const template = createMockTemplate({
      id: 'push-day',
      name: 'Push Day',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 4, targetReps: 8, restSeconds: 120 },
        { exerciseId: 'overhead-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      ],
    });

    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      await result.current.startWorkout(template);
    });

    const activeSession = useAppStore.getState().activeSession;
    expect(activeSession?.templateId).toBe('push-day');
    expect(activeSession?.name).toBe('Push Day');
    expect(activeSession?.exercises).toHaveLength(2);
    expect(activeSession?.exercises[0].exerciseId).toBe('bench-press');
    expect(activeSession?.exercises[0].targetSets).toBe(4);
    expect(activeSession?.exercises[0].targetReps).toBe(8);
    expect(activeSession?.exercises[0].sets).toEqual([]);
    expect(activeSession?.exercises[1].exerciseId).toBe('overhead-press');
  });

  it('should not fetch suggestions when no API key', async () => {
    const template = createMockTemplate();
    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      await result.current.startWorkout(template);
    });

    expect(result.current.isLoadingSuggestions).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith('/workout', { state: { suggestions: [] } });
  });
});
