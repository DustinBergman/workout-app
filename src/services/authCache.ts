import type { User, Session } from '@supabase/supabase-js';

export const AUTH_CACHE_KEY = 'workout-app-auth-cache';
export const AUTH_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

export interface CachedAuth {
  user: User;
  session: Session;
  cachedAt: number;
}

export const getCachedAuth = (): CachedAuth | null => {
  try {
    const cached = localStorage.getItem(AUTH_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached) as CachedAuth;
    const now = Date.now();

    // Check if cache is still valid (within 7 days)
    if (now - data.cachedAt > AUTH_CACHE_DURATION) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    // Check if the session itself hasn't expired
    const expiresAt = data.session.expires_at;
    if (expiresAt && expiresAt * 1000 < now) {
      localStorage.removeItem(AUTH_CACHE_KEY);
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

export const setCachedAuth = (user: User, session: Session): void => {
  try {
    const data: CachedAuth = {
      user,
      session,
      cachedAt: Date.now(),
    };
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
};

export const clearCachedAuth = (): void => {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // Ignore errors
  }
};

export const getInitialAuthState = (): { user: User | null; session: Session | null; isLoading: boolean } => {
  const cached = getCachedAuth();
  if (cached) {
    return { user: cached.user, session: cached.session, isLoading: false };
  }
  return { user: null, session: null, isLoading: true };
};
