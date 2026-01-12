import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStartWorkout } from './useStartWorkout';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { WorkoutTemplate, StrengthTemplateExercise, StrengthSessionExercise } from '../types';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock openai service
vi.mock('../services/openai', () => ({
  getPreWorkoutSuggestions: vi.fn().mockResolvedValue([]),
}));

const createStrengthTemplateExercise = (
  exerciseId: string,
  overrides: Partial<StrengthTemplateExercise> = {}
): StrengthTemplateExercise => ({
  type: 'strength',
  exerciseId,
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  ...overrides,
});

const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: 'template-1',
  name: 'Test Template',
  templateType: 'strength',
  exercises: [
    createStrengthTemplateExercise('bench-press'),
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
      distanceUnit: 'mi',
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
    currentWeek: 0,
  });
  useCurrentWorkoutStore.getState().reset();
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

    // Check that suggestions were saved to current workout store (empty because no API key)
    expect(useCurrentWorkoutStore.getState().suggestions).toEqual([]);

    // Check that navigate was called
    expect(mockNavigate).toHaveBeenCalledWith('/workout');
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
        createStrengthTemplateExercise('bench-press', { targetSets: 4, targetReps: 8, restSeconds: 120 }),
        createStrengthTemplateExercise('overhead-press', { targetSets: 3, targetReps: 10, restSeconds: 90 }),
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

    const firstExercise = activeSession?.exercises[0] as StrengthSessionExercise;
    expect(firstExercise.exerciseId).toBe('bench-press');
    expect(firstExercise.targetSets).toBe(4);
    expect(firstExercise.targetReps).toBe(8);
    expect(firstExercise.sets).toEqual([]);

    expect(activeSession?.exercises[1].exerciseId).toBe('overhead-press');
  });

  it('should not fetch suggestions when no API key', async () => {
    const template = createMockTemplate();
    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      await result.current.startWorkout(template);
    });

    expect(result.current.isLoadingSuggestions).toBe(false);
    expect(useCurrentWorkoutStore.getState().suggestions).toEqual([]);
    expect(mockNavigate).toHaveBeenCalledWith('/workout');
  });

  it('should not fetch suggestions when in baseline week (week 0)', async () => {
    const { getPreWorkoutSuggestions } = await import('../services/openai');

    // Set up store with API key, sessions, but week 0 (baseline)
    useAppStore.setState({
      preferences: {
        weightUnit: 'lbs',
        distanceUnit: 'mi',
        defaultRestSeconds: 90,
        darkMode: false,
        openaiApiKey: 'test-api-key',
      },
      sessions: [{
        id: 'session-1',
        name: 'Previous Workout',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        exercises: [],
      }],
      currentWeek: 0, // Baseline week
    });

    const template = createMockTemplate();
    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      await result.current.startWorkout(template);
    });

    // Should not call AI suggestions in baseline week
    expect(getPreWorkoutSuggestions).not.toHaveBeenCalled();
    expect(useCurrentWorkoutStore.getState().suggestions).toEqual([]);
  });

  it('should fetch suggestions when not in baseline week', async () => {
    const { getPreWorkoutSuggestions } = await import('../services/openai');

    // Set up store with API key, sessions, and week 1 (not baseline)
    useAppStore.setState({
      preferences: {
        weightUnit: 'lbs',
        distanceUnit: 'mi',
        defaultRestSeconds: 90,
        darkMode: false,
        openaiApiKey: 'test-api-key',
      },
      sessions: [{
        id: 'session-1',
        name: 'Previous Workout',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        exercises: [],
      }],
      currentWeek: 1, // Not baseline week
      workoutGoal: 'build',
    });

    const template = createMockTemplate();
    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      await result.current.startWorkout(template);
    });

    // Should call AI suggestions when not in baseline week
    expect(getPreWorkoutSuggestions).toHaveBeenCalled();
  });

  it('should proceed with workout even if suggestions request times out', async () => {
    vi.useFakeTimers();
    const { getPreWorkoutSuggestions } = await import('../services/openai');

    // Mock a slow API that never resolves
    vi.mocked(getPreWorkoutSuggestions).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Set up store with API key, sessions, and week 1
    useAppStore.setState({
      preferences: {
        weightUnit: 'lbs',
        distanceUnit: 'mi',
        defaultRestSeconds: 90,
        darkMode: false,
        openaiApiKey: 'test-api-key',
      },
      sessions: [{
        id: 'session-1',
        name: 'Previous Workout',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        exercises: [],
      }],
      currentWeek: 1,
      workoutGoal: 'build',
    });

    const template = createMockTemplate();
    const { result } = renderHook(() => useStartWorkout());

    // Start the workout (don't await yet)
    let workoutPromise: Promise<void>;
    act(() => {
      workoutPromise = result.current.startWorkout(template);
    });

    // Fast-forward past the 30 second timeout
    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    // Wait for the workout to complete
    await act(async () => {
      await workoutPromise;
    });

    // Workout should still start with empty suggestions
    expect(useCurrentWorkoutStore.getState().suggestions).toEqual([]);
    expect(mockNavigate).toHaveBeenCalledWith('/workout');

    vi.useRealTimers();
  });

  it('should proceed with workout if API returns an error', async () => {
    const { getPreWorkoutSuggestions } = await import('../services/openai');

    // Mock API error (e.g., out of credits)
    vi.mocked(getPreWorkoutSuggestions).mockRejectedValue(new Error('Insufficient credits'));

    // Set up store with API key, sessions, and week 1
    useAppStore.setState({
      preferences: {
        weightUnit: 'lbs',
        distanceUnit: 'mi',
        defaultRestSeconds: 90,
        darkMode: false,
        openaiApiKey: 'test-api-key',
      },
      sessions: [{
        id: 'session-1',
        name: 'Previous Workout',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        exercises: [],
      }],
      currentWeek: 1,
      workoutGoal: 'build',
    });

    const template = createMockTemplate();
    const { result } = renderHook(() => useStartWorkout());

    await act(async () => {
      await result.current.startWorkout(template);
    });

    // Workout should still start with empty suggestions
    expect(useCurrentWorkoutStore.getState().suggestions).toEqual([]);
    expect(mockNavigate).toHaveBeenCalledWith('/workout');
    expect(result.current.isLoadingSuggestions).toBe(false);
  });
});
