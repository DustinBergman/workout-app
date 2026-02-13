import {
  WorkoutSession,
  ExerciseSuggestion,
  WorkoutTemplate,
  WorkoutGoal,
  WORKOUT_GOALS,
  StrengthCompletedSet,
  StrengthTemplateExercise,
  WeightEntry,
  Exercise,
  ExperienceLevel,
  PhaseConfig,
  AIModel,
} from '../../types';
import { isStrengthPhase, StrengthPhaseConfig } from '../../types/cycles';
import { getExerciseById } from '../../data/exercises';
import { getCustomExercises } from '../storage';
import { executeLLMWithRetries, OpenAIModel } from './client';
import {
  analyzeExercise10Weeks,
  ExerciseAnalysis,
  hasEnoughHistoryForPlateauDetection,
} from './exerciseAnalysis';
import { filterOutliers } from '../../utils/outlierFilter';
import { calculateLocalSuggestion } from '../localSuggestions';
import {
  calculatePersonalizedProgression,
  PersonalizedProgressionConfig,
} from '../weightedProgression';

// Context shared across all exercise suggestions (exported for eval)
export interface SuggestionContext {
  trainingGuidance: string;
  weightContext: string;
  weightUnit: 'lbs' | 'kg';
  experienceLevel: ExperienceLevel;
  workoutGoal: WorkoutGoal;
  currentPhase?: PhaseConfig;
}

// Data for a single exercise suggestion request (exported for eval)
export interface ExerciseSuggestionInput {
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
  // Personalization data from weighted progression system
  personalization?: PersonalizedProgressionConfig;
}

export const buildWeightContext = (
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

export const buildTrainingGuidance = (
  workoutGoal: WorkoutGoal,
  experienceLevel: ExperienceLevel = 'intermediate',
  currentPhase?: PhaseConfig
): string => {
  const goalInfo = WORKOUT_GOALS[workoutGoal];
  const experienceGuidance = buildExperienceLevelGuidance(experienceLevel);

  if (!currentPhase) {
    return `Goal: ${goalInfo.name}. ${experienceGuidance}. Target: ${goalInfo.defaultRepRange}`;
  }

  const phaseGuidance = currentPhase.aiGuidance;
  const intensityInfo = currentPhase.intensityDescription;

  // Include weightAdjustment in guidance when present
  const weightAdj = isStrengthPhase(currentPhase) && (currentPhase as StrengthPhaseConfig).weightAdjustment
    ? ` Weight: ${(currentPhase as StrengthPhaseConfig).weightAdjustment}.`
    : '';

  // For strength phases, include rep range
  if ('repRangeMin' in currentPhase && 'repRangeMax' in currentPhase) {
    const repRange = `${currentPhase.repRangeMin}-${currentPhase.repRangeMax} reps`;
    return `Goal: ${goalInfo.name}. ${experienceGuidance}. Phase: ${currentPhase.name} (${intensityInfo}, ${repRange}).${weightAdj} ${phaseGuidance}`;
  }

  // For cardio phases
  return `Goal: ${goalInfo.name}. Phase: ${currentPhase.name} (${intensityInfo}). ${phaseGuidance}`;
};

// Build a structured prompt for a single exercise (exported for eval)
export const buildExercisePrompt = (
  context: SuggestionContext,
  exercise: ExerciseSuggestionInput
): string => {
  const parts: string[] = [
    '## Training Context',
    context.trainingGuidance,
  ];

  if (context.weightContext) {
    parts.push(context.weightContext);
  }

  parts.push(`\n## Exercise: ${exercise.exerciseName}`);
  parts.push(`Target: ${exercise.targetSets} sets x ${exercise.targetReps} reps`);

  // Add analysis if available
  if (exercise.analysis) {
    const { progressStatus, estimated1RMTrend, plateauSignals, recentSessions } = exercise.analysis;

    parts.push(`\n## Performance Analysis`);
    parts.push(`Progress Status: ${progressStatus.toUpperCase()}`);

    if (estimated1RMTrend !== undefined) {
      parts.push(`Estimated 1RM Trend: ${estimated1RMTrend > 0 ? '+' : ''}${estimated1RMTrend.toFixed(1)}% over 10 weeks`);
    }

    if (plateauSignals && progressStatus === 'plateau') {
      const signals = [];
      if (plateauSignals.sameWeight3Sessions) signals.push('same weight 3+ sessions');
      if (plateauSignals.failedRepTargets) signals.push('missed rep targets');
      if (plateauSignals.stalled1RM) signals.push('stalled 1RM');
      if (signals.length > 0) {
        parts.push(`Plateau Signals: ${signals.join(', ')}`);
      }
    }

    if (recentSessions && recentSessions.length > 0) {
      const recent = recentSessions.slice(0, 5).map(s =>
        `  ${s.maxWeight}${context.weightUnit} x ${s.avgReps.toFixed(0)} reps (est. 1RM: ${s.estimated1RM.toFixed(0)}${context.weightUnit})`
      ).join('\n');
      parts.push(`Recent Sessions (newest first):\n${recent}`);
    }
  }

  // Add recent sets if available
  if (exercise.recentSets && exercise.recentSets.length > 0) {
    const recent = exercise.recentSets.slice(0, 5);
    const lastWeight = recent[0].weight;
    const lastReps = recent[0].reps;
    parts.push(`\nLast Working Set: ${lastWeight}${context.weightUnit} x ${lastReps} reps`);
  } else {
    parts.push('\nNo previous data - suggest conservative starting weight');
  }

  // Add personalization data as an anchor
  if (exercise.personalization) {
    const p = exercise.personalization;
    parts.push(`\n## Algorithm Recommendation (use as anchor)`);
    parts.push(`Computed Baseline: ${p.baseline.toFixed(1)}${context.weightUnit} (recency-weighted)`);
    parts.push(`Suggested Increment: ${p.increment.toFixed(1)}${context.weightUnit}`);
    parts.push(`Composite Adjustment: ${p.compositeMultiplier.toFixed(2)}x`);
    parts.push(`Data Confidence: ${p.confidence}`);

    if (p.factors.length > 0) {
      parts.push('Active Factors:');
      for (const f of p.factors) {
        parts.push(`  - ${f.name} (${f.value.toFixed(2)}x): ${f.reasoning}`);
      }
    }
  }

  return parts.join('\n');
};

// Build the system prompt (exported for eval)
export const buildSystemPrompt = (
  exerciseId: string,
  weightUnit: 'lbs' | 'kg'
): string => {
  return `You are an expert strength coach with deep knowledge of progressive overload, periodization, and individual adaptation. Your job is to recommend the exact weight and reps for a trainee's next session on a specific exercise.

## How to Reason

1. **Start from the algorithm recommendation** if provided — it has already analyzed the user's per-exercise progression rate, recovery status, training consistency, success rate, body weight trend, and mood. Treat it as a strong anchor.
2. **Look at the performance data** — recent session weights/reps, 1RM trend, and progress status. These tell you what the user has actually been doing.
3. **Apply the training context** — the current phase/week, goal, and experience level dictate whether to push, maintain, or back off.
4. **Adjust if needed** — if you see something the algorithm might miss (e.g., a clear plateau pattern that needs a technique change, or a deload week where the algorithm anchor should be overridden), deviate with a clear reason.
5. **Be conservative rather than aggressive** — a missed rep at too-heavy weight is worse than an "easy" set that builds confidence.

## Rules
- Weight must be in ${weightUnit}, rounded to nearest ${weightUnit === 'lbs' ? '2.5 lbs' : '1.25 kg'}
- Reps must be > 0
- For PLATEAU status, include a techniqueTip and repRangeChange suggestion
- Keep reasoning to 1-2 sentences, focusing on *why* this specific weight/rep combo

Respond ONLY with valid JSON:
{
  "suggestion": {
    "exerciseId": "${exerciseId}",
    "suggestedWeight": <number>,
    "suggestedReps": <number>,
    "reasoning": "<1-2 sentence explanation>",
    "confidence": "high" | "medium" | "low",
    "progressStatus": "improving" | "plateau" | "declining" | "new",
    "techniqueTip": "<only for plateau>",
    "repRangeChange": { "from": "X-Y", "to": "A-B", "reason": "<why>" }
  }
}`;
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
  customExercises: Exercise[],
  model: OpenAIModel,
  analysis?: ExerciseAnalysis,
  recentSessionSets?: { weight: number; reps: number }[][],
  allSessions?: WorkoutSession[],
  weightEntries?: WeightEntry[],
  weeklyWorkoutGoal?: number
): Promise<ExerciseSuggestion> => {
  const prompt = buildExercisePrompt(context, exercise);
  const systemPrompt = buildSystemPrompt(exercise.exerciseId, context.weightUnit);

  // Create smart fallback using local suggestion engine when we have analysis data
  let fallbackSuggestion: ExerciseSuggestion;

  if (analysis && recentSessionSets) {
    fallbackSuggestion = calculateLocalSuggestion(
      exercise.exerciseId,
      analysis,
      {
        experienceLevel: context.experienceLevel,
        workoutGoal: context.workoutGoal,
        weightUnit: context.weightUnit,
        currentPhase: context.currentPhase,
        allSessions,
        weightEntries,
        weeklyWorkoutGoal,
        customExercises,
      },
      exercise.targetReps,
      recentSessionSets
    );
  } else {
    const lastWeight = exercise.recentSets?.[0]?.weight ?? 0;
    const lastReps = exercise.recentSets?.[0]?.reps ?? exercise.targetReps;
    const exerciseInfo = getExerciseById(exercise.exerciseId, customExercises);
    const exerciseName = exerciseInfo?.name || exercise.exerciseName;

    fallbackSuggestion = {
      exerciseId: exercise.exerciseId,
      suggestedWeight: lastWeight,
      suggestedReps: lastReps || exercise.targetReps || 10,
      reasoning: lastWeight > 0
        ? `Continue with your previous weight for ${exerciseName}`
        : `Start light and establish your working weight for ${exerciseName}`,
      confidence: lastWeight > 0 ? 'medium' : 'low',
      progressStatus: lastWeight > 0 ? 'improving' : 'new',
    };
  }

  const fallback = { suggestion: fallbackSuggestion };

  const result = await executeLLMWithRetries({
    apiKey,
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    maxTokens: 400,
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

  // Attach personalization factors from the algorithm for transparency
  if (exercise.personalization?.factors) {
    suggestion.personalizationFactors = exercise.personalization.factors;
  }

  return suggestion;
};

// Build exercise input data from template and history
const buildExerciseInput = (
  templateEx: StrengthTemplateExercise,
  previousSessions: WorkoutSession[],
  customExercises: Exercise[],
  analysis: ExerciseAnalysis | undefined,
  personalization: PersonalizedProgressionConfig | undefined
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

  // Filter outliers by weight before passing to AI
  const filteredSets = filterOutliers(previousSets, (s) => s.weight);

  const input: ExerciseSuggestionInput = {
    exerciseId: templateEx.exerciseId,
    exerciseName: exerciseInfo?.name || templateEx.exerciseId,
    targetSets: templateEx.targetSets ?? 3,
    targetReps: templateEx.targetReps ?? 10,
  };

  // Only include recent sets if we have data
  if (filteredSets.length > 0) {
    input.recentSets = filteredSets.slice(0, 10);
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

  // Include personalization data
  if (personalization) {
    input.personalization = personalization;
  }

  return input;
};

export const getPreWorkoutSuggestions = async (
  apiKey: string,
  template: WorkoutTemplate,
  previousSessions: WorkoutSession[],
  weightUnit: 'lbs' | 'kg',
  workoutGoal: WorkoutGoal = 'build',
  weightEntries: WeightEntry[] = [],
  experienceLevel: ExperienceLevel = 'intermediate',
  currentPhase?: PhaseConfig,
  weeklyWorkoutGoal?: number,
  aiModel?: AIModel
): Promise<ExerciseSuggestion[]> => {
  const customExercises = getCustomExercises();
  const model: OpenAIModel = (aiModel as OpenAIModel) || 'gpt-5-mini';

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

  // Collect recent session sets per exercise (used for both personalization and fallback)
  const recentSessionSetsMap = new Map<string, { weight: number; reps: number }[][]>();
  const sortedSessions = [...previousSessions]
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  for (const templateEx of strengthTemplateExercises) {
    const sessionSets: { weight: number; reps: number }[][] = [];
    for (const session of sortedSessions.slice(0, 10)) {
      for (const ex of session.exercises) {
        if (ex.exerciseId === templateEx.exerciseId) {
          const sets = ex.sets
            .filter((s): s is StrengthCompletedSet =>
              s.type === 'strength' || !('type' in s)
            )
            .map((s) => ({ weight: s.weight, reps: s.reps }));
          if (sets.length > 0) {
            sessionSets.push(sets);
          }
        }
      }
    }
    recentSessionSetsMap.set(templateEx.exerciseId, sessionSets);
  }

  // Compute personalization for each exercise
  const personalizationMap = new Map<string, PersonalizedProgressionConfig>();
  for (const templateEx of strengthTemplateExercises) {
    const analysis = analysisMap.get(templateEx.exerciseId);
    const recentSets = recentSessionSetsMap.get(templateEx.exerciseId) ?? [];

    if (analysis) {
      const config = calculatePersonalizedProgression({
        exerciseId: templateEx.exerciseId,
        analysis,
        recentSessionSets: recentSets,
        targetReps: templateEx.targetReps ?? 10,
        experienceLevel,
        weightUnit,
        workoutGoal,
        allSessions: previousSessions,
        weeklyWorkoutGoal,
        weightEntries,
        customExercises: customExercises as Exercise[],
      });
      personalizationMap.set(templateEx.exerciseId, config);
    }
  }

  // Build shared context (compact)
  const context: SuggestionContext = {
    trainingGuidance: buildTrainingGuidance(workoutGoal, experienceLevel, currentPhase),
    weightContext: buildWeightContext(weightEntries, weightUnit),
    weightUnit,
    experienceLevel,
    workoutGoal,
    currentPhase,
  };

  // Build input for each exercise
  const exerciseInputs = strengthTemplateExercises.map((templateEx) =>
    buildExerciseInput(
      templateEx,
      previousSessions,
      customExercises as Exercise[],
      analysisMap.get(templateEx.exerciseId),
      personalizationMap.get(templateEx.exerciseId)
    )
  );

  // Call LLM for each exercise in parallel
  const suggestionPromises = exerciseInputs.map((exerciseInput) =>
    getSuggestionForExercise(
      apiKey,
      context,
      exerciseInput,
      customExercises as Exercise[],
      model,
      analysisMap.get(exerciseInput.exerciseId),
      recentSessionSetsMap.get(exerciseInput.exerciseId),
      previousSessions,
      weightEntries,
      weeklyWorkoutGoal
    )
  );

  const suggestions = await Promise.all(suggestionPromises);

  return suggestions;
};
