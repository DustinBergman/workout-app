import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WorkoutModals } from './WorkoutModals';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({
    state: { suggestions: [] },
  }),
}));

vi.mock('../active-workout/index', () => ({
  ExercisePickerModal: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="exercise-picker">{children}</div> : null,
  CreateExerciseForm: ({ name }: any) => <div>Form: {name}</div>,
  PostWorkoutFlow: ({ isOpen }: any) =>
    isOpen ? <div data-testid="post-workout-flow">Post Workout Flow</div> : null,
  ScoringModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="scoring-modal">Scoring</div> : null,
  ScoreResultModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="score-result">Score Result</div> : null,
  ScoreErrorToast: ({ error }: any) =>
    error ? <div data-testid="error-toast">{error}</div> : null,
}));

vi.mock('../workout/ExerciseHistorySheet', () => ({
  ExerciseHistorySheet: ({ isOpen }: any) =>
    isOpen ? <div data-testid="history-sheet">History</div> : null,
}));

describe('WorkoutModals', () => {
  const defaultProps = {
    // Exercise picker modal
    showExercisePicker: false,
    onSetShowExercisePicker: vi.fn(),
    exerciseSearch: '',
    onSetExerciseSearch: vi.fn(),
    filteredExercises: [],
    onAddExerciseToSession: vi.fn(),
    customExerciseState: { isCreating: false, name: '', muscles: [], equipment: '' },
    onSetIsCreatingExercise: vi.fn(),
    onSetNewExerciseName: vi.fn(),
    onSetNewExerciseEquipment: vi.fn(),
    onToggleMuscleGroup: vi.fn(),
    onResetNewExerciseForm: vi.fn(),
    onHandleCreateExercise: vi.fn(),

    // Finish workout modal
    showFinishConfirm: false,
    onSetShowFinishConfirm: vi.fn(),
    workoutName: 'Test Workout',
    totalSets: 0,
    totalVolume: 0,
    totalCardioDistance: 0,
    weightUnit: 'lb',
    distanceUnit: 'mi',
    hasDeviated: false,
    hasTemplateId: false,
    updatePlan: false,
    onSetUpdatePlan: vi.fn(),
    onCancelWorkout: vi.fn(),
    onFinishWorkout: vi.fn(),

    // Scoring
    isScoring: false,
    scoreResult: null,
    scoreError: null,
    onClearScoreResult: vi.fn(),

    // History sheet
    historyExerciseId: null,
    historyExerciseName: undefined,
    onCloseHistory: vi.fn(),
    sessions: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not show any modals when all closed', () => {
    render(<WorkoutModals {...defaultProps} />);

    expect(screen.queryByTestId('exercise-picker')).not.toBeInTheDocument();
    expect(screen.queryByTestId('post-workout-flow')).not.toBeInTheDocument();
    expect(screen.queryByTestId('scoring-modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('score-result')).not.toBeInTheDocument();
    expect(screen.queryByTestId('error-toast')).not.toBeInTheDocument();
    expect(screen.queryByTestId('history-sheet')).not.toBeInTheDocument();
  });

  it('should show exercise picker modal when open', () => {
    render(
      <WorkoutModals
        {...defaultProps}
        showExercisePicker={true}
      />
    );

    expect(screen.getByTestId('exercise-picker')).toBeInTheDocument();
  });

  it('should show post-workout flow when open', () => {
    render(
      <WorkoutModals
        {...defaultProps}
        showFinishConfirm={true}
      />
    );

    expect(screen.getByTestId('post-workout-flow')).toBeInTheDocument();
  });

  it('should show scoring modal when scoring', () => {
    render(
      <WorkoutModals
        {...defaultProps}
        isScoring={true}
      />
    );

    expect(screen.getByTestId('scoring-modal')).toBeInTheDocument();
  });

  it('should show score result modal when result present', () => {
    const mockResult = {
      sessionId: 'test',
      score: 100,
      completionPercentage: 100,
      deviations: [],
      timestamp: new Date().toISOString(),
      grade: 'A',
      summary: 'Great workout',
      highlights: [],
      improvements: [],
    };

    render(
      <WorkoutModals
        {...defaultProps}
        scoreResult={mockResult}
      />
    );

    expect(screen.getByTestId('score-result')).toBeInTheDocument();
  });

  it('should show error toast when error present', () => {
    render(
      <WorkoutModals
        {...defaultProps}
        scoreError="Test error"
      />
    );

    expect(screen.getByTestId('error-toast')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should show history sheet when exercise selected', () => {
    render(
      <WorkoutModals
        {...defaultProps}
        historyExerciseId="bench-press"
        historyExerciseName="Bench Press"
      />
    );

    expect(screen.getByTestId('history-sheet')).toBeInTheDocument();
  });
});
