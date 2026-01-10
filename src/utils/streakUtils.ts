import type { WorkoutSession } from '../types';

/**
 * Calculate the current workout streak based on consecutive days with workouts.
 * A streak counts consecutive calendar days with at least one completed workout.
 *
 * @param sessions - Historical completed sessions (should be sorted by completedAt descending)
 * @param currentDate - The date of the workout being completed (defaults to now)
 * @returns The streak count (1 = first workout or gap in streak, 2+ = consecutive days)
 */
export const calculateStreak = (
  sessions: WorkoutSession[],
  currentDate: Date = new Date()
): number => {
  // Filter to only completed sessions and sort by completedAt descending
  const completedSessions = sessions
    .filter((s) => s.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  if (completedSessions.length === 0) {
    // First workout ever
    return 1;
  }

  // Get unique workout dates (calendar days)
  const workoutDates = new Set<string>();
  for (const session of completedSessions) {
    const date = new Date(session.completedAt!);
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    workoutDates.add(dateStr);
  }

  // Convert to sorted array (most recent first)
  const sortedDates = Array.from(workoutDates)
    .map((dateStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month, day);
    })
    .sort((a, b) => b.getTime() - a.getTime());

  // Get today's date (start of day)
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  // Get the most recent workout date
  const lastWorkoutDate = sortedDates[0];

  // Calculate days since last workout
  const daysSinceLastWorkout = Math.floor(
    (today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If last workout was more than 1 day ago, streak is broken
  if (daysSinceLastWorkout > 1) {
    return 1;
  }

  // Count consecutive days going backwards
  let streak = 1; // Include today's workout
  let expectedDate = new Date(today);

  // If we already worked out today, start checking from yesterday
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const lastWorkoutStr = `${lastWorkoutDate.getFullYear()}-${lastWorkoutDate.getMonth()}-${lastWorkoutDate.getDate()}`;

  if (todayStr === lastWorkoutStr) {
    // Already worked out today, check from yesterday
    expectedDate.setDate(expectedDate.getDate() - 1);
  } else if (daysSinceLastWorkout === 1) {
    // Last workout was yesterday, continue streak
    expectedDate = new Date(lastWorkoutDate);
  } else {
    // No recent workout, streak is 1
    return 1;
  }

  // Now count consecutive days from expectedDate going backwards
  for (const workoutDate of sortedDates) {
    const expectedStr = `${expectedDate.getFullYear()}-${expectedDate.getMonth()}-${expectedDate.getDate()}`;
    const workoutStr = `${workoutDate.getFullYear()}-${workoutDate.getMonth()}-${workoutDate.getDate()}`;

    if (expectedStr === workoutStr) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (workoutDate < expectedDate) {
      // Gap in streak, stop counting
      break;
    }
    // If workoutDate > expectedDate, skip it (already counted today)
  }

  return streak;
};
