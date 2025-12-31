import { WorkoutSession, WorkoutRecommendation } from '../../types';
import { callOpenAI, parseJSONResponse } from './client';
import { analyzeExercisePerformance } from './history';

export const getProgressiveOverloadRecommendations = async (
  apiKey: string,
  workoutHistory: WorkoutSession[],
  weightUnit: 'lbs' | 'kg'
): Promise<WorkoutRecommendation[]> => {
  if (workoutHistory.length < 2) {
    return [];
  }

  // Analyze exercise performance across sessions
  const exercisePerformance = analyzeExercisePerformance(workoutHistory);

  const prompt = `Based on this workout performance data, provide specific progressive overload recommendations:

${JSON.stringify(exercisePerformance, null, 2)}

For each exercise where you have a recommendation, respond in JSON format:
{
  "recommendations": [
    {
      "exerciseId": "exercise-id",
      "exerciseName": "Exercise Name",
      "currentWeight": number,
      "recommendedWeight": number,
      "currentReps": number,
      "recommendedReps": number,
      "reason": "Brief explanation",
      "type": "increase" | "decrease" | "maintain"
    }
  ]
}

Use ${weightUnit} for weights. Only include exercises where you have a clear recommendation.`;

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

  const parsed = parseJSONResponse<{ recommendations?: WorkoutRecommendation[] }>(content, {});
  return parsed.recommendations || [];
};
