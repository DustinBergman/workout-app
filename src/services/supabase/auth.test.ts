import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signUp,
  signIn,
  signOut,
  resetPassword,
  updatePassword,
  getSession,
  getUser,
  onAuthStateChange,
  resendConfirmation,
} from './auth';

// Mock the supabase client
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
      resend: vi.fn(),
    },
    from: vi.fn(() => ({
      update: mockUpdate,
    })),
  },
}));

import { supabase } from '../../lib/supabase';

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

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signUp', () => {
    it('should sign up a user with email and password', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as never);

      const result = await signUp('test@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: undefined },
      });
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should sign up with metadata and update profile', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      mockUpdate.mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as never);

      await signUp('test@example.com', 'password123', {
        firstName: 'John',
        lastName: 'Doe',
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: { data: { firstName: 'John', lastName: 'Doe' } },
      });

      // Verify profile update is called with correct data
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(mockUpdate).toHaveBeenCalledWith({
        username: null,
        first_name: 'John',
        last_name: 'Doe',
      });
      expect(mockEq).toHaveBeenCalledWith('id', mockUser.id);
    });

    it('should not update profile when no metadata provided', async () => {
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as never);

      await signUp('test@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalled();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return error on signup failure', async () => {
      const mockError = { message: 'Email already registered', status: 400 };
      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as never);

      const result = await signUp('test@example.com', 'password123');

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signIn', () => {
    it('should sign in a user with email and password', async () => {
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      } as never);

      const result = await signIn('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should return error on invalid credentials', async () => {
      const mockError = { message: 'Invalid credentials', status: 401 };
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      } as never);

      const result = await signIn('test@example.com', 'wrongpassword');

      expect(result.user).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('should sign out the user', async () => {
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: null,
      } as never);

      const result = await signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(result.error).toBeNull();
    });

    it('should return error on signout failure', async () => {
      const mockError = { message: 'Network error', status: 500 };
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError,
      } as never);

      const result = await signOut();

      expect(result.error).toEqual(mockError);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: null,
      } as never);

      const result = await resetPassword('test@example.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: expect.stringContaining('/reset-password') }
      );
      expect(result.error).toBeNull();
    });

    it('should return error for non-existent email', async () => {
      const mockError = { message: 'User not found', status: 404 };
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
        data: {},
        error: mockError,
      } as never);

      const result = await resetPassword('nonexistent@example.com');

      expect(result.error).toEqual(mockError);
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const result = await updatePassword('newpassword123');

      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
      expect(result.error).toBeNull();
    });

    it('should return error on password update failure', async () => {
      const mockError = { message: 'Password too weak', status: 400 };
      vi.mocked(supabase.auth.updateUser).mockResolvedValue({
        data: { user: null },
        error: mockError,
      } as never);

      const result = await updatePassword('weak');

      expect(result.error).toEqual(mockError);
    });
  });

  describe('getSession', () => {
    it('should return current session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      } as never);

      const result = await getSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should return null session when not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never);

      const result = await getSession();

      expect(result.session).toBeNull();
      expect(result.error).toBeNull();
    });
  });

  describe('getUser', () => {
    it('should return current user', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as never);

      const result = await getUser();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should return null user when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as never);

      const result = await getUser();

      expect(result.user).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const mockSubscription = { unsubscribe: vi.fn() };
      vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
        data: { subscription: mockSubscription },
      } as never);

      const callback = vi.fn();
      const subscription = onAuthStateChange(callback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
      expect(subscription).toEqual(mockSubscription);
    });
  });

  describe('resendConfirmation', () => {
    it('should resend confirmation email', async () => {
      vi.mocked(supabase.auth.resend).mockResolvedValue({
        data: {},
        error: null,
      } as never);

      const result = await resendConfirmation('test@example.com');

      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'test@example.com',
      });
      expect(result.error).toBeNull();
    });

    it('should return error on resend failure', async () => {
      const mockError = { message: 'Too many requests', status: 429 };
      vi.mocked(supabase.auth.resend).mockResolvedValue({
        data: {},
        error: mockError,
      } as never);

      const result = await resendConfirmation('test@example.com');

      expect(result.error).toEqual(mockError);
    });
  });
});
