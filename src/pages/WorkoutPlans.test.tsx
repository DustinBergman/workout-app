import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../test/test-utils';
import { WorkoutPlans } from './WorkoutPlans';
import { useAppStore } from '../store/useAppStore';
import { WorkoutTemplate, UserPreferences, Exercise } from '../types';

// Mock the useStartWorkout hook
vi.mock('../hooks/useStartWorkout', () => ({
  useStartWorkout: () => ({
    isLoadingSuggestions: false,
    startWorkout: vi.fn(),
    startQuickWorkout: vi.fn(),
  }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Helper to create mock templates
const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: 'template-1',
  name: 'Push Day',
  exercises: [
    {
      type: 'strength',
      exerciseId: 'bench-press',
      targetSets: 3,
      targetReps: 10,
      restSeconds: 90,
    },
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const defaultPreferences: UserPreferences = {
  weightUnit: 'lbs',
  distanceUnit: 'mi',
  defaultRestSeconds: 90,
  darkMode: false,
};

// Helper to find button by SVG path
const findButtonBySvgPath = (container: HTMLElement, pathSubstring: string) => {
  const buttons = container.querySelectorAll('button');
  return Array.from(buttons).find(btn => btn.innerHTML.includes(pathSubstring));
};

describe('WorkoutPlans', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the store to initial state
    useAppStore.setState({
      templates: [],
      sessions: [],
      activeSession: null,
      preferences: defaultPreferences,
      customExercises: [],
      currentWeek: 0,
      weekStartedAt: null,
      workoutGoal: 'build',
      hasCompletedIntro: false,
      weightEntries: [],
    });
  });

  describe('List View', () => {
    it('renders the page title', () => {
      render(<WorkoutPlans />);
      expect(screen.getByText('Workout Plans')).toBeInTheDocument();
    });

    it('shows empty state when no templates exist', () => {
      render(<WorkoutPlans />);
      expect(screen.getByText('No workout plans yet. Create your first one!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Plan' })).toBeInTheDocument();
    });

    it('renders templates when they exist', () => {
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      render(<WorkoutPlans />);
      expect(screen.getByText('Push Day')).toBeInTheDocument();
      expect(screen.getByText('1 exercises')).toBeInTheDocument();
    });

    it('shows exercise preview for templates', () => {
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      render(<WorkoutPlans />);
      expect(screen.getByText(/Bench Press - 3x10/)).toBeInTheDocument();
    });

    it('shows +N more when template has more than 4 exercises', () => {
      useAppStore.setState({
        templates: [
          createMockTemplate({
            exercises: [
              { type: 'strength', exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
              { type: 'strength', exerciseId: 'incline-dumbbell-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
              { type: 'strength', exerciseId: 'dumbbell-fly', targetSets: 3, targetReps: 12, restSeconds: 60 },
              { type: 'strength', exerciseId: 'tricep-pushdown', targetSets: 3, targetReps: 12, restSeconds: 60 },
              { type: 'strength', exerciseId: 'overhead-tricep-extension', targetSets: 3, targetReps: 12, restSeconds: 60 },
              { type: 'strength', exerciseId: 'lateral-raise', targetSets: 3, targetReps: 15, restSeconds: 45 },
            ],
          }),
        ],
      });
      render(<WorkoutPlans />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('shows Start Workout button for each template', () => {
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      render(<WorkoutPlans />);
      expect(screen.getByRole('button', { name: 'Start Workout' })).toBeInTheDocument();
    });

    it('clicking New button enters create mode', () => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));
      expect(screen.getByText('New Plan')).toBeInTheDocument();
    });

    it('clicking edit button enters edit mode with template data', () => {
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      const { container } = render(<WorkoutPlans />);

      // Find the edit button by SVG path (pencil icon)
      const editButton = findButtonBySvgPath(container, '11 5H6');
      fireEvent.click(editButton!);

      expect(screen.getByText('Edit Plan')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Push Day')).toBeInTheDocument();
    });

    it('clicking delete button with confirmation removes template', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      const { container } = render(<WorkoutPlans />);

      // Find the delete button by class (red trash icon)
      const deleteButton = findButtonBySvgPath(container, 'M19 7l');
      fireEvent.click(deleteButton!);

      expect(confirmSpy).toHaveBeenCalledWith('Delete this template?');
      expect(screen.queryByText('Push Day')).not.toBeInTheDocument();
      confirmSpy.mockRestore();
    });

    it('clicking delete button without confirmation keeps template', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      const { container } = render(<WorkoutPlans />);

      const deleteButton = findButtonBySvgPath(container, 'M19 7l');
      fireEvent.click(deleteButton!);

      expect(screen.getByText('Push Day')).toBeInTheDocument();
      confirmSpy.mockRestore();
    });

    it('renders multiple templates', () => {
      useAppStore.setState({
        templates: [
          createMockTemplate({ id: '1', name: 'Push Day' }),
          createMockTemplate({ id: '2', name: 'Pull Day' }),
          createMockTemplate({ id: '3', name: 'Leg Day' }),
        ],
      });
      render(<WorkoutPlans />);
      expect(screen.getByText('Push Day')).toBeInTheDocument();
      expect(screen.getByText('Pull Day')).toBeInTheDocument();
      expect(screen.getByText('Leg Day')).toBeInTheDocument();
    });
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));
    });

    it('shows create plan header', () => {
      expect(screen.getByText('New Plan')).toBeInTheDocument();
    });

    it('shows plan name input', () => {
      expect(screen.getByLabelText('Plan Name')).toBeInTheDocument();
    });

    it('shows empty exercises message initially', () => {
      expect(screen.getByText('No exercises added yet')).toBeInTheDocument();
    });

    it('shows Create with AI button', () => {
      expect(screen.getByText('Create with AI')).toBeInTheDocument();
    });

    it('navigates to AI creator when clicking Create with AI', () => {
      fireEvent.click(screen.getByText('Create with AI'));
      expect(mockNavigate).toHaveBeenCalledWith('/plans/create-with-ai');
    });

    it('back button returns to list view', () => {
      // Back button is the first button with a left arrow
      const buttons = screen.getAllByRole('button');
      const backButton = buttons.find(btn => btn.innerHTML.includes('M15 19l-7-7 7-7'));
      fireEvent.click(backButton!);
      expect(screen.getByText('Workout Plans')).toBeInTheDocument();
    });

    it('save button is disabled without name', () => {
      expect(screen.getByRole('button', { name: 'Create Plan' })).toBeDisabled();
    });

    it('save button is disabled without exercises', () => {
      fireEvent.change(screen.getByLabelText('Plan Name'), { target: { value: 'My Plan' } });
      expect(screen.getByRole('button', { name: 'Create Plan' })).toBeDisabled();
    });

    it('shows Add Exercise button', () => {
      expect(screen.getByRole('button', { name: 'Add Exercise' })).toBeInTheDocument();
    });
  });

  describe('Exercise Picker Modal', () => {
    beforeEach(() => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));
    });

    it('opens exercise picker modal', () => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('shows search input', () => {
      expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
    });

    it('shows Create New Exercise button', () => {
      expect(screen.getByText('Create New Exercise')).toBeInTheDocument();
    });

    it('shows exercise list', async () => {
      // Exercises load asynchronously - wait for them
      expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();
    });

    it('filters exercises when searching', async () => {
      // Wait for exercises to load
      await screen.findByText('Barbell Bench Press');

      const searchInput = screen.getByPlaceholderText('Search exercises...');
      fireEvent.change(searchInput, { target: { value: 'squat' } });

      expect(await screen.findByText('Barbell Back Squat')).toBeInTheDocument();
      expect(screen.queryByText('Barbell Bench Press')).not.toBeInTheDocument();
    });

    it('adds exercise when clicked', async () => {
      // Wait for exercises to load
      const benchPress = await screen.findByText('Barbell Bench Press');
      fireEvent.click(benchPress);

      // Modal should close and exercise should be added
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Exercise should now be in the list
      expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
      // The "No exercises added yet" message should be gone
      expect(screen.queryByText('No exercises added yet')).not.toBeInTheDocument();
    });

    it('closes modal when clicking close button', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('shows cardio badge for cardio exercises', async () => {
      // Wait for exercises to load
      await screen.findByText('Barbell Bench Press');

      const searchInput = screen.getByPlaceholderText('Search exercises...');
      fireEvent.change(searchInput, { target: { value: 'running' } });

      const dialog = screen.getByRole('dialog');
      // Multiple cardio exercises may appear, just check that at least one Cardio badge exists
      const cardioBadges = within(dialog).getAllByText('Cardio');
      expect(cardioBadges.length).toBeGreaterThan(0);
    });
  });

  describe('Exercise List Management', () => {
    beforeEach(async () => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));

      // Add an exercise
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));

      // Wait for exercises to load, then click
      const benchPress = await screen.findByText('Barbell Bench Press');
      fireEvent.click(benchPress);

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('shows exercise in list after adding', () => {
      expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
    });

    it('shows default sets, reps, and rest values', () => {
      expect(screen.getByDisplayValue('3')).toBeInTheDocument(); // Sets
      expect(screen.getByDisplayValue('10')).toBeInTheDocument(); // Reps
      expect(screen.getByDisplayValue('90')).toBeInTheDocument(); // Rest
    });

    it('can update sets value', () => {
      const setsInputs = screen.getAllByDisplayValue('3');
      fireEvent.change(setsInputs[0], { target: { value: '4' } });
      expect(screen.getByDisplayValue('4')).toBeInTheDocument();
    });

    it('can update reps value', () => {
      const repsInputs = screen.getAllByDisplayValue('10');
      fireEvent.change(repsInputs[0], { target: { value: '12' } });
      expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    });

    it('can update rest value', () => {
      const restInputs = screen.getAllByDisplayValue('90');
      fireEvent.change(restInputs[0], { target: { value: '120' } });
      expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    });

    it('can remove exercise', () => {
      // Find the remove button (trash icon in exercise card)
      const buttons = screen.getAllByRole('button');
      const removeButton = buttons.find(btn => btn.innerHTML.includes('M19 7l') && btn.closest('.space-y-4'));
      fireEvent.click(removeButton!);
      expect(screen.getByText('No exercises added yet')).toBeInTheDocument();
    });

    it('move up button is disabled for first exercise', () => {
      const buttons = screen.getAllByRole('button');
      const upButton = buttons.find(btn => btn.innerHTML.includes('M5 15l7-7'));
      expect(upButton).toBeDisabled();
    });

    it('move down button is disabled for last exercise', () => {
      const buttons = screen.getAllByRole('button');
      const downButton = buttons.find(btn => btn.innerHTML.includes('M19 9l-7 7'));
      expect(downButton).toBeDisabled();
    });
  });

  describe('Multiple Exercises Reordering', () => {
    beforeEach(async () => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));

      // Add first exercise
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));
      const benchPress = await screen.findByText('Barbell Bench Press');
      fireEvent.click(benchPress);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Add second exercise
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));
      // Wait for dialog to open and exercises to load
      const dialog = await screen.findByRole('dialog');
      await within(dialog).findByText('Barbell Bench Press'); // Wait for list to load
      const searchInput = within(dialog).getByPlaceholderText('Search exercises...');
      fireEvent.change(searchInput, { target: { value: 'squat' } });
      const squat = await within(dialog).findByText('Barbell Back Squat');
      fireEvent.click(squat);
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('shows both exercises', () => {
      expect(screen.getByText('Barbell Bench Press')).toBeInTheDocument();
      expect(screen.getByText('Barbell Back Squat')).toBeInTheDocument();
    });

    it('can move second exercise up', () => {
      // Get all move up buttons - the second one should be enabled
      const buttons = screen.getAllByRole('button');
      const upButtons = buttons.filter(btn => btn.innerHTML.includes('M5 15l7-7'));

      // First up button is disabled, second should be enabled
      expect(upButtons[0]).toBeDisabled();
      expect(upButtons[1]).not.toBeDisabled();
    });

    it('can move first exercise down', () => {
      const buttons = screen.getAllByRole('button');
      const downButtons = buttons.filter(btn => btn.innerHTML.includes('M19 9l-7 7'));

      // First down button should be enabled, second disabled
      expect(downButtons[0]).not.toBeDisabled();
      expect(downButtons[1]).toBeDisabled();
    });
  });

  describe('Custom Exercise Creation', () => {
    beforeEach(() => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));
      fireEvent.click(screen.getByText('Create New Exercise'));
    });

    it('shows custom exercise form', () => {
      expect(screen.getByLabelText('Exercise Name')).toBeInTheDocument();
    });

    it('shows muscle group selection', () => {
      expect(screen.getByText('Muscle Groups')).toBeInTheDocument();
      expect(screen.getByText('chest')).toBeInTheDocument();
      expect(screen.getByText('back')).toBeInTheDocument();
    });

    it('shows equipment selection', () => {
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('can enter exercise name', () => {
      fireEvent.change(screen.getByLabelText('Exercise Name'), { target: { value: 'Custom Press' } });
      expect(screen.getByDisplayValue('Custom Press')).toBeInTheDocument();
    });

    it('can select muscle groups', () => {
      fireEvent.click(screen.getByText('chest'));
      expect(screen.getByText('chest')).toHaveClass('bg-blue-500');
    });

    it('can toggle muscle groups off', () => {
      fireEvent.click(screen.getByText('chest'));
      fireEvent.click(screen.getByText('chest'));
      expect(screen.getByText('chest')).not.toHaveClass('bg-blue-500');
    });

    it('can select multiple muscle groups', () => {
      fireEvent.click(screen.getByText('chest'));
      fireEvent.click(screen.getByText('triceps'));
      expect(screen.getByText('chest')).toHaveClass('bg-blue-500');
      expect(screen.getByText('triceps')).toHaveClass('bg-blue-500');
    });

    it('can select equipment', () => {
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dumbbell' } });
      expect(screen.getByDisplayValue('Dumbbell')).toBeInTheDocument();
    });

    it('Create & Add button is disabled without name', () => {
      expect(screen.getByRole('button', { name: 'Create & Add' })).toBeDisabled();
    });

    it('Cancel button returns to exercise picker', () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
    });

    it('creates and adds custom exercise', async () => {
      fireEvent.change(screen.getByLabelText('Exercise Name'), { target: { value: 'My Custom Exercise' } });
      fireEvent.click(screen.getByText('chest'));
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'dumbbell' } });

      fireEvent.click(screen.getByRole('button', { name: 'Create & Add' }));

      // Modal should close and exercise should be added
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
      expect(screen.getByText('My Custom Exercise')).toBeInTheDocument();

      // Exercise should be in the store
      const state = useAppStore.getState();
      expect(state.customExercises).toHaveLength(1);
      expect(state.customExercises[0].name).toBe('My Custom Exercise');
    });
  });

  describe('Saving Templates', () => {
    it('creates new template when saving', async () => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));

      // Enter name
      fireEvent.change(screen.getByLabelText('Plan Name'), { target: { value: 'My New Plan' } });

      // Add exercise
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));
      const benchPress = await screen.findByText('Barbell Bench Press');
      fireEvent.click(benchPress);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Save
      fireEvent.click(screen.getByRole('button', { name: 'Create Plan' }));

      // Should return to list view with new template
      await waitFor(() => {
        expect(screen.getByText('Workout Plans')).toBeInTheDocument();
      });

      const state = useAppStore.getState();
      expect(state.templates).toHaveLength(1);
      expect(state.templates[0].name).toBe('My New Plan');
    });

    it('updates existing template when editing', async () => {
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      const { container } = render(<WorkoutPlans />);

      // Click edit
      const editButton = findButtonBySvgPath(container, '11 5H6');
      fireEvent.click(editButton!);

      // Change name
      fireEvent.change(screen.getByDisplayValue('Push Day'), { target: { value: 'Updated Push Day' } });

      // Save
      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));

      // Check store
      const state = useAppStore.getState();
      expect(state.templates[0].name).toBe('Updated Push Day');
    });
  });

  describe('Edit Mode', () => {
    const setupEditMode = () => {
      useAppStore.setState({
        templates: [createMockTemplate()],
      });
      const { container } = render(<WorkoutPlans />);
      const editButton = findButtonBySvgPath(container, '11 5H6');
      fireEvent.click(editButton!);
    };

    it('shows Edit Plan header', () => {
      setupEditMode();
      expect(screen.getByText('Edit Plan')).toBeInTheDocument();
    });

    it('does not show Create with AI button when editing', () => {
      setupEditMode();
      expect(screen.queryByText('Create with AI')).not.toBeInTheDocument();
    });

    it('shows Save Changes button instead of Create Plan', () => {
      setupEditMode();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Create Plan' })).not.toBeInTheDocument();
    });

    it('populates form with template data', async () => {
      setupEditMode();
      expect(screen.getByDisplayValue('Push Day')).toBeInTheDocument();
      // Exercise name should be displayed in the form
      expect(await screen.findByText('Barbell Bench Press')).toBeInTheDocument();
    });
  });

  describe('Cardio Exercises', () => {
    it('shows Cardio text for cardio exercises in template list', () => {
      useAppStore.setState({
        templates: [
          createMockTemplate({
            exercises: [
              { type: 'cardio', exerciseId: 'outdoor-run', restSeconds: 0 },
            ],
          }),
        ],
      });
      render(<WorkoutPlans />);
      // Cardio exercises show "Cardio" in the exercise list preview
      expect(screen.getByText(/Outdoor Run - Cardio/)).toBeInTheDocument();
    });

    it('shows only rest input for cardio exercises in edit mode', async () => {
      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));

      // Add cardio exercise
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));
      // Wait for exercises to load
      const outdoorRun = await screen.findByText('Outdoor Run');
      fireEvent.click(outdoorRun);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Cardio should only have rest input, not sets/reps
      const inputs = screen.getAllByRole('spinbutton');
      // Should have only 1 input (rest) for cardio
      expect(inputs.length).toBe(1);
    });
  });

  describe('Custom Exercises Display', () => {
    it('shows Custom badge for custom exercises in picker', () => {
      const customExercise: Exercise = {
        type: 'strength',
        id: 'custom-123',
        name: 'My Custom Exercise',
        muscleGroups: ['chest'],
        equipment: 'dumbbell',
      };
      useAppStore.setState({
        customExercises: [customExercise],
      });

      render(<WorkoutPlans />);
      fireEvent.click(screen.getByRole('button', { name: /New/ }));
      fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }));

      // Search for custom exercise
      const searchInput = screen.getByPlaceholderText('Search exercises...');
      fireEvent.change(searchInput, { target: { value: 'My Custom' } });

      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });
});
