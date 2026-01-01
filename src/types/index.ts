// Muscle Groups
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'traps'
  | 'lats';

// Equipment Types
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'ez-bar'
  | 'smith-machine'
  | 'resistance-band'
  | 'other';

// Weight Units
export type WeightUnit = 'lbs' | 'kg';

// Distance Units
export type DistanceUnit = 'mi' | 'km';

// Body Weight Entry
export interface WeightEntry {
  date: string;
  weight: number;
  unit: WeightUnit;
}

// Exercise Types
export type ExerciseType = 'strength' | 'cardio';

// Cardio Activity Types
export type CardioType =
  | 'running'
  | 'walking'
  | 'cycling'
  | 'rowing'
  | 'elliptical'
  | 'stair-climber'
  | 'swimming'
  | 'hiking'
  | 'hiit'
  | 'boxing'
  | 'other';

// Progressive Overload Week (0-4)
export type ProgressiveOverloadWeek = 0 | 1 | 2 | 3 | 4;

// Week Info for Progressive Overload
export interface WeekInfo {
  week: ProgressiveOverloadWeek;
  name: string;
  description: string;
  weightAdjustment: string;
  repRange: string;
}

export const PROGRESSIVE_OVERLOAD_WEEKS: Record<ProgressiveOverloadWeek, WeekInfo> = {
  0: {
    week: 0,
    name: 'Baseline',
    description: 'Establish your current working weights',
    weightAdjustment: 'Current weights',
    repRange: '8-12 reps',
  },
  1: {
    week: 1,
    name: 'Light Overload',
    description: 'Small weight increase with slightly lower reps',
    weightAdjustment: '+2-5%',
    repRange: '8-10 reps',
  },
  2: {
    week: 2,
    name: 'Volume Focus',
    description: 'Maintain weight, increase total volume',
    weightAdjustment: 'Same as Week 2',
    repRange: '10-12 reps or +1 set',
  },
  3: {
    week: 3,
    name: 'Strength Push',
    description: 'Heavier weights with lower reps for strength',
    weightAdjustment: '+5-10%',
    repRange: '6-8 reps',
  },
  4: {
    week: 4,
    name: 'Deload',
    description: 'Recovery week with reduced intensity',
    weightAdjustment: '-20-30%',
    repRange: '8-12 reps',
  },
};

// Workout Goals
export type WorkoutGoal = 'build' | 'lose' | 'maintain';

export interface GoalInfo {
  goal: WorkoutGoal;
  name: string;
  description: string;
  useProgressiveOverload: boolean;
  defaultRepRange: string;
  aiGuidance: string;
}

export const WORKOUT_GOALS: Record<WorkoutGoal, GoalInfo> = {
  build: {
    goal: 'build',
    name: 'Build Muscle',
    description: 'Progressive overload to gain strength and size',
    useProgressiveOverload: true,
    defaultRepRange: '6-12 reps',
    aiGuidance: 'Focus on progressive overload. Follow the current week\'s guidance for weight adjustments and rep ranges. Aim to increase weight or reps over time.',
  },
  lose: {
    goal: 'lose',
    name: 'Lose Weight',
    description: 'Preserve muscle while in caloric deficit',
    useProgressiveOverload: false,
    defaultRepRange: '6-10 reps',
    aiGuidance: 'Maintain current working weights to preserve muscle mass during caloric deficit. Do NOT suggest weight increases - the body cannot build muscle in a deficit. Keep weights heavy (6-10 reps) to signal muscle retention. Prioritize form and recovery.',
  },
  maintain: {
    goal: 'maintain',
    name: 'Maintain',
    description: 'Keep current fitness level steady',
    useProgressiveOverload: false,
    defaultRepRange: '8-12 reps',
    aiGuidance: 'Maintain consistent weights and volume. No progression needed - focus on sustainable, comfortable training. Keep rep ranges moderate (8-12 reps). Suggest same weights as previous sessions.',
  },
};

// Base Exercise fields shared by all types
interface BaseExercise {
  id: string;
  name: string;
  instructions?: string;
  imageUrl?: string;
}

// Strength Exercise Definition
export interface StrengthExercise extends BaseExercise {
  type: 'strength';
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
}

// Cardio Exercise Definition
export interface CardioExercise extends BaseExercise {
  type: 'cardio';
  cardioType: CardioType;
}

// Exercise Union Type
export type Exercise = StrengthExercise | CardioExercise;

// Strength Template Exercise (what's saved in a workout template)
export interface StrengthTemplateExercise {
  type: 'strength';
  exerciseId: string;
  targetSets?: number;
  targetReps?: number;
  restSeconds?: number;
}

// Cardio Template Exercise
export interface CardioTemplateExercise {
  type: 'cardio';
  exerciseId: string;
  restSeconds?: number;
}

// Template Exercise Union Type
export type TemplateExercise = StrengthTemplateExercise | CardioTemplateExercise;

// Workout Template
export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

// Strength Completed Set (during an active workout)
export interface StrengthCompletedSet {
  type: 'strength';
  reps: number;
  weight: number;
  unit: WeightUnit;
  completedAt: string;
}

// Cardio Completed Set (during an active workout)
export interface CardioCompletedSet {
  type: 'cardio';
  distance: number;
  distanceUnit: DistanceUnit;
  durationSeconds: number;
  completedAt: string;
}

// Completed Set Union Type
export type CompletedSet = StrengthCompletedSet | CardioCompletedSet;

// Strength Session Exercise (exercise with logged sets during a workout)
export interface StrengthSessionExercise {
  type: 'strength';
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  sets: CompletedSet[];
}

// Cardio Session Exercise
export interface CardioSessionExercise {
  type: 'cardio';
  exerciseId: string;
  restSeconds: number;
  sets: CompletedSet[];
}

// Session Exercise Union Type
export type SessionExercise = StrengthSessionExercise | CardioSessionExercise;

// Workout Session (an active or completed workout)
export interface WorkoutSession {
  id: string;
  templateId?: string;
  name: string;
  startedAt: string;
  completedAt?: string;
  exercises: SessionExercise[];
}

// User Preferences
export interface UserPreferences {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  defaultRestSeconds: number;
  openaiApiKey?: string;
  darkMode: boolean;
  firstName?: string;
  lastName?: string;
}

// AI Assistant Message
export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// AI Recommendation
export interface WorkoutRecommendation {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  recommendedWeight: number;
  currentReps: number;
  recommendedReps: number;
  reason: string;
  type: 'increase' | 'decrease' | 'maintain';
}

// Progress status for exercise analysis
export type ExerciseProgressStatus = 'improving' | 'plateau' | 'declining' | 'new';

// Rep range change suggestion
export interface RepRangeChange {
  from: string;   // e.g., "8-12"
  to: string;     // e.g., "5-8" or "12-15"
  reason: string; // e.g., "Break through plateau with heavier weight"
}

// Pre-workout AI Suggestion
export interface ExerciseSuggestion {
  exerciseId: string;
  suggestedWeight: number;
  suggestedReps: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
  // Enhanced fields for plateau detection
  progressStatus?: ExerciseProgressStatus;
  techniqueTip?: string;  // Only when plateau detected
  repRangeChange?: RepRangeChange;
}

// Post-workout AI Score
export interface WorkoutScoreResult {
  score: number;
  grade: string;
  summary: string;
  highlights: string[];
  improvements: string[];
}

// App State
export interface AppState {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  preferences: UserPreferences;
  customExercises: Exercise[];
}

// Storage Keys
export const STORAGE_KEYS = {
  TEMPLATES: 'workout-app-templates',
  SESSIONS: 'workout-app-sessions',
  PREFERENCES: 'workout-app-preferences',
  ACTIVE_SESSION: 'workout-app-active-session',
  CUSTOM_EXERCISES: 'workout-app-custom-exercises',
} as const;
