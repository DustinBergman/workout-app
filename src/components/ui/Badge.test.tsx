import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children correctly', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies default variant styling', () => {
    render(<Badge data-testid="badge">Default</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-interactive');
  });

  it('applies secondary variant', () => {
    render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-bg-subtle');
  });

  it('applies destructive variant', () => {
    render(<Badge variant="destructive" data-testid="badge">Error</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('bg-error');
  });

  it('applies outline variant', () => {
    render(<Badge variant="outline" data-testid="badge">Outline</Badge>);
    expect(screen.getByTestId('badge')).toHaveClass('text-fg-1');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('applies default styling', () => {
    render(<Badge data-testid="badge">Styled</Badge>);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveClass('rounded-md');
    expect(badge).toHaveClass('text-xs');
    expect(badge).toHaveClass('font-semibold');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Badge ref={ref}>Ref Badge</Badge>);
    expect(ref).toHaveBeenCalled();
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
  });
});
