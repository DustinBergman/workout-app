import { supabase } from '../../lib/supabase';
import type { Exercise, StrengthExercise, CardioExercise, MuscleGroup, Equipment, CardioType } from '../../types';

interface DbCustomExercise {
  id: string;
  user_id: string;
  name: string;
  type: 'strength' | 'cardio';
  muscle_groups: string[] | null;
  equipment: string | null;
  cardio_type: string | null;
  instructions: string | null;
  created_at: string;
}

/**
 * Get all custom exercises for the current user
 */
export const getCustomExercises = async (): Promise<{ exercises: Exercise[]; error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { exercises: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('custom_exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { exercises: [], error };
  }

  const exercises = (data || []).map(dbExerciseToExercise);
  return { exercises, error: null };
};

/**
 * Create a new custom exercise
 */
export const createCustomExercise = async (
  exercise: Omit<Exercise, 'id'>
): Promise<{ exercise: Exercise | null; error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { exercise: null, error: new Error('Not authenticated') };
  }

  let insertData: Omit<DbCustomExercise, 'id' | 'created_at'>;

  if (exercise.type === 'strength') {
    const strengthEx = exercise as Omit<StrengthExercise, 'id'>;
    insertData = {
      user_id: user.id,
      name: strengthEx.name,
      type: 'strength',
      muscle_groups: strengthEx.muscleGroups,
      equipment: strengthEx.equipment,
      cardio_type: null,
      instructions: strengthEx.instructions ?? null,
    };
  } else {
    const cardioEx = exercise as Omit<CardioExercise, 'id'>;
    insertData = {
      user_id: user.id,
      name: cardioEx.name,
      type: 'cardio',
      muscle_groups: null,
      equipment: null,
      cardio_type: cardioEx.cardioType,
      instructions: cardioEx.instructions ?? null,
    };
  }

  const { data, error } = await supabase
    .from('custom_exercises')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    return { exercise: null, error };
  }

  return { exercise: dbExerciseToExercise(data), error: null };
};

/**
 * Update a custom exercise
 */
export const updateCustomExercise = async (
  id: string,
  updates: Partial<Omit<Exercise, 'id'>>
): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const updateData: Partial<DbCustomExercise> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.type !== undefined) updateData.type = updates.type;
  if (updates.instructions !== undefined) updateData.instructions = updates.instructions ?? null;

  if ('muscleGroups' in updates) {
    updateData.muscle_groups = (updates as Partial<StrengthExercise>).muscleGroups ?? null;
  }
  if ('equipment' in updates) {
    updateData.equipment = (updates as Partial<StrengthExercise>).equipment ?? null;
  }
  if ('cardioType' in updates) {
    updateData.cardio_type = (updates as Partial<CardioExercise>).cardioType ?? null;
  }

  const { error } = await supabase
    .from('custom_exercises')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id);

  return { error };
};

/**
 * Delete a custom exercise
 */
export const deleteCustomExercise = async (id: string): Promise<{ error: Error | null }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('custom_exercises')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return { error };
};

// Helper: Convert DB exercise to app exercise
const dbExerciseToExercise = (dbEx: DbCustomExercise): Exercise => {
  if (dbEx.type === 'cardio') {
    return {
      id: dbEx.id,
      name: dbEx.name,
      type: 'cardio',
      cardioType: (dbEx.cardio_type as CardioType) || 'other',
      instructions: dbEx.instructions ?? undefined,
    };
  }

  return {
    id: dbEx.id,
    name: dbEx.name,
    type: 'strength',
    muscleGroups: (dbEx.muscle_groups as MuscleGroup[]) || [],
    equipment: (dbEx.equipment as Equipment) || 'other',
    instructions: dbEx.instructions ?? undefined,
  };
};
