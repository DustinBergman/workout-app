import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';
import { MuscleGroup } from '../../types';
import { getExerciseById } from '../../data/exercises';

export interface MuscleGroupBreakdown {
  muscleGroup: MuscleGroup;
  setCount: number;
  percentage: number;
}

export interface PublicUserStats {
  totalWorkouts: number;
  workoutsPerWeek: number;
  averageDurationMinutes: number;
  totalSets: number;
  muscleGroupBreakdown: MuscleGroupBreakdown[];
  memberSince: string | null;
}

interface WorkoutRow {
  id: string;
  started_at: string;
  completed_at: string;
  session_exercises: Array<{
    exercise_id: string;
    type: 'strength' | 'cardio';
    completed_sets: Array<{ id: string }>;
  }>;
}

/**
 * Get public stats for a user (viewable by friends or self)
 */
export const getUserStats = async (
  userId: string
): Promise<{ stats: PublicUserStats | null; error: Error | null }> => {
  const currentUser = await getAuthUser();
  if (!currentUser) {
    return { stats: null, error: new Error('Not authenticated') };
  }

  // If not viewing own profile, check if they're friends
  if (userId !== currentUser.id) {
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', currentUser.id)
      .eq('friend_id', userId)
      .maybeSingle();

    if (friendError) {
      return { stats: null, error: friendError };
    }

    if (!friendship) {
      // Not friends, return limited stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .single();

      return {
        stats: {
          totalWorkouts: 0,
          workoutsPerWeek: 0,
          averageDurationMinutes: 0,
          totalSets: 0,
          muscleGroupBreakdown: [],
          memberSince: profile?.created_at || null,
        },
        error: null,
      };
    }
  }

  // Fetch completed workouts with exercises and sets
  const { data: workouts, error: workoutsError } = await supabase
    .from('workout_sessions')
    .select(`
      id,
      started_at,
      completed_at,
      session_exercises (
        exercise_id,
        type,
        completed_sets (id)
      )
    `)
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (workoutsError) {
    return { stats: null, error: workoutsError };
  }

  // Get profile for member since date
  const { data: profile } = await supabase
    .from('profiles')
    .select('created_at')
    .eq('id', userId)
    .single();

  const typedWorkouts = workouts as WorkoutRow[];

  if (!typedWorkouts || typedWorkouts.length === 0) {
    return {
      stats: {
        totalWorkouts: 0,
        workoutsPerWeek: 0,
        averageDurationMinutes: 0,
        totalSets: 0,
        muscleGroupBreakdown: [],
        memberSince: profile?.created_at || null,
      },
      error: null,
    };
  }

  // Calculate total workouts
  const totalWorkouts = typedWorkouts.length;

  // Calculate workouts per week
  const dates = typedWorkouts.map((w) => new Date(w.started_at).getTime());
  const firstDate = Math.min(...dates);
  const lastDate = Math.max(...dates);
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekSpan = Math.max(1, (lastDate - firstDate) / msPerWeek);
  const workoutsPerWeek = totalWorkouts / weekSpan;

  // Calculate average duration
  let totalDurationMinutes = 0;
  let completedCount = 0;
  typedWorkouts.forEach((workout) => {
    if (workout.completed_at && workout.started_at) {
      const start = new Date(workout.started_at).getTime();
      const end = new Date(workout.completed_at).getTime();
      totalDurationMinutes += (end - start) / 60000;
      completedCount++;
    }
  });
  const averageDurationMinutes = completedCount > 0 ? totalDurationMinutes / completedCount : 0;

  // Calculate total sets and muscle group breakdown
  let totalSets = 0;
  const muscleGroupCounts: Record<string, number> = {};

  typedWorkouts.forEach((workout) => {
    workout.session_exercises.forEach((ex) => {
      const setCount = ex.completed_sets?.length || 0;
      totalSets += setCount;

      // Get exercise data to find muscle groups
      const exerciseData = getExerciseById(ex.exercise_id);
      if (exerciseData && exerciseData.type === 'strength' && exerciseData.muscleGroups) {
        exerciseData.muscleGroups.forEach((mg: MuscleGroup) => {
          muscleGroupCounts[mg] = (muscleGroupCounts[mg] || 0) + setCount;
        });
      }
    });
  });

  // Convert muscle group counts to breakdown with percentages
  const totalAttributions = Object.values(muscleGroupCounts).reduce((sum, count) => sum + count, 0);
  const muscleGroupBreakdown: MuscleGroupBreakdown[] = Object.entries(muscleGroupCounts)
    .map(([mg, count]) => ({
      muscleGroup: mg as MuscleGroup,
      setCount: count,
      percentage: totalAttributions > 0 ? (count / totalAttributions) * 100 : 0,
    }))
    .sort((a, b) => b.setCount - a.setCount);

  return {
    stats: {
      totalWorkouts,
      workoutsPerWeek,
      averageDurationMinutes,
      totalSets,
      muscleGroupBreakdown,
      memberSince: profile?.created_at || null,
    },
    error: null,
  };
};
