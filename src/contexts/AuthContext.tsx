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
} from '../services/supabase/auth';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: AuthError | null }>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const { session: currentSession } = await getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    };

    initAuth();

    // Subscribe to auth changes
    const subscription = onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (
    email: string,
    password: string,
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    const { user: newUser, session: newSession, error } = await authSignUp(email, password, metadata);
    if (!error && newUser) {
      setUser(newUser);
      setSession(newSession);
    }
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { user: newUser, session: newSession, error } = await authSignIn(email, password);
    if (!error && newUser) {
      setUser(newUser);
      setSession(newSession);
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await authSignOut();
    if (!error) {
      setUser(null);
      setSession(null);
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
