import { FC, ReactNode, useContext } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  INITIAL_SYNC_LOADING_TIMEOUT_MS,
  SyncContext,
  SyncProvider,
} from './SyncContext';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../hooks/useAuth';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  deduplicateTemplateExercises,
  getActiveSession,
  getCustomExercises,
  getProfile,
  getSessions,
  getTemplates,
  getWeightEntries,
} from '../services/supabase';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../hooks/useOnlineStatus', () => ({
  useOnlineStatus: vi.fn(),
}));

vi.mock('../services/supabase', () => ({
  getProfile: vi.fn(),
  getTemplates: vi.fn(),
  getSessions: vi.fn(),
  getActiveSession: vi.fn(),
  getCustomExercises: vi.fn(),
  getWeightEntries: vi.fn(),
  profileToPreferences: vi.fn(),
  deduplicateTemplateExercises: vi.fn(),
}));

const { unsubscribe, seedPendingSyncState } = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  seedPendingSyncState: vi.fn(),
}));
vi.mock('../store/syncSubscriptions', () => ({
  flushPendingSync: vi.fn().mockResolvedValue(undefined),
  getPendingSyncState: vi.fn(() => ({
    templates: {},
    sessions: {},
    customExercises: {},
    weights: {},
  })),
  setupSyncSubscriptions: vi.fn(() => unsubscribe),
  seedPendingSyncState,
  setSyncEnabled: vi.fn(),
  setSyncingFromCloud: vi.fn(),
}));

const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <SyncProvider>{children}</SyncProvider>
);

const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) throw new Error('Missing SyncContext');
  return context;
};

const template = {
  id: 'template-a',
  name: 'User A template',
  templateType: 'strength' as const,
  exercises: [],
  inRotation: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('SyncProvider identity and offline behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAppStore.setState({
      templates: [],
      sessions: [],
      activeSession: null,
      customExercises: [],
      weightEntries: [],
    });
    vi.mocked(useOnlineStatus).mockReturnValue(false);
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-a' },
      isAuthenticated: true,
      isLoading: false,
    } as never);
  });

  it('finishes initial loading with local state when authenticated offline', async () => {
    localStorage.setItem('workout-app-current-state-identity-v2', 'user-a');
    useAppStore.setState({ templates: [template] });

    const { result, unmount } = renderHook(useSyncContext, { wrapper });

    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.status).toBe('offline');
    expect(useAppStore.getState().templates).toEqual([template]);
    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('releases initial loading when cloud data loading hangs', async () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('workout-app-current-state-identity-v2', 'user-a');
    vi.mocked(useOnlineStatus).mockReturnValue(true);
    vi.mocked(getProfile).mockImplementation(() => new Promise(() => {}));
    vi.mocked(getTemplates).mockResolvedValue({ templates: [], error: null });
    vi.mocked(getSessions).mockResolvedValue({ sessions: [], error: null });
    vi.mocked(getActiveSession).mockResolvedValue({ session: null, error: null });
    vi.mocked(getCustomExercises).mockResolvedValue({ exercises: [], error: null });
    vi.mocked(getWeightEntries).mockResolvedValue({ entries: [], error: null });
    vi.mocked(deduplicateTemplateExercises).mockResolvedValue({ fixed: 0, error: null });

    const { result, unmount } = renderHook(useSyncContext, { wrapper });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(INITIAL_SYNC_LOADING_TIMEOUT_MS);
    });

    expect(result.current.isInitialLoading).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15000);
    });
    unmount();
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  it('saves and replaces account-bound state when the user changes', async () => {
    localStorage.setItem('workout-app-current-state-identity-v2', 'user-a');
    useAppStore.setState({ templates: [template] });

    const hook = renderHook(useSyncContext, { wrapper });
    await waitFor(() => expect(hook.result.current.isInitialLoading).toBe(false));

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-b' },
      isAuthenticated: true,
      isLoading: false,
    } as never);
    act(() => hook.rerender());

    await waitFor(() => expect(useAppStore.getState().templates).toEqual([]));
    expect(localStorage.getItem('workout-app-account-state-v2:user-a')).toContain('template-a');

    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user-a' },
      isAuthenticated: true,
      isLoading: false,
    } as never);
    act(() => hook.rerender());

    await waitFor(() => expect(useAppStore.getState().templates).toEqual([template]));
  });

  it('keeps matching legacy local data with the signed-in account', async () => {
    useAppStore.setState({
      templates: [template],
      preferences: {
        ...useAppStore.getState().preferences,
        firstName: 'Dustin',
        lastName: 'Bergman',
      },
    });
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: 'user-a',
        user_metadata: {
          firstName: 'Dustin',
          lastName: 'Bergman',
        },
      },
      isAuthenticated: true,
      isLoading: false,
    } as never);

    renderHook(useSyncContext, { wrapper });

    await waitFor(() => {
      expect(seedPendingSyncState).toHaveBeenCalledWith(
        'user-a',
        expect.objectContaining({ templates: [template] })
      );
    });
    expect(useAppStore.getState().templates).toEqual([template]);
  });
});
