import { createContext, FC, ReactNode, useCallback, useEffect, useState } from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import {
  signIn as authSignIn,
  signUp as authSignUp,
  signOut as authSignOut,
  resetPassword as authResetPassword,
  updatePassword as authUpdatePassword,
  getSession,
  onAuthStateChange,
  syncUserMetadataToProfile,
} from '../services/supabase/auth';
import {
  getCachedAuth,
  setCachedAuth,
  clearCachedAuth,
  getInitialAuthState,
} from '../services/authCache';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, metadata?: { username?: string; firstName?: string; lastName?: string }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const initialState = getInitialAuthState();
  const [user, setUser] = useState<User | null>(initialState.user);
  const [session, setSession] = useState<Session | null>(initialState.session);
  const [isLoading, setIsLoading] = useState(initialState.isLoading);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // First, check our local cache for a quick start
      const cachedAuth = getCachedAuth();
      if (cachedAuth) {
        setSession(cachedAuth.session);
        setUser(cachedAuth.user);
        setIsLoading(false);
        // Still fetch the real session in background to ensure it's fresh
        // but user sees the app immediately
        getSession().then(({ session: freshSession }) => {
          if (freshSession) {
            setSession(freshSession);
            setUser(freshSession.user);
            setCachedAuth(freshSession.user, freshSession);
          } else {
            // Session was invalid, clear everything
            setSession(null);
            setUser(null);
            clearCachedAuth();
          }
        });
        return;
      }

      // No cache, do the normal flow
      const { session: currentSession } = await getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        setCachedAuth(currentSession.user, currentSession);
      }
      setIsLoading(false);
    };

    initAuth();

    // Subscribe to auth changes
    const subscription = onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        setCachedAuth(newSession.user, newSession);
        // Sync user metadata to profile on sign in (handles email confirmation flow)
        // Fire and forget - don't block auth state update
        if (event === 'SIGNED_IN') {
          syncUserMetadataToProfile(newSession.user);
        }
      } else {
        clearCachedAuth();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { username?: string; firstName?: string; lastName?: string }
  ) => {
    const { user: newUser, session: newSession, error } = await authSignUp(email, password, metadata);
    if (!error && newUser && newSession) {
      setUser(newUser);
      setSession(newSession);
      setCachedAuth(newUser, newSession);
    }
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: newUser, session: newSession, error } = await authSignIn(email, password);
    if (!error && newUser && newSession) {
      setUser(newUser);
      setSession(newSession);
      setCachedAuth(newUser, newSession);
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await authSignOut();
    if (!error) {
      setUser(null);
      setSession(null);
      clearCachedAuth();
    }
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    return authResetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    return authUpdatePassword(newPassword);
  }, []);

  // User is only authenticated if they have a valid session
  // (Supabase only provides a session after email confirmation)
  const isAuthenticated = !!session && !!user;

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
