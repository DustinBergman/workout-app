import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';
import type { UserPreferences, WorkoutGoal, ExperienceLevel, ProgressiveOverloadWeek } from '../../types';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  weight_unit: 'lbs' | 'kg';
  distance_unit: 'mi' | 'km';
  default_rest_seconds: number;
  dark_mode: boolean;
  email_notifications_enabled: boolean;
  experience_level: ExperienceLevel;
  workout_goal: WorkoutGoal;
  current_week: ProgressiveOverloadWeek;
  week_started_at: string | null;
  has_completed_intro: boolean;
  openai_api_key: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's profile
 */
export const getProfile = async (): Promise<{ profile: Profile | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { profile: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { profile: data, error };
};

/**
 * Update the current user's profile
 */
export const updateProfile = async (
  updates: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  return { error };
};

/**
 * Convert Profile to UserPreferences (for Zustand store)
 */
export const profileToPreferences = (profile: Profile): UserPreferences => ({
  weightUnit: profile.weight_unit,
  distanceUnit: profile.distance_unit,
  defaultRestSeconds: profile.default_rest_seconds,
  darkMode: profile.dark_mode,
  emailNotificationsEnabled: profile.email_notifications_enabled,
  firstName: profile.first_name ?? undefined,
  lastName: profile.last_name ?? undefined,
  experienceLevel: profile.experience_level,
  openaiApiKey: profile.openai_api_key ?? undefined,
});

/**
 * Convert UserPreferences to Profile updates (for Supabase)
 */
export const preferencesToProfileUpdates = (
  prefs: Partial<UserPreferences>
): Partial<Profile> => {
  const updates: Partial<Profile> = {};

  if (prefs.weightUnit !== undefined) updates.weight_unit = prefs.weightUnit;
  if (prefs.distanceUnit !== undefined) updates.distance_unit = prefs.distanceUnit;
  if (prefs.defaultRestSeconds !== undefined) updates.default_rest_seconds = prefs.defaultRestSeconds;
  if (prefs.darkMode !== undefined) updates.dark_mode = prefs.darkMode;
  if (prefs.firstName !== undefined) updates.first_name = prefs.firstName || null;
  if (prefs.lastName !== undefined) updates.last_name = prefs.lastName || null;
  if (prefs.experienceLevel !== undefined) updates.experience_level = prefs.experienceLevel;
  if (prefs.openaiApiKey !== undefined) updates.openai_api_key = prefs.openaiApiKey || null;
  if (prefs.emailNotificationsEnabled !== undefined) updates.email_notifications_enabled = prefs.emailNotificationsEnabled;

  return updates;
};

/**
 * Check if a username is available
 */
export const checkUsernameAvailability = async (
  username: string
): Promise<{ available: boolean; error: Error | null }> => {
  const trimmed = username.trim().toLowerCase();

  if (trimmed.length < 3) {
    return { available: false, error: new Error('Username must be at least 3 characters') };
  }

  if (trimmed.length > 20) {
    return { available: false, error: new Error('Username must be 20 characters or less') };
  }

  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { available: false, error: new Error('Username can only contain letters, numbers, and underscores') };
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', trimmed)
    .maybeSingle();

  if (error) {
    return { available: false, error };
  }

  return { available: data === null, error: null };
};

/**
 * Update the current user's username
 */
export const updateUsername = async (
  username: string
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ username: username.trim().toLowerCase() })
    .eq('id', user.id);

  return { error };
};

/**
 * Search users by username, first name, or last name (for friend search)
 */
export const searchUsers = async (
  query: string
): Promise<{ users: Array<{ id: string; first_name: string | null; last_name: string | null; username: string | null; email?: string }>; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { users: [], error: new Error('Not authenticated') };
  }

  const trimmedQuery = query.trim().toLowerCase();
  if (trimmedQuery.length < 2) {
    return { users: [], error: null };
  }

  // Search by username, first name, or last name
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username')
    .or(`username.ilike.%${trimmedQuery}%,first_name.ilike.%${trimmedQuery}%,last_name.ilike.%${trimmedQuery}%`)
    .neq('id', user.id) // Exclude current user
    .limit(10);

  if (error) {
    return { users: [], error };
  }

  return { users: data || [], error: null };
};

/**
 * Get a user's profile by ID (for viewing friend profiles)
 */
export const getProfileById = async (
  userId: string
): Promise<{ profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'username'> | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username')
    .eq('id', userId)
    .single();

  return { profile: data, error };
};

/**
 * Public profile type for profile modal
 */
export interface PublicProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  experience_level: ExperienceLevel;
  workout_goal: WorkoutGoal;
}

/**
 * Get a user's public profile (for profile modal display)
 */
export const getPublicProfile = async (
  userId: string
): Promise<{ profile: PublicProfile | null; error: Error | null }> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, username, experience_level, workout_goal')
    .eq('id', userId)
    .single();

  return { profile: data, error };
};
