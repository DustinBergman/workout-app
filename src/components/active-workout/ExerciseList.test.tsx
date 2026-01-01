import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ExerciseList } from './ExerciseList';
import { StrengthSessionExercise, WorkoutSession } from '../../types';
import { MockActiveWorkoutProvider } from '../../test-utils/MockActiveWorkoutProvider';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    state: { suggestions: [] },
  }),
}));

vi.mock('../../data/exercises', () => ({
  getExerciseById: vi.fn((id) => ({
    id,
    name: `Exercise ${id}`,
    type: id.includes('run') ? 'cardio' : 'strength',
  })),
}));

const mockExercise: StrengthSessionExercise = {
  id: 'ex-0',
  type: 'strength',
  exerciseId: 'bench-press',
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  sets: [],
};

const mockSession: WorkoutSession = {
  id: 'test-session',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [mockExercise],
};

describe('ExerciseList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithDnd = (session: WorkoutSession) => {
    return render(
      <MockActiveWorkoutProvider value={{ session }}>
        <DndContext collisionDetection={closestCenter} onDragEnd={() => {}}>
          <SortableContext
            items={session.exercises.map((ex) => ex.id!)}
            strategy={verticalListSortingStrategy}
          >
            <ExerciseList
              session={session}
              sensors={[]}
              onDragEnd={() => {}}
            />
          </SortableContext>
        </DndContext>
      </MockActiveWorkoutProvider>
    );
  };

  it('should render nothing when no exercises', () => {
    const { container } = renderWithDnd({ ...mockSession, exercises: [] });

    // ExerciseList returns null when no exercises, so no space-y div
    expect(container.querySelector('[class*="space-y"]')).not.toBeInTheDocument();
  });

  it('should render exercises when present', () => {
    const { container } = renderWithDnd(mockSession);

    // Component renders (has content)
    expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument();
  });

  it('should handle multiple exercises', () => {
    const exercises = [
      {
        id: 'ex-0',
        type: 'strength' as const,
        exerciseId: 'bench-press',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 90,
        sets: [],
      },
      {
        id: 'ex-1',
        type: 'strength' as const,
        exerciseId: 'squat',
        targetSets: 3,
        targetReps: 8,
        restSeconds: 120,
        sets: [],
      },
    ];

    const { container } = renderWithDnd({ ...mockSession, exercises });

    // Component renders with space-y-3 class
    expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument();
  });
});
