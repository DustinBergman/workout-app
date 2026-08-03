import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

// Get platform-aware redirect URL for OAuth
export const getAuthRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return 'com.dustin.lift://auth/callback';
  }
  return `${window.location.origin}/auth`;
};

export const SUPABASE_AUTH_STORAGE_KEY =
  `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;

export const clearPersistedSupabaseAuth = (): void => {
  localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
};

const SUPABASE_REQUEST_TIMEOUT_MS = 15000;
const fetchWithTimeout: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const externalSignal = init.signal;
  const handleExternalAbort = () => controller.abort();
  if (externalSignal?.aborted) {
    controller.abort();
  } else {
    externalSignal?.addEventListener('abort', handleExternalAbort, { once: true });
  }
  const timeoutId = setTimeout(
    () => controller.abort(),
    SUPABASE_REQUEST_TIMEOUT_MS
  );

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', handleExternalAbort);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
  },
  global: {
    fetch: fetchWithTimeout,
  },
});
