import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableExerciseItem } from './SortableExerciseItem';
import { StrengthSessionExercise, CardioSessionExercise, WorkoutSession } from '../../types';
import { MockActiveWorkoutProvider } from '../../test-utils/MockActiveWorkoutProvider';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    state: { suggestions: [] },
  }),
}));

const mockStrengthExercise: StrengthSessionExercise = {
  id: 'ex-0',
  type: 'strength',
  exerciseId: 'bench-press',
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  sets: [],
};

const mockCardioExercise: CardioSessionExercise = {
  id: 'ex-1',
  type: 'cardio',
  exerciseId: 'running',
  restSeconds: 60,
  sets: [],
};

const mockSession: WorkoutSession = {
  id: 'test-session',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [mockStrengthExercise, mockCardioExercise],
};

describe('SortableExerciseItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithDnd = (component: React.ReactElement) => {
    return render(
      <MockActiveWorkoutProvider
        value={{
          session: mockSession,
        }}
      >
        <DndContext
          collisionDetection={closestCenter}
          onDragEnd={() => {}}
        >
          <SortableContext
            items={[mockStrengthExercise.id!, mockCardioExercise.id!]}
            strategy={verticalListSortingStrategy}
          >
            {component}
          </SortableContext>
        </DndContext>
      </MockActiveWorkoutProvider>
    );
  };

  it('should render strength exercise with minimal props', () => {
    const { container } = renderWithDnd(
      <SortableExerciseItem
        exercise={mockStrengthExercise}
        index={0}
      />
    );

    // Check that a card was rendered (indicates component rendered)
    const card = container.querySelector('[class*="border-border"]');
    expect(card).toBeInTheDocument();
  });

  it('should render cardio exercise with minimal props', () => {
    const { container } = renderWithDnd(
      <SortableExerciseItem
        exercise={mockCardioExercise}
        index={1}
      />
    );

    // Check that a card was rendered
    const card = container.querySelector('[class*="border-border"]');
    expect(card).toBeInTheDocument();
  });

  it('should render drag handle', () => {
    const { container } = renderWithDnd(
      <SortableExerciseItem
        exercise={mockStrengthExercise}
        index={0}
      />
    );

    // Check for drag handle SVG
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
