import {
  WorkoutSession,
  ExperienceLevel,
  WorkoutGoal,
  ProgressiveOverloadWeek,
  Exercise,
  WeightEntry,
  WORKOUT_GOALS,
} from '../../types';
import { callOpenAI, parseJSONResponse } from './client';
import { analyzeExercise10Weeks, ExerciseAnalysis } from './exerciseAnalysis';
import { getExerciseById } from '../../data/exercises';
import { calculateStreak } from '../../utils/streakUtils';

// ============================================================================
// Types
// ============================================================================

/**
 * Stat Card - shows a key metric with change indicator
 * Examples: "12% stronger", "5 workout streak", "3.2 workouts/week"
 */
export interface StatCardComponent {
  type: 'stat_card';
  label: string;           // e.g., "Upper Body Strength"
  value: string;           // e.g., "12%", "5 days"
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;       // e.g., "vs last month"
}

/**
 * Progress Indicator - shows status of a training area
 * Examples: "Upper body: improving", "Legs: plateau"
 */
export interface ProgressIndicatorComponent {
  type: 'progress_indicator';
  area: string;            // e.g., "Upper Body", "Legs"
  status: 'improving' | 'maintaining' | 'plateau' | 'declining';
  detail?: string;         // e.g., "4 weeks strong progress"
}

/**
 * Highlight Badge - celebrates achievements
 * Examples: PRs, milestones, streaks, consistency
 */
export interface HighlightBadgeComponent {
  type: 'highlight_badge';
  icon: 'trophy' | 'fire' | 'star' | 'medal' | 'target' | 'lightning';
  title: string;           // e.g., "5-Day Streak!"
  description?: string;    // e.g., "Your longest this month"
}

/**
 * Tip/Advice - actionable guidance
 */
export interface TipComponent {
  type: 'tip';
  category: 'technique' | 'recovery' | 'progression' | 'variety' | 'mindset';
  message: string;
}

export type PTComponent =
  | StatCardComponent
  | ProgressIndicatorComponent
  | HighlightBadgeComponent
  | TipComponent;

/**
 * Full PT Summary response from AI
 */
export interface PTSummaryResponse {
  summary: string;              // 2-4 sentence personalized paragraph
  components: PTComponent[];    // 2-4 dynamic components
  nextSessionFocus?: string;    // Optional actionable focus
}

/**
 * Input data for AI (aggregated, no specific weights)
 */
export interface PTSummaryInputData {
  firstName?: string;
  experienceLevel: ExperienceLevel;
  workoutGoal: WorkoutGoal;
  currentWeek: ProgressiveOverloadWeek;

  // Activity metrics
  totalWorkoutsLast10Weeks: number;
  workoutsPerWeek: number;
  currentStreak: number;
  longestStreakLast30Days: number;

  // Progress by muscle group (no weights)
  muscleGroupProgress: {
    muscleGroup: string;
    status: 'improving' | 'plateau' | 'declining' | 'insufficient_data';
    trendPercent: number;
  }[];

  // Plateau/improvement lists (exercise names only)
  exercisesOnPlateau: string[];
  exercisesImproving: string[];

  // Recent PRs (names only, no weights)
  recentPRs: { exerciseName: string; daysAgo: number }[];

  // Body weight trend (optional)
  bodyWeightTrend?: { direction: 'up' | 'down' | 'stable'; changePercent: number };

  // Mood trends (optional)
  averageMoodLast5Workouts?: number;
  moodTrend?: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// Cache
// ============================================================================

const PT_SUMMARY_CACHE_KEY = 'workout-app-pt-summary-cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

interface PTSummaryCache {
  summary: PTSummaryResponse;
  timestamp: number;
  sessionsHash: string;
}

const createSessionsHash = (sessions: WorkoutSession[]): string => {
  const recentSessions = sessions.slice(0, 10);
  return recentSessions.map(s => `${s.id}:${s.exercises.length}`).join('|');
};

export const hasValidPTSummaryCache = (sessions: WorkoutSession[]): boolean => {
  try {
    const cached = localStorage.getItem(PT_SUMMARY_CACHE_KEY);
    if (!cached) return false;

    const parsed: PTSummaryCache = JSON.parse(cached);
    const now = Date.now();

    if (now - parsed.timestamp > CACHE_DURATION_MS) {
      return false;
    }

    const sessionsHash = createSessionsHash(sessions);
    if (parsed.sessionsHash !== sessionsHash) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

const getCachedPTSummary = (sessionsHash: string): PTSummaryResponse | null => {
  try {
    const cached = localStorage.getItem(PT_SUMMARY_CACHE_KEY);
    if (!cached) return null;

    const parsed: PTSummaryCache = JSON.parse(cached);
    const now = Date.now();

    if (now - parsed.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(PT_SUMMARY_CACHE_KEY);
      return null;
    }

    if (parsed.sessionsHash !== sessionsHash) {
      localStorage.removeItem(PT_SUMMARY_CACHE_KEY);
      return null;
    }

    return parsed.summary;
  } catch {
    return null;
  }
};

const setCachedPTSummary = (summary: PTSummaryResponse, sessionsHash: string): void => {
  try {
    const cache: PTSummaryCache = {
      summary,
      timestamp: Date.now(),
      sessionsHash,
    };
    localStorage.setItem(PT_SUMMARY_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

export const clearPTSummaryCache = (): void => {
  localStorage.removeItem(PT_SUMMARY_CACHE_KEY);
};

// ============================================================================
// Data Aggregation
// ============================================================================

// Muscle group mapping for exercises
const MUSCLE_GROUP_MAP: Record<string, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  quads: 'Legs',
  hamstrings: 'Legs',
  glutes: 'Legs',
  calves: 'Legs',
  core: 'Core',
  abs: 'Core',
};

const getMuscleGroupForExercise = (exerciseId: string, customExercises: Exercise[]): string => {
  const exercise = getExerciseById(exerciseId, customExercises);
  if (!exercise) return 'Other';
  if (exercise.type === 'cardio') return 'Cardio';
  if (exercise.type === 'strength' && exercise.muscleGroups.length > 0) {
    const primaryMuscle = exercise.muscleGroups[0];
    return MUSCLE_GROUP_MAP[primaryMuscle] || 'Other';
  }
  return 'Other';
};

const calculateLongestStreakLast30Days = (sessions: WorkoutSession[]): number => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = sessions.filter(s =>
    s.completedAt && new Date(s.completedAt) >= thirtyDaysAgo
  );

  if (recentSessions.length === 0) return 0;

  // Get unique workout dates
  const workoutDates = new Set<string>();
  for (const session of recentSessions) {
    const date = new Date(session.completedAt!);
    workoutDates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  }

  // Convert to sorted array
  const sortedDates = Array.from(workoutDates)
    .map(dateStr => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month, day);
    })
    .sort((a, b) => a.getTime() - b.getTime());

  // Find longest consecutive streak
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const diffDays = Math.floor(
      (sortedDates[i].getTime() - sortedDates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return maxStreak;
};

export const aggregatePTSummaryData = (
  sessions: WorkoutSession[],
  weightEntries: WeightEntry[],
  customExercises: Exercise[],
  firstName: string | undefined,
  experienceLevel: ExperienceLevel,
  workoutGoal: WorkoutGoal,
  currentWeek: ProgressiveOverloadWeek
): PTSummaryInputData => {
  const tenWeeksAgo = new Date();
  tenWeeksAgo.setDate(tenWeeksAgo.getDate() - 70);

  const completedSessions = sessions.filter(s =>
    s.completedAt && new Date(s.completedAt) >= tenWeeksAgo
  );

  // Activity metrics
  const totalWorkoutsLast10Weeks = completedSessions.length;
  const workoutsPerWeek = totalWorkoutsLast10Weeks / 10;
  const currentStreak = calculateStreak(sessions);
  const longestStreakLast30Days = calculateLongestStreakLast30Days(sessions);

  // Collect unique exercises and analyze them
  const exerciseIds = new Set<string>();
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      if (ex.type === 'strength') {
        exerciseIds.add(ex.exerciseId);
      }
    });
  });

  // Analyze each exercise
  const exerciseAnalyses: ExerciseAnalysis[] = [];
  exerciseIds.forEach(exerciseId => {
    const analysis = analyzeExercise10Weeks(exerciseId, sessions, customExercises, undefined, false);
    if (analysis.progressStatus !== 'insufficient_data') {
      exerciseAnalyses.push(analysis);
    }
  });

  // Group by muscle group
  const muscleGroupMap = new Map<string, { totalTrend: number; count: number; statuses: string[] }>();
  exerciseAnalyses.forEach(analysis => {
    const muscleGroup = getMuscleGroupForExercise(analysis.exerciseId, customExercises);
    const existing = muscleGroupMap.get(muscleGroup) || { totalTrend: 0, count: 0, statuses: [] };
    existing.totalTrend += analysis.estimated1RMTrend;
    existing.count++;
    existing.statuses.push(analysis.progressStatus);
    muscleGroupMap.set(muscleGroup, existing);
  });

  const muscleGroupProgress = Array.from(muscleGroupMap.entries()).map(([muscleGroup, data]) => {
    const avgTrend = data.totalTrend / data.count;
    // Determine overall status based on majority
    const plateauCount = data.statuses.filter(s => s === 'plateau').length;
    const decliningCount = data.statuses.filter(s => s === 'declining').length;

    let status: 'improving' | 'plateau' | 'declining' | 'insufficient_data' = 'improving';
    if (plateauCount > data.count / 2) status = 'plateau';
    else if (decliningCount > data.count / 2) status = 'declining';
    else if (avgTrend > 2) status = 'improving';
    else if (avgTrend < -2) status = 'declining';
    // Default to improving if no clear signal

    return { muscleGroup, status, trendPercent: Math.round(avgTrend * 10) / 10 };
  });

  // Exercises on plateau / improving
  const exercisesOnPlateau = exerciseAnalyses
    .filter(a => a.progressStatus === 'plateau')
    .map(a => a.exerciseName);

  const exercisesImproving = exerciseAnalyses
    .filter(a => a.progressStatus === 'improving' && a.estimated1RMTrend > 3)
    .map(a => a.exerciseName);

  // Recent PRs from sessions (check personalBests field)
  const recentPRs: { exerciseName: string; daysAgo: number }[] = [];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  sessions.forEach(session => {
    if (session.personalBests && session.personalBests.length > 0 && session.completedAt) {
      const sessionDate = new Date(session.completedAt);
      if (sessionDate >= thirtyDaysAgo) {
        const daysAgo = Math.floor((Date.now() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        session.personalBests.forEach(pb => {
          const exercise = getExerciseById(pb.exerciseId, customExercises);
          if (exercise) {
            recentPRs.push({ exerciseName: exercise.name, daysAgo });
          }
        });
      }
    }
  });

  // Body weight trend
  let bodyWeightTrend: PTSummaryInputData['bodyWeightTrend'];
  if (weightEntries.length >= 2) {
    const sortedEntries = [...weightEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const recent = sortedEntries[0];
    const oldest = sortedEntries[Math.min(sortedEntries.length - 1, 7)]; // Compare to ~1 week ago
    if (recent && oldest) {
      const changePercent = ((recent.weight - oldest.weight) / oldest.weight) * 100;
      bodyWeightTrend = {
        direction: changePercent > 1 ? 'up' : changePercent < -1 ? 'down' : 'stable',
        changePercent: Math.round(changePercent * 10) / 10,
      };
    }
  }

  // Mood trends
  let averageMoodLast5Workouts: number | undefined;
  let moodTrend: 'improving' | 'stable' | 'declining' | undefined;

  const sessionsWithMood = completedSessions.filter(s => s.mood !== undefined).slice(0, 5);
  if (sessionsWithMood.length >= 3) {
    // Mood is already a number 1-5
    const moodValues = sessionsWithMood.map(s => s.mood as number);
    averageMoodLast5Workouts = moodValues.reduce((a, b) => a + b, 0) / moodValues.length;

    // Simple trend: compare first half to second half
    const firstHalf = moodValues.slice(0, Math.floor(moodValues.length / 2));
    const secondHalf = moodValues.slice(Math.floor(moodValues.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg - firstAvg > 0.5) moodTrend = 'improving';
    else if (firstAvg - secondAvg > 0.5) moodTrend = 'declining';
    else moodTrend = 'stable';
  }

  return {
    firstName,
    experienceLevel,
    workoutGoal,
    currentWeek,
    totalWorkoutsLast10Weeks,
    workoutsPerWeek: Math.round(workoutsPerWeek * 10) / 10,
    currentStreak,
    longestStreakLast30Days,
    muscleGroupProgress,
    exercisesOnPlateau,
    exercisesImproving,
    recentPRs: recentPRs.slice(0, 5), // Limit to 5
    bodyWeightTrend,
    averageMoodLast5Workouts,
    moodTrend,
  };
};

// ============================================================================
// AI Service
// ============================================================================

const buildSystemPrompt = (): string => {
  return `You are an encouraging, knowledgeable personal trainer providing a check-in summary for your client. Your tone is:
- Warm and supportive, like talking to a friend
- Specific to THEIR progress (use their name if available)
- Action-oriented without being pushy
- Celebratory of wins, constructive about challenges

CRITICAL GUIDELINES:
- NEVER mention specific weights, numbers of pounds/kg, or exact rep counts
- Focus on trends, feelings, consistency, and relative progress
- Keep the summary to 2-4 sentences max
- Select 2-4 components that are MOST relevant right now
- Vary your component selection based on what is noteworthy
- If things are going well with no plateaus, encourage them to keep doing what they are doing
- NEVER use emdashes (—) anywhere in your response. Use commas or separate sentences instead.
- ONLY suggest adding variety or changing exercises if PLATEAUS DETECTED shows actual exercises. If no plateaus, do NOT suggest variety.
- If the user is early in their program (weeks 0-2) and improving, the best advice is to stay the course.

IMPORTANT FOR nextSessionFocus:
- Only include nextSessionFocus if there is a SPECIFIC, ACTIONABLE issue to address (like a plateau or declining area)
- If things are going well, OMIT the nextSessionFocus field entirely
- Generic advice like "keep things fresh" or "add variety" is NOT helpful when there are no problems

Respond ONLY with valid JSON matching the specified format.`;
};

const buildUserPrompt = (data: PTSummaryInputData): string => {
  const goalInfo = WORKOUT_GOALS[data.workoutGoal];

  const progressLines = data.muscleGroupProgress
    .map(g => `- ${g.muscleGroup}: ${g.status} (${g.trendPercent > 0 ? '+' : ''}${g.trendPercent}%)`)
    .join('\n');

  return `Based on this client data, provide a personalized PT summary:

CLIENT PROFILE:
- Name: ${data.firstName || 'there'}
- Experience: ${data.experienceLevel}
- Goal: ${goalInfo.name}
- Current training week: Week ${data.currentWeek} of 5-week cycle

RECENT ACTIVITY:
- Workouts in last 10 weeks: ${data.totalWorkoutsLast10Weeks}
- Average per week: ${data.workoutsPerWeek}
- Current streak: ${data.currentStreak} days
- Longest streak (30d): ${data.longestStreakLast30Days} days

PROGRESS BY AREA:
${progressLines || 'No data yet'}

PLATEAUS DETECTED: ${data.exercisesOnPlateau.join(', ') || 'None'}
IMPROVING: ${data.exercisesImproving.join(', ') || 'None'}

RECENT PRs: ${data.recentPRs.map(p => `${p.exerciseName} (${p.daysAgo}d ago)`).join(', ') || 'None in last 30 days'}

${data.bodyWeightTrend ? `BODY WEIGHT: ${data.bodyWeightTrend.direction} ${data.bodyWeightTrend.changePercent}%` : ''}
${data.averageMoodLast5Workouts ? `AVERAGE MOOD: ${data.averageMoodLast5Workouts.toFixed(1)}/5 (${data.moodTrend})` : ''}

Respond with JSON matching this EXACT structure:
{
  "summary": "Your personalized message here (2-4 sentences, warm and encouraging, NO emdashes)",
  "components": [
    // Select 2-4 MOST RELEVANT from these types based on what is noteworthy:
    // { "type": "stat_card", "label": "string", "value": "string", "trend": "up|down|neutral", "subtitle": "optional string" }
    // { "type": "progress_indicator", "area": "string", "status": "improving|maintaining|plateau|declining", "detail": "optional string" }
    // { "type": "highlight_badge", "icon": "trophy|fire|star|medal|target|lightning", "title": "string", "description": "optional string" }
    // { "type": "tip", "category": "technique|recovery|progression|variety|mindset", "message": "string" }
    // NOTE: Only use "variety" category tip if PLATEAUS DETECTED has actual exercises listed
  ],
  "nextSessionFocus": "ONLY include if there is a specific problem to address. OMIT this field if things are going well."
}

REMEMBER:
- NO specific weights or rep numbers
- NO emdashes (—) anywhere
- NO generic "add variety" advice unless plateaus exist
- If improving and no plateaus, encourage staying the course`;
};

export const getPTSummary = async (
  apiKey: string,
  sessions: WorkoutSession[],
  weightEntries: WeightEntry[],
  customExercises: Exercise[],
  firstName: string | undefined,
  experienceLevel: ExperienceLevel,
  workoutGoal: WorkoutGoal,
  currentWeek: ProgressiveOverloadWeek
): Promise<PTSummaryResponse | null> => {
  // Need at least 2 sessions for meaningful summary
  if (sessions.filter(s => s.completedAt).length < 2) {
    return null;
  }

  // Check cache first
  const sessionsHash = createSessionsHash(sessions);
  const cached = getCachedPTSummary(sessionsHash);
  if (cached) {
    return cached;
  }

  // Aggregate data
  const inputData = aggregatePTSummaryData(
    sessions,
    weightEntries,
    customExercises,
    firstName,
    experienceLevel,
    workoutGoal,
    currentWeek
  );

  // Call OpenAI
  try {
    const content = await callOpenAI({
      apiKey,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(inputData) },
      ],
      maxTokens: 800,
      temperature: 0.6, // Higher for variety
    });

    const parsed = parseJSONResponse<PTSummaryResponse>(content, {
      summary: "Great work staying consistent! Keep pushing forward.",
      components: [],
    });

    // Validate and clean up the response
    const validatedResponse: PTSummaryResponse = {
      summary: parsed.summary || "Great work staying consistent! Keep pushing forward.",
      components: (parsed.components || []).slice(0, 4).filter(validateComponent),
      nextSessionFocus: parsed.nextSessionFocus,
    };

    // Cache the result
    setCachedPTSummary(validatedResponse, sessionsHash);

    return validatedResponse;
  } catch (err) {
    console.error('Failed to get PT summary:', err);
    return null;
  }
};

// Validate component structure
const validateComponent = (component: PTComponent): boolean => {
  if (!component || typeof component !== 'object') return false;

  switch (component.type) {
    case 'stat_card':
      return !!(component.label && component.value);
    case 'progress_indicator':
      return !!(component.area && component.status);
    case 'highlight_badge':
      return !!(component.icon && component.title);
    case 'tip':
      return !!(component.category && component.message);
    default:
      return false;
  }
};
