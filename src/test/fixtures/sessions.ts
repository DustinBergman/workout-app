import { WorkoutSession, SessionExercise, CompletedSet } from '../../types';

export function createMockCompletedSet(overrides: Partial<CompletedSet> = {}): CompletedSet {
  return {
    reps: 10,
    weight: 135,
    unit: 'lbs',
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockSessionExercise(overrides: Partial<SessionExercise> = {}): SessionExercise {
  return {
    exerciseId: 'bench-press',
    targetSets: 3,
    targetReps: 10,
    restSeconds: 90,
    sets: [],
    ...overrides,
  };
}

export function createMockSession(overrides: Partial<WorkoutSession> = {}): WorkoutSession {
  return {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: 'Test Workout',
    startedAt: new Date().toISOString(),
    exercises: [],
    ...overrides,
  };
}

export function createSessionsForDateRange(
  startDate: Date,
  endDate: Date,
  sessionsPerDay: number = 1
): WorkoutSession[] {
  const sessions: WorkoutSession[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    for (let i = 0; i < sessionsPerDay; i++) {
      sessions.push(
        createMockSession({
          id: `session-${current.toISOString()}-${i}`,
          startedAt: current.toISOString(),
        })
      );
    }
    current.setDate(current.getDate() + 1);
  }

  return sessions;
}
