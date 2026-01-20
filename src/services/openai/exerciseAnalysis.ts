import {
  WorkoutSession,
  StrengthCompletedSet,
  Exercise,
} from '../../types';
import { getExerciseById } from '../../data/exercises';

// Cache for exercise analysis results
interface AnalysisCache {
  analyses: Map<string, ExerciseAnalysis>;
  lastSessionCount: number;
  lastUpdated: string;
}

let analysisCache: AnalysisCache | null = null;

/**
 * Check if the user has enough training history for plateau detection
 * Requires at least 10 weeks with workout data
 */
export const hasEnoughHistoryForPlateauDetection = (sessions: WorkoutSession[]): boolean => {
  const tenWeeksAgo = new Date();
  tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 70);

  // Get completed sessions in the last 10 weeks
  const recentSessions = sessions.filter((s) => {
    if (!s.completedAt) return false;
    return new Date(s.startedAt) >= tenWeeksAgo;
  });

  if (recentSessions.length < 10) return false; // Need at least 10 sessions

  // Check that sessions span at least 8 different weeks (allowing some gaps)
  const weeksWithData = new Set<number>();
  recentSessions.forEach((session) => {
    const weekAgo = Math.floor(
      (Date.now() - new Date(session.startedAt).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    if (weekAgo <= 10) {
      weeksWithData.add(weekAgo);
    }
  });

  return weeksWithData.size >= 8; // At least 8 out of 10 weeks should have data
};

/**
 * Get cached analysis or null if cache is stale
 */
export const getCachedAnalysis = (
  exerciseId: string,
  sessionCount: number
): ExerciseAnalysis | null => {
  if (!analysisCache) return null;

  // Cache is stale if session count changed (new workout completed)
  if (analysisCache.lastSessionCount !== sessionCount) {
    analysisCache = null;
    return null;
  }

  return analysisCache.analyses.get(exerciseId) || null;
};

/**
 * Store analysis in cache
 */
export const cacheAnalysis = (
  analysis: ExerciseAnalysis,
  sessionCount: number
): void => {
  if (!analysisCache || analysisCache.lastSessionCount !== sessionCount) {
    analysisCache = {
      analyses: new Map(),
      lastSessionCount: sessionCount,
      lastUpdated: new Date().toISOString(),
    };
  }
  analysisCache.analyses.set(analysis.exerciseId, analysis);
};

/**
 * Clear the analysis cache (call when sessions change)
 */
export const clearAnalysisCache = (): void => {
  analysisCache = null;
};

// Weekly performance breakdown
export interface WeeklyPerformance {
  weekAgo: number;  // 0 = this week, 1 = last week, etc.
  sessions: number;
  avgWeight: number;
  avgReps: number;
  maxWeight: number;
  totalSets: number;
  estimated1RM: number;
}

// Progress detection signals
export interface PlateauSignals {
  sameWeight3Sessions: boolean;
  failedRepTargets: boolean;
  stalled1RM: boolean;
}

// Full exercise analysis
export interface ExerciseAnalysis {
  exerciseId: string;
  exerciseName: string;

  // 10-week history breakdown
  weeklyPerformance: WeeklyPerformance[];

  // Progress detection
  progressStatus: 'improving' | 'plateau' | 'declining' | 'insufficient_data';
  plateauSignals: PlateauSignals;

  // Calculated metrics
  weightTrend: number;        // % change over 10 weeks
  repsTrend: number;          // % change over 10 weeks
  estimated1RMTrend: number;  // % change over 10 weeks

  // Recent session data for context
  recentSessions: {
    date: string;
    maxWeight: number;
    avgReps: number;
    estimated1RM: number;
  }[];
}

/**
 * Calculate estimated 1RM using Epley formula
 * 1RM = weight × (1 + reps/30)
 */
export const calculateEpley1RM = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

/**
 * Get the week number (0-4) for a given date relative to now
 * 0 = this week, 1 = last week, etc.
 */
const getWeekAgo = (date: Date): number => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7);
};

/**
 * Analyze 10 weeks of exercise history and detect progress/plateau
 * @param enablePlateauDetection - Set to false to skip plateau detection (use when < 10 weeks of data)
 */
export const analyzeExercise10Weeks = (
  exerciseId: string,
  sessions: WorkoutSession[],
  customExercises: Exercise[],
  targetReps?: number,
  enablePlateauDetection: boolean = true
): ExerciseAnalysis => {
  // Check cache first
  const completedSessionCount = sessions.filter((s) => s.completedAt).length;
  const cached = getCachedAnalysis(exerciseId, completedSessionCount);
  if (cached) {
    return cached;
  }

  const exerciseInfo = getExerciseById(exerciseId, customExercises);
  const exerciseName = exerciseInfo?.name || exerciseId;

  // Get all sets for this exercise from sessions in the last 10 weeks
  const tenWeeksAgo = new Date();
  tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 70);

  // Collect all performance data grouped by session
  const sessionData: {
    date: Date;
    sets: { weight: number; reps: number }[];
  }[] = [];

  sessions.forEach((session) => {
    const sessionDate = new Date(session.startedAt);
    if (sessionDate < tenWeeksAgo) return;
    if (!session.completedAt) return; // Only count completed sessions

    session.exercises.forEach((ex) => {
      if (ex.exerciseId !== exerciseId) return;

      const strengthSets = ex.sets
        .filter((set): set is StrengthCompletedSet =>
          set.type === 'strength' || !('type' in set)
        )
        .map((set) => ({
          weight: set.weight,
          reps: set.reps,
        }));

      if (strengthSets.length > 0) {
        sessionData.push({
          date: sessionDate,
          sets: strengthSets,
        });
      }
    });
  });

  // Sort by date descending
  sessionData.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Check for insufficient data
  if (sessionData.length < 2) {
    return {
      exerciseId,
      exerciseName,
      weeklyPerformance: [],
      progressStatus: 'insufficient_data',
      plateauSignals: {
        sameWeight3Sessions: false,
        failedRepTargets: false,
        stalled1RM: false,
      },
      weightTrend: 0,
      repsTrend: 0,
      estimated1RMTrend: 0,
      recentSessions: sessionData.slice(0, 5).map((s) => {
        const maxWeight = Math.max(...s.sets.map((set) => set.weight));
        const avgReps = s.sets.reduce((sum, set) => sum + set.reps, 0) / s.sets.length;
        return {
          date: s.date.toISOString(),
          maxWeight,
          avgReps,
          estimated1RM: calculateEpley1RM(maxWeight, Math.round(avgReps)),
        };
      }),
    };
  }

  // Group by week
  const weeklyData: Map<number, typeof sessionData> = new Map();
  sessionData.forEach((session) => {
    const weekAgo = getWeekAgo(session.date);
    if (weekAgo <= 10) {
      const existing = weeklyData.get(weekAgo) || [];
      existing.push(session);
      weeklyData.set(weekAgo, existing);
    }
  });

  // Calculate weekly performance
  const weeklyPerformance: WeeklyPerformance[] = [];
  for (let week = 0; week <= 10; week++) {
    const weekSessions = weeklyData.get(week) || [];
    if (weekSessions.length === 0) continue;

    const allSets = weekSessions.flatMap((s) => s.sets);
    const avgWeight = allSets.reduce((sum, s) => sum + s.weight, 0) / allSets.length;
    const avgReps = allSets.reduce((sum, s) => sum + s.reps, 0) / allSets.length;
    const maxWeight = Math.max(...allSets.map((s) => s.weight));
    const estimated1RM = calculateEpley1RM(maxWeight, Math.round(avgReps));

    weeklyPerformance.push({
      weekAgo: week,
      sessions: weekSessions.length,
      avgWeight,
      avgReps,
      maxWeight,
      totalSets: allSets.length,
      estimated1RM,
    });
  }

  // Calculate trends (comparing most recent week to oldest week with data)
  let weightTrend = 0;
  let repsTrend = 0;
  let estimated1RMTrend = 0;

  if (weeklyPerformance.length >= 2) {
    const newest = weeklyPerformance[0];
    const oldest = weeklyPerformance[weeklyPerformance.length - 1];

    if (oldest.avgWeight > 0) {
      weightTrend = ((newest.avgWeight - oldest.avgWeight) / oldest.avgWeight) * 100;
    }
    if (oldest.avgReps > 0) {
      repsTrend = ((newest.avgReps - oldest.avgReps) / oldest.avgReps) * 100;
    }
    if (oldest.estimated1RM > 0) {
      estimated1RMTrend = ((newest.estimated1RM - oldest.estimated1RM) / oldest.estimated1RM) * 100;
    }
  }

  // Detect plateau signals (only if enabled and enough data)
  const plateauSignals = enablePlateauDetection
    ? detectPlateauSignals(sessionData, targetReps)
    : { sameWeight3Sessions: false, failedRepTargets: false, stalled1RM: false };

  // Determine overall progress status
  const progressStatus = enablePlateauDetection
    ? determineProgressStatus(plateauSignals, estimated1RMTrend, sessionData.length)
    : sessionData.length < 3
    ? 'insufficient_data'
    : estimated1RMTrend > 2
    ? 'improving'
    : estimated1RMTrend < -5
    ? 'declining'
    : 'improving'; // Default to improving when plateau detection is disabled

  // Build recent sessions summary
  const recentSessions = sessionData.slice(0, 5).map((s) => {
    const maxWeight = Math.max(...s.sets.map((set) => set.weight));
    const avgReps = s.sets.reduce((sum, set) => sum + set.reps, 0) / s.sets.length;
    return {
      date: s.date.toISOString(),
      maxWeight,
      avgReps,
      estimated1RM: calculateEpley1RM(maxWeight, Math.round(avgReps)),
    };
  });

  const analysis: ExerciseAnalysis = {
    exerciseId,
    exerciseName,
    weeklyPerformance,
    progressStatus,
    plateauSignals,
    weightTrend,
    repsTrend,
    estimated1RMTrend,
    recentSessions,
  };

  // Cache the result
  cacheAnalysis(analysis, completedSessionCount);

  return analysis;
};

/**
 * Detect plateau signals from session data
 */
const detectPlateauSignals = (
  sessionData: { date: Date; sets: { weight: number; reps: number }[] }[],
  targetReps?: number
): PlateauSignals => {
  // Signal 1: Same max weight for 4+ sessions (relaxed from 3)
  let sameWeight3Sessions = false;
  if (sessionData.length >= 4) {
    const maxWeights = sessionData.slice(0, 6).map((s) =>
      Math.max(...s.sets.map((set) => set.weight))
    );
    const firstWeight = maxWeights[0];
    const tolerance = firstWeight * 0.025; // 2.5% tolerance
    const sameWeightCount = maxWeights.filter((w) =>
      Math.abs(w - firstWeight) <= tolerance
    ).length;
    sameWeight3Sessions = sameWeightCount >= 4;
  }

  // Signal 2: Failed rep targets for 2+ sessions
  let failedRepTargets = false;
  if (targetReps && sessionData.length >= 2) {
    const failedSessions = sessionData.slice(0, 4).filter((s) => {
      const avgReps = s.sets.reduce((sum, set) => sum + set.reps, 0) / s.sets.length;
      return avgReps < targetReps - 1; // Allow 1 rep buffer
    });
    failedRepTargets = failedSessions.length >= 2;
  }

  // Signal 3: Stalled 1RM (unchanged ±3% for 4+ sessions)
  let stalled1RM = false;
  if (sessionData.length >= 4) {
    const estimated1RMs = sessionData.slice(0, 6).map((s) => {
      const maxWeight = Math.max(...s.sets.map((set) => set.weight));
      const avgReps = s.sets.reduce((sum, set) => sum + set.reps, 0) / s.sets.length;
      return calculateEpley1RM(maxWeight, Math.round(avgReps));
    });

    const first1RM = estimated1RMs[0];
    const tolerance = first1RM * 0.03; // 3% tolerance
    const stalled1RMCount = estimated1RMs.filter((rm) =>
      Math.abs(rm - first1RM) <= tolerance
    ).length;
    stalled1RM = stalled1RMCount >= 4;
  }

  return {
    sameWeight3Sessions,
    failedRepTargets,
    stalled1RM,
  };
};

/**
 * Determine overall progress status based on signals and trends
 */
const determineProgressStatus = (
  signals: PlateauSignals,
  estimated1RMTrend: number,
  sessionCount: number
): 'improving' | 'plateau' | 'declining' | 'insufficient_data' => {
  if (sessionCount < 3) {
    return 'insufficient_data';
  }

  // Count plateau signals
  const signalCount = [
    signals.sameWeight3Sessions,
    signals.failedRepTargets,
    signals.stalled1RM,
  ].filter(Boolean).length;

  // Declining if 1RM trend is significantly negative
  if (estimated1RMTrend < -5) {
    return 'declining';
  }

  // Improving if 1RM trend is positive (any positive trend means progress)
  if (estimated1RMTrend > 0) {
    return 'improving';
  }

  // Plateau requires 2+ signals AND negative/flat trend
  if (signalCount >= 2 && estimated1RMTrend <= 0) {
    return 'plateau';
  }

  // If only 1 signal but trend is negative, it's plateau
  if (signalCount === 1 && estimated1RMTrend < -2) {
    return 'plateau';
  }

  // Default to improving - give benefit of the doubt
  return 'improving';
};

/**
 * Build analysis context string for AI prompt
 */
export const buildExerciseAnalysisContext = (
  analyses: ExerciseAnalysis[]
): string => {
  if (analyses.length === 0) return '';

  const analysisLines = analyses.map((analysis) => {
    const weekSummary = analysis.weeklyPerformance
      .slice(0, 10)
      .map((w) => `Week ${w.weekAgo} ago: ${w.maxWeight}lbs × ${w.avgReps.toFixed(1)} reps (1RM: ${w.estimated1RM.toFixed(0)})`)
      .join('\n    ');

    const signals = [];
    if (analysis.plateauSignals.sameWeight3Sessions) signals.push('same weight 3+ sessions');
    if (analysis.plateauSignals.failedRepTargets) signals.push('missed rep targets');
    if (analysis.plateauSignals.stalled1RM) signals.push('stalled 1RM');

    return `
  ${analysis.exerciseName} (${analysis.exerciseId}):
    Status: ${analysis.progressStatus.toUpperCase()}
    ${weekSummary || 'No weekly data'}
    1RM Trend: ${analysis.estimated1RMTrend > 0 ? '+' : ''}${analysis.estimated1RMTrend.toFixed(1)}%
    ${signals.length > 0 ? `Plateau Signals: ${signals.join(', ')}` : ''}`;
  }).join('\n');

  return `
EXERCISE ANALYSIS (10-week history):
${analysisLines}
`;
};
