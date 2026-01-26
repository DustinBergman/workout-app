import { StrengthExercise, CardioExercise, MuscleGroup, Equipment, CardioType, WorkoutTemplate, StrengthTemplateExercise, CardioTemplateExercise, Exercise, CARDIO_TYPE_TO_CATEGORY } from '../../types';
import { getAllExercises } from '../../data/exercises';
import { callOpenAI, parseJSONResponse } from './client';

// Workout type options
export type WorkoutType = 'full-body' | 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'custom' | 'cardio';

// Mapping of workout types to target muscle groups (excludes cardio since it doesn't use muscle groups)
export const WORKOUT_TYPE_MUSCLES: Record<Exclude<WorkoutType, 'custom' | 'cardio'>, MuscleGroup[]> = {
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
  selectedCardioTypes?: CardioType[];
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

export interface GeneratedCardioPlan {
  name: string;
  exercises: Array<{
    exerciseId: string;
    restSeconds?: number;
  }>;
}

const SYSTEM_PROMPT = `You are an AI fitness assistant that creates personalized workout plans.

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
  availableExercises: StrengthExercise[]
): string => {
  const targetMuscles = input.workoutType === 'custom' || input.workoutType === 'cardio'
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

  // Filter to strength exercises only (plan generator doesn't support cardio)
  const strengthExercises = allExercises.filter(
    (ex): ex is StrengthExercise => ex.type === 'strength'
  );

  // Filter exercises by available equipment
  const exercisesWithEquipment = strengthExercises.filter(
    ex => input.availableEquipment.includes(ex.equipment)
  );

  // Get target muscles for this workout type
  const targetMuscles = input.workoutType === 'custom' || input.workoutType === 'cardio'
    ? input.customMuscleGroups || []
    : WORKOUT_TYPE_MUSCLES[input.workoutType];

  // Filter to exercises that target relevant muscles
  const relevantExercises = exercisesWithEquipment.filter(
    ex => ex.muscleGroups.some((mg: MuscleGroup) => targetMuscles.includes(mg))
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
  const exercises: StrengthTemplateExercise[] = plan.exercises.map(ex => ({
    type: 'strength' as const,
    exerciseId: ex.exerciseId,
    targetSets: ex.targetSets,
    targetReps: ex.targetReps,
    restSeconds: ex.restSeconds,
  }));
  return {
    id: crypto.randomUUID(),
    name: customName || plan.name,
    templateType: 'strength',
    exercises,
    inRotation: true,
    createdAt: now,
    updatedAt: now,
  };
};

// ============== CARDIO PLAN GENERATION ==============

const CARDIO_SYSTEM_PROMPT = `You are a professional fitness coach AI that creates personalized cardio training plans.

IMPORTANT RULES:
1. Only use exercises from the provided cardio exercise list - do not invent exercises
2. Select exercises that match the user's preferred cardio types
3. Order exercises strategically for an effective cardio session
4. Respond ONLY with valid JSON - no explanations or markdown

Guidelines for cardio workouts:
- Consider starting with a lower intensity warmup activity if appropriate
- Place higher intensity activities after warmup
- Mix activities for variety if multiple types are selected
- Rest between activities: 30-60 seconds for continuous flow, 60-120 seconds for interval-style`;

const buildCardioUserPrompt = (
  input: GeneratePlanInput,
  availableExercises: CardioExercise[]
): string => {
  const cardioTypes = input.selectedCardioTypes?.join(', ') || 'any';

  return `Create a cardio workout plan with the following requirements:

PREFERRED CARDIO TYPES: ${cardioTypes}

NUMBER OF EXERCISES: ${input.numberOfExercises}

${input.additionalComments ? `USER NOTES: ${input.additionalComments}` : ''}

AVAILABLE EXERCISES (you MUST only choose from this list):
${JSON.stringify(availableExercises.map(e => ({
  id: e.id,
  name: e.name,
  cardioType: e.cardioType
})), null, 2)}

Respond with a JSON object in this exact format:
{
  "name": "Suggested cardio workout name",
  "exercises": [
    {
      "exerciseId": "exact-id-from-list",
      "restSeconds": 60
    }
  ]
}`;
};

export const generateCardioPlan = async (
  apiKey: string,
  input: GeneratePlanInput,
  customExercises: Exercise[] = []
): Promise<GeneratedCardioPlan> => {
  const allExercises = getAllExercises(customExercises);

  // Filter to cardio exercises only
  const cardioExercises = allExercises.filter(
    (ex): ex is CardioExercise => ex.type === 'cardio'
  );

  // Filter by selected cardio types if specified
  const relevantExercises = input.selectedCardioTypes?.length
    ? cardioExercises.filter(ex => input.selectedCardioTypes!.includes(ex.cardioType))
    : cardioExercises;

  if (relevantExercises.length === 0) {
    throw new Error('No cardio exercises match your selected types. Try selecting more cardio types.');
  }

  const userPrompt = buildCardioUserPrompt(input, relevantExercises);

  const content = await callOpenAI({
    apiKey,
    messages: [
      { role: 'system', content: CARDIO_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt }
    ],
    maxTokens: 1000,
    temperature: 0.3,
  });

  // Parse and validate response
  const parsed = parseJSONResponse<GeneratedCardioPlan>(content, {
    name: 'AI Generated Cardio Workout',
    exercises: []
  });

  // Validate that all exercise IDs exist
  const validExerciseIds = new Set(allExercises.map(e => e.id));
  const validatedExercises = parsed.exercises.filter(
    ex => validExerciseIds.has(ex.exerciseId)
  );

  if (validatedExercises.length === 0) {
    throw new Error('AI failed to generate a valid cardio plan. Please try again.');
  }

  return {
    name: parsed.name || 'AI Generated Cardio Workout',
    exercises: validatedExercises
  };
};

// Helper to convert GeneratedCardioPlan to WorkoutTemplate
export const createCardioTemplateFromPlan = (
  plan: GeneratedCardioPlan,
  customName?: string,
  customExercises: Exercise[] = []
): WorkoutTemplate => {
  const now = new Date().toISOString();
  const allExercises = getAllExercises(customExercises);

  const exercises: CardioTemplateExercise[] = plan.exercises.map(ex => {
    // Look up the exercise to get its cardio type
    const exerciseInfo = allExercises.find(e => e.id === ex.exerciseId);
    const cardioType = exerciseInfo?.type === 'cardio' ? (exerciseInfo as CardioExercise).cardioType : 'other';
    const category = CARDIO_TYPE_TO_CATEGORY[cardioType];

    const base = {
      type: 'cardio' as const,
      exerciseId: ex.exerciseId,
      restSeconds: ex.restSeconds ?? 60,
    };

    // Create bespoke exercise based on category
    if (category === 'distance') {
      return { ...base, cardioCategory: 'distance' as const, targetDurationMinutes: 30 };
    } else if (category === 'interval') {
      return { ...base, cardioCategory: 'interval' as const, rounds: 4, workSeconds: 30, restBetweenRoundsSeconds: 15 };
    } else if (category === 'laps') {
      return { ...base, cardioCategory: 'laps' as const, targetLaps: 20 };
    } else if (category === 'duration') {
      return { ...base, cardioCategory: 'duration' as const, targetDurationMinutes: 20, targetIntensity: 'moderate' as const };
    } else {
      return { ...base, cardioCategory: 'other' as const, targetDurationMinutes: 20 };
    }
  });

  return {
    id: crypto.randomUUID(),
    name: customName || plan.name,
    templateType: 'cardio',
    exercises,
    inRotation: true,
    createdAt: now,
    updatedAt: now,
  };
};
