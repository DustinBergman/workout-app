import { WorkoutSession } from '../../types';
import { getExerciseById } from '../../data/exercises';
import { getCustomExercises } from '../storage';
import { ExerciseStats } from './types';

export const createHistoryContext = (sessions: WorkoutSession[]): string => {
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

export const analyzeExercisePerformance = (sessions: WorkoutSession[]): ExerciseStats[] => {
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
