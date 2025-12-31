import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeightChart } from './WeightChart';
import { WeightEntry } from '../../types';

// Mock recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

const createWeightEntry = (weight: number, daysAgo: number): WeightEntry => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    weight,
    date: date.toISOString(),
    unit: 'lbs',
  };
};

describe('WeightChart', () => {
  describe('empty state', () => {
    it('should show empty message when no entries', () => {
      render(<WeightChart entries={[]} weightUnit="lbs" />);
      expect(screen.getByText(/No weight data yet/)).toBeInTheDocument();
    });

    it('should prompt user to start tracking', () => {
      render(<WeightChart entries={[]} weightUnit="lbs" />);
      expect(screen.getByText(/Start tracking your weight/)).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    it('should render the chart when entries exist', () => {
      const entries = [
        createWeightEntry(180, 10),
        createWeightEntry(179, 5),
        createWeightEntry(178, 0),
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should display current weight', () => {
      const entries = [
        createWeightEntry(180, 10),
        createWeightEntry(178.5, 0),
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByText('178.5 lbs')).toBeInTheDocument();
    });

    it('should display current label', () => {
      const entries = [createWeightEntry(180, 0)];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByText('Current')).toBeInTheDocument();
    });

    it('should display change label', () => {
      const entries = [
        createWeightEntry(180, 10),
        createWeightEntry(178, 0),
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByText('Change (60d)')).toBeInTheDocument();
    });

    it('should show weight loss in green with negative sign', () => {
      const entries = [
        createWeightEntry(180, 10),
        createWeightEntry(175, 0),
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      const changeElement = screen.getByText('-5.0 lbs');
      expect(changeElement).toBeInTheDocument();
      expect(changeElement).toHaveClass('text-green-500');
    });

    it('should show weight gain in red with positive sign', () => {
      const entries = [
        createWeightEntry(175, 10),
        createWeightEntry(180, 0),
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      const changeElement = screen.getByText('+5.0 lbs');
      expect(changeElement).toBeInTheDocument();
      expect(changeElement).toHaveClass('text-red-500');
    });

    it('should use correct weight unit', () => {
      const entries = [createWeightEntry(80, 0)];

      render(<WeightChart entries={entries} weightUnit="kg" />);
      expect(screen.getByText('80.0 kg')).toBeInTheDocument();
    });
  });

  describe('data filtering', () => {
    it('should only show entries from last 60 days', () => {
      const entries = [
        createWeightEntry(180, 90), // Outside 60 days - should be filtered
        createWeightEntry(175, 30), // Within 60 days
        createWeightEntry(170, 0),  // Within 60 days
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      // Current should be 170 (most recent within 60 days)
      expect(screen.getByText('170.0 lbs')).toBeInTheDocument();
      // Change should be from 175 to 170 = -5, not from 180
      expect(screen.getByText('-5.0 lbs')).toBeInTheDocument();
    });

    it('should handle all entries outside 60 days', () => {
      const entries = [
        createWeightEntry(180, 90),
        createWeightEntry(175, 70),
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      // Should show empty state
      expect(screen.getByText(/No weight data yet/)).toBeInTheDocument();
    });
  });

  describe('chart components', () => {
    it('should render ResponsiveContainer', () => {
      const entries = [createWeightEntry(180, 0)];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should render Line component', () => {
      const entries = [createWeightEntry(180, 0)];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByTestId('line')).toBeInTheDocument();
    });

    it('should render axes', () => {
      const entries = [createWeightEntry(180, 0)];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
      expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    });

    it('should render ReferenceLine', () => {
      const entries = [createWeightEntry(180, 0)];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByTestId('reference-line')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('should sort entries by date ascending', () => {
      const entries = [
        createWeightEntry(170, 0),   // Most recent
        createWeightEntry(180, 10),  // Oldest
        createWeightEntry(175, 5),   // Middle
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      // Current should be the most recent (170)
      expect(screen.getByText('170.0 lbs')).toBeInTheDocument();
      // Change should be 170 - 180 = -10
      expect(screen.getByText('-10.0 lbs')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle single entry', () => {
      const entries = [createWeightEntry(180, 0)];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      expect(screen.getByText('180.0 lbs')).toBeInTheDocument();
      // Change should be 0 (180 - 180)
      expect(screen.getByText('0.0 lbs')).toBeInTheDocument();
    });

    it('should handle no change in weight', () => {
      const entries = [
        createWeightEntry(180, 10),
        createWeightEntry(180, 0),
      ];

      render(<WeightChart entries={entries} weightUnit="lbs" />);
      const changeElement = screen.getByText('0.0 lbs');
      expect(changeElement).toBeInTheDocument();
      expect(changeElement).toHaveClass('text-foreground');
    });
  });
});
