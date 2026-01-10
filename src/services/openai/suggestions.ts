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
    // Progressive overload mode with personal trainer logic
    return `
TRAINING GOAL: ${goalInfo.name} - ${goalInfo.cycleName} Cycle
${experienceGuidance}
${volumeGuidance}
IMPORTANT - ${goalInfo.cycleName} Week ${currentWeek + 1}: ${weekInfo.name}
- Goal: ${weekInfo.description}
- Target Rep Range: ${weekInfo.repRange}

SMART WEIGHT SUGGESTION GUIDELINES (Act like a personal trainer):
Analyze the user's ACTUAL progression patterns from their workout history to determine appropriate weights.
Do NOT use arbitrary fixed percentages - base suggestions on how this specific user is progressing.

EXPERIENCE-ADJUSTED PROGRESSION:
- Beginners (fast progression): If consistently hitting reps, suggest 5-10% increases
- Intermediates (moderate): If progressing well, suggest 2-5% increases
- Advanced (slow progression): Even 1-2.5% increases are significant wins

WEEK-SPECIFIC GUIDANCE:
- Week 1 (Baseline): Use current working weights, aim for 8-10 reps to establish baseline
- Week 2 (Light Overload): Based on baseline performance, suggest weight that challenges for 6-8 reps (lean towards 6)
- Week 3 (Volume Focus): Moderate weight for 7-9 reps - build work capacity
- Week 4 (Strength Push): If progression supports it, push for heavier weight at 5-6 reps
- Week 5 (Deload): Reduce weight by 20-30% for recovery, 8-12 easy reps

DECISION FRAMEWORK:
1. Look at the user's 1RM trend from exercise analysis
2. If IMPROVING: Progress according to experience level and week goal
3. If PLATEAU: Consider rep range change OR technique focus before weight increase
4. If DECLINING: Maintain or slightly reduce weight, prioritize recovery
5. Always ensure the suggested weight is achievable for the target rep range
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

CRITICAL: You MUST provide a suggestion for EVERY exercise listed below. Do not skip any exercises, even custom ones or ones without previous data. For each exercise, provide a suggestion. Consider:
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

  // Calculate token limit based on number of exercises (roughly 150 tokens per exercise suggestion)
  const estimatedTokensNeeded = Math.max(2000, strengthTemplateExercises.length * 200);

  const content = await callOpenAI({
    apiKey,
    messages: [
      {
        role: 'system',
        content: 'You are a fitness analysis AI that detects training plateaus and provides smart recommendations. Respond only with valid JSON. IMPORTANT: You MUST provide a suggestion for EVERY exercise in the list - do not skip any exercises.',
      },
      { role: 'user', content: prompt },
    ],
    maxTokens: estimatedTokensNeeded,
    temperature: 0.3,
  });

  const parsed = parseJSONResponse<{ suggestions?: ExerciseSuggestion[] }>(content, {});
  const aiSuggestions = parsed.suggestions || [];

  // Ensure every exercise has a suggestion - create fallbacks for any missing
  const completeSuggestions: ExerciseSuggestion[] = strengthTemplateExercises.map((templateEx) => {
    const existingSuggestion = aiSuggestions.find((s) => s.exerciseId === templateEx.exerciseId);

    if (existingSuggestion) {
      return existingSuggestion;
    }

    // Create a fallback suggestion for missing exercises
    const exerciseInfo = getExerciseById(templateEx.exerciseId, customExercises);
    const exerciseName = exerciseInfo?.name || templateEx.exerciseId;

    // Find the most recent performance for this exercise
    let lastWeight = 0;
    let lastReps = templateEx.targetReps;

    for (const session of previousSessions) {
      const matchingEx = session.exercises.find((ex) => ex.exerciseId === templateEx.exerciseId);
      if (matchingEx && matchingEx.sets.length > 0) {
        const lastSet = matchingEx.sets[matchingEx.sets.length - 1];
        if (lastSet.type === 'strength' || !('type' in lastSet)) {
          const strengthSet = lastSet as StrengthCompletedSet;
          lastWeight = strengthSet.weight;
          lastReps = strengthSet.reps;
          break;
        }
      }
    }

    // Create fallback suggestion based on last performance or conservative start
    const fallbackSuggestion: ExerciseSuggestion = {
      exerciseId: templateEx.exerciseId,
      suggestedWeight: lastWeight > 0 ? lastWeight : 0,
      suggestedReps: lastReps ?? templateEx.targetReps ?? 10,
      reasoning: lastWeight > 0
        ? `Continue with your previous weight for ${exerciseName}`
        : `Start light and establish your working weight for ${exerciseName}`,
      confidence: lastWeight > 0 ? 'medium' : 'low',
      progressStatus: lastWeight > 0 ? 'improving' : 'new',
    };

    return fallbackSuggestion;
  });

  return completeSuggestions;
};
