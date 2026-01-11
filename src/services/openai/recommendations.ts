import { WorkoutSession, WorkoutRecommendation, ExperienceLevel, WorkoutGoal, WORKOUT_GOALS, Exercise } from '../../types';
import { callOpenAI, parseJSONResponse } from './client';
import { analyzeExercisePerformance } from './history';
import { getExerciseById } from '../../data/exercises';

const CACHE_KEY = 'workout-app-recommendations-cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface RecommendationsCache {
  recommendations: WorkoutRecommendation[];
  timestamp: number;
  sessionsHash: string;
}

// Create a simple hash of sessions to detect changes
export const createSessionsHash = (sessions: WorkoutSession[]): string => {
  const recentSessions = sessions.slice(0, 10);
  return recentSessions.map(s => `${s.id}:${s.exercises.length}`).join('|');
};

// Check if valid cache exists (exported for use in hooks)
export const hasValidRecommendationsCache = (sessions: WorkoutSession[]): boolean => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return false;

    const parsed: RecommendationsCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_DURATION_MS) {
      return false;
    }

    // Check if sessions have changed
    const sessionsHash = createSessionsHash(sessions);
    if (parsed.sessionsHash !== sessionsHash) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const getCachedRecommendations = (sessionsHash: string): WorkoutRecommendation[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed: RecommendationsCache = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is expired
    if (now - parsed.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check if sessions have changed
    if (parsed.sessionsHash !== sessionsHash) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed.recommendations;
  } catch {
    return null;
  }
};

const setCachedRecommendations = (
  recommendations: WorkoutRecommendation[],
  sessionsHash: string
): void => {
  try {
    const cache: RecommendationsCache = {
      recommendations,
      timestamp: Date.now(),
      sessionsHash,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

const buildExperienceLevelGuidance = (experienceLevel: ExperienceLevel): string => {
  switch (experienceLevel) {
    case 'beginner':
      return `
EXPERIENCE LEVEL: Beginner (Less than 1 year of training)
- Can expect 5-10% weight increases when ready to progress
- Focus on form while progressing - technique is still developing
- Recommend smaller jumps initially to build confidence`;
    case 'intermediate':
      return `
EXPERIENCE LEVEL: Intermediate (1-2 years of training)
- Can expect 2-5% weight increases when progressing
- Balance between pushing limits and avoiding injury
- May need variety in rep ranges to continue progress`;
    case 'advanced':
      return `
EXPERIENCE LEVEL: Advanced (2+ years of consistent training)
- Expect only 1-2.5% weight increases at most
- Small PRs are significant achievements
- Focus on micro-progressions and technique refinement`;
    default:
      return '';
  }
};

const buildGoalGuidance = (workoutGoal: WorkoutGoal): string => {
  const goalInfo = WORKOUT_GOALS[workoutGoal];

  switch (workoutGoal) {
    case 'build':
      return `
TRAINING GOAL: ${goalInfo.name}
- Progressive overload is the priority
- Recommend weight increases when performance is consistent
- Focus on gradual, sustainable progression`;
    case 'lose':
      return `
TRAINING GOAL: ${goalInfo.name}
- CRITICAL: Do NOT recommend weight increases during a cut
- Focus on MAINTAINING current weights to preserve muscle
- Recovery is impaired in a caloric deficit
- Only recommend decreases if form is suffering`;
    case 'maintain':
      return `
TRAINING GOAL: ${goalInfo.name}
- Focus on maintaining current performance levels
- Small variations are fine but no aggressive changes
- Prioritize consistency over progression`;
    default:
      return '';
  }
};

// Resolve exercise names, including custom exercises
const resolveExerciseName = (exerciseId: string, customExercises: Exercise[]): string => {
  const exercise = getExerciseById(exerciseId, customExercises);
  return exercise?.name || exerciseId;
};

export const getProgressiveOverloadRecommendations = async (
  apiKey: string,
  workoutHistory: WorkoutSession[],
  weightUnit: 'lbs' | 'kg',
  customExercises: Exercise[] = [],
  experienceLevel: ExperienceLevel = 'intermediate',
  workoutGoal: WorkoutGoal = 'build'
): Promise<WorkoutRecommendation[]> => {
  if (workoutHistory.length < 2) {
    return [];
  }

  // Check cache first
  const sessionsHash = createSessionsHash(workoutHistory);
  const cached = getCachedRecommendations(sessionsHash);
  if (cached) {
    return cached;
  }

  // Analyze exercise performance across sessions
  const exercisePerformance = analyzeExercisePerformance(workoutHistory);

  // Resolve all exercise names (including custom exercises)
  const performanceWithNames = exercisePerformance.map(ep => ({
    ...ep,
    exerciseName: resolveExerciseName(ep.exerciseId, customExercises),
  }));

  const experienceGuidance = buildExperienceLevelGuidance(experienceLevel);
  const goalGuidance = buildGoalGuidance(workoutGoal);

  const prompt = `Based on this workout performance data, provide specific progressive overload recommendations.

${experienceGuidance}
${goalGuidance}

CRITICAL GUIDELINES:
- Weight increases should be SMALL and appropriate for the experience level
- For beginners: 5-10% max increase
- For intermediate: 2-5% max increase
- For advanced: 1-2.5% max increase
- Round to practical increments (2.5kg/5lbs for barbells, 1-2kg/2.5lbs for dumbbells)
- If goal is "Lose Weight", do NOT recommend increases - focus on maintaining
- Only recommend increases when there's clear evidence of consistent performance

Performance data:
${JSON.stringify(performanceWithNames, null, 2)}

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

Use ${weightUnit} for weights. Only include exercises where you have a clear, justified recommendation.`;

  const content = await callOpenAI({
    apiKey,
    messages: [
      {
        role: 'system',
        content: 'You are a fitness analysis AI that provides conservative, science-based progressive overload recommendations. Respond only with valid JSON.',
      },
      { role: 'user', content: prompt },
    ],
    maxTokens: 1000,
    temperature: 0.3,
  });

  const parsed = parseJSONResponse<{ recommendations?: WorkoutRecommendation[] }>(content, {});
  const recommendations = parsed.recommendations || [];

  // Ensure exercise names are resolved correctly
  const resolvedRecommendations = recommendations.map(rec => ({
    ...rec,
    exerciseName: resolveExerciseName(rec.exerciseId, customExercises) || rec.exerciseName,
  }));

  // Cache the results
  setCachedRecommendations(resolvedRecommendations, sessionsHash);

  return resolvedRecommendations;
};

// Export cache clear function for testing or manual refresh
export const clearRecommendationsCache = (): void => {
  localStorage.removeItem(CACHE_KEY);
};
