import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './Select';

// Mock scrollIntoView for jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('Select', () => {
  const renderSelect = (props = {}) => {
    return render(
      <Select {...props}>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select option" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </Select>
    );
  };

  it('renders trigger with placeholder', () => {
    renderSelect();
    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', async () => {
    renderSelect();
    const trigger = screen.getByTestId('select-trigger');
    fireEvent.click(trigger);
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
  });

  it('displays options when opened', async () => {
    renderSelect();
    fireEvent.click(screen.getByTestId('select-trigger'));
    expect(await screen.findByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('selects an option when clicked', async () => {
    const handleChange = vi.fn();
    renderSelect({ onValueChange: handleChange });
    fireEvent.click(screen.getByTestId('select-trigger'));
    const option = await screen.findByText('Option 2');
    fireEvent.click(option);
    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  it('displays selected value', async () => {
    renderSelect({ defaultValue: 'option1' });
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    renderSelect({ disabled: true });
    expect(screen.getByTestId('select-trigger')).toBeDisabled();
  });

  it('applies custom className to trigger', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">Item</SelectItem>
        </SelectContent>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveClass('custom-trigger');
  });
});
