import {
  WorkoutSession,
  ExerciseSuggestion,
  WorkoutTemplate,
  ProgressiveOverloadWeek,
  WorkoutGoal,
  StrengthCompletedSet,
  StrengthTemplateExercise,
  Exercise,
  ExperienceLevel,
  PhaseConfig,
} from '../types';
import { isStrengthPhase } from '../types/cycles';
import { getExerciseById } from '../data/exercises';
import { getCustomExercises } from './storage';
import {
  analyzeExercise10Weeks,
  ExerciseAnalysis,
  hasEnoughHistoryForPlateauDetection,
} from './openai/exerciseAnalysis';
import { filterOutliers } from '../utils/outlierFilter';

interface LocalSuggestionContext {
  experienceLevel: ExperienceLevel;
  workoutGoal: WorkoutGoal;
  weightUnit: 'lbs' | 'kg';
  currentWeek?: ProgressiveOverloadWeek;
  currentPhase?: PhaseConfig;
}

/**
 * Get the median value of a numeric array.
 * Returns 0 for empty arrays.
 */
const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

/**
 * Round weight to the nearest increment based on unit.
 * lbs: nearest 2.5 lbs
 * kg: nearest 1.25 kg
 */
const roundWeight = (weight: number, unit: 'lbs' | 'kg'): number => {
  const increment = unit === 'lbs' ? 2.5 : 1.25;
  return Math.round(weight / increment) * increment;
};

/**
 * Get the weight increment for progression based on experience level and unit.
 */
const getProgressionIncrement = (
  experienceLevel: ExperienceLevel,
  unit: 'lbs' | 'kg'
): number => {
  if (unit === 'kg') {
    return experienceLevel === 'beginner' ? 2.5 : 1.25;
  }
  // lbs
  return experienceLevel === 'beginner' ? 5 : 2.5;
};

/**
 * Calculate a local suggestion for a single exercise without AI.
 */
export const calculateLocalSuggestion = (
  exerciseId: string,
  analysis: ExerciseAnalysis,
  context: LocalSuggestionContext,
  targetReps: number,
  recentSessionSets: { weight: number; reps: number }[][]
): ExerciseSuggestion => {
  const customExercises = getCustomExercises();
  const exerciseInfo = getExerciseById(exerciseId, customExercises);
  const exerciseName = exerciseInfo?.name || exerciseId;

  // 1. Working weight = median of last 3-5 sessions' max weights (outlier-filtered)
  const sessionMaxWeights = recentSessionSets
    .slice(0, 5)
    .map((sets) => {
      const filtered = filterOutliers(sets, (s) => s.weight);
      return filtered.length > 0 ? Math.max(...filtered.map((s) => s.weight)) : 0;
    })
    .filter((w) => w > 0);

  let workingWeight = median(sessionMaxWeights);

  // 2. Working reps = median of recent avg reps
  const sessionAvgReps = recentSessionSets
    .slice(0, 5)
    .map((sets) => {
      const filtered = filterOutliers(sets, (s) => s.weight);
      return filtered.length > 0
        ? filtered.reduce((sum, s) => sum + s.reps, 0) / filtered.length
        : 0;
    })
    .filter((r) => r > 0);

  let workingReps = Math.round(median(sessionAvgReps)) || targetReps;

  // 3. Progression based on status
  let reasoning = '';
  const increment = getProgressionIncrement(context.experienceLevel, context.weightUnit);

  if (workingWeight === 0) {
    // No history at all
    return {
      exerciseId,
      suggestedWeight: 0,
      suggestedReps: targetReps,
      reasoning: `Start light and establish your working weight for ${exerciseName}`,
      confidence: 'low',
      progressStatus: 'new',
    };
  }

  switch (analysis.progressStatus) {
    case 'improving':
      if (context.experienceLevel === 'advanced') {
        // Advanced: add reps instead of weight
        workingReps = Math.min(workingReps + 1, targetReps + 3);
        reasoning = `Progressing well — adding 1 rep for ${exerciseName}`;
      } else {
        workingWeight += increment;
        reasoning = `Progressing well — adding ${increment} ${context.weightUnit} for ${exerciseName}`;
      }
      break;

    case 'plateau':
      workingWeight *= 0.9; // Reduce 10%
      workingReps = Math.min(workingReps + 2, workingReps + 3);
      reasoning = `Plateau detected — reducing weight 10% and increasing reps for ${exerciseName}`;
      break;

    case 'declining':
      workingWeight *= 0.875; // Reduce 12.5%
      reasoning = `Performance declining — reducing weight 12.5% for recovery on ${exerciseName}`;
      break;

    case 'insufficient_data':
    default:
      reasoning = `Continue with your current weight for ${exerciseName}`;
      break;
  }

  // 4. Week/phase modifiers
  if (context.currentPhase) {
    const phaseType = context.currentPhase.type;
    if (phaseType === 'deload') {
      workingWeight *= 0.7; // Reduce 30% (midpoint of 25-30%)
      workingReps = Math.max(targetReps, 10);
      reasoning = `Deload phase — reducing weight ~30% for ${exerciseName}`;
    } else if (phaseType === 'accumulation') {
      // Volume: keep weight, higher reps
      workingReps = Math.max(workingReps, targetReps);
      if (isStrengthPhase(context.currentPhase)) {
        workingReps = Math.min(workingReps, context.currentPhase.repRangeMax);
      }
    } else if (phaseType === 'intensification' || phaseType === 'realization') {
      // Strength: increase weight, lower reps
      workingWeight *= 1.05;
      if (isStrengthPhase(context.currentPhase)) {
        workingReps = Math.max(context.currentPhase.repRangeMin, Math.min(workingReps, context.currentPhase.repRangeMax));
      } else {
        workingReps = Math.max(3, workingReps - 2);
      }
    }
  } else if (context.currentWeek !== undefined) {
    // Legacy week system
    switch (context.currentWeek) {
      case 4: // Deload
        workingWeight *= 0.75; // Reduce 25%
        workingReps = Math.max(targetReps, 10);
        reasoning = `Deload week — reducing weight for recovery on ${exerciseName}`;
        break;
      case 3: // Strength push
        workingWeight *= 1.05;
        workingReps = Math.max(5, workingReps - 2);
        break;
      // Weeks 0-2 use the base progression logic above
    }
  }

  // 5. Round to nearest increment
  workingWeight = roundWeight(workingWeight, context.weightUnit);

  // Non-negative guard
  workingWeight = Math.max(0, workingWeight);
  workingReps = Math.max(1, workingReps);

  const confidence = analysis.progressStatus === 'insufficient_data' ? 'low' : 'medium';

  return {
    exerciseId,
    suggestedWeight: workingWeight,
    suggestedReps: workingReps,
    reasoning,
    confidence,
    progressStatus: analysis.progressStatus === 'insufficient_data' ? 'new' : analysis.progressStatus,
  };
};

/**
 * Generate local suggestions for all exercises in a template.
 * Mirrors getPreWorkoutSuggestions signature (minus apiKey).
 */
export const getLocalSuggestions = (
  template: WorkoutTemplate,
  previousSessions: WorkoutSession[],
  weightUnit: 'lbs' | 'kg',
  currentWeek?: ProgressiveOverloadWeek,
  workoutGoal: WorkoutGoal = 'build',
  experienceLevel: ExperienceLevel = 'intermediate',
  currentPhase?: PhaseConfig
): ExerciseSuggestion[] => {
  const customExercises = getCustomExercises();

  const strengthTemplateExercises = template.exercises.filter(
    (ex): ex is StrengthTemplateExercise => ex.type === 'strength' || !('type' in ex)
  );

  if (strengthTemplateExercises.length === 0) {
    return [];
  }

  const enablePlateauDetection = hasEnoughHistoryForPlateauDetection(previousSessions);

  const context: LocalSuggestionContext = {
    experienceLevel,
    workoutGoal,
    weightUnit,
    currentWeek,
    currentPhase,
  };

  return strengthTemplateExercises.map((templateEx) => {
    const analysis = analyzeExercise10Weeks(
      templateEx.exerciseId,
      previousSessions,
      customExercises as Exercise[],
      templateEx.targetReps,
      enablePlateauDetection
    );

    // Collect recent session sets for this exercise
    const recentSessionSets: { weight: number; reps: number }[][] = [];
    const sortedSessions = [...previousSessions]
      .filter((s) => s.completedAt)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    for (const session of sortedSessions.slice(0, 10)) {
      for (const ex of session.exercises) {
        if (ex.exerciseId === templateEx.exerciseId) {
          const strengthSets = ex.sets
            .filter((s): s is StrengthCompletedSet =>
              s.type === 'strength' || !('type' in s)
            )
            .map((s) => ({ weight: s.weight, reps: s.reps }));
          if (strengthSets.length > 0) {
            recentSessionSets.push(strengthSets);
          }
        }
      }
    }

    return calculateLocalSuggestion(
      templateEx.exerciseId,
      analysis,
      context,
      templateEx.targetReps ?? 10,
      recentSessionSets
    );
  });
};
