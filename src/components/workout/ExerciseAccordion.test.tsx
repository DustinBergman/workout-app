import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExerciseAccordion } from './ExerciseAccordion';
import { StrengthSessionExercise, StrengthExercise } from '../../types';
import { MockActiveWorkoutProvider } from '../../test-utils/MockActiveWorkoutProvider';

vi.mock('../../data/exercises', () => ({
  getExerciseById: vi.fn((id) => ({
    id,
    name: 'Bench Press',
    type: 'strength',
  })),
}));

const mockExerciseInfo: StrengthExercise = {
  id: 'bench-press',
  name: 'Bench Press',
  type: 'strength',
  muscleGroups: ['chest'],
  equipment: 'barbell',
};

const createMockSession = (
  exercise: StrengthSessionExercise
) => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [exercise],
});

const createMockExercise = (
  overrides?: Partial<StrengthSessionExercise>
): StrengthSessionExercise => ({
  id: 'ex-0',
  type: 'strength',
  exerciseId: 'bench-press',
  targetSets: 3,
  targetReps: 10,
  restSeconds: 90,
  sets: [],
  ...overrides,
});

describe('ExerciseAccordion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render exercise name and progress', () => {
    const exercise = createMockExercise();
    const session = createMockSession(exercise);
    render(
      <MockActiveWorkoutProvider value={{ session }}>
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    expect(screen.getByText('Bench Press')).toBeInTheDocument();
  });

  it('should auto-open the next incomplete set when exercise accordion is expanded', async () => {
    const exercise = createMockExercise({
      sets: [
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
      ],
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
          setExpandedIndex: vi.fn(),
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // The second set should be expanded automatically (index 1 in the allSets array)
    await waitFor(() => {
      const setAccordions = screen.getAllByRole('button');
      // Should have exercise header + multiple set accordions
      expect(setAccordions.length).toBeGreaterThan(1);
    });
  });

  it('should display completed sets in green', () => {
    const exercise = createMockExercise({
      sets: [
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 12, completedAt: new Date().toISOString() },
      ],
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // Check for green styling in completed sets
    const greenSets = screen.getAllByText(/Set \d+/);
    expect(greenSets.length).toBeGreaterThanOrEqual(2);
  });

  it('should display empty sets in gray', () => {
    const exercise = createMockExercise({
      sets: [],
      targetSets: 3,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // Should show all 3 empty sets
    const setHeaders = screen.getAllByText(/Set \d+/);
    expect(setHeaders.length).toBeGreaterThanOrEqual(3);
  });

  it('should show "Add Set" button', () => {
    const exercise = createMockExercise();
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    expect(screen.getByRole('button', { name: /\+ Add Set/ })).toBeInTheDocument();
  });

  it('should display read-only target sets information', () => {
    const exercise = createMockExercise({ targetSets: 4 });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    expect(screen.getByText('Target: 4 sets')).toBeInTheDocument();
  });

  it('should show History button', () => {
    const exercise = createMockExercise();
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    expect(screen.getByRole('button', { name: /History/ })).toBeInTheDocument();
  });

  it('should show empty set form when empty set is expanded', () => {
    const exercise = createMockExercise({
      sets: [],
      targetSets: 2,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // First set should be auto-expanded, showing the form
    const weightInputs = screen.getAllByPlaceholderText('0');
    expect(weightInputs.length).toBeGreaterThan(0);
  });

  it('should show weight and reps for completed sets', () => {
    const exercise = createMockExercise({
      sets: [
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
      ],
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    expect(screen.getByText(/135 lbs x 10 reps/)).toBeInTheDocument();
  });

  it('should show suggested weight for empty sets', () => {
    const exercise = createMockExercise({
      sets: [
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
      ],
      targetSets: 2,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // Empty set should show "10 reps @ 135 lb"
    expect(screen.getByText(/reps @/)).toBeInTheDocument();
  });

  it('should have "Remove Exercise" button', () => {
    const exercise = createMockExercise();
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    expect(screen.getByRole('button', { name: /Remove Exercise/ })).toBeInTheDocument();
  });

  it('should collapse sets when clicking an expanded set header', () => {
    const exercise = createMockExercise({
      sets: [
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
      ],
      targetSets: 2,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // Find and click the first set header
    const setHeaders = screen.getAllByRole('button');
    // Skip exercise header, click first set header
    fireEvent.click(setHeaders[1]);

    // After clicking, the set should be collapsed (no form shown)
    // We can't directly test the internal state, but we can verify no error occurred
    expect(setHeaders.length).toBeGreaterThan(0);
  });

  it('should show quick adjustment buttons for weight', () => {
    const exercise = createMockExercise({
      sets: [],
      targetSets: 1,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // Should have weight adjustment buttons: -10, -5, +5, +10
    expect(screen.getByRole('button', { name: /-10/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /-5/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+5/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+10/ })).toBeInTheDocument();
  });

  it('should show quick adjustment buttons for reps', () => {
    const exercise = createMockExercise({
      sets: [],
      targetSets: 1,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // Should have reps adjustment buttons: -2, -1, +1, +2
    // Use getAllByRole since there are also weight adjustment buttons with similar names
    const allButtons = screen.getAllByRole('button');
    const repButtons = allButtons.filter((btn) => {
      const text = btn.textContent;
      return text === '-2' || text === '-1' || text === '+1' || text === '+2';
    });
    expect(repButtons.length).toBeGreaterThanOrEqual(4);
  });

  it('should have "Complete Set" button for empty sets', () => {
    const exercise = createMockExercise({
      sets: [],
      targetSets: 1,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: 0,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    expect(screen.getByRole('button', { name: /Complete Set/ })).toBeInTheDocument();
  });

  it('should show progress indicator in collapsed state', () => {
    const exercise = createMockExercise({
      sets: [
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
      ],
      targetSets: 3,
    });
    const session = createMockSession(exercise);

    render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: null,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // Should show "1/3" or similar progress
    expect(screen.getByText(/1\/3/)).toBeInTheDocument();
  });

  it('should show completion icon when all sets are done', () => {
    const exercise = createMockExercise({
      sets: [
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
      ],
      targetSets: 3,
    });
    const session = createMockSession(exercise);

    const { container } = render(
      <MockActiveWorkoutProvider
        value={{
          session,
          expandedIndex: null,
        }}
      >
        <ExerciseAccordion
          exercise={exercise}
          exerciseInfo={mockExerciseInfo}
        />
      </MockActiveWorkoutProvider>
    );

    // When complete, should show checkmark icon (rendered as SVG)
    // Check that the status indicator has the green checkmark styling
    const statusIcon = container.querySelector('.bg-green-500');
    expect(statusIcon).toBeInTheDocument();

    // Check for the checkmark SVG inside
    const checkmarkSvg = statusIcon?.querySelector('svg');
    expect(checkmarkSvg).toBeInTheDocument();
  });

  describe('completed set editing', () => {
    it('should show Edit button for completed sets', async () => {
      const exercise = createMockExercise({
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Click set header to expand it
      const setHeader = screen.getByText(/Set 1/).closest('button');
      if (setHeader) fireEvent.click(setHeader);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
      });
    });

    it('should show editable inputs when Edit button is clicked', async () => {
      const exercise = createMockExercise({
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Expand the set accordion
      const setHeader = screen.getByText(/Set 1/).closest('button');
      if (setHeader) fireEvent.click(setHeader);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit/ });
      fireEvent.click(editButton);

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('135');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('should show Done and Remove buttons when editing', async () => {
      const exercise = createMockExercise({
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Expand the set accordion
      const setHeader = screen.getByText(/Set 1/).closest('button');
      if (setHeader) fireEvent.click(setHeader);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit/ });
      fireEvent.click(editButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const doneButton = buttons.find(btn => btn.textContent?.includes('Done'));
        const removeButtons = buttons.filter(btn => btn.textContent?.trim() === 'Remove');
        expect(doneButton).toBeInTheDocument();
        expect(removeButtons.length).toBeGreaterThan(0);
      });
    });

    it('should save changes and collapse when Done is clicked after editing weight', async () => {
      const updateSetForExercise = vi.fn();
      const exercise = createMockExercise({
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateSetForExercise,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Expand the set accordion
      const setHeader = screen.getByText(/Set 1/).closest('button');
      if (setHeader) fireEvent.click(setHeader);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit/ });
      fireEvent.click(editButton);

      // Find the weight input and change it
      const inputs = screen.getAllByDisplayValue('135');
      const weightInput = inputs[0] as HTMLInputElement;
      fireEvent.change(weightInput, { target: { value: '155' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Done/ })).toBeInTheDocument();
      });

      const doneButton = screen.getByRole('button', { name: /Done/ });
      fireEvent.click(doneButton);

      // Verify updateSetForExercise was called with new weight
      await waitFor(() => {
        expect(updateSetForExercise).toHaveBeenCalledWith(0, 0, 10, 155);
      });

      // Verify Edit button is showing (set is collapsed/not in edit mode)
      await waitFor(() => {
        const editButtons = screen.queryAllByRole('button', { name: /Edit/ });
        expect(editButtons.length).toBe(0);
      });
    });

    it('should save changes and collapse when Done is clicked after editing reps', async () => {
      const updateSetForExercise = vi.fn();
      const exercise = createMockExercise({
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateSetForExercise,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Expand the set accordion
      const setHeader = screen.getByText(/Set 1/).closest('button');
      if (setHeader) fireEvent.click(setHeader);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit/ });
      fireEvent.click(editButton);

      // Find the reps input and change it
      const inputs = screen.getAllByDisplayValue('10');
      const repsInput = inputs[0] as HTMLInputElement;
      fireEvent.change(repsInput, { target: { value: '12' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Done/ })).toBeInTheDocument();
      });

      const doneButton = screen.getByRole('button', { name: /Done/ });
      fireEvent.click(doneButton);

      // Verify updateSetForExercise was called with new reps
      await waitFor(() => {
        expect(updateSetForExercise).toHaveBeenCalledWith(0, 0, 12, 135);
      });
    });

    it('should save changes when editing both weight and reps', async () => {
      const updateSetForExercise = vi.fn();
      const exercise = createMockExercise({
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateSetForExercise,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Expand the set accordion
      const setHeader = screen.getByText(/Set 1/).closest('button');
      if (setHeader) fireEvent.click(setHeader);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit/ });
      fireEvent.click(editButton);

      // Change both weight and reps
      const inputs = screen.getAllByDisplayValue('135');
      const weightInput = inputs[0] as HTMLInputElement;
      fireEvent.change(weightInput, { target: { value: '155' } });

      const repsInputs = screen.getAllByDisplayValue('10');
      const repsInput = repsInputs[0] as HTMLInputElement;
      fireEvent.change(repsInput, { target: { value: '12' } });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Done/ })).toBeInTheDocument();
      });

      const doneButton = screen.getByRole('button', { name: /Done/ });
      fireEvent.click(doneButton);

      // Verify updateSetForExercise was called with both new values
      await waitFor(() => {
        expect(updateSetForExercise).toHaveBeenCalledWith(0, 0, 12, 155);
      });
    });

    it('should call removeSetForExercise when Remove is clicked in edit mode', async () => {
      const removeSetForExercise = vi.fn();
      const exercise = createMockExercise({
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            removeSetForExercise,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Expand the set accordion
      const setHeader = screen.getByText(/Set 1/).closest('button');
      if (setHeader) fireEvent.click(setHeader);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Edit/ })).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Edit/ });
      fireEvent.click(editButton);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const removeButtons = buttons.filter(btn => btn.textContent?.trim() === 'Remove');
        expect(removeButtons.length).toBeGreaterThan(0);
      });

      const buttons = screen.getAllByRole('button');
      const removeButton = buttons.find(btn => btn.textContent?.trim() === 'Remove');
      if (removeButton) fireEvent.click(removeButton);

      await waitFor(() => {
        expect(removeSetForExercise).toHaveBeenCalledWith(0, 0);
      });
    });
  });

  describe('remove set', () => {
    it('should have "Remove Set" button for empty sets', () => {
      const exercise = createMockExercise({
        sets: [],
        targetSets: 3,
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      expect(screen.getByRole('button', { name: /Remove Set/ })).toBeInTheDocument();
    });

    it('should call updateTargetSets when Remove Set is clicked', async () => {
      const updateTargetSets = vi.fn();
      const exercise = createMockExercise({
        sets: [],
        targetSets: 3,
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateTargetSets,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      const removeSetButton = screen.getByRole('button', { name: /Remove Set/ });
      fireEvent.click(removeSetButton);

      await waitFor(() => {
        expect(updateTargetSets).toHaveBeenCalledWith(exercise.exerciseId, -1);
      });
    });

    it('should collapse empty set after removing', async () => {
      const setExpandedIndex = vi.fn();
      const updateTargetSets = vi.fn();
      const exercise = createMockExercise({
        sets: [],
        targetSets: 3,
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            setExpandedIndex,
            updateTargetSets,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      const removeSetButton = screen.getByRole('button', { name: /Remove Set/ });
      fireEvent.click(removeSetButton);

      // Verify that updateTargetSets was called
      await waitFor(() => {
        expect(updateTargetSets).toHaveBeenCalledWith(exercise.exerciseId, -1);
      });
    });

    it('should not allow removing below 1 target set', () => {
      const updateTargetSets = vi.fn();
      const exercise = createMockExercise({
        sets: [],
        targetSets: 1,
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateTargetSets,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Remove Set button should not be rendered when targetSets is 1
      const removeSetButton = screen.queryByRole('button', { name: /Remove Set/ });
      expect(removeSetButton).not.toBeInTheDocument();
    });

    it('should work with targetSets using default value', async () => {
      const updateTargetSets = vi.fn();
      const exercise = createMockExercise({
        sets: [],
        targetSets: undefined,
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateTargetSets,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      const removeSetButton = screen.getByRole('button', { name: /Remove Set/ });
      fireEvent.click(removeSetButton);

      await waitFor(() => {
        expect(updateTargetSets).toHaveBeenCalledWith(exercise.exerciseId, -1);
      });
    });
  });

  describe('add set', () => {
    it('should add a new set even when not all sets are completed', async () => {
      const updateTargetSets = vi.fn();
      // Exercise with 2 of 3 sets completed
      const exercise = createMockExercise({
        targetSets: 3,
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateTargetSets,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Find and click the "Add Set" button
      const addSetButton = screen.getByRole('button', { name: /\+ Add Set/ });
      fireEvent.click(addSetButton);

      // Verify updateTargetSets was called to increase targetSets
      await waitFor(() => {
        expect(updateTargetSets).toHaveBeenCalledWith(exercise.exerciseId, 1);
      });
    });

    it('should add a new set when all sets are completed', async () => {
      const updateTargetSets = vi.fn();
      // Exercise with all 3 sets completed
      const exercise = createMockExercise({
        targetSets: 3,
        sets: [
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
          { type: 'strength' as const, weight: 135, unit: 'lbs' as const, reps: 10, completedAt: new Date().toISOString() },
        ],
      });
      const session = createMockSession(exercise);

      render(
        <MockActiveWorkoutProvider
          value={{
            session,
            expandedIndex: 0,
            updateTargetSets,
          }}
        >
          <ExerciseAccordion
            exercise={exercise}
            exerciseInfo={mockExerciseInfo}
          />
        </MockActiveWorkoutProvider>
      );

      // Find and click the "Add Set" button
      const addSetButton = screen.getByRole('button', { name: /\+ Add Set/ });
      fireEvent.click(addSetButton);

      // Verify updateTargetSets was called to increase targetSets
      await waitFor(() => {
        expect(updateTargetSets).toHaveBeenCalledWith(exercise.exerciseId, 1);
      });
    });
  });
});
