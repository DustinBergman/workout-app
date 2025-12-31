import { useMemo } from 'react';
import { WorkoutSession, MuscleGroup, Exercise } from '../types';
import { calculateSessionStats } from './useSessionStats';
import { getAllExercises } from '../data/exercises';

export type TimePeriod = '30' | '90' | 'all';

export interface MuscleGroupBreakdown {
  muscleGroup: MuscleGroup;
  setCount: number;
  percentage: number;
}

export interface UserStats {
  averageStrengthIncrease: number;
  muscleGroupBreakdown: MuscleGroupBreakdown[];
  averageSessionDuration: number; // in minutes
  averageSessionsPerWeek: number;
  averageVolumePerSession: number;
  totalSessions: number;
}

const MUSCLE_GROUP_LIST: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'
];

const filterByTimePeriod = (
  sessions: WorkoutSession[],
  period: TimePeriod
): WorkoutSession[] => {
  if (period === 'all') return sessions;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - parseInt(period));

  return sessions.filter(s => new Date(s.startedAt) >= cutoff);
};

const calculateStrengthProgress = (
  sessions: WorkoutSession[]
): number => {
  // Group exercise history by exerciseId
  const exerciseHistory: Map<string, { date: string; avgWeight: number }[]> = new Map();

  sessions.forEach(session => {
    session.exercises.forEach(ex => {
      if (ex.sets.length === 0) return;

      // Only calculate for strength exercises
      const strengthSets = ex.sets.filter(s => s.type === 'strength' || !('type' in s));
      if (strengthSets.length === 0) return;

      // Calculate average weight for this exercise in this session
      const totalWeight = strengthSets.reduce((sum, s) => sum + ('weight' in s ? s.weight : 0), 0);
      const avgWeight = totalWeight / strengthSets.length;

      if (avgWeight === 0) return;

      const history = exerciseHistory.get(ex.exerciseId) || [];
      history.push({
        date: session.completedAt || session.startedAt,
        avgWeight
      });
      exerciseHistory.set(ex.exerciseId, history);
    });
  });

  // Calculate progress for exercises with 2+ data points
  const increases: number[] = [];

  exerciseHistory.forEach((history) => {
    if (history.length < 2) return;

    // Sort by date
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const firstWeight = history[0].avgWeight;
    const lastWeight = history[history.length - 1].avgWeight;

    if (firstWeight > 0 && lastWeight > firstWeight) {
      const increase = ((lastWeight - firstWeight) / firstWeight) * 100;
      increases.push(increase);
    }
  });

  if (increases.length === 0) return 0;

  return increases.reduce((sum, inc) => sum + inc, 0) / increases.length;
};

const calculateMuscleGroupBreakdown = (
  sessions: WorkoutSession[],
  customExercises: Exercise[]
): MuscleGroupBreakdown[] => {
  const allExercises = getAllExercises(customExercises);
  const muscleGroupCounts: Record<MuscleGroup, number> = {} as Record<MuscleGroup, number>;

  // Initialize counts
  MUSCLE_GROUP_LIST.forEach(mg => {
    muscleGroupCounts[mg] = 0;
  });

  let totalAttributions = 0;

  sessions.forEach(session => {
    session.exercises.forEach(ex => {
      const exercise = allExercises.find(e => e.id === ex.exerciseId);
      if (!exercise || exercise.type !== 'strength') return;

      const setCount = ex.sets.length;
      exercise.muscleGroups.forEach((mg: MuscleGroup) => {
        muscleGroupCounts[mg] += setCount;
        totalAttributions += setCount;
      });
    });
  });

  return Object.entries(muscleGroupCounts)
    .filter(([, count]) => count > 0)
    .map(([mg, count]) => ({
      muscleGroup: mg as MuscleGroup,
      setCount: count,
      percentage: totalAttributions > 0 ? (count / totalAttributions) * 100 : 0
    }))
    .sort((a, b) => b.setCount - a.setCount);
};

const calculateAverageSessionDuration = (sessions: WorkoutSession[]): number => {
  const completedSessions = sessions.filter(s => s.completedAt);
  if (completedSessions.length === 0) return 0;

  const totalMinutes = completedSessions.reduce((sum, session) => {
    const start = new Date(session.startedAt).getTime();
    const end = new Date(session.completedAt!).getTime();
    return sum + (end - start) / 60000; // Convert ms to minutes
  }, 0);

  return totalMinutes / completedSessions.length;
};

const calculateSessionsPerWeek = (sessions: WorkoutSession[]): number => {
  if (sessions.length === 0) return 0;

  const dates = sessions.map(s => new Date(s.startedAt).getTime());
  const firstDate = Math.min(...dates);
  const lastDate = Math.max(...dates);

  // If all sessions are on the same day, return 1 session per week
  if (firstDate === lastDate) return sessions.length;

  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekSpan = Math.max(1, (lastDate - firstDate) / msPerWeek);

  return sessions.length / weekSpan;
};

const calculateAverageVolumePerSession = (sessions: WorkoutSession[]): number => {
  if (sessions.length === 0) return 0;

  const totalVolume = sessions.reduce((sum, session) => {
    return sum + calculateSessionStats(session).totalVolume;
  }, 0);

  return totalVolume / sessions.length;
};

export const useUserStats = (
  sessions: WorkoutSession[],
  timePeriod: TimePeriod,
  customExercises: Exercise[] = []
): UserStats => {
  return useMemo(() => {
    const filteredSessions = filterByTimePeriod(sessions, timePeriod);

    if (filteredSessions.length === 0) {
      return {
        averageStrengthIncrease: 0,
        muscleGroupBreakdown: [],
        averageSessionDuration: 0,
        averageSessionsPerWeek: 0,
        averageVolumePerSession: 0,
        totalSessions: 0,
      };
    }

    return {
      averageStrengthIncrease: calculateStrengthProgress(filteredSessions),
      muscleGroupBreakdown: calculateMuscleGroupBreakdown(filteredSessions, customExercises),
      averageSessionDuration: calculateAverageSessionDuration(filteredSessions),
      averageSessionsPerWeek: calculateSessionsPerWeek(filteredSessions),
      averageVolumePerSession: calculateAverageVolumePerSession(filteredSessions),
      totalSessions: filteredSessions.length,
    };
  }, [sessions, timePeriod, customExercises]);
};
