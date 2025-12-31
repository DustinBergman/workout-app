import { Exercise } from '../../types';

export const mockExercise: Exercise = {
  id: 'test-exercise-1',
  name: 'Test Bench Press',
  muscleGroups: ['chest', 'triceps'],
  equipment: 'barbell',
  instructions: 'Test instructions',
};

export const mockCustomExercise: Exercise = {
  id: 'custom-exercise-1',
  name: 'My Custom Exercise',
  muscleGroups: ['back'],
  equipment: 'dumbbell',
  instructions: 'Custom instructions',
};

export function createMockExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: 'Test Exercise',
    muscleGroups: ['chest'],
    equipment: 'barbell',
    ...overrides,
  };
}
