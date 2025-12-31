import { Exercise, MuscleGroup, Equipment, WorkoutTemplate } from '../../types';
import { getAllExercises } from '../../data/exercises';
import { callOpenAI, parseJSONResponse } from './client';

// Workout type options
export type WorkoutType = 'full-body' | 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'custom';

// Mapping of workout types to target muscle groups
export const WORKOUT_TYPE_MUSCLES: Record<Exclude<WorkoutType, 'custom'>, MuscleGroup[]> = {
  'full-body': ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quadriceps', 'hamstrings', 'glutes', 'core'],
  'push': ['chest', 'shoulders', 'triceps'],
  'pull': ['back', 'lats', 'biceps', 'traps'],
  'legs': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  'upper': ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'lats', 'traps'],
  'lower': ['quadriceps', 'hamstrings', 'glutes', 'calves'],
};

export interface GeneratePlanInput {
  workoutType: WorkoutType;
  customMuscleGroups?: MuscleGroup[];
  numberOfExercises: number;
  availableEquipment: Equipment[];
  additionalComments: string;
}

export interface GeneratedPlan {
  name: string;
  exercises: Array<{
    exerciseId: string;
    targetSets: number;
    targetReps: number;
    restSeconds: number;
  }>;
}

const SYSTEM_PROMPT = `You are a professional fitness coach AI that creates personalized workout plans.

IMPORTANT RULES:
1. Only use exercises from the provided exercise list - do not invent exercises
2. Select exercises that match the target muscle groups
3. Only include exercises that use the user's available equipment
4. Order exercises strategically: compound movements first, isolation exercises last
5. Balance the workout to avoid overworking any single muscle group
6. Respond ONLY with valid JSON - no explanations or markdown

Guidelines for sets/reps/rest:
- Compound movements (bench press, squat, deadlift, rows): 3-4 sets, 6-10 reps, 90-120s rest
- Isolation movements (curls, extensions, raises): 3 sets, 10-15 reps, 60-90s rest
- Core exercises: 3 sets, 12-20 reps, 45-60s rest`;

const buildUserPrompt = (
  input: GeneratePlanInput,
  availableExercises: Exercise[]
): string => {
  const targetMuscles = input.workoutType === 'custom'
    ? input.customMuscleGroups || []
    : WORKOUT_TYPE_MUSCLES[input.workoutType];

  const workoutTypeName = input.workoutType.replace('-', ' ');

  return `Create a ${workoutTypeName} workout plan with the following requirements:

TARGET MUSCLE GROUPS: ${targetMuscles.join(', ')}

NUMBER OF EXERCISES: ${input.numberOfExercises}

AVAILABLE EQUIPMENT: ${input.availableEquipment.join(', ')}

${input.additionalComments ? `USER NOTES: ${input.additionalComments}` : ''}

AVAILABLE EXERCISES (you MUST only choose from this list):
${JSON.stringify(availableExercises.map(e => ({
  id: e.id,
  name: e.name,
  muscleGroups: e.muscleGroups,
  equipment: e.equipment
})), null, 2)}

Respond with a JSON object in this exact format:
{
  "name": "Suggested workout name based on type",
  "exercises": [
    {
      "exerciseId": "exact-id-from-list",
      "targetSets": 3,
      "targetReps": 10,
      "restSeconds": 90
    }
  ]
}`;
};

export const generateWorkoutPlan = async (
  apiKey: string,
  input: GeneratePlanInput,
  customExercises: Exercise[] = []
): Promise<GeneratedPlan> => {
  const allExercises = getAllExercises(customExercises);

  // Filter exercises by available equipment
  const exercisesWithEquipment = allExercises.filter(
    ex => input.availableEquipment.includes(ex.equipment)
  );

  // Get target muscles for this workout type
  const targetMuscles = input.workoutType === 'custom'
    ? input.customMuscleGroups || []
    : WORKOUT_TYPE_MUSCLES[input.workoutType];

  // Filter to exercises that target relevant muscles
  const relevantExercises = exercisesWithEquipment.filter(
    ex => ex.muscleGroups.some(mg => targetMuscles.includes(mg))
  );

  if (relevantExercises.length === 0) {
    throw new Error('No exercises match your selected equipment and muscle groups. Try selecting more equipment options.');
  }

  const userPrompt = buildUserPrompt(input, relevantExercises);

  const content = await callOpenAI({
    apiKey,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    maxTokens: 1500,
    temperature: 0.3,
  });

  // Parse and validate response
  const parsed = parseJSONResponse<GeneratedPlan>(content, {
    name: 'AI Generated Workout',
    exercises: []
  });

  // Validate that all exercise IDs exist
  const validExerciseIds = new Set(allExercises.map(e => e.id));
  const validatedExercises = parsed.exercises.filter(
    ex => validExerciseIds.has(ex.exerciseId)
  );

  if (validatedExercises.length === 0) {
    throw new Error('AI failed to generate a valid workout plan. Please try again.');
  }

  return {
    name: parsed.name || 'AI Generated Workout',
    exercises: validatedExercises
  };
};

// Helper to convert GeneratedPlan to WorkoutTemplate
export const createTemplateFromPlan = (
  plan: GeneratedPlan,
  customName?: string
): WorkoutTemplate => {
  const now = new Date().toISOString();
  return {
    id: Math.random().toString(36).substring(2, 15),
    name: customName || plan.name,
    exercises: plan.exercises.map(ex => ({
      exerciseId: ex.exerciseId,
      targetSets: ex.targetSets,
      targetReps: ex.targetReps,
      restSeconds: ex.restSeconds,
    })),
    createdAt: now,
    updatedAt: now,
  };
};
