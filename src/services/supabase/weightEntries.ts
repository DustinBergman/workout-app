import { supabase } from '../../lib/supabase';
import type { WeightEntry, WeightUnit } from '../../types';

interface DbWeightEntry {
  id: string;
  user_id: string;
  date: string;
  weight: number;
  unit: WeightUnit;
  created_at: string;
}

/**
 * Get all weight entries for the current user
 */
export const getWeightEntries = async (): Promise<{ entries: WeightEntry[]; error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { entries: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (error) {
    return { entries: [], error };
  }

  const entries = (data || []).map(dbEntryToEntry);
  return { entries, error: null };
};

/**
 * Add or update a weight entry (upserts based on date)
 */
export const upsertWeightEntry = async (
  entry: WeightEntry
): Promise<{ entry: WeightEntry | null; error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { entry: null, error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('weight_entries')
    .upsert(
      {
        user_id: user.id,
        date: entry.date,
        weight: entry.weight,
        unit: entry.unit,
      },
      { onConflict: 'user_id,date' }
    )
    .select()
    .single();

  if (error || !data) {
    return { entry: null, error };
  }

  return { entry: dbEntryToEntry(data), error: null };
};

/**
 * Delete a weight entry
 */
export const deleteWeightEntry = async (date: string): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('weight_entries')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date);

  return { error };
};

// Helper: Convert DB entry to app entry
const dbEntryToEntry = (dbEntry: DbWeightEntry): WeightEntry => ({
  date: dbEntry.date,
  weight: dbEntry.weight,
  unit: dbEntry.unit,
});
