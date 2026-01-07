import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserStats } from './userStats';

// Mock supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock authHelper
vi.mock('./authHelper', () => ({
  getAuthUser: vi.fn(),
}));

// Mock exercises data
vi.mock('../../data/exercises', () => ({
  getExerciseById: vi.fn(),
}));

import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';
import { getExerciseById } from '../../data/exercises';

describe('getUserStats', () => {
  const mockCurrentUser = { id: 'current-user-123' } as any;

  const mockWorkouts = [
    {
      id: 'workout-1',
      started_at: '2024-01-01T08:00:00Z',
      completed_at: '2024-01-01T09:00:00Z',
      session_exercises: [
        {
          exercise_id: 'bench-press',
          type: 'strength',
          completed_sets: [{ id: 'set-1' }, { id: 'set-2' }, { id: 'set-3' }],
        },
        {
          exercise_id: 'squat',
          type: 'strength',
          completed_sets: [{ id: 'set-4' }, { id: 'set-5' }],
        },
      ],
    },
    {
      id: 'workout-2',
      started_at: '2024-01-08T08:00:00Z',
      completed_at: '2024-01-08T09:30:00Z',
      session_exercises: [
        {
          exercise_id: 'bench-press',
          type: 'strength',
          completed_sets: [{ id: 'set-6' }, { id: 'set-7' }],
        },
      ],
    },
  ];

  const mockProfile = {
    created_at: '2023-06-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAuthUser).mockResolvedValue(mockCurrentUser);

    // Mock exercise data
    vi.mocked(getExerciseById).mockImplementation((id: string) => {
      if (id === 'bench-press') {
        return {
          id: 'bench-press',
          name: 'Bench Press',
          type: 'strength',
          muscleGroups: ['chest', 'triceps', 'shoulders'],
        } as any;
      }
      if (id === 'squat') {
        return {
          id: 'squat',
          name: 'Squat',
          type: 'strength',
          muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
        } as any;
      }
      return null;
    });
  });

  const setupSupabaseMocks = (options: {
    isFriend?: boolean;
    workouts?: typeof mockWorkouts;
    profile?: typeof mockProfile;
  }) => {
    const { isFriend = true, workouts = mockWorkouts, profile = mockProfile } = options;

    const fromMock = vi.fn().mockImplementation((table: string) => {
      if (table === 'friendships') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: isFriend ? { id: 'friendship-1' } : null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'workout_sessions') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              not: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: workouts,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: profile,
                error: null,
              }),
            }),
          }),
        };
      }
      return {};
    });

    vi.mocked(supabase.from).mockImplementation(fromMock);
  };

  it('should return stats for own profile', async () => {
    setupSupabaseMocks({});

    const result = await getUserStats('current-user-123');

    expect(result.error).toBeNull();
    expect(result.stats).not.toBeNull();
    expect(result.stats?.totalWorkouts).toBe(2);
    expect(result.stats?.totalSets).toBe(7); // 3 + 2 + 2
  });

  it('should return stats for a friend', async () => {
    setupSupabaseMocks({ isFriend: true });

    const result = await getUserStats('friend-user-456');

    expect(result.error).toBeNull();
    expect(result.stats).not.toBeNull();
    expect(result.stats?.totalWorkouts).toBe(2);
  });

  it('should return limited stats for non-friends', async () => {
    setupSupabaseMocks({ isFriend: false });

    const result = await getUserStats('stranger-789');

    expect(result.error).toBeNull();
    expect(result.stats).not.toBeNull();
    expect(result.stats?.totalWorkouts).toBe(0);
    expect(result.stats?.muscleGroupBreakdown).toHaveLength(0);
    expect(result.stats?.memberSince).toBe('2023-06-01T00:00:00Z');
  });

  it('should calculate workouts per week correctly', async () => {
    setupSupabaseMocks({});

    const result = await getUserStats('current-user-123');

    expect(result.stats).not.toBeNull();
    // 2 workouts over 1 week = 2 per week
    expect(result.stats?.workoutsPerWeek).toBeCloseTo(2, 0);
  });

  it('should calculate average duration correctly', async () => {
    setupSupabaseMocks({});

    const result = await getUserStats('current-user-123');

    expect(result.stats).not.toBeNull();
    // Workout 1: 60 mins, Workout 2: 90 mins, average = 75 mins
    expect(result.stats?.averageDurationMinutes).toBeCloseTo(75, 0);
  });

  it('should calculate muscle group breakdown correctly', async () => {
    setupSupabaseMocks({});

    const result = await getUserStats('current-user-123');

    expect(result.stats).not.toBeNull();
    expect(result.stats?.muscleGroupBreakdown.length).toBeGreaterThan(0);

    // Find chest in the breakdown (from bench press: 3 sets workout 1 + 2 sets workout 2 = 5 sets)
    const chestStats = result.stats?.muscleGroupBreakdown.find((mg) => mg.muscleGroup === 'chest');
    expect(chestStats?.setCount).toBe(5);
  });

  it('should return error when not authenticated', async () => {
    vi.mocked(getAuthUser).mockResolvedValue(null);

    const result = await getUserStats('any-user');

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toBe('Not authenticated');
    expect(result.stats).toBeNull();
  });

  it('should handle empty workouts gracefully', async () => {
    setupSupabaseMocks({ workouts: [] });

    const result = await getUserStats('current-user-123');

    expect(result.error).toBeNull();
    expect(result.stats).not.toBeNull();
    expect(result.stats?.totalWorkouts).toBe(0);
    expect(result.stats?.workoutsPerWeek).toBe(0);
    expect(result.stats?.averageDurationMinutes).toBe(0);
    expect(result.stats?.muscleGroupBreakdown).toHaveLength(0);
  });

  it('should include memberSince date', async () => {
    setupSupabaseMocks({});

    const result = await getUserStats('current-user-123');

    expect(result.stats?.memberSince).toBe('2023-06-01T00:00:00Z');
  });

  it('should sort muscle groups by set count descending', async () => {
    setupSupabaseMocks({});

    const result = await getUserStats('current-user-123');

    const breakdown = result.stats?.muscleGroupBreakdown || [];
    for (let i = 1; i < breakdown.length; i++) {
      expect(breakdown[i - 1].setCount).toBeGreaterThanOrEqual(breakdown[i].setCount);
    }
  });
});
