import type { WorkoutSession } from '../types';

/**
 * Get the ISO week number and year for a date
 */
const getWeekKey = (date: Date): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday day 7 instead of 0
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo}`;
};

/**
 * Get the week key for a date offset by a number of weeks
 */
const getOffsetWeekKey = (date: Date, offsetWeeks: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + (offsetWeeks * 7));
  return getWeekKey(d);
};

/**
 * Calculate the current workout streak based on consecutive weeks hitting the weekly goal.
 * A streak counts consecutive calendar weeks where the user completed at least their
 * target number of workouts.
 *
 * @param sessions - Historical completed sessions
 * @param weeklyGoal - Target workouts per week (default 4)
 * @param currentDate - The date to calculate from (defaults to now)
 * @returns Object with weekStreak (consecutive weeks hitting goal) and currentWeekWorkouts
 */
export const calculateWeeklyStreak = (
  sessions: WorkoutSession[],
  weeklyGoal: number = 4,
  currentDate: Date = new Date()
): { weekStreak: number; currentWeekWorkouts: number; goalMet: boolean } => {
  // Filter to only completed sessions
  const completedSessions = sessions.filter((s) => s.completedAt);

  if (completedSessions.length === 0) {
    return { weekStreak: 0, currentWeekWorkouts: 0, goalMet: false };
  }

  // Group workouts by week
  const workoutsByWeek = new Map<string, number>();
  for (const session of completedSessions) {
    const weekKey = getWeekKey(new Date(session.completedAt!));
    workoutsByWeek.set(weekKey, (workoutsByWeek.get(weekKey) || 0) + 1);
  }

  // Get current week info
  const currentWeekKey = getWeekKey(currentDate);
  const currentWeekWorkouts = workoutsByWeek.get(currentWeekKey) || 0;
  const currentWeekGoalMet = currentWeekWorkouts >= weeklyGoal;

  // Count consecutive weeks hitting goal (going backwards from last completed week)
  let streak = 0;
  let checkWeekOffset = 0;

  // Start from current week if we have workouts, otherwise start from last week
  if (currentWeekWorkouts > 0) {
    checkWeekOffset = 0;
  } else {
    // No workouts this week yet, check if last week was successful
    checkWeekOffset = -1;
  }

  // Count backwards through weeks
  while (true) {
    const weekKey = getOffsetWeekKey(currentDate, checkWeekOffset);
    const workoutsThisWeek = workoutsByWeek.get(weekKey) || 0;

    if (workoutsThisWeek >= weeklyGoal) {
      streak++;
      checkWeekOffset--;
    } else if (checkWeekOffset === 0 && workoutsThisWeek > 0) {
      // Current week has workouts but hasn't met goal yet - don't count but continue checking past weeks
      checkWeekOffset--;
    } else {
      // Week didn't meet goal, streak is broken
      break;
    }

    // Safety limit - don't go back more than 52 weeks
    if (checkWeekOffset < -52) break;
  }

  return {
    weekStreak: streak,
    currentWeekWorkouts,
    goalMet: currentWeekGoalMet,
  };
};

/**
 * Legacy function for backward compatibility.
 * Now calculates streak based on weekly goals instead of daily.
 *
 * @deprecated Use calculateWeeklyStreak instead for more detailed info
 */
export const calculateStreak = (
  sessions: WorkoutSession[],
  currentDate: Date = new Date(),
  weeklyGoal: number = 4
): number => {
  const { weekStreak } = calculateWeeklyStreak(sessions, weeklyGoal, currentDate);
  return weekStreak;
};
