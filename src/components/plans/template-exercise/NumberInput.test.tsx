import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberInput } from './NumberInput';

describe('NumberInput', () => {
  it('clamps values to the configured minimum', () => {
    const onChange = vi.fn();
    render(
      <NumberInput
        label="Sets"
        value={3}
        min={1}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Sets'), {
      target: { value: '-2' },
    });

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('allows clearing the input', () => {
    const onChange = vi.fn();
    render(
      <NumberInput
        label="Reps"
        value={10}
        min={1}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText('Reps'), {
      target: { value: '' },
    });

    expect(onChange).toHaveBeenCalledWith(undefined);
  });
});
