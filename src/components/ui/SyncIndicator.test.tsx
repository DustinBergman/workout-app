import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SyncIndicator } from './SyncIndicator';

// Mock the hooks
vi.mock('../../hooks/useSync', () => ({
  useSync: vi.fn(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useSync } from '../../hooks/useSync';
import { useAuth } from '../../hooks/useAuth';

describe('SyncIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'synced',
    } as never);

    const { container } = render(<SyncIndicator />);

    expect(container.firstChild).toBeNull();
  });

  it('should render syncing indicator when syncing', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'syncing',
    } as never);

    render(<SyncIndicator />);

    expect(screen.getByText('Syncing...')).toBeInTheDocument();
  });

  it('should render offline indicator when offline', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'offline',
    } as never);

    render(<SyncIndicator />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should render error indicator when there is a sync error', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'error',
    } as never);

    render(<SyncIndicator />);

    expect(screen.getByText('Sync error')).toBeInTheDocument();
  });

  it('should render cloud icon when synced', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'synced',
    } as never);

    const { container } = render(<SyncIndicator />);

    // Should render SVG (cloud icon) but no text for synced state
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should not render anything for idle status', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'idle',
    } as never);

    const { container } = render(<SyncIndicator />);

    expect(container.firstChild).toBeNull();
  });

  it('should have correct styling for syncing state', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'syncing',
    } as never);

    const { container } = render(<SyncIndicator />);

    // Should have animated pulse dot
    const pulseElement = container.querySelector('.animate-pulse');
    expect(pulseElement).toBeInTheDocument();
  });

  it('should have correct styling for error state', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'error',
    } as never);

    const { container } = render(<SyncIndicator />);

    // Should have destructive/error color class
    const errorElement = container.querySelector('.text-destructive');
    expect(errorElement).toBeInTheDocument();
  });

  it('should have correct styling for offline state', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
    } as never);
    vi.mocked(useSync).mockReturnValue({
      status: 'offline',
    } as never);

    const { container } = render(<SyncIndicator />);

    // Should have orange color class
    const offlineElement = container.querySelector('.text-orange-500');
    expect(offlineElement).toBeInTheDocument();
  });
});
