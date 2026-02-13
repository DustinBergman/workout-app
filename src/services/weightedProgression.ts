import {
  WorkoutSession,
  WorkoutGoal,
  WeightEntry,
  ExperienceLevel,
  Exercise,
  StrengthExercise,
  MuscleGroup,
} from '../types';
import {
  ExerciseAnalysis,
  WeeklyPerformance,
} from './openai/exerciseAnalysis';
import { getExerciseById } from '../data/exercises';
import { filterOutliers } from '../utils/outlierFilter';

// ── Types ────────────────────────────────────────────────────────────

export interface PersonalizationFactor {
  name: string;
  value: number;
  reasoning: string;
}

export interface PersonalizedProgressionConfig {
  baseline: number;
  increment: number;
  compositeMultiplier: number;
  factors: PersonalizationFactor[];
  confidence: 'high' | 'medium' | 'low';
}

export interface PersonalizedProgressionContext {
  exerciseId: string;
  analysis: ExerciseAnalysis;
  recentSessionSets: { weight: number; reps: number }[][];
  targetReps: number;
  experienceLevel: ExperienceLevel;
  weightUnit: 'lbs' | 'kg';
  workoutGoal: WorkoutGoal;
  allSessions: WorkoutSession[];
  weeklyWorkoutGoal?: number;
  weightEntries?: WeightEntry[];
  customExercises?: Exercise[];
}

// ── Phase 1: Recency-Weighted Baseline ───────────────────────────────

/**
 * Exponential decay weighted average of recent session max weights.
 * More recent sessions contribute more. Decay factor: e^(-0.2 * i)
 * where i is the session index (0 = most recent).
 *
 * Falls back to 0 if no valid weights.
 */
export const calculateExponentialDecayBaseline = (
  sessionMaxWeights: number[]
): number => {
  if (sessionMaxWeights.length === 0) return 0;

  let weightedSum = 0;
  let weightSum = 0;

  for (let i = 0; i < sessionMaxWeights.length; i++) {
    const decayWeight = Math.exp(-0.2 * i);
    weightedSum += sessionMaxWeights[i] * decayWeight;
    weightSum += decayWeight;
  }

  return weightSum > 0 ? weightedSum / weightSum : 0;
};

// ── Phase 1: Per-Exercise Adaptive Progression Rate ──────────────────

/**
 * Compute a per-exercise progression rate from weeklyPerformance data
 * using linear regression on maxWeight vs. week index.
 *
 * Requires 3+ data points. Falls back to the default fixed increment
 * if data is sparse or the fit is poor (R² < 0.3).
 *
 * Clamped to max 2x the default increment to prevent absurd jumps.
 */
export const calculateAdaptiveIncrement = (
  weeklyPerformance: WeeklyPerformance[],
  defaultIncrement: number
): { increment: number; isAdaptive: boolean } => {
  // Need 3+ weeks of data for meaningful regression
  if (weeklyPerformance.length < 3) {
    return { increment: defaultIncrement, isAdaptive: false };
  }

  // Sort by weekAgo descending so index 0 = oldest
  const sorted = [...weeklyPerformance].sort((a, b) => b.weekAgo - a.weekAgo);

  const n = sorted.length;
  const xs = sorted.map((_, i) => i); // 0, 1, 2, ...
  const ys = sorted.map((w) => w.maxWeight);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0);

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) {
    return { increment: defaultIncrement, isAdaptive: false };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R²
  const meanY = sumY / n;
  const ssTotal = ys.reduce((acc, y) => acc + (y - meanY) ** 2, 0);
  const ssResidual = ys.reduce((acc, y, i) => {
    const predicted = intercept + slope * xs[i];
    return acc + (y - predicted) ** 2;
  }, 0);

  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;

  // If R² < 0.3 (noisy data), fall back to default
  if (rSquared < 0.3) {
    return { increment: defaultIncrement, isAdaptive: false };
  }

  // slope = weight change per week. Use absolute value, sign handled elsewhere.
  const adaptiveIncrement = Math.abs(slope);

  // Clamp to max 2x the default increment
  const clamped = Math.min(adaptiveIncrement, defaultIncrement * 2);

  // If adaptive increment is very small (< 25% of default), use default
  if (clamped < defaultIncrement * 0.25) {
    return { increment: defaultIncrement, isAdaptive: false };
  }

  return { increment: clamped, isAdaptive: true };
};

// ── Phase 2: Success Rate Multiplier ─────────────────────────────────

/**
 * Tracks how often the user hits target reps at working weight.
 *
 * Looks at the last 5 sessions' sets. A set "succeeds" if reps >= targetReps.
 * Returns a multiplier:
 *   ≥90% → 1.2x (push harder)
 *   ≥75% → 1.0x (on track)
 *   ≥50% → 0.7x (struggling)
 *   <50% → 0.5x (ease off)
 */
export const calculateSuccessRate = (
  recentSessionSets: { weight: number; reps: number }[][],
  targetReps: number
): { multiplier: number; successRate: number } => {
  const allSets = recentSessionSets.slice(0, 5).flat();

  if (allSets.length === 0) {
    return { multiplier: 1.0, successRate: 0 };
  }

  // Only consider sets at or near the max weight (within 90%) to focus on working sets
  const maxWeight = Math.max(...allSets.map((s) => s.weight));
  const workingSets = allSets.filter((s) => s.weight >= maxWeight * 0.9);

  if (workingSets.length === 0) {
    return { multiplier: 1.0, successRate: 0 };
  }

  const successCount = workingSets.filter((s) => s.reps >= targetReps).length;
  const successRate = successCount / workingSets.length;

  let multiplier: number;
  if (successRate >= 0.9) {
    multiplier = 1.2;
  } else if (successRate >= 0.75) {
    multiplier = 1.0;
  } else if (successRate >= 0.5) {
    multiplier = 0.7;
  } else {
    multiplier = 0.5;
  }

  return { multiplier, successRate };
};

// ── Phase 2: Workout Consistency Factor ──────────────────────────────

/**
 * Compare actual sessions in last 2 weeks vs weeklyWorkoutGoal.
 *
 *   ≥100% adherence → 1.05x
 *   ≥75%  → 1.0x
 *   ≥50%  → 0.9x
 *   <50%  → 0.8x
 */
export const calculateConsistencyFactor = (
  allSessions: WorkoutSession[],
  weeklyWorkoutGoal?: number
): { multiplier: number; adherenceRate: number } => {
  if (!weeklyWorkoutGoal || weeklyWorkoutGoal <= 0) {
    return { multiplier: 1.0, adherenceRate: 0 };
  }

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentCompleted = allSessions.filter((s) => {
    if (!s.completedAt) return false;
    return new Date(s.completedAt) >= twoWeeksAgo;
  });

  const expectedSessions = weeklyWorkoutGoal * 2; // 2 weeks
  const adherenceRate = recentCompleted.length / expectedSessions;

  let multiplier: number;
  if (adherenceRate >= 1.0) {
    multiplier = 1.05;
  } else if (adherenceRate >= 0.75) {
    multiplier = 1.0;
  } else if (adherenceRate >= 0.5) {
    multiplier = 0.9;
  } else {
    multiplier = 0.8;
  }

  return { multiplier, adherenceRate };
};

// ── Phase 3: Recovery Factor ─────────────────────────────────────────

/**
 * Days since the same muscle group was last trained.
 *
 *   ≥5 days → 1.05x (well rested)
 *   ≥3 days → 1.0x  (normal)
 *   ≥2 days → 0.95x (tight recovery)
 *   <2 days → 0.9x  (insufficient recovery)
 */
export const calculateRecoveryFactor = (
  exerciseId: string,
  allSessions: WorkoutSession[],
  customExercises: Exercise[] = []
): { multiplier: number; daysSinceLastTrained: number | null } => {
  const exerciseInfo = getExerciseById(exerciseId, customExercises);

  if (!exerciseInfo || exerciseInfo.type !== 'strength') {
    return { multiplier: 1.0, daysSinceLastTrained: null };
  }

  const targetMuscles = new Set((exerciseInfo as StrengthExercise).muscleGroups);

  // Find most recent session that trained overlapping muscles
  const sortedSessions = [...allSessions]
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  for (const session of sortedSessions) {
    const hasOverlap = session.exercises.some((ex) => {
      const exInfo = getExerciseById(ex.exerciseId, customExercises);
      if (!exInfo || exInfo.type !== 'strength') return false;
      return (exInfo as StrengthExercise).muscleGroups.some(
        (mg: MuscleGroup) => targetMuscles.has(mg)
      );
    });

    if (hasOverlap) {
      const daysSince = (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60 * 60 * 24);

      let multiplier: number;
      if (daysSince >= 5) {
        multiplier = 1.05;
      } else if (daysSince >= 3) {
        multiplier = 1.0;
      } else if (daysSince >= 2) {
        multiplier = 0.95;
      } else {
        multiplier = 0.9;
      }

      return { multiplier, daysSinceLastTrained: daysSince };
    }
  }

  // No prior session found for this muscle group
  return { multiplier: 1.0, daysSinceLastTrained: null };
};

// ── Phase 3: Body Weight Trend Integration ───────────────────────────

/**
 * Compute body weight trend over 30-60 days and adjust relative to goal.
 *
 *   Build + gaining → 1.05x
 *   Build + losing  → 0.9x
 *   Lose + losing   → 1.0x (expected)
 *   Lose + gaining   → 0.95x (not going as planned)
 *   Maintain + stable → 1.0x
 *   Maintain + changing → 0.95x
 */
export const calculateBodyWeightFactor = (
  weightEntries: WeightEntry[],
  workoutGoal: WorkoutGoal
): { multiplier: number; trend: 'gaining' | 'losing' | 'stable' | 'unknown' } => {
  if (weightEntries.length < 2) {
    return { multiplier: 1.0, trend: 'unknown' };
  }

  // Filter to last 60 days
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recent = weightEntries
    .filter((e) => new Date(e.date) >= sixtyDaysAgo)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (recent.length < 2) {
    return { multiplier: 1.0, trend: 'unknown' };
  }

  // Simple linear trend: compare average of first half to second half
  const mid = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, mid);
  const secondHalf = recent.slice(mid);

  const avgFirst = firstHalf.reduce((sum, e) => sum + e.weight, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, e) => sum + e.weight, 0) / secondHalf.length;

  const changePercent = ((avgSecond - avgFirst) / avgFirst) * 100;

  // Determine trend (±1% is considered stable)
  let trend: 'gaining' | 'losing' | 'stable';
  if (changePercent > 1) {
    trend = 'gaining';
  } else if (changePercent < -1) {
    trend = 'losing';
  } else {
    trend = 'stable';
  }

  let multiplier: number;
  switch (workoutGoal) {
    case 'build':
      multiplier = trend === 'gaining' ? 1.05 : trend === 'losing' ? 0.9 : 1.0;
      break;
    case 'lose':
      multiplier = trend === 'losing' ? 1.0 : trend === 'gaining' ? 0.95 : 1.0;
      break;
    case 'maintain':
      multiplier = trend === 'stable' ? 1.0 : 0.95;
      break;
  }

  return { multiplier, trend };
};

// ── Phase 4: Mood Trend Factor ───────────────────────────────────────

/**
 * Average mood from last 5 completed sessions.
 *
 *   ≥4.0 → 1.1x
 *   ≥3.0 → 1.0x
 *   ≥2.0 → 0.85x
 *   <2.0 → 0.7x
 */
export const calculateMoodFactor = (
  allSessions: WorkoutSession[]
): { multiplier: number; avgMood: number | null } => {
  const recentWithMood = allSessions
    .filter((s) => s.completedAt && s.mood != null)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 5);

  if (recentWithMood.length === 0) {
    return { multiplier: 1.0, avgMood: null };
  }

  const avgMood = recentWithMood.reduce((sum, s) => sum + (s.mood as number), 0) / recentWithMood.length;

  let multiplier: number;
  if (avgMood >= 4.0) {
    multiplier = 1.1;
  } else if (avgMood >= 3.0) {
    multiplier = 1.0;
  } else if (avgMood >= 2.0) {
    multiplier = 0.85;
  } else {
    multiplier = 0.7;
  }

  return { multiplier, avgMood };
};

// ── Orchestrator ─────────────────────────────────────────────────────

/**
 * Calculate personalized progression config for a single exercise.
 *
 * Gathers all factor multipliers, composes them multiplicatively,
 * clamps the composite to [0.5, 1.5], and blends with default
 * behavior based on data confidence.
 */
export const calculatePersonalizedProgression = (
  ctx: PersonalizedProgressionContext
): PersonalizedProgressionConfig => {
  const factors: PersonalizationFactor[] = [];

  // ── Baseline ──
  const sessionMaxWeights = ctx.recentSessionSets
    .slice(0, 5)
    .map((sets) => {
      const filtered = filterOutliers(sets, (s) => s.weight);
      return filtered.length > 0 ? Math.max(...filtered.map((s) => s.weight)) : 0;
    })
    .filter((w) => w > 0);

  const baseline = calculateExponentialDecayBaseline(sessionMaxWeights);

  // ── Default increment ──
  const defaultIncrement =
    ctx.weightUnit === 'kg'
      ? ctx.experienceLevel === 'beginner' ? 2.5 : 1.25
      : ctx.experienceLevel === 'beginner' ? 5 : 2.5;

  // ── Factor 1: Adaptive Increment ──
  const { increment: adaptiveIncrement, isAdaptive } = calculateAdaptiveIncrement(
    ctx.analysis.weeklyPerformance,
    defaultIncrement
  );

  if (isAdaptive) {
    factors.push({
      name: 'Adaptive Progression',
      value: adaptiveIncrement,
      reasoning: `Per-exercise progression rate: ${adaptiveIncrement.toFixed(1)} ${ctx.weightUnit}/week based on your history`,
    });
  }

  // ── Factor 2: Success Rate ──
  const { multiplier: successMult, successRate } = calculateSuccessRate(
    ctx.recentSessionSets,
    ctx.targetReps
  );

  if (successMult !== 1.0) {
    factors.push({
      name: 'Success Rate',
      value: successMult,
      reasoning: `Hit target reps ${(successRate * 100).toFixed(0)}% of the time → ${successMult > 1 ? 'pushing harder' : 'easing off'}`,
    });
  }

  // ── Factor 3: Consistency ──
  const { multiplier: consistencyMult, adherenceRate } = calculateConsistencyFactor(
    ctx.allSessions,
    ctx.weeklyWorkoutGoal
  );

  if (consistencyMult !== 1.0) {
    factors.push({
      name: 'Workout Consistency',
      value: consistencyMult,
      reasoning: `${(adherenceRate * 100).toFixed(0)}% of target sessions completed → ${consistencyMult > 1 ? 'consistent training' : 'reduced expectations'}`,
    });
  }

  // ── Factor 4: Recovery ──
  const { multiplier: recoveryMult, daysSinceLastTrained } = calculateRecoveryFactor(
    ctx.exerciseId,
    ctx.allSessions,
    ctx.customExercises
  );

  if (recoveryMult !== 1.0 && daysSinceLastTrained != null) {
    factors.push({
      name: 'Recovery',
      value: recoveryMult,
      reasoning: `${daysSinceLastTrained.toFixed(1)} days since muscle group trained → ${recoveryMult > 1 ? 'well rested' : 'tight recovery'}`,
    });
  }

  // ── Factor 5: Body Weight Trend ──
  const { multiplier: bwMult, trend: bwTrend } = calculateBodyWeightFactor(
    ctx.weightEntries ?? [],
    ctx.workoutGoal
  );

  if (bwMult !== 1.0) {
    factors.push({
      name: 'Body Weight Trend',
      value: bwMult,
      reasoning: `Weight trend: ${bwTrend} while goal is ${ctx.workoutGoal}`,
    });
  }

  // ── Factor 6: Mood ──
  const { multiplier: moodMult, avgMood } = calculateMoodFactor(ctx.allSessions);

  if (moodMult !== 1.0 && avgMood != null) {
    factors.push({
      name: 'Mood Trend',
      value: moodMult,
      reasoning: `Average mood: ${avgMood.toFixed(1)}/5 → ${moodMult > 1 ? 'feeling strong' : 'lower energy'}`,
    });
  }

  // ── Composite multiplier ──
  const rawComposite = successMult * consistencyMult * recoveryMult * bwMult * moodMult;
  const compositeMultiplier = Math.max(0.5, Math.min(1.5, rawComposite));

  // ── Confidence ──
  // Based on how much data we have
  const dataPoints = sessionMaxWeights.length;
  const hasWeeklyData = ctx.analysis.weeklyPerformance.length >= 3;

  let confidence: 'high' | 'medium' | 'low';
  if (dataPoints >= 5 && hasWeeklyData) {
    confidence = 'high';
  } else if (dataPoints >= 3) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Blend adaptive vs. default based on confidence
  let finalIncrement: number;
  if (confidence === 'high') {
    finalIncrement = adaptiveIncrement;
  } else if (confidence === 'medium') {
    finalIncrement = adaptiveIncrement * 0.7 + defaultIncrement * 0.3;
  } else {
    finalIncrement = defaultIncrement;
  }

  return {
    baseline,
    increment: finalIncrement,
    compositeMultiplier,
    factors,
    confidence,
  };
};
