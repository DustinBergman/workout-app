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

// Exercise Definition
export interface Exercise {
  id: string;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  instructions?: string;
}

// Template Exercise (what's saved in a workout template)
export interface TemplateExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
}

// Workout Template
export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: string;
  updatedAt: string;
}

// Completed Set (during an active workout)
export interface CompletedSet {
  reps: number;
  weight: number;
  unit: WeightUnit;
  completedAt: string;
}

// Session Exercise (exercise with logged sets during a workout)
export interface SessionExercise {
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  sets: CompletedSet[];
}

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
  defaultRestSeconds: number;
  openaiApiKey?: string;
  darkMode: boolean;
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

// Pre-workout AI Suggestion
export interface ExerciseSuggestion {
  exerciseId: string;
  suggestedWeight: number;
  suggestedReps: number;
  reasoning: string;
  confidence: 'high' | 'medium' | 'low';
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
