import { WorkoutSession, WorkoutRecommendation, WorkoutScoreResult, ExerciseSuggestion, WorkoutTemplate, ProgressiveOverloadWeek, PROGRESSIVE_OVERLOAD_WEEKS } from '../types';
import { getExerciseById } from '../data/exercises';
import { getCustomExercises } from './storage';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  recentSets: Array<{
    date: string;
    weight: number;
    reps: number;
    unit: string;
  }>;
  averageWeight: number;
  averageReps: number;
  trend: 'improving' | 'plateau' | 'declining' | 'insufficient_data';
}

const createHistoryContext = (sessions: WorkoutSession[]): string => {
  if (sessions.length === 0) {
    return 'No workout history available yet.';
  }

  // Take last 10 sessions for context
  const recentSessions = sessions
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 10);

  const customExercises = getCustomExercises();
  return recentSessions
    .map((session) => {
      const date = new Date(session.startedAt).toLocaleDateString();
      const exercises = session.exercises
        .map((ex) => {
          const info = getExerciseById(ex.exerciseId, customExercises);
          const sets = ex.sets
            .map((s) => `${s.weight}${s.unit}x${s.reps}`)
            .join(', ');
          return `  - ${info?.name || ex.exerciseId}: ${sets || 'no sets'}`;
        })
        .join('\n');
      return `${date} - ${session.name}:\n${exercises}`;
    })
    .join('\n\n');
};

const analyzeExercisePerformance = (sessions: WorkoutSession[]): ExerciseStats[] => {
  const exerciseMap: Map<string, ExerciseStats['recentSets']> = new Map();
  const customExercises = getCustomExercises();

  // Collect all sets by exercise
  sessions.forEach((session) => {
    session.exercises.forEach((ex) => {
      const existing = exerciseMap.get(ex.exerciseId) || [];
      ex.sets.forEach((set) => {
        existing.push({
          date: session.startedAt,
          weight: set.weight,
          reps: set.reps,
          unit: set.unit,
        });
      });
      exerciseMap.set(ex.exerciseId, existing);
    });
  });

  // Analyze each exercise
  const stats: ExerciseStats[] = [];

  exerciseMap.forEach((sets, exerciseId) => {
    if (sets.length < 3) return; // Need at least 3 sets to analyze

    const info = getExerciseById(exerciseId, customExercises);
    const sortedSets = sets.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const recentSets = sortedSets.slice(0, 10);
    const avgWeight = recentSets.reduce((sum, s) => sum + s.weight, 0) / recentSets.length;
    const avgReps = recentSets.reduce((sum, s) => sum + s.reps, 0) / recentSets.length;

    // Simple trend analysis
    let trend: ExerciseStats['trend'] = 'insufficient_data';
    if (recentSets.length >= 6) {
      const firstHalf = recentSets.slice(Math.floor(recentSets.length / 2));
      const secondHalf = recentSets.slice(0, Math.floor(recentSets.length / 2));

      const firstAvg = firstHalf.reduce((s, x) => s + x.weight * x.reps, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((s, x) => s + x.weight * x.reps, 0) / secondHalf.length;

      const change = (secondAvg - firstAvg) / firstAvg;
      if (change > 0.05) trend = 'improving';
      else if (change < -0.05) trend = 'declining';
      else trend = 'plateau';
    }

    stats.push({
      exerciseId,
      exerciseName: info?.name || exerciseId,
      recentSets: recentSets.slice(0, 5),
      averageWeight: Math.round(avgWeight * 10) / 10,
      averageReps: Math.round(avgReps * 10) / 10,
      trend,
    });
  });

  return stats;
};

export const sendChatMessage = async (
  apiKey: string,
  messages: ChatMessage[],
  workoutHistory: WorkoutSession[]
): Promise<string> => {
  // Create a summary of workout history for context
  const historyContext = createHistoryContext(workoutHistory);

  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are a knowledgeable fitness coach and workout assistant. You help users optimize their training with progressive overload principles.

You have access to the user's workout history:
${historyContext}

Your guidelines:
- Analyze workout patterns to suggest weight/rep adjustments
- Recommend progressive overload when the user consistently hits their targets
- Suggest deloads when performance drops or plateaus occur
- Provide form tips and exercise alternatives when asked
- Keep responses concise and actionable
- Use the user's weight unit preference in recommendations
- Be encouraging but realistic`,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [systemMessage, ...messages],
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
};

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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness analysis AI. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.recommendations || [];
    }
  } catch (e) {
    console.error('Failed to parse recommendations:', e);
  }

  return [];
};

// Pre-workout suggestions for weights and reps
export const getPreWorkoutSuggestions = async (
  apiKey: string,
  template: WorkoutTemplate,
  previousSessions: WorkoutSession[],
  weightUnit: 'lbs' | 'kg',
  currentWeek?: ProgressiveOverloadWeek
): Promise<ExerciseSuggestion[]> => {
  const customExercises = getCustomExercises();
  // Build context about each exercise in the template
  const exerciseContext = template.exercises.map((templateEx) => {
    const exerciseInfo = getExerciseById(templateEx.exerciseId, customExercises);

    // Find previous performance for this exercise
    const previousSets: Array<{ date: string; weight: number; reps: number }> = [];
    previousSessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        if (ex.exerciseId === templateEx.exerciseId) {
          ex.sets.forEach((set) => {
            previousSets.push({
              date: session.startedAt,
              weight: set.weight,
              reps: set.reps,
            });
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

  // Build week-specific guidance
  let weekGuidance = '';
  if (currentWeek !== undefined) {
    const weekInfo = PROGRESSIVE_OVERLOAD_WEEKS[currentWeek];
    weekGuidance = `
IMPORTANT - Progressive Overload Week ${currentWeek}: ${weekInfo.name}
- Goal: ${weekInfo.description}
- Weight Adjustment: ${weekInfo.weightAdjustment}
- Target Rep Range: ${weekInfo.repRange}

Apply these week-specific guidelines when calculating suggestions:
- Week 0 (Baseline): Use current working weights, aim for 8-12 reps
- Week 1 (Light Overload): Increase weight by 2-5% from baseline, aim for 8-10 reps
- Week 2 (Volume Focus): Keep weight same as Week 1, increase to 10-12 reps or add 1 extra set
- Week 3 (Strength Push): Increase weight by 5-10% from baseline, lower reps to 6-8
- Week 4 (Deload): Reduce weight by 20-30% from baseline, moderate 8-12 reps for recovery
`;
  }

  const prompt = `You are a fitness AI providing pre-workout recommendations. Based on the user's previous performance, suggest appropriate weights and reps for today's workout.
${weekGuidance}
Exercises for today's workout:
${JSON.stringify(exerciseContext, null, 2)}

For each exercise, provide a suggestion. Consider:
- The current progressive overload week guidelines above (if provided)
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

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a fitness analysis AI. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.suggestions || [];
    }
  } catch (e) {
    console.error('Failed to parse suggestions:', e);
  }

  return [];
};

// Post-workout scoring
export const getWorkoutScore = async (
  apiKey: string,
  completedSession: WorkoutSession,
  previousSessions: WorkoutSession[],
  weightUnit: 'lbs' | 'kg'
): Promise<WorkoutScoreResult> => {
  const customExercises = getCustomExercises();
  // Build workout summary
  const workoutSummary = completedSession.exercises.map((ex) => {
    const exerciseInfo = getExerciseById(ex.exerciseId, customExercises);
    return {
      exerciseName: exerciseInfo?.name || ex.exerciseId,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      completedSets: ex.sets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        unit: s.unit,
      })),
    };
  });

  // Find previous sessions with same template or similar exercises
  const relevantHistory = previousSessions
    .filter((s) => {
      if (completedSession.templateId && s.templateId === completedSession.templateId) {
        return true;
      }
      // Or sessions with overlapping exercises
      const currentExerciseIds = completedSession.exercises.map((e) => e.exerciseId);
      const overlap = s.exercises.filter((e) => currentExerciseIds.includes(e.exerciseId));
      return overlap.length >= 2;
    })
    .slice(0, 5);

  const historyContext = relevantHistory.map((s) => ({
    date: s.startedAt,
    exercises: s.exercises.map((ex) => ({
      exerciseId: ex.exerciseId,
      sets: ex.sets.map((set) => ({ weight: set.weight, reps: set.reps })),
    })),
  }));

  const prompt = `You are a fitness coach scoring a completed workout. Analyze this workout and provide a score.

Completed Workout:
${JSON.stringify(workoutSummary, null, 2)}

Relevant Previous Workouts (for comparison):
${JSON.stringify(historyContext, null, 2)}

Score the workout from 0-100 based on:
- Did they complete all target sets and reps? (consistency)
- Did they maintain or improve weights compared to previous sessions? (progress)
- Was the volume appropriate? (not too little, not overtraining)

Respond in JSON format:
{
  "score": number (0-100),
  "grade": string (A+, A, A-, B+, B, B-, C+, C, C-, D, F),
  "summary": "2-3 sentence overall assessment",
  "highlights": ["what went well - 1-3 items"],
  "improvements": ["areas to improve - 1-3 items"]
}

Be encouraging but honest. Use ${weightUnit} when referencing weights.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a supportive fitness coach. Respond only with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: parsed.score || 0,
        grade: parsed.grade || 'N/A',
        summary: parsed.summary || 'Unable to generate summary.',
        highlights: parsed.highlights || [],
        improvements: parsed.improvements || [],
      };
    }
  } catch (e) {
    console.error('Failed to parse score:', e);
  }

  // Return default if parsing fails
  return {
    score: 70,
    grade: 'B',
    summary: 'Workout completed! Unable to generate detailed analysis.',
    highlights: ['You showed up and did the work!'],
    improvements: ['Try to log more details for better analysis.'],
  };
};
