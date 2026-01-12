import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EditCustomExerciseModal } from './EditCustomExerciseModal';

describe('EditCustomExerciseModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    exerciseId: 'test-exercise-id',
    currentName: 'Test Exercise',
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with current exercise name', () => {
    render(<EditCustomExerciseModal {...defaultProps} />);

    expect(screen.getByText('Edit Exercise Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Exercise')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<EditCustomExerciseModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Edit Exercise Name')).not.toBeInTheDocument();
  });

  it('calls onSave with new name when saving', () => {
    render(<EditCustomExerciseModal {...defaultProps} />);

    const input = screen.getByDisplayValue('Test Exercise');
    fireEvent.change(input, { target: { value: 'New Exercise Name' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledWith('test-exercise-id', 'New Exercise Name');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when cancel is clicked', () => {
    render(<EditCustomExerciseModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
    expect(defaultProps.onSave).not.toHaveBeenCalled();
  });

  it('does not call onSave if name is unchanged', () => {
    render(<EditCustomExerciseModal {...defaultProps} />);

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(defaultProps.onSave).not.toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('trims whitespace from name before saving', () => {
    render(<EditCustomExerciseModal {...defaultProps} />);

    const input = screen.getByDisplayValue('Test Exercise');
    fireEvent.change(input, { target: { value: '  Trimmed Name  ' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledWith('test-exercise-id', 'Trimmed Name');
  });

  it('disables save button when name is empty', () => {
    render(<EditCustomExerciseModal {...defaultProps} />);

    const input = screen.getByDisplayValue('Test Exercise');
    fireEvent.change(input, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('disables save button when name is only whitespace', () => {
    render(<EditCustomExerciseModal {...defaultProps} />);

    const input = screen.getByDisplayValue('Test Exercise');
    fireEvent.change(input, { target: { value: '   ' } });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();
  });

  it('updates input value when currentName prop changes', () => {
    const { rerender } = render(<EditCustomExerciseModal {...defaultProps} />);

    expect(screen.getByDisplayValue('Test Exercise')).toBeInTheDocument();

    rerender(<EditCustomExerciseModal {...defaultProps} currentName="Updated Name" />);

    expect(screen.getByDisplayValue('Updated Name')).toBeInTheDocument();
  });
});
