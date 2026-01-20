import { WorkoutSession, Exercise } from '../types';
import { analyzeExercise10Weeks } from './openai/exerciseAnalysis';

// ============================================================================
// Types
// ============================================================================

export type DeloadTriggerType =
  | 'plateau_detected'
  | 'performance_decline'
  | 'mood_decline'
  | 'max_weeks_reached'
  | 'fatigue_accumulation';

export interface DeloadTrigger {
  type: DeloadTriggerType;
  threshold: number;
  description: string;
}

export interface DeloadStrategy {
  type: 'scheduled' | 'reactive' | 'hybrid';
  triggers: DeloadTrigger[];
  maxWeeksWithoutDeload: number;
}

export type DeloadUrgency = 'immediate' | 'soon' | 'optional';

export interface DeloadRecommendation {
  shouldDeload: boolean;
  urgency: DeloadUrgency;
  reasons: string[];
  triggeredBy: DeloadTriggerType[];
  suggestedAction?: string;
}

// ============================================================================
// Default Strategy
// ============================================================================

export const DEFAULT_DELOAD_STRATEGY: DeloadStrategy = {
  type: 'hybrid',
  triggers: [
    {
      type: 'plateau_detected',
      threshold: 3, // 3+ exercises on plateau
      description: 'Multiple exercises showing no progress',
    },
    {
      type: 'performance_decline',
      threshold: 5, // 5% decline in estimated 1RM
      description: 'Strength declining across exercises',
    },
    {
      type: 'mood_decline',
      threshold: 2.5, // Average mood below 2.5/5
      description: 'Consistently low workout enjoyment',
    },
    {
      type: 'max_weeks_reached',
      threshold: 6, // 6 weeks without deload
      description: 'Extended training without recovery week',
    },
    {
      type: 'fatigue_accumulation',
      threshold: 3, // 3+ fatigue signals
      description: 'Multiple signs of accumulated fatigue',
    },
  ],
  maxWeeksWithoutDeload: 8,
};

// ============================================================================
// Detection Logic
// ============================================================================

interface DetectionContext {
  sessions: WorkoutSession[];
  customExercises: Exercise[];
  weeksSinceLastDeload: number;
  currentPhaseIsDeload?: boolean;
}

/**
 * Count exercises that are on plateau
 */
const countPlateauExercises = (
  sessions: WorkoutSession[],
  customExercises: Exercise[]
): { count: number; exerciseNames: string[] } => {
  const exerciseIds = new Set<string>();
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      if (ex.type === 'strength') {
        exerciseIds.add(ex.exerciseId);
      }
    });
  });

  const plateauExercises: string[] = [];

  exerciseIds.forEach(exerciseId => {
    const analysis = analyzeExercise10Weeks(
      exerciseId,
      sessions,
      customExercises,
      undefined,
      true // Enable plateau detection
    );

    if (analysis.progressStatus === 'plateau') {
      plateauExercises.push(analysis.exerciseName);
    }
  });

  return { count: plateauExercises.length, exerciseNames: plateauExercises };
};

/**
 * Calculate average performance trend across exercises
 */
const calculatePerformanceTrend = (
  sessions: WorkoutSession[],
  customExercises: Exercise[]
): { averageTrend: number; decliningExercises: string[] } => {
  const exerciseIds = new Set<string>();
  sessions.forEach(s => {
    s.exercises.forEach(ex => {
      if (ex.type === 'strength') {
        exerciseIds.add(ex.exerciseId);
      }
    });
  });

  const trends: number[] = [];
  const decliningExercises: string[] = [];

  exerciseIds.forEach(exerciseId => {
    const analysis = analyzeExercise10Weeks(
      exerciseId,
      sessions,
      customExercises,
      undefined,
      true
    );

    if (analysis.progressStatus !== 'insufficient_data') {
      trends.push(analysis.estimated1RMTrend);
      if (analysis.progressStatus === 'declining') {
        decliningExercises.push(analysis.exerciseName);
      }
    }
  });

  const averageTrend = trends.length > 0
    ? trends.reduce((a, b) => a + b, 0) / trends.length
    : 0;

  return { averageTrend, decliningExercises };
};

/**
 * Calculate average mood from recent sessions
 */
const calculateAverageMood = (sessions: WorkoutSession[]): number | null => {
  const recentSessions = sessions
    .filter(s => s.completedAt && s.mood !== undefined)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
    .slice(0, 10);

  if (recentSessions.length < 3) return null;

  const moodSum = recentSessions.reduce((sum, s) => sum + (s.mood as number), 0);
  return moodSum / recentSessions.length;
};

/**
 * Count fatigue signals from recent sessions
 */
const countFatigueSignals = (
  sessions: WorkoutSession[],
  customExercises: Exercise[]
): { count: number; signals: string[] } => {
  const signals: string[] = [];

  // Check for declining performance
  const { decliningExercises } = calculatePerformanceTrend(sessions, customExercises);
  if (decliningExercises.length >= 2) {
    signals.push(`Declining performance in ${decliningExercises.length} exercises`);
  }

  // Check for mood decline
  const avgMood = calculateAverageMood(sessions);
  if (avgMood !== null && avgMood < 3) {
    signals.push('Low workout enjoyment');
  }

  // Check for incomplete sessions (started but not completed)
  const recentSessions = sessions.slice(0, 10);
  const incompleteSessions = recentSessions.filter(
    s => !s.completedAt && new Date(s.startedAt) < new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
  if (incompleteSessions.length >= 2) {
    signals.push('Multiple abandoned workouts');
  }

  // Check for reduced volume (comparing recent vs older sessions)
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const fourWeeksAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);

  const recentCompletedSessions = sessions.filter(
    s => s.completedAt && new Date(s.completedAt) >= twoWeeksAgo
  );
  const olderSessions = sessions.filter(
    s => s.completedAt &&
      new Date(s.completedAt) >= fourWeeksAgo &&
      new Date(s.completedAt) < twoWeeksAgo
  );

  if (recentCompletedSessions.length >= 2 && olderSessions.length >= 2) {
    const avgRecentSets = recentCompletedSessions.reduce(
      (sum, s) => sum + s.exercises.reduce((eSum, ex) => eSum + ex.sets.length, 0),
      0
    ) / recentCompletedSessions.length;

    const avgOlderSets = olderSessions.reduce(
      (sum, s) => sum + s.exercises.reduce((eSum, ex) => eSum + ex.sets.length, 0),
      0
    ) / olderSessions.length;

    if (avgRecentSets < avgOlderSets * 0.8) {
      signals.push('Reduced workout volume');
    }
  }

  return { count: signals.length, signals };
};

/**
 * Main deload detection function
 */
export const detectDeloadNeed = (
  context: DetectionContext,
  strategy: DeloadStrategy = DEFAULT_DELOAD_STRATEGY
): DeloadRecommendation => {
  const { sessions, customExercises, weeksSinceLastDeload, currentPhaseIsDeload } = context;

  // If already in a deload phase, no recommendation needed
  if (currentPhaseIsDeload) {
    return {
      shouldDeload: false,
      urgency: 'optional',
      reasons: [],
      triggeredBy: [],
    };
  }

  // Need at least 2 weeks of data
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter(
    s => s.completedAt && new Date(s.completedAt) >= twoWeeksAgo
  );

  if (recentSessions.length < 3) {
    return {
      shouldDeload: false,
      urgency: 'optional',
      reasons: [],
      triggeredBy: [],
    };
  }

  const triggeredBy: DeloadTriggerType[] = [];
  const reasons: string[] = [];

  // Check each trigger
  for (const trigger of strategy.triggers) {
    switch (trigger.type) {
      case 'plateau_detected': {
        const { count, exerciseNames } = countPlateauExercises(sessions, customExercises);
        if (count >= trigger.threshold) {
          triggeredBy.push('plateau_detected');
          reasons.push(`${count} exercises on plateau: ${exerciseNames.slice(0, 3).join(', ')}${exerciseNames.length > 3 ? '...' : ''}`);
        }
        break;
      }

      case 'performance_decline': {
        const { averageTrend } = calculatePerformanceTrend(sessions, customExercises);
        if (averageTrend < -trigger.threshold) {
          triggeredBy.push('performance_decline');
          reasons.push(`Performance declining ${Math.abs(averageTrend).toFixed(1)}% on average`);
        }
        break;
      }

      case 'mood_decline': {
        const avgMood = calculateAverageMood(sessions);
        if (avgMood !== null && avgMood < trigger.threshold) {
          triggeredBy.push('mood_decline');
          reasons.push(`Low workout enjoyment (${avgMood.toFixed(1)}/5 average)`);
        }
        break;
      }

      case 'max_weeks_reached': {
        if (weeksSinceLastDeload >= trigger.threshold) {
          triggeredBy.push('max_weeks_reached');
          reasons.push(`${weeksSinceLastDeload} weeks since last recovery week`);
        }
        break;
      }

      case 'fatigue_accumulation': {
        const { count, signals } = countFatigueSignals(sessions, customExercises);
        if (count >= trigger.threshold) {
          triggeredBy.push('fatigue_accumulation');
          reasons.push(`Multiple fatigue signals: ${signals.join(', ')}`);
        }
        break;
      }
    }
  }

  // Determine urgency based on triggered signals
  let urgency: DeloadUrgency = 'optional';
  let shouldDeload = false;

  if (triggeredBy.length >= 3 || weeksSinceLastDeload >= strategy.maxWeeksWithoutDeload) {
    urgency = 'immediate';
    shouldDeload = true;
  } else if (triggeredBy.length >= 2) {
    urgency = 'soon';
    shouldDeload = true;
  } else if (triggeredBy.length >= 1) {
    urgency = 'optional';
    shouldDeload = true;
  }

  // Generate suggested action
  let suggestedAction: string | undefined;
  if (shouldDeload) {
    if (urgency === 'immediate') {
      suggestedAction = 'Consider taking a deload week now. Reduce weights by 40-50% and focus on recovery.';
    } else if (urgency === 'soon') {
      suggestedAction = 'Plan a deload week within the next 1-2 weeks to prevent overtraining.';
    } else {
      suggestedAction = 'A deload week could help. Consider it if you continue to feel fatigued.';
    }
  }

  return {
    shouldDeload,
    urgency,
    reasons,
    triggeredBy,
    suggestedAction,
  };
};

/**
 * Calculate weeks since last deload phase
 * Uses session history to estimate when the last easy/recovery week occurred
 */
export const calculateWeeksSinceDeload = (
  sessions: WorkoutSession[],
  cycleStartDate?: string,
  currentPhaseIndex?: number,
  phases?: Array<{ type: string; durationWeeks: number }>,
  currentWeekInPhase?: number
): number => {
  // If we have cycle info and current phase is known
  if (cycleStartDate && currentPhaseIndex !== undefined && phases && currentWeekInPhase !== undefined) {
    // Find the last deload phase before or at the current phase
    let lastDeloadPhaseIndex = -1;
    for (let i = currentPhaseIndex; i >= 0; i--) {
      if (phases[i].type === 'deload') {
        lastDeloadPhaseIndex = i;
        break;
      }
    }

    // If we're in a deload or just after one, return 0
    if (lastDeloadPhaseIndex === currentPhaseIndex) {
      return 0;
    }

    // Sum up weeks from after the last deload (or from start) to current position
    let weekCount = 0;
    const startPhase = lastDeloadPhaseIndex + 1;
    for (let i = startPhase; i < currentPhaseIndex; i++) {
      weekCount += phases[i].durationWeeks;
    }
    // Add current week within current phase
    weekCount += currentWeekInPhase;

    return weekCount;
  }

  // Fallback: estimate based on session dates
  const completedSessions = sessions
    .filter(s => s.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  if (completedSessions.length < 2) return 0;

  const mostRecent = new Date(completedSessions[0].completedAt!);
  const oldest = new Date(completedSessions[Math.min(completedSessions.length - 1, 20)].completedAt!);

  const daysDiff = Math.floor((mostRecent.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24));
  return Math.floor(daysDiff / 7);
};
