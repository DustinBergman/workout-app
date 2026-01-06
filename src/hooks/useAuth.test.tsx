import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';
import { FC, ReactNode } from 'react';

describe('useAuth', () => {
  it('should throw error when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });

  it('should return context value when used within AuthProvider', () => {
    const mockContextValue: AuthContextType = {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    };

    const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toEqual(mockContextValue);
  });

  it('should return authenticated state when user is logged in', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      aud: 'authenticated',
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockSession = {
      access_token: 'token',
      refresh_token: 'refresh',
      user: mockUser,
    };

    const mockContextValue: AuthContextType = {
      user: mockUser as never,
      session: mockSession as never,
      isLoading: false,
      isAuthenticated: true,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    };

    const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.session).toEqual(mockSession);
  });

  it('should return loading state during auth check', () => {
    const mockContextValue: AuthContextType = {
      user: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      updatePassword: vi.fn(),
    };

    const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('should provide auth functions', () => {
    const mockSignUp = vi.fn();
    const mockSignIn = vi.fn();
    const mockSignOut = vi.fn();
    const mockResetPassword = vi.fn();
    const mockUpdatePassword = vi.fn();

    const mockContextValue: AuthContextType = {
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      signUp: mockSignUp,
      signIn: mockSignIn,
      signOut: mockSignOut,
      resetPassword: mockResetPassword,
      updatePassword: mockUpdatePassword,
    };

    const wrapper: FC<{ children: ReactNode }> = ({ children }) => (
      <AuthContext.Provider value={mockContextValue}>
        {children}
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.signUp).toBe(mockSignUp);
    expect(result.current.signIn).toBe(mockSignIn);
    expect(result.current.signOut).toBe(mockSignOut);
    expect(result.current.resetPassword).toBe(mockResetPassword);
    expect(result.current.updatePassword).toBe(mockUpdatePassword);
  });
});
