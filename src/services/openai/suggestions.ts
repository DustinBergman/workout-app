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
import { callOpenAI, parseJSONResponse } from './client';
import {
  analyzeExercise10Weeks,
  buildExerciseAnalysisContext,
  ExerciseAnalysis,
  hasEnoughHistoryForPlateauDetection,
} from './exerciseAnalysis';

const buildWeightContext = (
  weightEntries: WeightEntry[],
  weightUnit: 'lbs' | 'kg'
): string => {
  if (weightEntries.length === 0) {
    return '';
  }

  // Get entries from last 60 days
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

  const last5 = recentEntries.slice(0, 5).map((e) => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: e.weight,
  }));

  return `
USER BODY WEIGHT CONTEXT:
Current weight: ${currentWeight.toFixed(1)} ${weightUnit}
Weight trend (last 60 days): ${trend} ${Math.abs(weightChange).toFixed(1)} ${weightUnit}
Recent entries: ${last5.map((e) => `${e.date}: ${e.weight}${weightUnit}`).join(', ')}

Consider this when suggesting weights:
- If losing weight rapidly (>2 ${weightUnit}/week), user may be in a deficit and need slightly lower weights to maintain form
- If gaining weight steadily, user may be bulking and can potentially handle progressive overload
- Adjust recommendations based on body weight changes and recovery capacity
`;
};

const buildExperienceLevelGuidance = (experienceLevel: ExperienceLevel): string => {
  switch (experienceLevel) {
    case 'beginner':
      return `
EXPERIENCE LEVEL: Beginner (Less than 1 year of training)
- Neuromuscular adaptations allow faster progression
- Can expect 5-10% weight increases when progressing
- Focus on form while progressing - technique is still developing
- Recovery is typically faster, can handle slightly more aggressive increases
`;
    case 'intermediate':
      return `
EXPERIENCE LEVEL: Intermediate (1-2 years of training)
- Moderate progression rate expected
- Can expect 2-5% weight increases when progressing
- May need to cycle rep ranges to continue progress
- Balance between pushing limits and avoiding plateaus
`;
    case 'advanced':
      return `
EXPERIENCE LEVEL: Advanced (2+ years of consistent training)
- Progression is slow and hard-earned
- Expect only 1-2.5% weight increases at most
- Volume manipulation more important than linear weight increases
- Focus on technique refinement and intensity techniques
- Small PRs are significant achievements at this level
`;
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

  const volumeGuidance = `
VOLUME GUIDANCE (Science-Based):
- Prefer 2-3 working sets per exercise taken to failure
- Quality over quantity - fewer sets with maximum effort
- Research shows diminishing returns beyond 3 hard sets
- Each set should be performed with high intensity (close to or at failure)
`;

  // All goals now use week-based guidance
  if (currentWeek === undefined) {
    // Fallback if no week specified
    return `
TRAINING GOAL: ${goalInfo.name}
${experienceGuidance}
${volumeGuidance}
${goalInfo.aiGuidance}
Target rep range: ${goalInfo.defaultRepRange}
`;
  }

  const weekConfig = getWeekConfigForGoal(workoutGoal);
  const weekInfo = weekConfig[currentWeek];

  if (workoutGoal === 'build') {
    // Progressive overload mode
    return `
TRAINING GOAL: ${goalInfo.name} - ${goalInfo.cycleName} Cycle
${experienceGuidance}
${volumeGuidance}
IMPORTANT - ${goalInfo.cycleName} Week ${currentWeek + 1}: ${weekInfo.name}
- Goal: ${weekInfo.description}
- Weight Adjustment: ${weekInfo.weightAdjustment}
- Target Rep Range: ${weekInfo.repRange}

Apply these week-specific guidelines when calculating suggestions:
- Week 1 (Baseline): Use current working weights, aim for 8-12 reps
- Week 2 (Light Overload): Increase weight by 2-5% from baseline, aim for 8-10 reps
- Week 3 (Volume Focus): Keep weight same as Week 2, increase to 10-12 reps or add 1 extra set
- Week 4 (Strength Push): Increase weight by 5-10% from baseline, lower reps to 6-8
- Week 5 (Deload): Reduce weight by 20-30% from baseline, moderate 8-12 reps for recovery
`;
  }

  if (workoutGoal === 'lose') {
    // Fatigue management mode - cycle intensity/volume while preserving muscle
    return `
TRAINING GOAL: ${goalInfo.name} - ${goalInfo.cycleName} Cycle
${experienceGuidance}
${volumeGuidance}
IMPORTANT - ${goalInfo.cycleName} Week ${currentWeek + 1}: ${weekInfo.name}
- Goal: ${weekInfo.description}
- Weight Adjustment: ${weekInfo.weightAdjustment}
- Target Rep Range: ${weekInfo.repRange}

CRITICAL - Caloric Deficit Training Principles:
- DO NOT suggest weight increases - the body cannot build muscle in a deficit
- Focus on MAINTAINING strength while managing fatigue
- Recovery is impaired, so follow the week's volume/intensity guidelines strictly

Week-specific guidelines for fatigue management:
- Week 1 (Baseline Strength): Use current working weights, 6-10 reps - establish maintenance baseline
- Week 2 (Volume Reduction): Same weights but reduce sets by 1 - manage accumulating fatigue
- Week 3 (Intensity Focus): Same heavy weights, low volume (4-6 reps) - preserve strength signal
- Week 4 (Moderate Recovery): Reduce weight by 10%, moderate volume - partial recovery
- Week 5 (Full Deload): Reduce weight by 30%, light volume - full recovery before next cycle
`;
  }

  if (workoutGoal === 'maintain') {
    // Intensity wave mode - vary intensity to prevent staleness
    return `
TRAINING GOAL: ${goalInfo.name} - ${goalInfo.cycleName} Cycle
${experienceGuidance}
${volumeGuidance}
IMPORTANT - ${goalInfo.cycleName} Week ${currentWeek + 1}: ${weekInfo.name}
- Goal: ${weekInfo.description}
- Weight Adjustment: ${weekInfo.weightAdjustment}
- Target Rep Range: ${weekInfo.repRange}

Intensity Wave Principles:
- Vary intensity week-to-week to prevent staleness and maintain engagement
- No net progression expected - weights should average out over the cycle
- Focus on sustainable, enjoyable training

Week-specific guidelines for intensity waves:
- Week 1 (Standard): Use current baseline weights, 8-12 reps - normal moderate training
- Week 2 (Light Wave): Reduce weight by 10-15%, higher reps (12-15) - active recovery feel
- Week 3 (Moderate Push): Increase weight by 5% from baseline, 8-10 reps - slight challenge
- Week 4 (Heavy Wave): Increase weight by 10% from baseline, lower reps (6-8) - intensity peak
- Week 5 (Recovery): Reduce weight by 20%, moderate reps - reset before next cycle
`;
  }

  // Default/fallback
  return `
TRAINING GOAL: ${goalInfo.name}
${experienceGuidance}
${volumeGuidance}
${goalInfo.aiGuidance}
Target rep range: ${goalInfo.defaultRepRange}
`;
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

  // Build context about each exercise in the template (only strength exercises)
  const strengthTemplateExercises = template.exercises.filter(
    (ex): ex is StrengthTemplateExercise => ex.type === 'strength' || !('type' in ex)
  );

  // Check if we have enough history for plateau detection (10 weeks of consistent training)
  const enablePlateauDetection = hasEnoughHistoryForPlateauDetection(previousSessions);

  // Analyze each exercise's 10-week history (uses caching internally)
  const exerciseAnalyses: ExerciseAnalysis[] = strengthTemplateExercises.map((templateEx) =>
    analyzeExercise10Weeks(
      templateEx.exerciseId,
      previousSessions,
      customExercises as Exercise[],
      templateEx.targetReps,
      enablePlateauDetection
    )
  );

  const exerciseContext = strengthTemplateExercises.map((templateEx) => {
    const exerciseInfo = getExerciseById(templateEx.exerciseId, customExercises);
    const analysis = exerciseAnalyses.find((a) => a.exerciseId === templateEx.exerciseId);

    // Find previous performance for this exercise (strength sets only)
    const previousSets: Array<{ date: string; weight: number; reps: number }> = [];
    previousSessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (ex.exerciseId === templateEx.exerciseId) {
          ex.sets.forEach((set) => {
            // Only include strength sets
            if (set.type === 'strength' || !('type' in set)) {
              const strengthSet = set as StrengthCompletedSet;
              previousSets.push({
                date: session.startedAt,
                weight: strengthSet.weight,
                reps: strengthSet.reps,
              });
            }
          });
        }
      });
    });

    // Sort by date descending and take last 10
    previousSets.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const recentSets = previousSets.slice(0, 10);

    return {
      exerciseId: templateEx.exerciseId,
      exerciseName: exerciseInfo?.name || templateEx.exerciseId,
      targetSets: templateEx.targetSets,
      targetReps: templateEx.targetReps,
      recentPerformance: recentSets,
      progressStatus: analysis?.progressStatus || 'new',
      plateauSignals: analysis?.plateauSignals,
      estimated1RMTrend: analysis?.estimated1RMTrend,
    };
  });

  const trainingGuidance = buildTrainingGuidance(workoutGoal, currentWeek, experienceLevel);
  const weightContext = buildWeightContext(weightEntries, weightUnit);
  const analysisContext = buildExerciseAnalysisContext(exerciseAnalyses);

  const prompt = `You are a fitness AI providing pre-workout recommendations. Based on the user's previous performance and 4-week progress analysis, suggest appropriate weights and reps for today's workout.
${trainingGuidance}
${weightContext}
${analysisContext}
Exercises for today's workout:
${JSON.stringify(exerciseContext, null, 2)}

For each exercise, provide a suggestion. Consider:
- The training goal and guidelines above (CRITICAL - follow these strictly)
- The 10-week progress analysis and plateau signals
- Previous performance data to establish their baseline working weights
- If no previous data exists, suggest a conservative starting point

IMPORTANT - For exercises marked as "PLATEAU":
- Suggest a REP RANGE CHANGE to break through the plateau
- If current range is around 8-12 reps: suggest either 5-8 reps (heavier weight) or 12-15 reps (lighter weight, more volume)
- Include a "techniqueTip" explaining the change (e.g., "Break through your plateau by switching to heavier weight with lower reps")
- Include a "repRangeChange" object with from/to/reason fields

For exercises marked as "IMPROVING" or with insufficient data:
- Continue with normal progression per week guidelines
- No techniqueTip or repRangeChange needed

Respond in JSON format:
{
  "suggestions": [
    {
      "exerciseId": "exercise-id",
      "suggestedWeight": number,
      "suggestedReps": number,
      "reasoning": "Brief explanation (1 sentence)",
      "confidence": "high" | "medium" | "low",
      "progressStatus": "improving" | "plateau" | "declining" | "new",
      "techniqueTip": "Optional - only for plateau exercises",
      "repRangeChange": {
        "from": "8-12",
        "to": "5-8",
        "reason": "Heavier loads to stimulate new strength gains"
      }
    }
  ]
}

Use ${weightUnit} for weights. Confidence should be:
- "high" if there's clear recent data showing a pattern
- "medium" if there's some data but pattern is unclear
- "low" if there's minimal or no previous data`;

  const content = await callOpenAI({
    apiKey,
    messages: [
      {
        role: 'system',
        content: 'You are a fitness analysis AI that detects training plateaus and provides smart recommendations. Respond only with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    maxTokens: 1500,
    temperature: 0.3,
  });

  const parsed = parseJSONResponse<{ suggestions?: ExerciseSuggestion[] }>(content, {});
  return parsed.suggestions || [];
};
