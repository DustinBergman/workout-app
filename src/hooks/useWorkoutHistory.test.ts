import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useWorkoutHistory,
  formatSessionDuration,
  formatHistoryDate,
} from './useWorkoutHistory';
import { WorkoutSession } from '../types';

// Mock the store - use object wrapper for mutable state
const mockState = {
  sessions: [] as WorkoutSession[],
  deleteSession: vi.fn(),
};

vi.mock('../store/useAppStore', () => ({
  useAppStore: vi.fn((selector) => {
    const state = {
      sessions: mockState.sessions,
      preferences: { weightUnit: 'lbs', distanceUnit: 'mi' },
      customExercises: [],
      deleteSession: mockState.deleteSession,
    };
    return selector(state);
  }),
}));

// Mock the supabase delete function
vi.mock('../services/supabase/sessions', () => ({
  deleteSession: vi.fn().mockResolvedValue({ error: null }),
}));

// Mock toast
vi.mock('../store/toastStore', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('formatSessionDuration', () => {
  it('returns "In progress" when completedAt is null', () => {
    const session = {
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: null,
    } as unknown as WorkoutSession;

    expect(formatSessionDuration(session)).toBe('In progress');
  });

  it('returns minutes for sessions under 60 minutes', () => {
    const session = {
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T10:45:00Z',
    } as unknown as WorkoutSession;

    expect(formatSessionDuration(session)).toBe('45 min');
  });

  it('returns hours and minutes for sessions over 60 minutes', () => {
    const session = {
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T11:30:00Z',
    } as unknown as WorkoutSession;

    expect(formatSessionDuration(session)).toBe('1h 30m');
  });

  it('returns hours and 0 minutes for exact hour sessions', () => {
    const session = {
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T12:00:00Z',
    } as unknown as WorkoutSession;

    expect(formatSessionDuration(session)).toBe('2h 0m');
  });
});

describe('formatHistoryDate', () => {
  beforeEach(() => {
    // Mock Date to have consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for today\'s date', () => {
    expect(formatHistoryDate('2024-01-15T10:00:00Z')).toBe('Today');
  });

  it('returns "Yesterday" for yesterday\'s date', () => {
    expect(formatHistoryDate('2024-01-14T10:00:00Z')).toBe('Yesterday');
  });

  it('returns formatted date for older dates', () => {
    const result = formatHistoryDate('2024-01-10T10:00:00Z');
    // Should return something like "Wed, Jan 10"
    expect(result).toContain('Jan');
    expect(result).toContain('10');
  });
});

describe('useWorkoutHistory', () => {
  const createMockSession = (
    id: string,
    startedAt: string,
    name: string
  ): WorkoutSession => ({
    id,
    name,
    startedAt,
    completedAt: new Date(new Date(startedAt).getTime() + 3600000).toISOString(),
    exercises: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockState.sessions = [];
  });

  describe('sortedSessions', () => {
    it('returns empty array when no sessions', () => {
      const { result } = renderHook(() => useWorkoutHistory());
      expect(result.current.sortedSessions).toEqual([]);
    });

    it('sorts sessions by date newest first', () => {
      mockState.sessions = [
        createMockSession('1', '2024-01-10T10:00:00Z', 'Workout 1'),
        createMockSession('2', '2024-01-15T10:00:00Z', 'Workout 2'),
        createMockSession('3', '2024-01-12T10:00:00Z', 'Workout 3'),
      ];

      const { result } = renderHook(() => useWorkoutHistory());

      expect(result.current.sortedSessions[0].id).toBe('2');
      expect(result.current.sortedSessions[1].id).toBe('3');
      expect(result.current.sortedSessions[2].id).toBe('1');
    });
  });

  describe('groupedSessions', () => {
    it('groups sessions by date', () => {
      // Use local time strings (no Z suffix) to avoid timezone conversion issues
      mockState.sessions = [
        createMockSession('1', '2024-01-15T10:00:00', 'Morning Workout'),
        createMockSession('2', '2024-01-15T18:00:00', 'Evening Workout'),
        createMockSession('3', '2024-01-14T10:00:00', 'Yesterday Workout'),
      ];

      const { result } = renderHook(() => useWorkoutHistory());
      const grouped = result.current.groupedSessions;

      // Should have 2 date groups
      const dateKeys = Object.keys(grouped);
      expect(dateKeys.length).toBe(2);

      // Find the group with 2 sessions (Jan 15)
      const jan15Key = dateKeys.find((key) => grouped[key].length === 2);
      expect(jan15Key).toBeDefined();
      expect(grouped[jan15Key!].length).toBe(2);
    });
  });

  describe('filteredSessions', () => {
    it('returns all sessions when no date filter', () => {
      mockState.sessions = [
        createMockSession('1', '2024-01-15T10:00:00Z', 'Workout 1'),
        createMockSession('2', '2024-01-14T10:00:00Z', 'Workout 2'),
      ];

      const { result } = renderHook(() => useWorkoutHistory());
      expect(result.current.filteredSessions.length).toBe(2);
    });

    it('filters sessions by selected date', () => {
      // Use local time strings (no Z suffix) to avoid timezone conversion issues
      const session1 = createMockSession('1', '2024-01-15T10:00:00', 'Workout 1');
      const session2 = createMockSession('2', '2024-01-14T10:00:00', 'Workout 2');
      const session3 = createMockSession('3', '2024-01-15T18:00:00', 'Workout 3');
      mockState.sessions = [session1, session2, session3];

      const { result } = renderHook(() => useWorkoutHistory());

      // Select a date via handleDayClick using local date
      act(() => {
        result.current.handleDayClick(new Date(2024, 0, 15), [session1, session3]);
      });

      expect(result.current.selectedDate?.toDateString()).toBe(
        new Date(2024, 0, 15).toDateString()
      );
      expect(result.current.filteredSessions.length).toBe(2);
    });
  });

  describe('viewMode', () => {
    it('defaults to heatmap view', () => {
      const { result } = renderHook(() => useWorkoutHistory());
      expect(result.current.viewMode).toBe('heatmap');
    });

    it('can toggle view mode', () => {
      const { result } = renderHook(() => useWorkoutHistory());

      act(() => {
        result.current.setViewMode('list');
      });

      expect(result.current.viewMode).toBe('list');

      act(() => {
        result.current.setViewMode('heatmap');
      });

      expect(result.current.viewMode).toBe('heatmap');
    });
  });

  describe('handleDayClick', () => {
    it('sets selected date when sessions exist', () => {
      const { result } = renderHook(() => useWorkoutHistory());
      const testDate = new Date('2024-01-15');
      const sessions = [createMockSession('1', '2024-01-15T10:00:00Z', 'Test')];

      act(() => {
        result.current.handleDayClick(testDate, sessions);
      });

      expect(result.current.selectedDate?.toDateString()).toBe(
        testDate.toDateString()
      );
    });

    it('clears selected date when no sessions', () => {
      const { result } = renderHook(() => useWorkoutHistory());

      // First set a date
      act(() => {
        result.current.handleDayClick(new Date('2024-01-15'), [
          createMockSession('1', '2024-01-15T10:00:00Z', 'Test'),
        ]);
      });

      expect(result.current.selectedDate).not.toBeNull();

      // Then click a day with no sessions
      act(() => {
        result.current.handleDayClick(new Date('2024-01-16'), []);
      });

      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe('clearDateFilter', () => {
    it('clears the selected date', () => {
      const { result } = renderHook(() => useWorkoutHistory());

      // Set a date
      act(() => {
        result.current.handleDayClick(new Date('2024-01-15'), [
          createMockSession('1', '2024-01-15T10:00:00Z', 'Test'),
        ]);
      });

      expect(result.current.selectedDate).not.toBeNull();

      // Clear it
      act(() => {
        result.current.clearDateFilter();
      });

      expect(result.current.selectedDate).toBeNull();
    });
  });

  describe('session selection', () => {
    it('can select and close session detail', () => {
      const session = createMockSession('1', '2024-01-15T10:00:00Z', 'Test Workout');
      mockState.sessions = [session];

      const { result } = renderHook(() => useWorkoutHistory());

      expect(result.current.selectedSession).toBeNull();

      act(() => {
        result.current.setSelectedSession(session);
      });

      expect(result.current.selectedSession).toEqual(session);

      act(() => {
        result.current.closeSessionDetail();
      });

      expect(result.current.selectedSession).toBeNull();
    });
  });

  describe('delete functionality', () => {
    it('can initiate and cancel delete', () => {
      const session = createMockSession('1', '2024-01-15T10:00:00Z', 'Test Workout');
      mockState.sessions = [session];

      const { result } = renderHook(() => useWorkoutHistory());
      const mockEvent = { stopPropagation: vi.fn() } as unknown as React.MouseEvent;

      expect(result.current.sessionToDelete).toBeNull();

      act(() => {
        result.current.handleDeleteClick(mockEvent, session);
      });

      expect(result.current.sessionToDelete).toEqual(session);
      expect(mockEvent.stopPropagation).toHaveBeenCalled();

      act(() => {
        result.current.cancelDelete();
      });

      expect(result.current.sessionToDelete).toBeNull();
    });
  });
});
