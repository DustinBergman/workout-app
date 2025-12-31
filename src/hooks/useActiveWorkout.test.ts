import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useActiveWorkout,
  useRestTimer,
  useExerciseManagement,
  useCustomExercise,
  useExerciseHistory,
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
  exercises: [
    { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 } as StrengthTemplateExercise,
  ],
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
        await result.current.finishWorkout();
      });
      expect(useAppStore.getState().activeSession).toBeNull();
      expect(useAppStore.getState().sessions).toHaveLength(1);
    });

    it('should navigate to history when no API key', async () => {
      const mockSession = createMockSession();
      resetStores(mockSession);
      const { result } = renderHook(() => useActiveWorkout());
      await act(async () => {
        await result.current.finishWorkout();
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

  it('should log a cardio set', () => {
    const mockSession = createMockSession({
      exercises: [createCardioSessionExercise('outdoor-run')],
    });
    resetStores(mockSession);
    const { result } = renderHook(() => useExerciseManagement());
    act(() => {
      result.current.logCardioForExercise(0, 3.1, 'mi', 1800);
    });
    const updatedSession = useAppStore.getState().activeSession;
    expect(updatedSession?.exercises[0].sets).toHaveLength(1);
    expect(updatedSession?.exercises[0].sets[0].type).toBe('cardio');
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

describe('useExerciseHistory', () => {
  beforeEach(() => {
    resetStores(createMockSession());
  });

  afterEach(() => {
    resetStores(null);
  });

  it('should show history for exercise', () => {
    const { result } = renderHook(() => useExerciseHistory());
    expect(result.current.historyExerciseId).toBeNull();
    act(() => {
      result.current.handleShowHistory('bench-press');
    });
    expect(result.current.historyExerciseId).toBe('bench-press');
    expect(result.current.historyExerciseName).toBe('Bench Press');
  });

  it('should close history', () => {
    const { result } = renderHook(() => useExerciseHistory());
    act(() => {
      result.current.handleShowHistory('bench-press');
    });
    expect(result.current.historyExerciseId).toBe('bench-press');
    act(() => {
      result.current.closeHistory();
    });
    expect(result.current.historyExerciseId).toBeNull();
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
});
