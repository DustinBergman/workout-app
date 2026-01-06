import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User, Session } from '@supabase/supabase-js';
import {
  getCachedAuth,
  setCachedAuth,
  clearCachedAuth,
  getInitialAuthState,
  AUTH_CACHE_KEY,
  AUTH_CACHE_DURATION,
} from './authCache';

const createMockUser = (overrides = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
} as User);

const createMockSession = (overrides = {}): Session => ({
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides,
} as Session);

describe('authCache', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getCachedAuth', () => {
    it('should return null when no cache exists', () => {
      expect(getCachedAuth()).toBeNull();
    });

    it('should return cached auth when valid', () => {
      const user = createMockUser();
      const session = createMockSession();
      const cachedData = {
        user,
        session,
        cachedAt: Date.now(),
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cachedData));

      const result = getCachedAuth();

      expect(result).not.toBeNull();
      expect(result?.user.id).toBe(user.id);
      expect(result?.session.access_token).toBe(session.access_token);
    });

    it('should return null and clear cache when cache is older than 7 days', () => {
      const user = createMockUser();
      const session = createMockSession();
      const cachedData = {
        user,
        session,
        cachedAt: Date.now() - AUTH_CACHE_DURATION - 1000, // 7 days + 1 second ago
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cachedData));

      const result = getCachedAuth();

      expect(result).toBeNull();
      expect(localStorage.getItem(AUTH_CACHE_KEY)).toBeNull();
    });

    it('should return null and clear cache when session is expired', () => {
      const user = createMockUser();
      const session = createMockSession({
        expires_at: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      });
      const cachedData = {
        user,
        session,
        cachedAt: Date.now() - 1000, // 1 second ago (cache is fresh)
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cachedData));

      const result = getCachedAuth();

      expect(result).toBeNull();
      expect(localStorage.getItem(AUTH_CACHE_KEY)).toBeNull();
    });

    it('should return null on invalid JSON', () => {
      localStorage.setItem(AUTH_CACHE_KEY, 'invalid json');

      expect(getCachedAuth()).toBeNull();
    });

    it('should handle session without expires_at', () => {
      const user = createMockUser();
      const session = createMockSession();
      // Remove expires_at by creating a new object without it
      const sessionWithoutExpiry = { ...session };
      delete (sessionWithoutExpiry as unknown as Record<string, unknown>).expires_at;

      const cachedData = {
        user,
        session: sessionWithoutExpiry,
        cachedAt: Date.now(),
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cachedData));

      const result = getCachedAuth();

      // Should still return the cache since we can't verify expiry
      expect(result).not.toBeNull();
    });
  });

  describe('setCachedAuth', () => {
    it('should store user and session in localStorage', () => {
      const user = createMockUser();
      const session = createMockSession();

      setCachedAuth(user, session);

      const stored = localStorage.getItem(AUTH_CACHE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.user.id).toBe(user.id);
      expect(parsed.session.access_token).toBe(session.access_token);
      expect(parsed.cachedAt).toBeDefined();
    });

    it('should overwrite existing cache', () => {
      const user1 = createMockUser({ id: 'user-1' });
      const session1 = createMockSession({ access_token: 'token-1' });
      const user2 = createMockUser({ id: 'user-2' });
      const session2 = createMockSession({ access_token: 'token-2' });

      setCachedAuth(user1, session1);
      setCachedAuth(user2, session2);

      const stored = localStorage.getItem(AUTH_CACHE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.user.id).toBe('user-2');
      expect(parsed.session.access_token).toBe('token-2');
    });

    it('should not throw on localStorage errors', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const user = createMockUser();
      const session = createMockSession();

      expect(() => setCachedAuth(user, session)).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('clearCachedAuth', () => {
    it('should remove cache from localStorage', () => {
      const user = createMockUser();
      const session = createMockSession();
      setCachedAuth(user, session);

      expect(localStorage.getItem(AUTH_CACHE_KEY)).not.toBeNull();

      clearCachedAuth();

      expect(localStorage.getItem(AUTH_CACHE_KEY)).toBeNull();
    });

    it('should not throw when no cache exists', () => {
      expect(() => clearCachedAuth()).not.toThrow();
    });

    it('should not throw on localStorage errors', () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => clearCachedAuth()).not.toThrow();

      localStorage.removeItem = originalRemoveItem;
    });
  });

  describe('getInitialAuthState', () => {
    it('should return loading state when no cache exists', () => {
      const result = getInitialAuthState();

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.isLoading).toBe(true);
    });

    it('should return cached state when valid cache exists', () => {
      const user = createMockUser();
      const session = createMockSession();
      setCachedAuth(user, session);

      const result = getInitialAuthState();

      expect(result.user).not.toBeNull();
      expect(result.user?.id).toBe(user.id);
      expect(result.session).not.toBeNull();
      expect(result.isLoading).toBe(false);
    });

    it('should return loading state when cache is expired', () => {
      const user = createMockUser();
      const session = createMockSession({
        expires_at: Math.floor(Date.now() / 1000) - 3600, // Expired
      });
      const cachedData = {
        user,
        session,
        cachedAt: Date.now(),
      };
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(cachedData));

      const result = getInitialAuthState();

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.isLoading).toBe(true);
    });
  });

  describe('AUTH_CACHE_DURATION', () => {
    it('should be 7 days in milliseconds', () => {
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      expect(AUTH_CACHE_DURATION).toBe(sevenDaysInMs);
    });
  });
});
