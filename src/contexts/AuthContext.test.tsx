import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AUTH_INITIALIZATION_TIMEOUT_MS, AuthProvider } from './AuthContext';
import { useAuth } from '../hooks/useAuth';
import { FC, ReactNode } from 'react';
import { setCachedAuth } from '../services/authCache';
import { useToastStore } from '../store/toastStore';

// Mock the auth service
vi.mock('../services/supabase/auth', () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  syncUserMetadataToProfile: vi.fn(),
}));

import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  updatePassword as authUpdatePassword,
  getSession,
  onAuthStateChange,
} from '../services/supabase/auth';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

const mockSession = {
  access_token: 'access-token-123',
  refresh_token: 'refresh-token-123',
  user: mockUser,
};

const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useToastStore.getState().clearToasts();
    // Default mock implementations
    vi.mocked(getSession).mockResolvedValue({ session: null, error: null });
    vi.mocked(onAuthStateChange).mockReturnValue({
      unsubscribe: vi.fn(),
    } as never);
  });

  describe('initialization', () => {
    it('should start in loading state', async () => {
      // Make getSession hang to catch initial loading state
      vi.mocked(getSession).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should stop loading when the initial auth check hangs', async () => {
      vi.useFakeTimers();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(getSession).mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAuth(), { wrapper });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(AUTH_INITIALIZATION_TIMEOUT_MS);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);

      consoleSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should initialize with existing session', async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: mockSession as never,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('should preserve cached auth when session refresh fails', async () => {
      setCachedAuth(mockUser as never, mockSession as never);
      vi.mocked(getSession).mockResolvedValue({
        session: null,
        error: new Error('Network unavailable') as never,
      });
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => expect(getSession).toHaveBeenCalled());
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe(mockUser.id);
      const toasts = useToastStore.getState().toasts;
      expect(toasts[toasts.length - 1]?.message).toBe(
        'Unable to refresh your session. Using cached access.'
      );

      consoleSpy.mockRestore();
    });

    it('should temporarily preserve cached auth while initial validation is pending', async () => {
      setCachedAuth(mockUser as never, mockSession as never);
      vi.mocked(getSession).mockImplementation(() => new Promise(() => {}));
      let authCallback:
        | ((event: string, session: typeof mockSession | null) => void)
        | undefined;
      vi.mocked(onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback as typeof authCallback;
        return { unsubscribe: vi.fn() } as never;
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => authCallback?.('INITIAL_SESSION', null));

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe(mockUser.id);
    });

    it('should clear cached auth after an authoritative null initial session', async () => {
      setCachedAuth(mockUser as never, mockSession as never);
      let authCallback:
        | ((event: string, session: typeof mockSession | null) => void)
        | undefined;
      vi.mocked(onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback as typeof authCallback;
        return { unsubscribe: vi.fn() } as never;
      });
      vi.mocked(getSession).mockResolvedValue({ session: null, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(false));

      act(() => authCallback?.('INITIAL_SESSION', null));

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should initialize without session when not authenticated', async () => {
      vi.mocked(getSession).mockResolvedValue({ session: null, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('should subscribe to auth state changes', async () => {
      renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(onAuthStateChange).toHaveBeenCalled();
      });
    });

    it('should unsubscribe on unmount', async () => {
      const unsubscribeMock = vi.fn();
      vi.mocked(onAuthStateChange).mockReturnValue({
        unsubscribe: unsubscribeMock,
      } as never);

      const { unmount } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(onAuthStateChange).toHaveBeenCalled();
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    it('should call auth signUp and update state on success', async () => {
      vi.mocked(authSignUp).mockResolvedValue({
        user: mockUser as never,
        session: mockSession as never,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123');
      });

      expect(authSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        undefined
      );
    });

    it('should call auth signUp with metadata', async () => {
      vi.mocked(authSignUp).mockResolvedValue({
        user: mockUser as never,
        session: mockSession as never,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signUp('test@example.com', 'password123', {
          firstName: 'John',
          lastName: 'Doe',
        });
      });

      expect(authSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        { firstName: 'John', lastName: 'Doe' }
      );
    });

    it('should return error on signUp failure', async () => {
      const mockError = { message: 'Email already registered' };
      vi.mocked(authSignUp).mockResolvedValue({
        user: null,
        session: null,
        error: mockError as never,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.signUp('test@example.com', 'password');
      });

      expect(response).toEqual({ error: mockError });
    });
  });

  describe('signIn', () => {
    it('should call auth signIn and update state on success', async () => {
      vi.mocked(authSignIn).mockResolvedValue({
        user: mockUser as never,
        session: mockSession as never,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(authSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should return error on signIn failure', async () => {
      const mockError = { message: 'Invalid credentials' };
      vi.mocked(authSignIn).mockResolvedValue({
        user: null,
        session: null,
        error: mockError as never,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let response;
      await act(async () => {
        response = await result.current.signIn('test@example.com', 'wrong');
      });

      expect(response).toEqual({ error: mockError });
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should call auth signOut and clear state', async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: mockSession as never,
        error: null,
      });
      vi.mocked(authSignOut).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.signOut();
      });

      expect(authSignOut).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('clears local auth even when Supabase sign out fails', async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: mockSession as never,
        error: null,
      });
      vi.mocked(authSignOut).mockResolvedValue({
        error: new Error('Network unavailable') as never,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('workout-app-auth-cache')).toBeNull();
    });

    it('accepts the intended sign-in event after a local sign-out', async () => {
      let authCallback:
        | ((event: string, session: typeof mockSession | null) => void)
        | undefined;
      vi.mocked(onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback as typeof authCallback;
        return { unsubscribe: vi.fn() } as never;
      });
      vi.mocked(authSignOut).mockResolvedValue({ error: null });
      vi.mocked(authSignIn).mockImplementation(async () => {
        authCallback?.('SIGNED_IN', mockSession);
        return {
          user: mockUser as never,
          session: mockSession as never,
          error: null,
        };
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));
      await act(async () => {
        await result.current.signOut();
        await result.current.signIn('test@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
    });

    it('waits for an in-progress sign-out before starting a new sign-in', async () => {
      let resolveSignOut:
        | ((value: { error: null }) => void)
        | undefined;
      vi.mocked(authSignOut).mockImplementation(
        () => new Promise((resolve) => {
          resolveSignOut = resolve;
        })
      );
      vi.mocked(authSignIn).mockResolvedValue({
        user: mockUser as never,
        session: mockSession as never,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      let signOutPromise!: Promise<{ error: unknown }>;
      let signInPromise!: Promise<{ error: unknown }>;
      act(() => {
        signOutPromise = result.current.signOut();
        signInPromise = result.current.signIn('test@example.com', 'password123');
      });
      expect(authSignIn).not.toHaveBeenCalled();

      resolveSignOut?.({ error: null });
      await act(async () => {
        await Promise.all([signOutPromise, signInPromise]);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(authSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  describe('resetPassword', () => {
    it('should call auth resetPassword', async () => {
      vi.mocked(authResetPassword).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(authResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('updatePassword', () => {
    it('should call auth updatePassword', async () => {
      vi.mocked(authUpdatePassword).mockResolvedValue({ error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updatePassword('newpassword123');
      });

      expect(authUpdatePassword).toHaveBeenCalledWith('newpassword123');
    });
  });

  describe('isAuthenticated', () => {
    it('should be false when no session', async () => {
      vi.mocked(getSession).mockResolvedValue({ session: null, error: null });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should be true when session exists', async () => {
      vi.mocked(getSession).mockResolvedValue({
        session: mockSession as never,
        error: null,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
