import {
  WorkoutSession,
  ExperienceLevel,
  WorkoutGoal,
  PREDEFINED_CYCLES,
  TrainingCycleConfig,
  Exercise,
} from '../../types';
import { callOpenAI } from './client';
import { analyzeExercise10Weeks } from './exerciseAnalysis';

// ============================================================================
// Types
// ============================================================================

export interface CycleRecommendationInput {
  experienceLevel: ExperienceLevel;
  workoutGoal: WorkoutGoal;
  totalCompletedWorkouts: number;
  weeklyWorkoutAverage: number;
  hasPlateaus: boolean;
  plateauCount: number;
  recentPRCount: number; // PRs in last 30 days
  averageMood: number | null;
  isCardioPrimary: boolean;
  currentCycleId?: string;
}

export interface CycleRecommendation {
  recommendedCycleId: string;
  reasoning: string;
  alternativeId?: string;
  alternativeReason?: string;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// Data Aggregation
// ============================================================================

/**
 * Aggregate user data for cycle recommendation
 */
export const aggregateCycleRecommendationData = (
  sessions: WorkoutSession[],
  experienceLevel: ExperienceLevel,
  workoutGoal: WorkoutGoal,
  customExercises: Exercise[] = [],
  currentCycleId?: string
): CycleRecommendationInput => {
  const completedSessions = sessions.filter(s => s.completedAt);

  // Calculate weekly workout average (last 8 weeks)
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
  const recentSessions = completedSessions.filter(
    s => new Date(s.completedAt!) >= eightWeeksAgo
  );
  const weeklyWorkoutAverage = recentSessions.length / 8;

  // Check for cardio-primary users (>50% cardio-only sessions)
  const cardioOnlySessions = completedSessions.filter(session => {
    const hasCardio = session.exercises.some(ex => ex.type === 'cardio');
    const hasStrength = session.exercises.some(ex => ex.type === 'strength');
    return hasCardio && !hasStrength;
  });
  const isCardioPrimary = completedSessions.length > 0 &&
    cardioOnlySessions.length > completedSessions.length / 2;

  // Count plateaus using actual exercise analysis
  const exerciseIds = new Set<string>();
  completedSessions.forEach(s => {
    s.exercises.forEach(ex => {
      if (ex.type === 'strength') {
        exerciseIds.add(ex.exerciseId);
      }
    });
  });

  let plateauCount = 0;
  exerciseIds.forEach(exerciseId => {
    const analysis = analyzeExercise10Weeks(
      exerciseId,
      sessions,
      customExercises,
      undefined,
      true // Enable plateau detection
    );
    if (analysis.progressStatus === 'plateau') {
      plateauCount++;
    }
  });
  const hasPlateaus = plateauCount > 0;

  // Count recent PRs (sessions with mood of 5 or explicit PR markers)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPRSessions = completedSessions.filter(
    s => new Date(s.completedAt!) >= thirtyDaysAgo && s.mood === 5
  );
  const recentPRCount = recentPRSessions.length;

  // Calculate average mood
  const sessionsWithMood = completedSessions.filter(s => s.mood !== undefined);
  const averageMood = sessionsWithMood.length > 0
    ? sessionsWithMood.reduce((sum, s) => sum + (s.mood as number), 0) / sessionsWithMood.length
    : null;

  return {
    experienceLevel,
    workoutGoal,
    totalCompletedWorkouts: completedSessions.length,
    weeklyWorkoutAverage: Math.round(weeklyWorkoutAverage * 10) / 10,
    hasPlateaus,
    plateauCount,
    recentPRCount,
    averageMood,
    isCardioPrimary,
    currentCycleId,
  };
};

// ============================================================================
// Prompt Building
// ============================================================================

const buildSystemPrompt = (): string => {
  return `You are a fitness programming expert helping a user choose the best training cycle for their situation.

Available training cycles:
${PREDEFINED_CYCLES.map(c => `- ${c.id}: "${c.name}" (${c.totalWeeks} weeks, ${c.cycleType}) - ${c.description}
  Phases: ${c.phases.map(p => p.name).join(' → ')}
  Recommended for: ${c.recommendedForExperience.join(', ')} experience, ${c.recommendedForGoals.join(', ')} goals`).join('\n')}

GUIDELINES:
- Match cycle type to user's training focus (strength vs cardio)
- Consider experience level when recommending cycle length
- Beginners benefit from shorter cycles (4 weeks) for faster feedback
- Advanced users can handle longer cycles (8 weeks) with more complex periodization
- If user is hitting plateaus, recommend a cycle that differs from their current one
- If user is making good progress, recommend staying with similar structure

Respond with JSON only.`;
};

const buildUserPrompt = (data: CycleRecommendationInput): string => {
  return `Based on this user's profile, recommend the best training cycle:

USER PROFILE:
- Experience level: ${data.experienceLevel}
- Workout goal: ${data.workoutGoal}
- Training focus: ${data.isCardioPrimary ? 'Cardio-primary' : 'Strength-focused'}
- Total completed workouts: ${data.totalCompletedWorkouts}
- Weekly workout average: ${data.weeklyWorkoutAverage} workouts/week
- Has plateaus: ${data.hasPlateaus ? `Yes (${data.plateauCount} exercises)` : 'No'}
- Recent PRs (30 days): ${data.recentPRCount}
${data.averageMood !== null ? `- Average workout enjoyment: ${data.averageMood.toFixed(1)}/5` : ''}
${data.currentCycleId ? `- Currently using: ${data.currentCycleId}` : '- Not currently using a structured cycle'}

Respond with JSON matching this exact structure:
{
  "recommendedCycleId": "<id from available cycles>",
  "reasoning": "<1-2 sentences explaining why this cycle is best for them>",
  "alternativeId": "<optional: another good option>",
  "alternativeReason": "<optional: why they might choose the alternative>",
  "confidence": "high" | "medium" | "low"
}`;
};

// ============================================================================
// Main Function
// ============================================================================

/**
 * Get LLM-powered cycle recommendation
 */
export const getCycleRecommendation = async (
  apiKey: string,
  sessions: WorkoutSession[],
  experienceLevel: ExperienceLevel,
  workoutGoal: WorkoutGoal,
  customExercises: Exercise[] = [],
  currentCycleId?: string
): Promise<CycleRecommendation | null> => {
  // Need some workout history for meaningful recommendation
  const completedSessions = sessions.filter(s => s.completedAt);
  if (completedSessions.length < 3) {
    // Return a default recommendation for new users
    return getDefaultRecommendation(experienceLevel, workoutGoal);
  }

  const inputData = aggregateCycleRecommendationData(
    sessions,
    experienceLevel,
    workoutGoal,
    customExercises,
    currentCycleId
  );

  try {
    const content = await callOpenAI({
      apiKey,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(inputData) },
      ],
      maxTokens: 400,
      temperature: 0.3,
    });

    const parsed = JSON.parse(content);

    // Validate the recommended cycle exists
    const recommendedCycle = PREDEFINED_CYCLES.find(c => c.id === parsed.recommendedCycleId);
    if (!recommendedCycle) {
      return getDefaultRecommendation(experienceLevel, workoutGoal, inputData.isCardioPrimary);
    }

    return {
      recommendedCycleId: parsed.recommendedCycleId,
      reasoning: parsed.reasoning || 'This cycle matches your experience level and goals.',
      alternativeId: parsed.alternativeId,
      alternativeReason: parsed.alternativeReason,
      confidence: parsed.confidence || 'medium',
    };
  } catch (error) {
    console.error('Failed to get cycle recommendation:', error);
    return getDefaultRecommendation(experienceLevel, workoutGoal, inputData.isCardioPrimary);
  }
};

/**
 * Get a default recommendation based on experience level and goal
 */
const getDefaultRecommendation = (
  experienceLevel: ExperienceLevel,
  _workoutGoal: WorkoutGoal,
  isCardioPrimary: boolean = false
): CycleRecommendation => {
  // For cardio-primary users
  if (isCardioPrimary) {
    return {
      recommendedCycleId: experienceLevel === 'beginner' ? 'cardio-4' : 'cardio-6',
      reasoning: experienceLevel === 'beginner'
        ? 'A 4-week cardio cycle is perfect for building your base fitness with structured progression.'
        : 'A 6-week cardio cycle provides more time for endurance building and peak performance.',
      confidence: 'medium',
    };
  }

  // For strength-focused users
  switch (experienceLevel) {
    case 'beginner':
      return {
        recommendedCycleId: 'beginner-4',
        reasoning: 'A 4-week cycle is ideal for beginners, providing quick feedback and steady progression without overwhelming complexity.',
        alternativeId: 'intermediate-6',
        alternativeReason: 'If you want more time to build strength before deloading.',
        confidence: 'high',
      };
    case 'intermediate':
      return {
        recommendedCycleId: 'intermediate-6',
        reasoning: 'A 6-week cycle balances progression and recovery well for intermediate lifters, with distinct volume and strength phases.',
        alternativeId: 'advanced-8',
        alternativeReason: 'If you want more complex periodization and longer mesocycles.',
        confidence: 'high',
      };
    case 'advanced':
      return {
        recommendedCycleId: 'advanced-8',
        reasoning: 'An 8-week cycle allows for sophisticated periodization with hypertrophy, strength, and peaking phases that advanced lifters benefit from.',
        alternativeId: 'intermediate-6',
        alternativeReason: 'If you prefer shorter cycles with more frequent deloads.',
        confidence: 'high',
      };
    default:
      return {
        recommendedCycleId: 'intermediate-6',
        reasoning: 'A 6-week cycle is a solid choice for most lifters, balancing progression with adequate recovery.',
        confidence: 'medium',
      };
  }
};

/**
 * Get the recommended cycle config object
 */
export const getRecommendedCycleConfig = (
  recommendation: CycleRecommendation
): TrainingCycleConfig | null => {
  return PREDEFINED_CYCLES.find(c => c.id === recommendation.recommendedCycleId) || null;
};
