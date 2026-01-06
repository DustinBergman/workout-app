import { supabase } from '../../lib/supabase';
import type { User } from '@supabase/supabase-js';

// Session cache with timestamp
let cachedUser: User | null = null;
let cacheTimestamp: number | null = null;

const CACHE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Get the current user from cached session or fetch fresh if needed.
 * Uses in-memory cache to avoid repeated database calls.
 * Cache expires after 15 minutes.
 */
export const getAuthUser = async (): Promise<User | null> => {
  const now = Date.now();

  // Return cached user if valid and not expired
  if (cachedUser && cacheTimestamp && now - cacheTimestamp < CACHE_DURATION_MS) {
    return cachedUser;
  }

  // Fetch fresh session
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    cachedUser = session.user;
    cacheTimestamp = now;
    return cachedUser;
  }

  // No valid session
  cachedUser = null;
  cacheTimestamp = null;
  return null;
};

/**
 * Update the cached user (call this on auth state changes)
 */
export const setAuthUser = (user: User | null): void => {
  cachedUser = user;
  cacheTimestamp = user ? Date.now() : null;
};

/**
 * Clear the auth cache (call this on sign out)
 */
export const clearAuthCache = (): void => {
  cachedUser = null;
  cacheTimestamp = null;
};

/**
 * Force refresh the cached user from the database
 */
export const refreshAuthUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    cachedUser = session.user;
    cacheTimestamp = Date.now();
    return cachedUser;
  }

  cachedUser = null;
  cacheTimestamp = null;
  return null;
};
