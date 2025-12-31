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
