import {
  WorkoutSession,
  ExerciseSuggestion,
  WorkoutTemplate,
  ProgressiveOverloadWeek,
  WorkoutGoal,
  WORKOUT_GOALS,
  StrengthCompletedSet,
  StrengthTemplateExercise,
  WeightEntry,
  Exercise,
  ExperienceLevel,
  getWeekConfigForGoal,
} from '../../types';
import { getExerciseById } from '../../data/exercises';
import { getCustomExercises } from '../storage';
import { executeLLMWithRetries } from './client';
import {
  analyzeExercise10Weeks,
  ExerciseAnalysis,
  hasEnoughHistoryForPlateauDetection,
} from './exerciseAnalysis';

// Context shared across all exercise suggestions
interface SuggestionContext {
  trainingGuidance: string;
  weightContext: string;
  weightUnit: 'lbs' | 'kg';
}

// Data for a single exercise suggestion request
interface ExerciseSuggestionInput {
  exerciseId: string;
  exerciseName: string;
  targetSets: number;
  targetReps: number;
  // Recent performance - only include if we have data
  recentSets?: Array<{ date: string; weight: number; reps: number }>;
  // Analysis data - only include if we have history
  analysis?: {
    progressStatus: 'improving' | 'plateau' | 'declining' | 'insufficient_data';
    estimated1RMTrend?: number;
    plateauSignals?: {
      sameWeight3Sessions: boolean;
      failedRepTargets: boolean;
      stalled1RM: boolean;
    };
    recentSessions?: Array<{
      date: string;
      maxWeight: number;
      avgReps: number;
      estimated1RM: number;
    }>;
  };
}

const buildWeightContext = (
  weightEntries: WeightEntry[],
  weightUnit: 'lbs' | 'kg'
): string => {
  if (weightEntries.length === 0) {
    return '';
  }

  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const recentEntries = weightEntries
    .filter((e) => new Date(e.date) >= sixtyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (recentEntries.length === 0) {
    return '';
  }

  const currentWeight = recentEntries[0].weight;
  const oldestEntry = recentEntries[recentEntries.length - 1];
  const weightChange = currentWeight - oldestEntry.weight;

  let trend = 'maintained';
  if (weightChange > 1) trend = 'gained';
  else if (weightChange < -1) trend = 'lost';

  return `Body weight: ${currentWeight.toFixed(1)} ${weightUnit} (${trend} ${Math.abs(weightChange).toFixed(1)} ${weightUnit} over 60 days)`;
};

const buildExperienceLevelGuidance = (experienceLevel: ExperienceLevel): string => {
  switch (experienceLevel) {
    case 'beginner':
      return 'Beginner: Can progress 5-10% when ready';
    case 'intermediate':
      return 'Intermediate: Progress 2-5% when ready';
    case 'advanced':
      return 'Advanced: Progress 1-2.5% max';
    default:
      return '';
  }
};

const buildTrainingGuidance = (
  workoutGoal: WorkoutGoal,
  currentWeek?: ProgressiveOverloadWeek,
  experienceLevel: ExperienceLevel = 'intermediate'
): string => {
  const goalInfo = WORKOUT_GOALS[workoutGoal];
  const experienceGuidance = buildExperienceLevelGuidance(experienceLevel);

  if (currentWeek === undefined) {
    return `Goal: ${goalInfo.name}. ${experienceGuidance}. Target: ${goalInfo.defaultRepRange}`;
  }

  const weekConfig = getWeekConfigForGoal(workoutGoal);
  const weekInfo = weekConfig[currentWeek];

  if (workoutGoal === 'build') {
    const weekGuidance: Record<number, string> = {
      0: 'Week 1 (Baseline): Use current working weights, 8-10 reps',
      1: 'Week 2 (Light Overload): Increase weight, target 6-8 reps',
      2: 'Week 3 (Volume Focus): KEEP Week 2 weight (do NOT reduce), build to 7-9 reps',
      3: 'Week 4 (Strength Push): Push heavier if ready, 5-6 reps',
      4: 'Week 5 (Deload): Reduce 20-30%, easy 8-12 reps',
    };
    return `Goal: ${goalInfo.name}. ${experienceGuidance}. ${weekGuidance[currentWeek] || weekInfo.description}`;
  }

  if (workoutGoal === 'lose') {
    const weekGuidance: Record<number, string> = {
      0: 'Week 1: Maintain current weights, 6-10 reps',
      1: 'Week 2: Same weights, reduce volume',
      2: 'Week 3: Heavy weights, low volume (4-6 reps)',
      3: 'Week 4: Reduce 10%, moderate volume',
      4: 'Week 5: Reduce 30%, light deload',
    };
    return `Goal: ${goalInfo.name} (deficit - maintain strength, no increases). ${weekGuidance[currentWeek] || weekInfo.description}`;
  }

  if (workoutGoal === 'maintain') {
    const weekGuidance: Record<number, string> = {
      0: 'Week 1: Baseline weights, 8-12 reps',
      1: 'Week 2: Reduce 10-15%, higher reps (12-15)',
      2: 'Week 3: Increase 5% from baseline, 8-10 reps',
      3: 'Week 4: Increase 10% from baseline, 6-8 reps',
      4: 'Week 5: Reduce 20%, recovery',
    };
    return `Goal: ${goalInfo.name} (intensity waves). ${weekGuidance[currentWeek] || weekInfo.description}`;
  }

  return `Goal: ${goalInfo.name}. ${experienceGuidance}. Target: ${goalInfo.defaultRepRange}`;
};

// Build a concise prompt for a single exercise
const buildExercisePrompt = (
  context: SuggestionContext,
  exercise: ExerciseSuggestionInput
): string => {
  const parts: string[] = [
    context.trainingGuidance,
  ];

  if (context.weightContext) {
    parts.push(context.weightContext);
  }

  parts.push(`\nExercise: ${exercise.exerciseName}`);
  parts.push(`Target: ${exercise.targetSets} sets x ${exercise.targetReps} reps`);

  // Add analysis if available
  if (exercise.analysis) {
    const { progressStatus, estimated1RMTrend, plateauSignals, recentSessions } = exercise.analysis;
    parts.push(`Status: ${progressStatus.toUpperCase()}`);

    if (estimated1RMTrend !== undefined) {
      parts.push(`1RM Trend: ${estimated1RMTrend > 0 ? '+' : ''}${estimated1RMTrend.toFixed(1)}%`);
    }

    if (plateauSignals && progressStatus === 'plateau') {
      const signals = [];
      if (plateauSignals.sameWeight3Sessions) signals.push('same weight 3+ sessions');
      if (plateauSignals.failedRepTargets) signals.push('missed rep targets');
      if (plateauSignals.stalled1RM) signals.push('stalled 1RM');
      if (signals.length > 0) {
        parts.push(`Plateau signals: ${signals.join(', ')}`);
      }
    }

    if (recentSessions && recentSessions.length > 0) {
      const recent = recentSessions.slice(0, 3).map(s =>
        `${s.maxWeight}${context.weightUnit} x ${s.avgReps.toFixed(0)} reps`
      ).join(', ');
      parts.push(`Recent: ${recent}`);
    }
  }

  // Add recent sets if available (most recent 5)
  if (exercise.recentSets && exercise.recentSets.length > 0) {
    const recent = exercise.recentSets.slice(0, 5);
    const lastWeight = recent[0].weight;
    const lastReps = recent[0].reps;
    parts.push(`Last set: ${lastWeight}${context.weightUnit} x ${lastReps} reps`);
  } else {
    parts.push('No previous data - suggest conservative starting weight');
  }

  return parts.join('\n');
};

// Validate a suggestion response
const validateSuggestion = (response: { suggestion?: ExerciseSuggestion }): boolean => {
  const s = response.suggestion;
  if (!s) return false;
  if (typeof s.suggestedWeight !== 'number') return false;
  if (typeof s.suggestedReps !== 'number' || s.suggestedReps <= 0) return false;
  if (!s.exerciseId) return false;
  return true;
};

// Get suggestion for a single exercise with retries
const getSuggestionForExercise = async (
  apiKey: string,
  context: SuggestionContext,
  exercise: ExerciseSuggestionInput,
  customExercises: Exercise[]
): Promise<ExerciseSuggestion> => {
  const prompt = buildExercisePrompt(context, exercise);

  const systemPrompt = `You are a fitness AI. Suggest weight and reps for this exercise based on the context.
Respond ONLY with valid JSON in this exact format:
{
  "suggestion": {
    "exerciseId": "${exercise.exerciseId}",
    "suggestedWeight": <number in ${context.weightUnit}>,
    "suggestedReps": <number, must be > 0>,
    "reasoning": "<1 sentence explanation>",
    "confidence": "high" | "medium" | "low",
    "progressStatus": "improving" | "plateau" | "declining" | "new"
  }
}

For PLATEAU status, also include:
- "techniqueTip": "<advice to break plateau>"
- "repRangeChange": { "from": "X-Y", "to": "A-B", "reason": "<why>" }`;

  // Create fallback based on last performance
  const lastWeight = exercise.recentSets?.[0]?.weight ?? 0;
  const lastReps = exercise.recentSets?.[0]?.reps ?? exercise.targetReps;
  const exerciseInfo = getExerciseById(exercise.exerciseId, customExercises);
  const exerciseName = exerciseInfo?.name || exercise.exerciseName;

  const fallback: { suggestion: ExerciseSuggestion } = {
    suggestion: {
      exerciseId: exercise.exerciseId,
      suggestedWeight: lastWeight,
      suggestedReps: lastReps || exercise.targetReps || 10,
      reasoning: lastWeight > 0
        ? `Continue with your previous weight for ${exerciseName}`
        : `Start light and establish your working weight for ${exerciseName}`,
      confidence: lastWeight > 0 ? 'medium' : 'low',
      progressStatus: lastWeight > 0 ? 'improving' : 'new',
    },
  };

  const result = await executeLLMWithRetries({
    apiKey,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    maxTokens: 300,
    temperature: 0.3,
    validate: validateSuggestion,
    fallback,
    maxRetries: 3,
  });

  // Ensure reps is valid
  const suggestion = result.suggestion;
  if (suggestion.suggestedReps <= 0) {
    suggestion.suggestedReps = exercise.targetReps || 10;
  }

  return suggestion;
};

// Build exercise input data from template and history
const buildExerciseInput = (
  templateEx: StrengthTemplateExercise,
  previousSessions: WorkoutSession[],
  customExercises: Exercise[],
  analysis: ExerciseAnalysis | undefined
): ExerciseSuggestionInput => {
  const exerciseInfo = getExerciseById(templateEx.exerciseId, customExercises);

  // Find recent sets for this exercise
  const previousSets: Array<{ date: string; weight: number; reps: number }> = [];
  for (const session of previousSessions) {
    for (const ex of session.exercises) {
      if (ex.exerciseId === templateEx.exerciseId) {
        for (const set of ex.sets) {
          if (set.type === 'strength' || !('type' in set)) {
            const strengthSet = set as StrengthCompletedSet;
            previousSets.push({
              date: session.startedAt,
              weight: strengthSet.weight,
              reps: strengthSet.reps,
            });
          }
        }
      }
    }
  }

  // Sort by date descending
  previousSets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const input: ExerciseSuggestionInput = {
    exerciseId: templateEx.exerciseId,
    exerciseName: exerciseInfo?.name || templateEx.exerciseId,
    targetSets: templateEx.targetSets ?? 3,
    targetReps: templateEx.targetReps ?? 10,
  };

  // Only include recent sets if we have data
  if (previousSets.length > 0) {
    input.recentSets = previousSets.slice(0, 10);
  }

  // Only include analysis if we have meaningful data
  if (analysis && analysis.progressStatus !== 'insufficient_data') {
    input.analysis = {
      progressStatus: analysis.progressStatus,
      estimated1RMTrend: analysis.estimated1RMTrend,
      plateauSignals: analysis.plateauSignals,
      recentSessions: analysis.recentSessions,
    };
  }

  return input;
};

export const getPreWorkoutSuggestions = async (
  apiKey: string,
  template: WorkoutTemplate,
  previousSessions: WorkoutSession[],
  weightUnit: 'lbs' | 'kg',
  currentWeek?: ProgressiveOverloadWeek,
  workoutGoal: WorkoutGoal = 'build',
  weightEntries: WeightEntry[] = [],
  experienceLevel: ExperienceLevel = 'intermediate'
): Promise<ExerciseSuggestion[]> => {
  const customExercises = getCustomExercises();

  // Filter to strength exercises only
  const strengthTemplateExercises = template.exercises.filter(
    (ex): ex is StrengthTemplateExercise => ex.type === 'strength' || !('type' in ex)
  );

  if (strengthTemplateExercises.length === 0) {
    return [];
  }

  // Check if we have enough history for plateau detection
  const enablePlateauDetection = hasEnoughHistoryForPlateauDetection(previousSessions);

  // Analyze each exercise (uses caching internally)
  const analysisMap = new Map<string, ExerciseAnalysis>();
  for (const templateEx of strengthTemplateExercises) {
    const analysis = analyzeExercise10Weeks(
      templateEx.exerciseId,
      previousSessions,
      customExercises as Exercise[],
      templateEx.targetReps,
      enablePlateauDetection
    );
    analysisMap.set(templateEx.exerciseId, analysis);
  }

  // Build shared context (compact)
  const context: SuggestionContext = {
    trainingGuidance: buildTrainingGuidance(workoutGoal, currentWeek, experienceLevel),
    weightContext: buildWeightContext(weightEntries, weightUnit),
    weightUnit,
  };

  // Build input for each exercise
  const exerciseInputs = strengthTemplateExercises.map((templateEx) =>
    buildExerciseInput(
      templateEx,
      previousSessions,
      customExercises as Exercise[],
      analysisMap.get(templateEx.exerciseId)
    )
  );

  // Call LLM for each exercise in parallel
  const suggestionPromises = exerciseInputs.map((exerciseInput) =>
    getSuggestionForExercise(apiKey, context, exerciseInput, customExercises as Exercise[])
  );

  const suggestions = await Promise.all(suggestionPromises);

  return suggestions;
};
