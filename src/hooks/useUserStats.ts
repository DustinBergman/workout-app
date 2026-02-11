import { useMemo } from 'react';
import { WorkoutSession, MuscleGroup, Exercise, WeightEntry, StrengthCompletedSet, CardioCompletedSet, DistanceUnit } from '../types';
import { calculateSessionStats } from './useSessionStats';
import { getAllExercises } from '../data/exercises';
import { calculate1RM } from '../utils/personalBestUtils';
import { estimateCardioCalories } from '../utils/workoutUtils';
import { filterOutliers } from '../utils/outlierFilter';

export type TimePeriod = '30' | '90' | 'all';

export interface MuscleGroupBreakdown {
  muscleGroup: MuscleGroup;
  setCount: number;
  percentage: number;
}

export interface CardioStats {
  totalDistance: number;
  distanceUnit: DistanceUnit;
  averagePace: number | null; // minutes per distance unit, null if no distance data
  paceImprovement: number; // percentage improvement (positive = faster)
  totalCalories: number;
  sessionCount: number;
  averageDuration: number; // in minutes
}

export interface UserStats {
  averageStrengthIncrease: number;
  muscleGroupBreakdown: MuscleGroupBreakdown[];
  averageSessionDuration: number; // in minutes
  averageSessionsPerWeek: number;
  averageVolumePerSession: number;
  averageWeightChangePerWeek: number; // percentage
  totalSessions: number;
  // Cardio stats
  cardio: CardioStats;
  isCardioPrimary: boolean; // true if >50% of sessions are cardio-only
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
  // Group exercise history by exerciseId using estimated 1RM
  // This accounts for both weight AND reps to measure true strength progress
  const exerciseHistory: Map<string, { date: string; best1RM: number }[]> = new Map();

  sessions.forEach(session => {
    session.exercises.forEach(ex => {
      if (ex.sets.length === 0) return;

      // Only calculate for strength exercises
      const strengthSets = ex.sets.filter(
        (s): s is StrengthCompletedSet => s.type === 'strength' || !('type' in s)
      );
      if (strengthSets.length === 0) return;

      // Filter outliers by weight before computing 1RM
      const filteredSets = filterOutliers(strengthSets, (s) => s.weight);

      // Find the best estimated 1RM for this exercise in this session
      // This normalizes different weight/rep combinations to a comparable metric
      let best1RM = 0;
      for (const set of filteredSets) {
        if ('weight' in set && 'reps' in set && set.weight > 0 && set.reps > 0) {
          const estimated1RM = calculate1RM(set.weight, set.reps);
          best1RM = Math.max(best1RM, estimated1RM);
        }
      }

      if (best1RM === 0) return;

      const history = exerciseHistory.get(ex.exerciseId) || [];
      history.push({
        date: session.completedAt || session.startedAt,
        best1RM
      });
      exerciseHistory.set(ex.exerciseId, history);
    });
  });

  // Calculate progress for exercises with 2+ data points
  const changes: number[] = [];

  exerciseHistory.forEach((history) => {
    if (history.length < 2) return;

    // Sort by date
    history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const first1RM = history[0].best1RM;
    const last1RM = history[history.length - 1].best1RM;

    if (first1RM > 0) {
      // Include all changes (positive, negative, or zero)
      const change = ((last1RM - first1RM) / first1RM) * 100;
      changes.push(change);
    }
  });

  if (changes.length === 0) return 0;

  return changes.reduce((sum, change) => sum + change, 0) / changes.length;
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

const calculateWeightChangePerWeek = (weightEntries: WeightEntry[]): number => {
  if (weightEntries.length < 2) return 0;

  // Sort weight entries by date
  const sorted = [...weightEntries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const firstWeight = sorted[0].weight;
  const lastWeight = sorted[sorted.length - 1].weight;

  if (firstWeight === 0) return 0;

  // Calculate percentage change
  const percentChange = ((lastWeight - firstWeight) / firstWeight) * 100;

  // Calculate weeks spanned
  const firstDate = new Date(sorted[0].date).getTime();
  const lastDate = new Date(sorted[sorted.length - 1].date).getTime();
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;
  const weekSpan = Math.max(1, (lastDate - firstDate) / msPerWeek);

  return percentChange / weekSpan;
};

// ============================================
// Cardio Stats Calculations
// ============================================

const isCardioOnlySession = (session: WorkoutSession): boolean => {
  return session.exercises.length > 0 && session.exercises.every(ex => ex.type === 'cardio');
};

const calculateCardioStats = (
  sessions: WorkoutSession[],
  customExercises: Exercise[],
  distanceUnit: DistanceUnit
): CardioStats => {
  const allExercises = getAllExercises(customExercises);

  let totalDistance = 0;
  let totalDurationSeconds = 0;
  let totalCalories = 0;
  let cardioSessionCount = 0;

  // Track pace data for improvement calculation
  const paceData: { date: string; pace: number }[] = [];

  sessions.forEach(session => {
    let sessionHasCardio = false;

    session.exercises.forEach(ex => {
      if (ex.type !== 'cardio') return;

      const exerciseInfo = allExercises.find(e => e.id === ex.exerciseId);
      const cardioType = exerciseInfo?.type === 'cardio' ? exerciseInfo.cardioType : 'other';

      ex.sets.forEach(set => {
        if (set.type !== 'cardio') return;
        const cardioSet = set as CardioCompletedSet;
        sessionHasCardio = true;

        // Duration
        if (cardioSet.durationSeconds) {
          totalDurationSeconds += cardioSet.durationSeconds;
        }

        // Distance - normalize to user's preferred unit
        if (cardioSet.distance && cardioSet.distance > 0) {
          let distance = cardioSet.distance;
          const setUnit = cardioSet.distanceUnit || 'mi';

          // Convert to user's preferred unit
          if (setUnit !== distanceUnit) {
            if (setUnit === 'km' && distanceUnit === 'mi') {
              distance = distance * 0.621371;
            } else if (setUnit === 'mi' && distanceUnit === 'km') {
              distance = distance * 1.60934;
            }
          }

          totalDistance += distance;

          // Calculate pace if we have duration
          if (cardioSet.durationSeconds && cardioSet.durationSeconds > 0) {
            const paceMinutes = (cardioSet.durationSeconds / 60) / distance;
            paceData.push({
              date: cardioSet.completedAt || session.completedAt || session.startedAt,
              pace: paceMinutes,
            });
          }
        }

        // Calories - use logged value or estimate
        if (cardioSet.calories && cardioSet.calories > 0) {
          totalCalories += cardioSet.calories;
        } else if (cardioSet.durationSeconds) {
          // Estimate calories if not logged
          const estimated = estimateCardioCalories(cardioType, {
            durationSeconds: cardioSet.durationSeconds,
            distance: cardioSet.distance,
            distanceUnit: cardioSet.distanceUnit,
          });
          totalCalories += estimated;
        }
      });
    });

    if (sessionHasCardio) {
      cardioSessionCount++;
    }
  });

  // Calculate average pace (filter outliers before averaging)
  let averagePace: number | null = null;
  if (paceData.length > 0) {
    const filteredPaceData = filterOutliers(paceData, (p) => p.pace);
    averagePace = filteredPaceData.reduce((sum, p) => sum + p.pace, 0) / filteredPaceData.length;
  }

  // Calculate pace improvement (compare last 2 weeks to prior 2 weeks)
  let paceImprovement = 0;
  if (paceData.length >= 4) {
    // Sort by date
    paceData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const recentPaces = paceData.filter(p => new Date(p.date) >= twoWeeksAgo);
    const olderPaces = paceData.filter(p => {
      const date = new Date(p.date);
      return date >= fourWeeksAgo && date < twoWeeksAgo;
    });

    if (recentPaces.length > 0 && olderPaces.length > 0) {
      const recentAvg = recentPaces.reduce((sum, p) => sum + p.pace, 0) / recentPaces.length;
      const olderAvg = olderPaces.reduce((sum, p) => sum + p.pace, 0) / olderPaces.length;

      // Lower pace = faster, so improvement is (old - new) / old * 100
      if (olderAvg > 0) {
        paceImprovement = ((olderAvg - recentAvg) / olderAvg) * 100;
      }
    }
  }

  return {
    totalDistance,
    distanceUnit,
    averagePace,
    paceImprovement,
    totalCalories: Math.round(totalCalories),
    sessionCount: cardioSessionCount,
    averageDuration: cardioSessionCount > 0 ? (totalDurationSeconds / 60) / cardioSessionCount : 0,
  };
};

const calculateIsCardioPrimary = (sessions: WorkoutSession[]): boolean => {
  if (sessions.length === 0) return false;

  const cardioOnlyCount = sessions.filter(isCardioOnlySession).length;
  return cardioOnlyCount > sessions.length * 0.5;
};

export const useUserStats = (
  sessions: WorkoutSession[],
  timePeriod: TimePeriod,
  customExercises: Exercise[] = [],
  weightEntries: WeightEntry[] = [],
  distanceUnit: DistanceUnit = 'mi'
): UserStats => {
  return useMemo(() => {
    const filteredSessions = filterByTimePeriod(sessions, timePeriod);

    const emptyCardioStats: CardioStats = {
      totalDistance: 0,
      distanceUnit,
      averagePace: null,
      paceImprovement: 0,
      totalCalories: 0,
      sessionCount: 0,
      averageDuration: 0,
    };

    if (filteredSessions.length === 0) {
      return {
        averageStrengthIncrease: 0,
        muscleGroupBreakdown: [],
        averageSessionDuration: 0,
        averageSessionsPerWeek: 0,
        averageVolumePerSession: 0,
        averageWeightChangePerWeek: 0,
        totalSessions: 0,
        cardio: emptyCardioStats,
        isCardioPrimary: false,
      };
    }

    return {
      averageStrengthIncrease: calculateStrengthProgress(filteredSessions),
      muscleGroupBreakdown: calculateMuscleGroupBreakdown(filteredSessions, customExercises),
      averageSessionDuration: calculateAverageSessionDuration(filteredSessions),
      averageSessionsPerWeek: calculateSessionsPerWeek(filteredSessions),
      averageVolumePerSession: calculateAverageVolumePerSession(filteredSessions),
      averageWeightChangePerWeek: calculateWeightChangePerWeek(weightEntries),
      totalSessions: filteredSessions.length,
      cardio: calculateCardioStats(filteredSessions, customExercises, distanceUnit),
      isCardioPrimary: calculateIsCardioPrimary(filteredSessions),
    };
  }, [sessions, timePeriod, customExercises, weightEntries, distanceUnit]);
};
