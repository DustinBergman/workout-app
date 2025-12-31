import {
  WorkoutSession,
  ExerciseSuggestion,
  WorkoutTemplate,
  ProgressiveOverloadWeek,
  PROGRESSIVE_OVERLOAD_WEEKS,
  WorkoutGoal,
  WORKOUT_GOALS,
  StrengthCompletedSet,
  StrengthTemplateExercise,
  WeightEntry,
} from '../../types';
import { getExerciseById } from '../../data/exercises';
import { getCustomExercises } from '../storage';
import { callOpenAI, parseJSONResponse } from './client';

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

const buildTrainingGuidance = (
  workoutGoal: WorkoutGoal,
  currentWeek?: ProgressiveOverloadWeek
): string => {
  const goalInfo = WORKOUT_GOALS[workoutGoal];

  if (workoutGoal === 'build' && currentWeek !== undefined) {
    // Progressive overload mode - use week-based guidance
    const weekInfo = PROGRESSIVE_OVERLOAD_WEEKS[currentWeek];
    return `
TRAINING GOAL: ${goalInfo.name} - ${goalInfo.description}

IMPORTANT - Progressive Overload Week ${currentWeek + 1}: ${weekInfo.name}
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
    // Weight loss mode - maintain strength, no progression
    return `
TRAINING GOAL: ${goalInfo.name} - ${goalInfo.description}

CRITICAL GUIDANCE FOR CALORIC DEFICIT TRAINING:
${goalInfo.aiGuidance}

Key principles:
- Use the SAME weights as previous sessions (maintain strength)
- DO NOT suggest weight increases - the body cannot build muscle effectively in a deficit
- Keep weights heavy to signal the body to retain muscle mass
- Target rep range: 6-10 reps (heavier is better for muscle retention)
- If the user struggled with previous weights, maintain or slightly reduce (never increase)
- Focus on form and avoiding injury during recovery-impaired state
`;
  }

  if (workoutGoal === 'maintain') {
    // Maintenance mode - steady state, no progression
    return `
TRAINING GOAL: ${goalInfo.name} - ${goalInfo.description}

GUIDANCE FOR MAINTENANCE TRAINING:
${goalInfo.aiGuidance}

Key principles:
- Suggest the SAME weights as previous successful sessions
- No progressive overload - goal is consistency, not progression
- Target rep range: 8-12 reps (comfortable, sustainable)
- Keep volume moderate and consistent week to week
- If no previous data, suggest conservative starting weights
`;
  }

  // Default/fallback - basic guidance
  return `
TRAINING GOAL: ${goalInfo.name}
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
  weightEntries: WeightEntry[] = []
): Promise<ExerciseSuggestion[]> => {
  const customExercises = getCustomExercises();

  // Build context about each exercise in the template (only strength exercises)
  const strengthTemplateExercises = template.exercises.filter(
    (ex): ex is StrengthTemplateExercise => ex.type === 'strength' || !('type' in ex)
  );

  const exerciseContext = strengthTemplateExercises.map((templateEx) => {
    const exerciseInfo = getExerciseById(templateEx.exerciseId, customExercises);

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
    };
  });

  const trainingGuidance = buildTrainingGuidance(workoutGoal, currentWeek);
  const weightContext = buildWeightContext(weightEntries, weightUnit);

  const prompt = `You are a fitness AI providing pre-workout recommendations. Based on the user's previous performance, suggest appropriate weights and reps for today's workout.
${trainingGuidance}
${weightContext}
Exercises for today's workout:
${JSON.stringify(exerciseContext, null, 2)}

For each exercise, provide a suggestion. Consider:
- The training goal and guidelines above (CRITICAL - follow these strictly)
- Previous performance data to establish their baseline working weights
- If no previous data exists, suggest a conservative starting point

Respond in JSON format:
{
  "suggestions": [
    {
      "exerciseId": "exercise-id",
      "suggestedWeight": number,
      "suggestedReps": number,
      "reasoning": "Brief explanation (1 sentence)",
      "confidence": "high" | "medium" | "low"
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
        content: 'You are a fitness analysis AI. Respond only with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    maxTokens: 1000,
    temperature: 0.3,
  });

  const parsed = parseJSONResponse<{ suggestions?: ExerciseSuggestion[] }>(content, {});
  return parsed.suggestions || [];
};
