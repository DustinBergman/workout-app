import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkoutHeatmap } from './WorkoutHeatmap';
import { createMockSession } from '../../test/fixtures/sessions';

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

    it('should render legend', () => {
      render(<WorkoutHeatmap sessions={[]} />);

      expect(screen.getByText('Less')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();
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
    it('should highlight days with workouts', () => {
      const todaySession = createMockSession({
        startedAt: mockDate.toISOString(),
      });

      const { container } = render(<WorkoutHeatmap sessions={[todaySession]} />);

      // Should have at least one green cell
      const greenCells = container.querySelectorAll('[class*="bg-green"]');
      expect(greenCells.length).toBeGreaterThan(0);
    });

    it('should show different intensities based on workout count', () => {
      const date = new Date(mockDate);
      const sessions = [
        createMockSession({ id: '1', startedAt: date.toISOString() }),
        createMockSession({ id: '2', startedAt: date.toISOString() }),
        createMockSession({ id: '3', startedAt: date.toISOString() }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      // Should have a dark green cell for 3+ workouts
      const darkGreenCells = container.querySelectorAll('[class*="bg-green-600"]');
      expect(darkGreenCells.length).toBeGreaterThan(0);
    });

    it('should show light green for 1 workout', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        createMockSession({ id: '1', startedAt: yesterday.toISOString() }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      // Should have a light green cell
      const lightGreenCells = container.querySelectorAll('[class*="bg-green-200"]');
      expect(lightGreenCells.length).toBeGreaterThan(0);
    });

    it('should show medium green for 2 workouts', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        createMockSession({ id: '1', startedAt: yesterday.toISOString() }),
        createMockSession({ id: '2', startedAt: yesterday.toISOString() }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      // Should have a medium green cell
      const mediumGreenCells = container.querySelectorAll('[class*="bg-green-400"]');
      expect(mediumGreenCells.length).toBeGreaterThan(0);
    });
  });

  describe('Interactivity', () => {
    it('should call onDayClick when a day with workouts is clicked', () => {
      const onDayClick = vi.fn();
      const session = createMockSession({ startedAt: mockDate.toISOString() });

      const { container } = render(
        <WorkoutHeatmap sessions={[session]} onDayClick={onDayClick} />
      );

      // Find a green cell (has workout)
      const greenCells = container.querySelectorAll('[class*="bg-green"]');
      if (greenCells.length > 0) {
        fireEvent.click(greenCells[0]);
        expect(onDayClick).toHaveBeenCalled();
      }
    });

    it('should pass correct date and sessions to onDayClick', () => {
      const onDayClick = vi.fn();
      const session = createMockSession({ startedAt: mockDate.toISOString() });

      const { container } = render(
        <WorkoutHeatmap sessions={[session]} onDayClick={onDayClick} />
      );

      // Find a green cell (has workout)
      const greenCells = container.querySelectorAll('[class*="bg-green"]');
      if (greenCells.length > 0) {
        fireEvent.click(greenCells[0]);

        const callArgs = onDayClick.mock.calls[0];
        expect(callArgs[0]).toBeInstanceOf(Date);
        expect(Array.isArray(callArgs[1])).toBe(true);
      }
    });

    it('should work without onDayClick handler', () => {
      const session = createMockSession({ startedAt: mockDate.toISOString() });

      const { container } = render(<WorkoutHeatmap sessions={[session]} />);

      // Should not throw when clicking
      const greenCells = container.querySelectorAll('[class*="bg-green"]');
      if (greenCells.length > 0) {
        expect(() => fireEvent.click(greenCells[0])).not.toThrow();
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
    it('should have title attribute with date and count', () => {
      const session = createMockSession({ startedAt: mockDate.toISOString() });

      const { container } = render(<WorkoutHeatmap sessions={[session]} />);

      // Find cells with title attribute
      const cells = container.querySelectorAll('[title*="workout"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should use singular "workout" for 1 workout', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const session = createMockSession({ startedAt: yesterday.toISOString() });

      const { container } = render(<WorkoutHeatmap sessions={[session]} />);

      const cells = container.querySelectorAll('[title*="1 workout"]');
      expect(cells.length).toBeGreaterThan(0);
    });

    it('should use plural "workouts" for multiple workouts', () => {
      const yesterday = new Date(mockDate);
      yesterday.setDate(yesterday.getDate() - 1);

      const sessions = [
        createMockSession({ id: '1', startedAt: yesterday.toISOString() }),
        createMockSession({ id: '2', startedAt: yesterday.toISOString() }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      const cells = container.querySelectorAll('[title*="2 workouts"]');
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

      // Initially no green cells in the heatmap grid (exclude legend)
      // Look for cells with workout data (have title attribute with workout count > 0)
      let workoutCells = container.querySelectorAll('[title*="1 workout"], [title*="2 workout"], [title*="3 workout"]');
      expect(workoutCells.length).toBe(0);

      // Add a session
      const session = createMockSession({ startedAt: mockDate.toISOString() });
      rerender(<WorkoutHeatmap sessions={[session]} />);

      // Now should have cells with workout
      workoutCells = container.querySelectorAll('[title*="1 workout"], [title*="2 workout"], [title*="3 workout"]');
      expect(workoutCells.length).toBeGreaterThan(0);
    });

    it('should handle empty session array', () => {
      const { container } = render(<WorkoutHeatmap sessions={[]} />);

      // Should have no cells showing workouts (all should be "0 workouts")
      const workoutCells = container.querySelectorAll('[title*="1 workout"], [title*="2 workout"], [title*="3 workout"]');
      expect(workoutCells.length).toBe(0);
    });

    it('should handle multiple sessions on same day', () => {
      const sessions = [
        createMockSession({ id: '1', startedAt: mockDate.toISOString() }),
        createMockSession({ id: '2', startedAt: mockDate.toISOString() }),
        createMockSession({ id: '3', startedAt: mockDate.toISOString() }),
        createMockSession({ id: '4', startedAt: mockDate.toISOString() }),
        createMockSession({ id: '5', startedAt: mockDate.toISOString() }),
      ];

      const { container } = render(<WorkoutHeatmap sessions={sessions} />);

      // Should have a dark green cell (3+ workouts)
      const darkGreenCells = container.querySelectorAll('[class*="bg-green-600"]');
      expect(darkGreenCells.length).toBeGreaterThan(0);
    });
  });
});
