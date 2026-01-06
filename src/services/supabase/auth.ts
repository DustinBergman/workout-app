import { supabase } from '../../lib/supabase';
import type { AuthError, User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface AuthStateChange {
  event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED' | 'PASSWORD_RECOVERY';
  session: Session | null;
}

/**
 * Sign up a new user with email and password
 * Also saves first/last name to the profiles table
 */
export const signUp = async (
  email: string,
  password: string,
  metadata?: { firstName?: string; lastName?: string }
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  // If signup successful and we have name data, update the profile
  // The profile is auto-created by a database trigger on auth.users insert
  if (!error && data.user && (metadata?.firstName || metadata?.lastName)) {
    // Update the profile with the name - the trigger creates the profile synchronously
    await supabase
      .from('profiles')
      .update({
        first_name: metadata.firstName || null,
        last_name: metadata.lastName || null,
      })
      .eq('id', data.user.id);
  }

  return {
    user: data.user,
    session: data.session,
    error,
  };
};

/**
 * Sign in with email and password
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return {
    user: data.user,
    session: data.session,
    error,
  };
};

/**
 * Sign out the current user
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Send a password reset email
 */
export const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error };
};

/**
 * Update user password (for use after clicking reset link)
 */
export const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { error };
};

/**
 * Get the current session
 */
export const getSession = async (): Promise<{ session: Session | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.getSession();
  return {
    session: data.session,
    error,
  };
};

/**
 * Get the current user
 */
export const getUser = async (): Promise<{ user: User | null; error: AuthError | null }> => {
  const { data, error } = await supabase.auth.getUser();
  return {
    user: data.user,
    error,
  };
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
  return subscription;
};

/**
 * Resend confirmation email
 */
export const resendConfirmation = async (email: string): Promise<{ error: AuthError | null }> => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  return { error };
};
