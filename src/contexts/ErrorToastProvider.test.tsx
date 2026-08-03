import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useToastStore } from '../store/toastStore';
import { ErrorToastProvider } from './ErrorToastProvider';

const ThrowingChild = () => {
  throw new Error('Render failure');
};

describe('ErrorToastProvider', () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  it('enqueues browser errors', () => {
    render(
      <ErrorToastProvider>
        <div>App</div>
      </ErrorToastProvider>
    );

    act(() => {
      window.dispatchEvent(
        new ErrorEvent('error', {
          error: new Error('Global failure'),
          message: 'Global failure',
        })
      );
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Global failure');
  });

  it('enqueues unhandled promise rejections', () => {
    render(
      <ErrorToastProvider>
        <div>App</div>
      </ErrorToastProvider>
    );
    const event = new Event('unhandledrejection');
    Object.defineProperty(event, 'reason', {
      value: new Error('Rejected operation'),
    });

    act(() => {
      window.dispatchEvent(event);
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Rejected operation');
  });

  it('catches render errors and keeps the toast container mounted', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorToastProvider>
        <ThrowingChild />
      </ErrorToastProvider>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Render failure');
    consoleSpy.mockRestore();
  });
});
