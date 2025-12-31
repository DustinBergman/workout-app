import { WorkoutTemplate, StrengthTemplateExercise } from '../../types';

export function createMockTemplateExercise(
  overrides: Partial<StrengthTemplateExercise> = {}
): StrengthTemplateExercise {
  return {
    type: 'strength',
    exerciseId: 'bench-press',
    targetSets: 3,
    targetReps: 10,
    restSeconds: 90,
    ...overrides,
  };
}

export function createMockTemplate(overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate {
  const now = new Date().toISOString();
  return {
    id: `template-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: 'Test Template',
    exercises: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
