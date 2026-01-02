import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekBadge } from './WeekBadge';
import { ProgressiveOverloadWeek } from '../../types';

describe('WeekBadge', () => {
  describe('Compact Mode (default)', () => {
    it('renders week number correctly', () => {
      render(<WeekBadge week={0} workoutGoal="build" />);
      expect(screen.getByText('Week 1')).toBeInTheDocument();
    });

    it('renders week name correctly', () => {
      render(<WeekBadge week={0} workoutGoal="build" />);
      expect(screen.getByText('Baseline')).toBeInTheDocument();
    });

    it('displays correct week number for each week', () => {
      const weeks: ProgressiveOverloadWeek[] = [0, 1, 2, 3, 4];
      weeks.forEach((week) => {
        const { unmount } = render(<WeekBadge week={week} workoutGoal="build" />);
        expect(screen.getByText(`Week ${week + 1}`)).toBeInTheDocument();
        unmount();
      });
    });

    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(<WeekBadge week={0} workoutGoal="build" onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('applies custom className', () => {
      render(<WeekBadge week={0} workoutGoal="build" className="custom-class" data-testid="badge" />);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });

  describe('Detailed Mode (showDetails=true)', () => {
    it('renders detailed view with week info', () => {
      render(<WeekBadge week={0} workoutGoal="build" showDetails />);
      expect(screen.getByText('Week 1')).toBeInTheDocument();
      expect(screen.getByText('Baseline')).toBeInTheDocument();
      expect(screen.getByText('Establish your current working weights')).toBeInTheDocument();
    });

    it('shows weight adjustment', () => {
      render(<WeekBadge week={1} workoutGoal="build" showDetails />);
      expect(screen.getByText('+2-5%')).toBeInTheDocument();
    });

    it('shows target rep range', () => {
      render(<WeekBadge week={0} workoutGoal="build" showDetails />);
      expect(screen.getByText('Target: 8-12 reps')).toBeInTheDocument();
    });

    it('shows "Tap to change week" when onClick is provided', () => {
      const handleClick = vi.fn();
      render(<WeekBadge week={0} workoutGoal="build" showDetails onClick={handleClick} />);
      expect(screen.getByText('Tap to change week')).toBeInTheDocument();
    });

    it('does not show "Tap to change week" when onClick is not provided', () => {
      render(<WeekBadge week={0} workoutGoal="build" showDetails />);
      expect(screen.queryByText('Tap to change week')).not.toBeInTheDocument();
    });

    it('calls onClick when clicked in detailed mode', () => {
      const handleClick = vi.fn();
      render(<WeekBadge week={0} workoutGoal="build" showDetails onClick={handleClick} />);

      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Week Info Display', () => {
    it('displays correct info for Week 1 (Baseline)', () => {
      render(<WeekBadge week={0} workoutGoal="build" showDetails />);
      expect(screen.getByText('Baseline')).toBeInTheDocument();
      expect(screen.getByText('Current weights')).toBeInTheDocument();
    });

    it('displays correct info for Week 2 (Light Overload)', () => {
      render(<WeekBadge week={1} workoutGoal="build" showDetails />);
      expect(screen.getByText('Light Overload')).toBeInTheDocument();
      expect(screen.getByText('+2-5%')).toBeInTheDocument();
    });

    it('displays correct info for Week 3 (Volume Focus)', () => {
      render(<WeekBadge week={2} workoutGoal="build" showDetails />);
      expect(screen.getByText('Volume Focus')).toBeInTheDocument();
    });

    it('displays correct info for Week 4 (Strength Push)', () => {
      render(<WeekBadge week={3} workoutGoal="build" showDetails />);
      expect(screen.getByText('Strength Push')).toBeInTheDocument();
      expect(screen.getByText('+5-10%')).toBeInTheDocument();
    });

    it('displays correct info for Week 5 (Deload)', () => {
      render(<WeekBadge week={4} workoutGoal="build" showDetails />);
      expect(screen.getByText('Deload')).toBeInTheDocument();
      expect(screen.getByText('-20-30%')).toBeInTheDocument();
    });
  });

  describe('Color Classes', () => {
    it('applies slate colors for week 0', () => {
      render(<WeekBadge week={0} workoutGoal="build" data-testid="badge" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-slate-100');
      expect(button).toHaveClass('border-slate-300');
    });

    it('applies green colors for week 1', () => {
      render(<WeekBadge week={1} workoutGoal="build" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-green-100');
      expect(button).toHaveClass('border-green-300');
    });

    it('applies blue colors for week 2', () => {
      render(<WeekBadge week={2} workoutGoal="build" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-100');
      expect(button).toHaveClass('border-blue-300');
    });

    it('applies orange colors for week 3', () => {
      render(<WeekBadge week={3} workoutGoal="build" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-orange-100');
      expect(button).toHaveClass('border-orange-300');
    });

    it('applies purple colors for week 4', () => {
      render(<WeekBadge week={4} workoutGoal="build" />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-purple-100');
      expect(button).toHaveClass('border-purple-300');
    });
  });

  describe('Goal-specific Week Info', () => {
    it('displays lose weight week info', () => {
      render(<WeekBadge week={0} workoutGoal="lose" showDetails />);
      expect(screen.getByText('Baseline Strength')).toBeInTheDocument();
    });

    it('displays maintain week info', () => {
      render(<WeekBadge week={0} workoutGoal="maintain" showDetails />);
      expect(screen.getByText('Standard')).toBeInTheDocument();
    });
  });
});
