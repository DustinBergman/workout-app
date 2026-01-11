import { supabase } from '../../lib/supabase';
import { getAuthUser } from './authHelper';
import type { WorkoutTemplate, TemplateExercise, TemplateType, TemplateCopiedFrom } from '../../types';

interface DbTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  type: 'strength' | 'cardio';
  sort_order: number;
  target_sets: number | null;
  target_reps: number | null;
  rest_seconds: number | null;
  cardio_category: string | null;
  tracking_mode: string | null;
  target_duration_minutes: number | null;
  target_calories: number | null;
  target_intensity: string | null;
  rounds: number | null;
  work_seconds: number | null;
  rest_between_rounds_seconds: number | null;
  target_laps: number | null;
}

interface DbWorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  template_type: TemplateType;
  sort_order: number;
  copied_from: TemplateCopiedFrom | null;
  created_at: string;
  updated_at: string;
  template_exercises?: DbTemplateExercise[];
}

/**
 * Get all templates for the current user
 */
export const getTemplates = async (): Promise<{ templates: WorkoutTemplate[]; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { templates: [], error: new Error('Not authenticated') };
  }

  const { data, error } = await supabase
    .from('workout_templates')
    .select(`
      *,
      template_exercises (*)
    `)
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  if (error) {
    return { templates: [], error };
  }

  const templates = (data || []).map(dbTemplateToTemplate);
  return { templates, error: null };
};

/**
 * Create a new template
 */
export const createTemplate = async (
  template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{ template: WorkoutTemplate | null; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { template: null, error: new Error('Not authenticated') };
  }

  // Create the template
  const { data: templateData, error: templateError } = await supabase
    .from('workout_templates')
    .insert({
      user_id: user.id,
      name: template.name,
      template_type: template.templateType,
      copied_from: template.copiedFrom || null,
    })
    .select()
    .single();

  if (templateError || !templateData) {
    return { template: null, error: templateError };
  }

  // Create the template exercises
  if (template.exercises.length > 0) {
    const exercisesToInsert = template.exercises.map((ex, idx) =>
      templateExerciseToDbExercise(ex, templateData.id, idx)
    );

    const { error: exercisesError } = await supabase
      .from('template_exercises')
      .insert(exercisesToInsert);

    if (exercisesError) {
      return { template: null, error: exercisesError };
    }
  }

  // Fetch the complete template with exercises
  const { data: completeData, error: fetchError } = await supabase
    .from('workout_templates')
    .select(`
      *,
      template_exercises (*)
    `)
    .eq('id', templateData.id)
    .single();

  if (fetchError) {
    return { template: null, error: fetchError };
  }

  return { template: dbTemplateToTemplate(completeData), error: null };
};

/**
 * Update an existing template
 */
export const updateTemplate = async (
  id: string,
  updates: Partial<Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  // Update template metadata
  if (updates.name || updates.templateType) {
    const templateUpdates: Record<string, string> = {};
    if (updates.name) templateUpdates.name = updates.name;
    if (updates.templateType) templateUpdates.template_type = updates.templateType;

    const { error: updateError } = await supabase
      .from('workout_templates')
      .update(templateUpdates)
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return { error: updateError };
    }
  }

  // Update exercises if provided
  if (updates.exercises) {
    // Delete existing exercises
    const { error: deleteError } = await supabase
      .from('template_exercises')
      .delete()
      .eq('template_id', id);

    if (deleteError) {
      return { error: deleteError };
    }

    // Insert new exercises
    if (updates.exercises.length > 0) {
      const exercisesToInsert = updates.exercises.map((ex, idx) =>
        templateExerciseToDbExercise(ex, id, idx)
      );

      const { error: insertError } = await supabase
        .from('template_exercises')
        .insert(exercisesToInsert);

      if (insertError) {
        return { error: insertError };
      }
    }
  }

  return { error: null };
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string): Promise<{ error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { error: new Error('Not authenticated') };
  }

  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  return { error };
};

// Helper: Convert DB template to app template
const dbTemplateToTemplate = (dbTemplate: DbWorkoutTemplate): WorkoutTemplate => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  templateType: dbTemplate.template_type,
  exercises: (dbTemplate.template_exercises || [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(dbExerciseToTemplateExercise),
  copiedFrom: dbTemplate.copied_from ?? undefined,
  createdAt: dbTemplate.created_at,
  updatedAt: dbTemplate.updated_at,
});

// Helper: Convert DB exercise to app template exercise
const dbExerciseToTemplateExercise = (dbEx: DbTemplateExercise): TemplateExercise => {
  if (dbEx.type === 'cardio') {
    const base = {
      type: 'cardio' as const,
      exerciseId: dbEx.exercise_id,
      restSeconds: dbEx.rest_seconds ?? undefined,
      trackingMode: (dbEx.tracking_mode as 'detailed' | 'simple') || 'detailed',
      targetCalories: dbEx.target_calories ?? undefined,
      cardioCategory: (dbEx.cardio_category || 'other') as 'distance' | 'interval' | 'laps' | 'duration' | 'other',
    };

    // Add category-specific fields
    return {
      ...base,
      targetDurationMinutes: dbEx.target_duration_minutes ?? undefined,
      targetIntensity: dbEx.target_intensity as 'low' | 'moderate' | 'high' | undefined,
      rounds: dbEx.rounds ?? undefined,
      workSeconds: dbEx.work_seconds ?? undefined,
      restBetweenRoundsSeconds: dbEx.rest_between_rounds_seconds ?? undefined,
      targetLaps: dbEx.target_laps ?? undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
  }

  return {
    type: 'strength',
    exerciseId: dbEx.exercise_id,
    targetSets: dbEx.target_sets ?? undefined,
    targetReps: dbEx.target_reps ?? undefined,
    restSeconds: dbEx.rest_seconds ?? undefined,
  };
};

/**
 * Deduplicate exercises in all templates for the current user.
 * This fixes a bug where exercises were duplicated due to sync issues.
 */
export const deduplicateTemplateExercises = async (): Promise<{ fixed: number; error: Error | null }> => {
  const user = await getAuthUser();
  if (!user) {
    return { fixed: 0, error: new Error('Not authenticated') };
  }

  // Get all templates with their exercises
  const { data: templates, error: fetchError } = await supabase
    .from('workout_templates')
    .select(`
      id,
      template_exercises (*)
    `)
    .eq('user_id', user.id);

  if (fetchError) {
    return { fixed: 0, error: fetchError };
  }

  let totalFixed = 0;

  for (const template of templates || []) {
    const exercises = template.template_exercises || [];

    // Group exercises by exercise_id, keeping only the first (lowest sort_order) of each
    const seen = new Set<string>();
    const duplicateIds: string[] = [];

    // Sort by sort_order to keep the first occurrence
    const sorted = [...exercises].sort((a, b) => a.sort_order - b.sort_order);

    for (const ex of sorted) {
      if (seen.has(ex.exercise_id)) {
        duplicateIds.push(ex.id);
      } else {
        seen.add(ex.exercise_id);
      }
    }

    if (duplicateIds.length > 0) {
      // Delete the duplicate exercises
      const { error: deleteError } = await supabase
        .from('template_exercises')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) {
        console.error('Failed to delete duplicates for template', template.id, deleteError);
        continue;
      }

      totalFixed += duplicateIds.length;
      console.log(`Fixed ${duplicateIds.length} duplicate exercises in template ${template.id}`);
    }
  }

  return { fixed: totalFixed, error: null };
};

// Helper: Convert app template exercise to DB format
const templateExerciseToDbExercise = (
  ex: TemplateExercise,
  templateId: string,
  sortOrder: number
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): any => {
  const base = {
    template_id: templateId,
    exercise_id: ex.exerciseId,
    type: ex.type,
    sort_order: sortOrder,
    rest_seconds: ex.restSeconds ?? null,
  };

  if (ex.type === 'cardio') {
    return {
      ...base,
      cardio_category: ex.cardioCategory,
      tracking_mode: ex.trackingMode || 'detailed',
      target_calories: ex.targetCalories ?? null,
      target_duration_minutes: 'targetDurationMinutes' in ex ? ex.targetDurationMinutes ?? null : null,
      target_intensity: 'targetIntensity' in ex ? ex.targetIntensity ?? null : null,
      rounds: 'rounds' in ex ? ex.rounds ?? null : null,
      work_seconds: 'workSeconds' in ex ? ex.workSeconds ?? null : null,
      rest_between_rounds_seconds: 'restBetweenRoundsSeconds' in ex ? ex.restBetweenRoundsSeconds ?? null : null,
      target_laps: 'targetLaps' in ex ? ex.targetLaps ?? null : null,
    };
  }

  return {
    ...base,
    target_sets: ex.targetSets ?? null,
    target_reps: ex.targetReps ?? null,
  };
};
