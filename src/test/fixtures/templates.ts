import { WorkoutTemplate, StrengthTemplateExercise, TemplateType, TemplateExercise } from '../../types';

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

interface MockTemplateOverrides {
  id?: string;
  name?: string;
  templateType?: TemplateType;
  exercises?: TemplateExercise[];
  createdAt?: string;
  updatedAt?: string;
}

export function createMockTemplate(overrides: MockTemplateOverrides = {}): WorkoutTemplate {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? `template-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: overrides.name ?? 'Test Template',
    templateType: overrides.templateType ?? 'strength',
    exercises: overrides.exercises ?? [],
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}
