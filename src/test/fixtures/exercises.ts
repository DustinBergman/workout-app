import { StrengthExercise } from '../../types';

export const mockExercise: StrengthExercise = {
  type: 'strength',
  id: 'test-exercise-1',
  name: 'Test Bench Press',
  muscleGroups: ['chest', 'triceps'],
  equipment: 'barbell',
  instructions: 'Test instructions',
};

export const mockCustomExercise: StrengthExercise = {
  type: 'strength',
  id: 'custom-exercise-1',
  name: 'My Custom Exercise',
  muscleGroups: ['back'],
  equipment: 'dumbbell',
  instructions: 'Custom instructions',
};

export function createMockExercise(overrides: Partial<StrengthExercise> = {}): StrengthExercise {
  return {
    type: 'strength',
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: 'Test Exercise',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    ...overrides,
  };
}
