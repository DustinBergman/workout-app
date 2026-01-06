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
 * Also saves username and first/last name to the profiles table
 */
export const signUp = async (
  email: string,
  password: string,
  metadata?: { username?: string; firstName?: string; lastName?: string }
): Promise<AuthResponse> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  // If signup successful and we have profile data, update the profile
  // The profile is auto-created by a database trigger on auth.users insert
  if (!error && data.user && (metadata?.username || metadata?.firstName || metadata?.lastName)) {
    // Small delay to ensure the profile trigger has completed
    await new Promise(resolve => setTimeout(resolve, 100));

    // Update the profile with the name and username
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: metadata.username?.trim().toLowerCase() || null,
        first_name: metadata.firstName || null,
        last_name: metadata.lastName || null,
      })
      .eq('id', data.user.id);

    // If update failed, try upsert as fallback (in case profile doesn't exist yet)
    if (profileError) {
      console.error('Profile update failed, trying upsert:', profileError);
      await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          username: metadata.username?.trim().toLowerCase() || null,
          first_name: metadata.firstName || null,
          last_name: metadata.lastName || null,
        });
    }
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

/**
 * Sync user metadata (username, first/last name) to the profiles table
 * Called when user signs in after email confirmation
 */
export const syncUserMetadataToProfile = async (user: User): Promise<void> => {
  const metadata = user.user_metadata;
  if (!metadata) return;

  const { username, firstName, lastName } = metadata;

  // Only sync if there's data to sync
  if (!username && !firstName && !lastName) return;

  const updates: Record<string, string | null> = {};

  if (username) {
    updates.username = username.trim().toLowerCase();
  }
  if (firstName) {
    updates.first_name = firstName;
  }
  if (lastName) {
    updates.last_name = lastName;
  }

  // Update the profile - user is now authenticated so RLS should allow this
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) {
    console.error('Failed to sync user metadata to profile:', error);
  }
};
