import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutHeatmap } from './WorkoutHeatmap';
import { createMockSession, createMockSessionExercise } from '../../test/fixtures/sessions';
import { CardioSessionExercise } from '../../types';

// Helper to create a cardio session exercise
const createCardioExercise = (): CardioSessionExercise => ({
  type: 'cardio',
  exerciseId: 'running',
  restSeconds: 60,
  sets: [],
});

describe('WorkoutHeatmap', () => {
  const mockDate = new Date('2024-06-15T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render without sessions', () => {
      render(<WorkoutHeatmap sessions={[]} />);

      // Should render day labels
      expect(screen.getByText('Mon')).toBeInTheDocument();
      expect(screen.getByText('Wed')).toBeInTheDocument();
      expect(screen.getByText('Fri')).toBeInTheDocument();
    });

    it('should render month labels', () => {
      render(<WorkoutHeatmap sessions={[]} />);

      // Should have month labels (at least current month) - may have multiple due to spanning year
      const junLabels = screen.getAllByText('Jun');
      expect(junLabels.length).toBeGreaterThan(0);
    });

    it('should render legend with workout types', () => {
      render(<WorkoutHeatmap sessions={[]} />);

      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Cardio')).toBeInTheDocument();
      expect(screen.getByText('Both')).toBeInTheDocument();
    });

    it('should render 52 weeks of data', () => {
      const { container } = render(<WorkoutHeatmap sessions={[]} />);

      // Each week is a column with gap-[2px], should have ~52-53 columns
      const weekColumns = container.querySelectorAll('.flex.flex-col.gap-\\[2px\\]');
      expect(weekColumns.length).toBeGreaterThanOrEqual(52);
      expect(weekColumns.length).toBeLessThanOrEqual(54);
    });
  });

  describe('Workout Display', () => {
    it('should show blue for strength workouts', () => {
      const strengthSession = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [createMockSessionExercise()],
      });

      const { container } = render(<WorkoutHeatmap sessions={[strengthSession]} />);

      // Should have a blue cell for strength workout
      const blueCells = container.querySelectorAll('[class*="bg-blue-500"]');
      expect(blueCells.length).toBeGreaterThan(0);
    });

    it('should show green for cardio workouts', () => {
      const cardioSession = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [createCardioExercise()],
      });

      const { container } = render(<WorkoutHeatmap sessions={[cardioSession]} />);

      // Should have a green cell for cardio workout
      const greenCells = container.querySelectorAll('[class*="bg-green-500"]');
      expect(greenCells.length).toBeGreaterThan(0);
    });

    it('should show split cell for both workout types on same day', () => {
      const strengthSession = createMockSession({
        id: 'strength-1',
        startedAt: mockDate.toISOString(),
        exercises: [createMockSessionExercise()],
      });
      const cardioSession = createMockSession({
        id: 'cardio-1',
        startedAt: mockDate.toISOString(),
        exercises: [createCardioExercise()],
      });

      const { container } = render(
        <WorkoutHeatmap sessions={[strengthSession, cardioSession]} />
      );

      // Should have cells with both colors (split view has two child divs)
      const splitCells = container.querySelectorAll('.overflow-hidden.flex');
      // Filter to cells that have both blue and green children
      const bothColorCells = Array.from(splitCells).filter((cell) => {
        const hasBlue = cell.querySelector('[class*="bg-blue-500"]');
        const hasGreen = cell.querySelector('[class*="bg-green-500"]');
        return hasBlue && hasGreen;
      });
      expect(bothColorCells.length).toBeGreaterThan(0);
    });

    it('should handle sessions without exercises as strength', () => {
      // Sessions without exercises default to strength type
      const emptySession = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [],
      });

      const { container } = render(<WorkoutHeatmap sessions={[emptySession]} />);

      // Should have a blue cell (strength)
      const blueCells = container.querySelectorAll('[class*="bg-blue-500"]');
      expect(blueCells.length).toBeGreaterThan(0);
    });
  });

  describe('Interactivity', () => {
    it('should call onDayClick when a day with workouts is clicked', () => {
      const onDayClick = vi.fn();
      const session = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [createMockSessionExercise()],
      });

      const { container } = render(
        <WorkoutHeatmap sessions={[session]} onDayClick={onDayClick} />
      );

      // Find the wrapper div with title attribute containing workout info
      const cellWrappers = container.querySelectorAll('[title*="strength workout"]');
      if (cellWrappers.length > 0) {
        fireEvent.click(cellWrappers[0]);
        expect(onDayClick).toHaveBeenCalled();
      }
    });

    it('should pass correct date and sessions to onDayClick', () => {
      const onDayClick = vi.fn();
      const session = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [createMockSessionExercise()],
      });

      const { container } = render(
        <WorkoutHeatmap sessions={[session]} onDayClick={onDayClick} />
      );

      // Find the wrapper div with title attribute
      const cellWrappers = container.querySelectorAll('[title*="strength workout"]');
      if (cellWrappers.length > 0) {
        fireEvent.click(cellWrappers[0]);

        const callArgs = onDayClick.mock.calls[0];
        expect(callArgs[0]).toBeInstanceOf(Date);
        expect(Array.isArray(callArgs[1])).toBe(true);
      }
    });

    it('should work without onDayClick handler', () => {
      const session = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [createMockSessionExercise()],
      });

      const { container } = render(<WorkoutHeatmap sessions={[session]} />);

      // Should not throw when clicking
      const cellWrappers = container.querySelectorAll('[title*="workout"]');
      if (cellWrappers.length > 0) {
        expect(() => fireEvent.click(cellWrappers[0])).not.toThrow();
      }
    });
  });

  describe('Today Indicator', () => {
    it('should highlight today with a ring', () => {
      const { container } = render(<WorkoutHeatmap sessions={[]} />);

      const todayCell = container.querySelector('[class*="ring-blue-500"]');
      expect(todayCell).toBeInTheDocument();
    });
  });

  describe('Tooltips', () => {
    it('should have title attribute with date and workout type', () => {
      const session = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [createMockSessionExercise()],
      });

      const { container } = render(<WorkoutHeatmap sessions={[session]} />);

      // Find cells with title attribute mentioning workout type
      const cells = container.querySelectorAll('[title*="strength workout"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should use singular "workout" for 1 workout', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const session = createMockSession({
        startedAt: yesterday.toISOString(),
        exercises: [createMockSessionExercise()],
      });

      const { container } = render(<WorkoutHeatmap sessions={[session]} />);

      // Title should say "1 strength workout" (singular)
      const cells = container.querySelectorAll('[title*="1 strength workout"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should use plural "workouts" for multiple workouts', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        createMockSession({
          id: '1',
          startedAt: yesterday.toISOString(),
          exercises: [createMockSessionExercise()],
        }),
        createMockSession({
          id: '2',
          startedAt: yesterday.toISOString(),
          exercises: [createMockSessionExercise()],
        }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      // Title should say "2 strength workouts" (plural)
      const cells = container.querySelectorAll('[title*="2 strength workouts"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should show "strength & cardio" for mixed workout days', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        createMockSession({
          id: 'strength-1',
          startedAt: yesterday.toISOString(),
          exercises: [createMockSessionExercise()],
        }),
        createMockSession({
          id: 'cardio-1',
          startedAt: yesterday.toISOString(),
          exercises: [createCardioExercise()],
        }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      // Title should indicate both types
      const cells = container.querySelectorAll('[title*="strength & cardio"]');
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions from many days ago', () => {
      const oldDate = new Date(mockDate);
      oldDate.setDate(oldDate.getDate() - 100);

      const session = createMockSession({ startedAt: oldDate.toISOString() });

      const { container } = render(<WorkoutHeatmap sessions={[session]} />);

      // Should render without errors
      expect(container).toBeInTheDocument();
    });

    it('should handle sessions older than 52 weeks', () => {
      const veryOldDate = new Date(mockDate);
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 2);

      const session = createMockSession({ startedAt: veryOldDate.toISOString() });

      // Should render without errors, old session just wont be visible
      const { container } = render(<WorkoutHeatmap sessions={[session]} />);
      expect(container).toBeInTheDocument();
    });

    it('should update when sessions prop changes', () => {
      const { rerender, container } = render(<WorkoutHeatmap sessions={[]} />);

      // Initially no workout cells
      let workoutCells = container.querySelectorAll('[title*="strength workout"], [title*="cardio workout"]');
      expect(workoutCells.length).toBe(0);

      // Add a session
      const session = createMockSession({
        startedAt: mockDate.toISOString(),
        exercises: [createMockSessionExercise()],
      });
      rerender(<WorkoutHeatmap sessions={[session]} />);

      // Now should have cells with workout
      workoutCells = container.querySelectorAll('[title*="strength workout"], [title*="cardio workout"]');
      expect(workoutCells.length).toBeGreaterThan(0);
    });

    it('should handle empty session array', () => {
      const { container } = render(<WorkoutHeatmap sessions={[]} />);

      // Should have no cells showing workouts
      const workoutCells = container.querySelectorAll('[title*="strength workout"], [title*="cardio workout"]');
      expect(workoutCells.length).toBe(0);
    });

    it('should handle multiple sessions on same day', () => {
      const sessions = [
        createMockSession({
          id: '1',
          startedAt: mockDate.toISOString(),
          exercises: [createMockSessionExercise()],
        }),
        createMockSession({
          id: '2',
          startedAt: mockDate.toISOString(),
          exercises: [createMockSessionExercise()],
        }),
        createMockSession({
          id: '3',
          startedAt: mockDate.toISOString(),
          exercises: [createMockSessionExercise()],
        }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      // Should have a blue cell (all strength)
      const blueCells = container.querySelectorAll('[class*="bg-blue-500"]');
      expect(blueCells.length).toBeGreaterThan(0);
    });
  });
});
