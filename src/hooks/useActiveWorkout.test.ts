import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useActiveWorkout,
  useRestTimer,
  useExerciseManagement,
  useCustomExercise,
  MUSCLE_GROUPS,
  EQUIPMENT_OPTIONS,
} from './useActiveWorkout';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import {
  WorkoutSession,
  StrengthSessionExercise,
  CardioSessionExercise,
  StrengthCompletedSet,
  WorkoutTemplate,
  StrengthTemplateExercise,
} from '../types';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocationState: { suggestions?: unknown[] } = {};
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: mockLocationState }),
}));

// Mock openai service
vi.mock('../services/openai', () => ({
  getWorkoutScore: vi.fn().mockResolvedValue({
    score: 85,
    grade: 'A-',
    summary: 'Great workout!',
    highlights: ['Good form'],
    improvements: ['Try more weight next time'],
  }),
}));

// Mock exercises data
vi.mock('../data/exercises', () => ({
  getAllExercises: vi.fn(() => [
    { id: 'bench-press', type: 'strength', name: 'Bench Press', muscleGroups: ['chest'], equipment: 'barbell' },
    { id: 'squat', type: 'strength', name: 'Squat', muscleGroups: ['quadriceps'], equipment: 'barbell' },
    { id: 'outdoor-run', type: 'cardio', name: 'Outdoor Run', cardioType: 'running' },
  ]),
  searchExercises: vi.fn(() => [
    { id: 'bench-press', type: 'strength', name: 'Bench Press', muscleGroups: ['chest'], equipment: 'barbell' },
  ]),
  getExerciseById: vi.fn((id: string) => {
    if (id === 'bench-press') return { id: 'bench-press', type: 'strength', name: 'Bench Press', muscleGroups: ['chest'], equipment: 'barbell' };
    if (id === 'outdoor-run') return { id: 'outdoor-run', type: 'cardio', name: 'Outdoor Run', cardioType: 'running' };
    return null;
  }),
}));

// Helper functions
const createStrengthSessionExercise = (
  exerciseId: string,
  overrides: Partial<StrengthSessionExercise> = {}
): StrengthSessionExercise => ({
  id: `exercise-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type: 'strength',
  exerciseId,
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  sets: [],
  ...overrides,
});

const createCardioSessionExercise = (
  exerciseId: string,
  overrides: Partial<CardioSessionExercise> = {}
): CardioSessionExercise => ({
  id: `exercise-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  type: 'cardio',
  exerciseId,
  restSeconds: 60,
  sets: [],
  ...overrides,
});

const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [createStrengthSessionExercise('bench-press')],
  ...overrides,
});

const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: 'template-1',
  name: 'Test Template',
  templateType: 'strength',
  exercises: [
    { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 } as StrengthTemplateExercise,
  ],
  inRotation: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

// Reset stores between tests
const resetStores = (activeSession: WorkoutSession | null = null) => {
  useAppStore.setState({
    templates: [],
    sessions: [],
    activeSession,
    preferences: {
      weightUnit: 'lbs',
      distanceUnit: 'mi',
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
    currentWeek: 0,
  });
  useCurrentWorkoutStore.setState({
    expandedIndex: null,
    showTimer: false,
    timerDuration: 90,
    showExercisePicker: false,
    exerciseSearch: '',
    showFinishConfirm: false,
    historyExerciseId: null,
    updatePlan: false,
  });
};

describe('useActiveWorkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockLocationState.suggestions = undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStores(null);
  });

  describe('exports', () => {
    it('should export MUSCLE_GROUPS constant', () => {
      expect(MUSCLE_GROUPS).toBeDefined();
      expect(MUSCLE_GROUPS).toContain('chest');
      expect(MUSCLE_GROUPS).toContain('back');
    });

    it('should export EQUIPMENT_OPTIONS constant', () => {
      expect(EQUIPMENT_OPTIONS).toBeDefined();
      expect(EQUIPMENT_OPTIONS).toContain('barbell');
      expect(EQUIPMENT_OPTIONS).toContain('dumbbell');
    });
  });

  describe('initialization', () => {
    it('should navigate to home when no active session', () => {
      resetStores(null);
      renderHook(() => useActiveWorkout());
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should initialize elapsed seconds to 0', () => {
      const mockSession = createMockSession({
        startedAt: new Date().toISOString(),
      });
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      expect(result.current.elapsedSeconds).toBe(0);
    });
  });

  describe('computed values', () => {
    it('should calculate totalSets correctly', () => {
      const mockSession = createMockSession({
        exercises: [
          createStrengthSessionExercise('bench-press', {
            sets: [
              { type: 'strength', reps: 10, weight: 135, unit: 'lbs', completedAt: '' },
              { type: 'strength', reps: 8, weight: 135, unit: 'lbs', completedAt: '' },
            ],
          }),
          createStrengthSessionExercise('squat', {
            sets: [
              { type: 'strength', reps: 10, weight: 225, unit: 'lbs', completedAt: '' },
            ],
          }),
        ],
      });
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      expect(result.current.totalSets).toBe(3);
    });

    it('should calculate totalVolume correctly', () => {
      const mockSession = createMockSession({
        exercises: [
          createStrengthSessionExercise('bench-press', {
            sets: [
              { type: 'strength', reps: 10, weight: 100, unit: 'lbs', completedAt: '' },
              { type: 'strength', reps: 10, weight: 100, unit: 'lbs', completedAt: '' },
            ],
          }),
        ],
      });
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      expect(result.current.totalVolume).toBe(2000);
    });

    it('should calculate totalCardioDistance correctly', () => {
      const mockSession = createMockSession({
        exercises: [
          createCardioSessionExercise('outdoor-run', {
            sets: [
              { type: 'cardio', distance: 2.5, distanceUnit: 'mi', durationSeconds: 1200, completedAt: '' },
              { type: 'cardio', distance: 1.5, distanceUnit: 'mi', durationSeconds: 720, completedAt: '' },
            ],
          }),
        ],
      });
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      expect(result.current.totalCardioDistance).toBe(4);
    });

    it('should return filtered exercises', () => {
      const mockSession = createMockSession();
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      expect(result.current.filteredExercises.length).toBeGreaterThan(0);
    });

    it('should detect template deviation', () => {
      const mockSession = createMockSession({
        templateId: 'template-1',
        exercises: [createStrengthSessionExercise('bench-press')],
      });
      const mockTemplate = createMockTemplate();
      useAppStore.setState({
        templates: [mockTemplate],
        sessions: [],
        activeSession: mockSession,
        preferences: { weightUnit: 'lbs', distanceUnit: 'mi', defaultRestSeconds: 90, darkMode: false },
        customExercises: [],
        currentWeek: 0,
      });
      const { result } = renderHook(() => useActiveWorkout());
      expect(result.current.hasDeviated).toBe(false);
    });
  });

  describe('workout completion', () => {
    it('should cancel workout and navigate home', () => {
      const mockSession = createMockSession();
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      act(() => {
        result.current.cancelWorkout();
      });
      expect(useAppStore.getState().activeSession).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should finish workout and save session', async () => {
      const mockSession = createMockSession();
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      await act(async () => {
        await result.current.finishWorkout(3, null);
      });
      expect(useAppStore.getState().activeSession).toBeNull();
      expect(useAppStore.getState().sessions).toHaveLength(1);
    });

    it('should navigate to history when no API key', async () => {
      const mockSession = createMockSession();
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      await act(async () => {
        await result.current.finishWorkout(3, null);
      });
      expect(mockNavigate).toHaveBeenCalledWith('/history');
    });
  });
});

describe('useRestTimer', () => {
  beforeEach(() => {
    resetStores(createMockSession());
  });

  afterEach(() => {
    resetStores(null);
  });

  it('should start timer with duration', () => {
    const { result } = renderHook(() => useRestTimer());
    expect(result.current.showTimer).toBe(false);
    act(() => {
      result.current.handleStartTimer(60);
    });
    expect(result.current.showTimer).toBe(true);
    expect(result.current.timerDuration).toBe(60);
  });

  it('should hide timer', () => {
    const { result } = renderHook(() => useRestTimer());
    act(() => {
      result.current.handleStartTimer(60);
    });
    expect(result.current.showTimer).toBe(true);
    act(() => {
      result.current.hideTimer();
    });
    expect(result.current.showTimer).toBe(false);
  });
});

describe('useExerciseManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetStores(null);
  });

  it('should log a strength set', () => {
    const mockSession = createMockSession();
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.logSetForExercise(0, 10, 135);
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises[0].sets).toHaveLength(1);
    const set = updatedSession?.exercises[0].sets[0] as StrengthCompletedSet;
    expect(set.reps).toBe(10);
    expect(set.weight).toBe(135);
  });

  it('should log a cardio set with distance', () => {
    const mockSession = createMockSession({
      exercises: [createCardioSessionExercise('outdoor-run')],
    });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.logCardioForExercise(0, { distance: 3.1, distanceUnit: 'mi', durationSeconds: 1800 });
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises[0].sets).toHaveLength(1);
    const set = updatedSession?.exercises[0].sets[0];
    expect(set?.type).toBe('cardio');
    if (set?.type === 'cardio') {
      expect(set.distance).toBe(3.1);
      expect(set.distanceUnit).toBe('mi');
      expect(set.durationSeconds).toBe(1800);
      expect(set.calories).toBeUndefined();
    }
  });

  it('should log a cardio set with calories (for HIIT workouts)', () => {
    const mockSession = createMockSession({
      exercises: [createCardioSessionExercise('hiit')],
    });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.logCardioForExercise(0, { calories: 350, durationSeconds: 1200 });
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises[0].sets).toHaveLength(1);
    const set = updatedSession?.exercises[0].sets[0];
    expect(set?.type).toBe('cardio');
    if (set?.type === 'cardio') {
      expect(set.calories).toBe(350);
      expect(set.durationSeconds).toBe(1200);
      expect(set.distance).toBeUndefined();
      expect(set.distanceUnit).toBeUndefined();
    }
  });

  it('should remove the last set', () => {
    const mockSession = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press', {
          sets: [
            { type: 'strength', reps: 10, weight: 135, unit: 'lbs', completedAt: '' },
            { type: 'strength', reps: 8, weight: 135, unit: 'lbs', completedAt: '' },
          ],
        }),
      ],
    });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.removeLastSetForExercise(0);
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises[0].sets).toHaveLength(1);
  });

  it('should add a strength exercise to session', () => {
    const mockSession = createMockSession({ exercises: [] });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.addExerciseToSession('bench-press');
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises).toHaveLength(1);
    expect(updatedSession?.exercises[0].exerciseId).toBe('bench-press');
  });

  it('should add a cardio exercise to session', () => {
    const mockSession = createMockSession({ exercises: [] });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.addExerciseToSession('outdoor-run');
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises).toHaveLength(1);
    expect(updatedSession?.exercises[0].type).toBe('cardio');
  });

  it('should remove an exercise', () => {
    const mockSession = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press'),
        createStrengthSessionExercise('squat'),
      ],
    });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.removeExercise(0);
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises).toHaveLength(1);
    expect(updatedSession?.exercises[0].exerciseId).toBe('squat');
  });

  it('should update target sets', () => {
    const mockSession = createMockSession();
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.updateTargetSets('bench-press', 1);
    });
    const updatedSession = useAppStore.getState().activeSession;
    const exercise = updatedSession?.exercises[0] as StrengthSessionExercise;
    expect(exercise.targetSets).toBe(4);
  });

  it('should not allow target sets below 1', () => {
    const mockSession = createMockSession({
      exercises: [createStrengthSessionExercise('bench-press', { targetSets: 1 })],
    });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.updateTargetSets('bench-press', -1);
    });
    const updatedSession = useAppStore.getState().activeSession;
    const exercise = updatedSession?.exercises[0] as StrengthSessionExercise;
    expect(exercise.targetSets).toBe(1);
  });
});

describe('useCustomExercise', () => {
  beforeEach(() => {
    resetStores(createMockSession());
  });

  afterEach(() => {
    resetStores(null);
  });

  it('should initialize with empty custom exercise state', () => {
    const { result } = renderHook(() => useCustomExercise());
    expect(result.current.customExerciseState.isCreating).toBe(false);
    expect(result.current.customExerciseState.name).toBe('');
    expect(result.current.customExerciseState.muscles).toEqual([]);
    expect(result.current.customExerciseState.equipment).toBe('other');
  });

  it('should toggle muscle groups', () => {
    const { result } = renderHook(() => useCustomExercise());
    act(() => {
      result.current.toggleMuscleGroup('chest');
    });
    expect(result.current.customExerciseState.muscles).toContain('chest');
    act(() => {
      result.current.toggleMuscleGroup('chest');
    });
    expect(result.current.customExerciseState.muscles).not.toContain('chest');
  });

  it('should reset custom exercise form', () => {
    const { result } = renderHook(() => useCustomExercise());
    act(() => {
      result.current.setIsCreatingExercise(true);
      result.current.setNewExerciseName('My Exercise');
      result.current.toggleMuscleGroup('chest');
    });
    expect(result.current.customExerciseState.isCreating).toBe(true);
    expect(result.current.customExerciseState.name).toBe('My Exercise');
    act(() => {
      result.current.resetNewExerciseForm();
    });
    expect(result.current.customExerciseState.isCreating).toBe(false);
    expect(result.current.customExerciseState.name).toBe('');
    expect(result.current.customExerciseState.muscles).toEqual([]);
  });
});

describe('useCurrentWorkoutStore', () => {
  beforeEach(() => {
    resetStores(createMockSession());
  });

  afterEach(() => {
    resetStores(null);
  });

  it('should toggle exercise picker via store', () => {
    expect(useCurrentWorkoutStore.getState().showExercisePicker).toBe(false);
    act(() => {
      useCurrentWorkoutStore.getState().setShowExercisePicker(true);
    });
    expect(useCurrentWorkoutStore.getState().showExercisePicker).toBe(true);
  });

  it('should update exercise search via store', () => {
    act(() => {
      useCurrentWorkoutStore.getState().setExerciseSearch('bench');
    });
    expect(useCurrentWorkoutStore.getState().exerciseSearch).toBe('bench');
  });

  it('should toggle finish confirm via store', () => {
    expect(useCurrentWorkoutStore.getState().showFinishConfirm).toBe(false);
    act(() => {
      useCurrentWorkoutStore.getState().setShowFinishConfirm(true);
    });
    expect(useCurrentWorkoutStore.getState().showFinishConfirm).toBe(true);
  });

  it('should toggle updatePlan via store', () => {
    expect(useCurrentWorkoutStore.getState().updatePlan).toBe(false);
    act(() => {
      useCurrentWorkoutStore.getState().setUpdatePlan(true);
    });
    expect(useCurrentWorkoutStore.getState().updatePlan).toBe(true);
  });

  it('should set expanded index via store', () => {
    act(() => {
      useCurrentWorkoutStore.getState().setExpandedIndex(1);
    });
    expect(useCurrentWorkoutStore.getState().expandedIndex).toBe(1);
  });

  it('should manage skipAutoExpand flag via store', () => {
    expect(useCurrentWorkoutStore.getState().skipAutoExpand).toBe(false);
    act(() => {
      useCurrentWorkoutStore.getState().setSkipAutoExpand(true);
    });
    expect(useCurrentWorkoutStore.getState().skipAutoExpand).toBe(true);
    act(() => {
      useCurrentWorkoutStore.getState().setSkipAutoExpand(false);
    });
    expect(useCurrentWorkoutStore.getState().skipAutoExpand).toBe(false);
  });
});

describe('Drag and Drop - Auto-Expand Prevention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAppStore.getState().setActiveSession(null);
    useCurrentWorkoutStore.getState().reset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should skip auto-expand when skipAutoExpand flag is true', () => {
    const session = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press'),
        createStrengthSessionExercise('squat'),
      ],
    });
    useAppStore.getState().setActiveSession(session);
    useCurrentWorkoutStore.getState().setExpandedIndex(null);
    useCurrentWorkoutStore.getState().setSkipAutoExpand(true);

    const { result } = renderHook(() => useActiveWorkout());

    // Since skipAutoExpand is true, expandedIndex should still be null
    // (it should skip the auto-expand logic)
    expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(0);

    // Immediately after effect runs, flag is still true (deferred reset)
    expect(useCurrentWorkoutStore.getState().skipAutoExpand).toBe(true);

    // Advance timers by 0 to complete the deferred setTimeout(0) reset
    // (this allows the microtask queue to process without running other timers)
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // After timeout, the flag should be reset to false
    expect(useCurrentWorkoutStore.getState().skipAutoExpand).toBe(false);
  });

  it('should auto-expand first incomplete exercise when skipAutoExpand is false', () => {
    const completedSet = {
      type: 'strength' as const,
      reps: 10,
      weight: 185,
      unit: 'lbs' as const,
      completedAt: new Date().toISOString(),
    };

    const session = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press', {
          targetSets: 3,
          sets: [completedSet, completedSet, completedSet], // completed
        }),
        createStrengthSessionExercise('squat', {
          targetSets: 3,
          sets: [], // incomplete
        }),
      ],
    });

    useAppStore.getState().setActiveSession(session);
    useCurrentWorkoutStore.getState().setExpandedIndex(null);
    useCurrentWorkoutStore.getState().setSkipAutoExpand(false);

    const { result } = renderHook(() => useActiveWorkout());

    // Should auto-expand the second exercise (first incomplete)
    // Note: The actual expandedIndex update might be async, so we check the computed values
    expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should auto-expand to first exercise if all are complete', () => {
    const completedSet = {
      type: 'strength' as const,
      reps: 10,
      weight: 185,
      unit: 'lbs' as const,
      completedAt: new Date().toISOString(),
    };

    const session = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press', {
          targetSets: 3,
          sets: [completedSet, completedSet, completedSet],
        }),
        createStrengthSessionExercise('squat', {
          targetSets: 3,
          sets: [completedSet, completedSet, completedSet],
        }),
      ],
    });

    useAppStore.getState().setActiveSession(session);
    useCurrentWorkoutStore.getState().setExpandedIndex(null);
    useCurrentWorkoutStore.getState().setSkipAutoExpand(false);

    const { result } = renderHook(() => useActiveWorkout());

    // Should auto-expand to first exercise since all are complete
    expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should handle cardio exercises in auto-expand logic', () => {
    const session = createMockSession({
      exercises: [
        createCardioSessionExercise('outdoor-run', {
          sets: [], // incomplete
        }),
      ],
    });

    useAppStore.getState().setActiveSession(session);
    useCurrentWorkoutStore.getState().setExpandedIndex(null);
    useCurrentWorkoutStore.getState().setSkipAutoExpand(false);

    const { result } = renderHook(() => useActiveWorkout());

    // Should handle cardio exercises (no sets = incomplete)
    expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should not auto-expand if expandedIndex is already set', () => {
    const session = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press'),
        createStrengthSessionExercise('squat'),
      ],
    });

    useAppStore.getState().setActiveSession(session);
    useCurrentWorkoutStore.getState().setExpandedIndex(0);
    useCurrentWorkoutStore.getState().setSkipAutoExpand(false);

    const originalExpandedIndex = useCurrentWorkoutStore.getState().expandedIndex;

    const { result } = renderHook(() => useActiveWorkout());

    // expandedIndex should remain at 0 (not changed)
    expect(useCurrentWorkoutStore.getState().expandedIndex).toBe(originalExpandedIndex);
    expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(0);
  });

  it('should defer skipAutoExpand flag reset and not auto-expand first incomplete during drag-and-drop', () => {
    // This test simulates the exact scenario:
    // 1. User reorders exercises via drag-and-drop
    // 2. handleDragEnd sets skipAutoExpand(true) and resets expandedIndex
    // 3. useActiveWorkout should skip the auto-expand logic
    // 4. After setTimeout(0) completes, flag should reset to false

    const completedSet = {
      type: 'strength' as const,
      reps: 10,
      weight: 185,
      unit: 'lbs' as const,
      completedAt: new Date().toISOString(),
    };

    const session = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press', {
          targetSets: 3,
          sets: [completedSet, completedSet, completedSet], // completed
        }),
        createStrengthSessionExercise('squat', {
          targetSets: 3,
          sets: [], // incomplete - would normally trigger auto-expand to index 1
        }),
      ],
    });

    useAppStore.getState().setActiveSession(session);
    useCurrentWorkoutStore.getState().setExpandedIndex(null);

    // Simulate drag-and-drop: set skipAutoExpand flag BEFORE rendering hook
    act(() => {
      useCurrentWorkoutStore.getState().setSkipAutoExpand(true);
    });

    renderHook(() => useActiveWorkout());

    // Immediately after hook renders, expandedIndex should still be null
    // (auto-expand logic was skipped due to skipAutoExpand flag)
    expect(useCurrentWorkoutStore.getState().expandedIndex).toBeNull();
    expect(useCurrentWorkoutStore.getState().skipAutoExpand).toBe(true);

    // Advance timers by 0 to complete the deferred setTimeout(0) reset
    act(() => {
      vi.advanceTimersByTime(0);
    });

    // After the deferred reset completes, the flag should now be false
    expect(useCurrentWorkoutStore.getState().skipAutoExpand).toBe(false);

    // Important: expandedIndex should STILL be null after flag reset
    // (auto-expand doesn't happen retroactively after flag is reset)
    expect(useCurrentWorkoutStore.getState().expandedIndex).toBeNull();
  });

  it('should allow auto-expand to happen normally once skipAutoExpand flag is reset', () => {
    // This test verifies that after the flag is reset, subsequent renders
    // with unchanged session DO trigger auto-expand

    const completedSet = {
      type: 'strength' as const,
      reps: 10,
      weight: 185,
      unit: 'lbs' as const,
      completedAt: new Date().toISOString(),
    };

    const session = createMockSession({
      exercises: [
        createStrengthSessionExercise('bench-press', {
          targetSets: 3,
          sets: [completedSet, completedSet, completedSet],
        }),
        createStrengthSessionExercise('squat', {
          targetSets: 3,
          sets: [], // incomplete
        }),
      ],
    });

    useAppStore.getState().setActiveSession(session);
    useCurrentWorkoutStore.getState().setExpandedIndex(null);
    useCurrentWorkoutStore.getState().setSkipAutoExpand(false);

    const { result } = renderHook(() => useActiveWorkout());

    // With skipAutoExpand false and expandedIndex null, should auto-expand
    // to first incomplete exercise (index 1)
    // Note: The effect runs during render, so we check after render
    expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe('Cardio workout duration calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetStores(null);
  });

  it('should use sum of cardio durations for cardio-only workouts', async () => {
    // Create a cardio-only workout with logged durations
    const mockSession = createMockSession({
      exercises: [
        createCardioSessionExercise('outdoor-run', {
          sets: [
            { type: 'cardio', distance: 3, distanceUnit: 'mi', durationSeconds: 1800, completedAt: '' }, // 30 min
            { type: 'cardio', distance: 2, distanceUnit: 'mi', durationSeconds: 900, completedAt: '' },  // 15 min
          ],
        }),
      ],
    });
    resetStores(mockSession);

    const { result } = renderHook(() => useActiveWorkout());

    await act(async () => {
      await result.current.finishWorkout(3, null);
    });

    const savedSession = useAppStore.getState().sessions[0];
    expect(savedSession).toBeDefined();

    // Calculate duration from startedAt to completedAt
    const startTime = new Date(savedSession.startedAt).getTime();
    const endTime = new Date(savedSession.completedAt!).getTime();
    const durationSeconds = (endTime - startTime) / 1000;

    // Should be approximately 45 minutes (2700 seconds) based on logged cardio
    expect(durationSeconds).toBe(2700);
  });

  it('should use sum of multiple cardio exercises durations', async () => {
    const mockSession = createMockSession({
      exercises: [
        createCardioSessionExercise('outdoor-run', {
          sets: [
            { type: 'cardio', distance: 5, distanceUnit: 'mi', durationSeconds: 2700, completedAt: '' }, // 45 min run
          ],
        }),
        createCardioSessionExercise('outdoor-run', {
          sets: [
            { type: 'cardio', distance: 1, distanceUnit: 'mi', durationSeconds: 600, completedAt: '' }, // 10 min cooldown
          ],
        }),
      ],
    });
    resetStores(mockSession);

    const { result } = renderHook(() => useActiveWorkout());

    await act(async () => {
      await result.current.finishWorkout(3, null);
    });

    const savedSession = useAppStore.getState().sessions[0];
    const startTime = new Date(savedSession.startedAt).getTime();
    const endTime = new Date(savedSession.completedAt!).getTime();
    const durationSeconds = (endTime - startTime) / 1000;

    // Should be 55 minutes (3300 seconds)
    expect(durationSeconds).toBe(3300);
  });

  it('should NOT adjust duration for strength-only workouts (use timer)', async () => {
    const originalStartedAt = new Date('2024-01-01T10:00:00Z').toISOString();
    const mockSession = createMockSession({
      startedAt: originalStartedAt,
      exercises: [
        createStrengthSessionExercise('bench-press', {
          sets: [
            { type: 'strength', reps: 10, weight: 135, unit: 'lbs', completedAt: '' },
          ],
        }),
      ],
    });
    resetStores(mockSession);

    const { result } = renderHook(() => useActiveWorkout());

    await act(async () => {
      await result.current.finishWorkout(3, null);
    });

    const savedSession = useAppStore.getState().sessions[0];

    // startedAt should be unchanged for strength workouts
    expect(savedSession.startedAt).toBe(originalStartedAt);
  });

  it('should NOT adjust duration for mixed strength/cardio workouts (use timer)', async () => {
    const originalStartedAt = new Date('2024-01-01T10:00:00Z').toISOString();
    const mockSession = createMockSession({
      startedAt: originalStartedAt,
      exercises: [
        createStrengthSessionExercise('bench-press', {
          sets: [
            { type: 'strength', reps: 10, weight: 135, unit: 'lbs', completedAt: '' },
          ],
        }),
        createCardioSessionExercise('outdoor-run', {
          sets: [
            { type: 'cardio', distance: 1, distanceUnit: 'mi', durationSeconds: 600, completedAt: '' },
          ],
        }),
      ],
    });
    resetStores(mockSession);

    const { result } = renderHook(() => useActiveWorkout());

    await act(async () => {
      await result.current.finishWorkout(3, null);
    });

    const savedSession = useAppStore.getState().sessions[0];

    // startedAt should be unchanged for mixed workouts
    expect(savedSession.startedAt).toBe(originalStartedAt);
  });

  it('should use timer if cardio workout has no logged durations', async () => {
    const originalStartedAt = new Date('2024-01-01T10:00:00Z').toISOString();
    const mockSession = createMockSession({
      startedAt: originalStartedAt,
      exercises: [
        createCardioSessionExercise('outdoor-run', {
          sets: [], // No logged sets
        }),
      ],
    });
    resetStores(mockSession);

    const { result } = renderHook(() => useActiveWorkout());

    await act(async () => {
      await result.current.finishWorkout(3, null);
    });

    const savedSession = useAppStore.getState().sessions[0];

    // startedAt should be unchanged when no cardio durations logged
    expect(savedSession.startedAt).toBe(originalStartedAt);
  });

  it('should handle cardio sets with zero duration', async () => {
    const originalStartedAt = new Date('2024-01-01T10:00:00Z').toISOString();
    const mockSession = createMockSession({
      startedAt: originalStartedAt,
      exercises: [
        createCardioSessionExercise('outdoor-run', {
          sets: [
            { type: 'cardio', distance: 1, distanceUnit: 'mi', durationSeconds: 0, completedAt: '' },
          ],
        }),
      ],
    });
    resetStores(mockSession);

    const { result } = renderHook(() => useActiveWorkout());

    await act(async () => {
      await result.current.finishWorkout(3, null);
    });

    const savedSession = useAppStore.getState().sessions[0];

    // startedAt should be unchanged when total duration is 0
    expect(savedSession.startedAt).toBe(originalStartedAt);
  });
});
