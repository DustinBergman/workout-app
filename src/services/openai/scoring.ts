import { WorkoutSession, WorkoutScoreResult, StrengthSessionExercise, StrengthCompletedSet } from '../../types';
import { getExerciseById } from '../../data/exercises';
import { getCustomExercises } from '../storage';
import { callOpenAI, parseJSONResponse } from './client';

const DEFAULT_SCORE_RESULT: WorkoutScoreResult = {
  score: 70,
  grade: 'B',
  summary: 'Workout completed! Unable to generate detailed analysis.',
  highlights: ['You showed up and did the work!'],
  improvements: ['Try to log more details for better analysis.'],
};

export const getWorkoutScore = async (
  apiKey: string,
  completedSession: WorkoutSession,
  previousSessions: WorkoutSession[],
  weightUnit: 'lbs' | 'kg'
): Promise<WorkoutScoreResult> => {
  const customExercises = getCustomExercises();

  // Build workout summary (only for strength exercises)
  const workoutSummary = completedSession.exercises
    .filter((ex): ex is StrengthSessionExercise => ex.type === 'strength' || !('type' in ex))
    .map((ex) => {
      const exerciseInfo = getExerciseById(ex.exerciseId, customExercises);
      const strengthSets = ex.sets.filter((s): s is StrengthCompletedSet => s.type === 'strength' || !('type' in s));
      return {
        exerciseName: exerciseInfo?.name || ex.exerciseId,
        targetSets: ex.targetSets,
        targetReps: ex.targetReps,
        completedSets: strengthSets.map((s) => ({
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
    exercises: s.exercises
      .filter((ex): ex is StrengthSessionExercise => ex.type === 'strength' || !('type' in ex))
      .map((ex) => {
        const strengthSets = ex.sets.filter((set): set is StrengthCompletedSet => set.type === 'strength' || !('type' in set));
        return {
          exerciseId: ex.exerciseId,
          sets: strengthSets.map((set) => ({ weight: set.weight, reps: set.reps })),
        };
      }),
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

  const content = await callOpenAI({
    apiKey,
    messages: [
      {
        role: 'system',
        content: 'You are a supportive fitness coach. Respond only with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    maxTokens: 1000,
    temperature: 0.5,
  });

  const parsed = parseJSONResponse<Partial<WorkoutScoreResult>>(content, {});

  return {
    score: parsed.score || DEFAULT_SCORE_RESULT.score,
    grade: parsed.grade || DEFAULT_SCORE_RESULT.grade,
    summary: parsed.summary || DEFAULT_SCORE_RESULT.summary,
    highlights: parsed.highlights || DEFAULT_SCORE_RESULT.highlights,
    improvements: parsed.improvements || DEFAULT_SCORE_RESULT.improvements,
  };
};
