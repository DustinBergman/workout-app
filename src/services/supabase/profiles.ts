import { supabase } from '../../lib/supabase';
import type { UserPreferences, WorkoutGoal, ExperienceLevel, ProgressiveOverloadWeek } from '../../types';

export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  weight_unit: 'lbs' | 'kg';
  distance_unit: 'mi' | 'km';
  default_rest_seconds: number;
  dark_mode: boolean;
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
  const { data: { user } } = await supabase.auth.getUser();
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
  const { data: { user } } = await supabase.auth.getUser();
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

  return updates;
};
