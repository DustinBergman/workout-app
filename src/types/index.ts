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

// Cardio Categories (for bespoke template fields)
export type CardioCategory = 'distance' | 'interval' | 'laps' | 'duration' | 'other';

// Map CardioType to CardioCategory
export const CARDIO_TYPE_TO_CATEGORY: Record<CardioType, CardioCategory> = {
  running: 'distance',
  walking: 'distance',
  cycling: 'distance',
  hiking: 'distance',
  hiit: 'interval',
  boxing: 'interval',
  swimming: 'laps',
  rowing: 'duration',
  elliptical: 'duration',
  'stair-climber': 'duration',
  other: 'other',
};

// Template Type (strength or cardio)
export type TemplateType = 'strength' | 'cardio';

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
    weightAdjustment: 'Based on recent performance',
    repRange: '8-10 reps',
  },
  1: {
    week: 1,
    name: 'Light Overload',
    description: 'Small weight increase with lower reps',
    weightAdjustment: 'Progression-based increase',
    repRange: '6-8 reps',
  },
  2: {
    week: 2,
    name: 'Volume Focus',
    description: 'Keep heavier weight, build reps',
    weightAdjustment: 'Keep Week 2 weight',
    repRange: '7-9 reps',
  },
  3: {
    week: 3,
    name: 'Strength Push',
    description: 'Heavy weights with low reps for strength',
    weightAdjustment: 'Push for PR if progression supports it',
    repRange: '5-6 reps',
  },
  4: {
    week: 4,
    name: 'Deload',
    description: 'Recovery week with reduced intensity',
    weightAdjustment: 'Reduce by 20-30%',
    repRange: '8-12 reps',
  },
};

// Lose Weight Weeks - Fatigue Management Cycle
export const LOSE_WEIGHT_WEEKS: Record<ProgressiveOverloadWeek, WeekInfo> = {
  0: {
    week: 0,
    name: 'Baseline Strength',
    description: 'Establish maintenance weights',
    weightAdjustment: 'Current weights',
    repRange: '6-10 reps',
  },
  1: {
    week: 1,
    name: 'Volume Reduction',
    description: 'Same weights, fewer sets to manage fatigue',
    weightAdjustment: 'Same weight',
    repRange: '6-8 reps, -1 set',
  },
  2: {
    week: 2,
    name: 'Intensity Focus',
    description: 'Heavy weights, minimal volume',
    weightAdjustment: 'Same weight',
    repRange: '4-6 reps',
  },
  3: {
    week: 3,
    name: 'Moderate Recovery',
    description: 'Slightly lighter, moderate volume',
    weightAdjustment: '-10%',
    repRange: '8-10 reps',
  },
  4: {
    week: 4,
    name: 'Full Deload',
    description: 'Light recovery week',
    weightAdjustment: '-30%',
    repRange: '10-12 reps',
  },
};

// Maintain Weeks - Intensity Wave Cycle
export const MAINTAIN_WEEKS: Record<ProgressiveOverloadWeek, WeekInfo> = {
  0: {
    week: 0,
    name: 'Standard',
    description: 'Baseline moderate training',
    weightAdjustment: 'Current weights',
    repRange: '8-12 reps',
  },
  1: {
    week: 1,
    name: 'Light Wave',
    description: 'Reduced intensity, higher reps',
    weightAdjustment: '-10-15%',
    repRange: '12-15 reps',
  },
  2: {
    week: 2,
    name: 'Moderate Push',
    description: 'Slightly heavier weights',
    weightAdjustment: '+5%',
    repRange: '8-10 reps',
  },
  3: {
    week: 3,
    name: 'Heavy Wave',
    description: 'Intensity peak week',
    weightAdjustment: '+10%',
    repRange: '6-8 reps',
  },
  4: {
    week: 4,
    name: 'Recovery',
    description: 'Light deload week',
    weightAdjustment: '-20%',
    repRange: '10-12 reps',
  },
};

// Workout Goals
export type WorkoutGoal = 'build' | 'lose' | 'maintain';

// Helper function to get week config for a goal
export const getWeekConfigForGoal = (goal: WorkoutGoal): Record<ProgressiveOverloadWeek, WeekInfo> => {
  switch (goal) {
    case 'build':
      return PROGRESSIVE_OVERLOAD_WEEKS;
    case 'lose':
      return LOSE_WEIGHT_WEEKS;
    case 'maintain':
      return MAINTAIN_WEEKS;
  }
};

// Experience Level
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface GoalInfo {
  goal: WorkoutGoal;
  name: string;
  description: string;
  cycleName: string;
  defaultRepRange: string;
  aiGuidance: string;
}

export const WORKOUT_GOALS: Record<WorkoutGoal, GoalInfo> = {
  build: {
    goal: 'build',
    name: 'Build Muscle',
    description: '5-week progressive overload cycle',
    cycleName: 'Progressive Overload',
    defaultRepRange: '6-12 reps',
    aiGuidance: 'Focus on progressive overload. Follow the current week\'s guidance for weight adjustments and rep ranges. Aim to increase weight or reps over time.',
  },
  lose: {
    goal: 'lose',
    name: 'Lose Weight',
    description: '5-week fatigue management cycle',
    cycleName: 'Fatigue Management',
    defaultRepRange: '6-10 reps',
    aiGuidance: 'Manage fatigue while preserving muscle mass during caloric deficit. Follow the week\'s guidance for volume and intensity adjustments. Prioritize form and recovery.',
  },
  maintain: {
    goal: 'maintain',
    name: 'Maintain',
    description: '5-week intensity wave cycle',
    cycleName: 'Intensity Waves',
    defaultRepRange: '8-12 reps',
    aiGuidance: 'Follow the intensity wave pattern to prevent staleness while maintaining fitness. Vary intensity week to week for sustainable training.',
  },
};

// Workout Mood - 5 levels from terrible to amazing
export type WorkoutMood = 1 | 2 | 3 | 4 | 5;

export interface WorkoutMoodConfig {
  emoji: string;
  label: string;
}

export const WORKOUT_MOOD_CONFIG: Record<WorkoutMood, WorkoutMoodConfig> = {
  1: { emoji: '😫', label: 'Terrible' },
  2: { emoji: '😓', label: 'Tough' },
  3: { emoji: '😐', label: 'Okay' },
  4: { emoji: '😊', label: 'Good' },
  5: { emoji: '🔥', label: 'Amazing' },
};

// Personal Best record
export interface PersonalBest {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | '1rm';
  value: number;
  unit: WeightUnit;
  reps?: number;
}

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

// Tracking mode for cardio exercises
export type CardioTrackingMode = 'detailed' | 'simple';

// Base Cardio Template Exercise fields
interface BaseCardioTemplateExercise {
  type: 'cardio';
  exerciseId: string;
  restSeconds?: number;
  trackingMode?: CardioTrackingMode; // 'detailed' = category-specific fields, 'simple' = duration/calories
  targetCalories?: number;           // Available in simple mode for all types
}

// Distance-based cardio (Running, Walking, Cycling, Hiking)
export interface DistanceCardioTemplateExercise extends BaseCardioTemplateExercise {
  cardioCategory: 'distance';
  targetDistance?: number;        // in user's preferred unit (mi/km)
  targetDurationMinutes?: number; // e.g., 30 minutes
}

// Interval-based cardio (HIIT, Boxing)
export interface IntervalCardioTemplateExercise extends BaseCardioTemplateExercise {
  cardioCategory: 'interval';
  rounds?: number;                    // e.g., 8 rounds
  workSeconds?: number;               // e.g., 30 seconds work
  restBetweenRoundsSeconds?: number;  // e.g., 15 seconds rest between rounds
}

// Lap-based cardio (Swimming)
export interface LapCardioTemplateExercise extends BaseCardioTemplateExercise {
  cardioCategory: 'laps';
  targetLaps?: number;            // e.g., 20 laps
  targetDistance?: number;        // alternative to laps
  targetDurationMinutes?: number;
}

// Duration-based cardio (Rowing, Elliptical, Stair-climber)
export interface DurationCardioTemplateExercise extends BaseCardioTemplateExercise {
  cardioCategory: 'duration';
  targetDurationMinutes?: number;
  targetIntensity?: 'low' | 'moderate' | 'high';
}

// Other cardio (catch-all)
export interface OtherCardioTemplateExercise extends BaseCardioTemplateExercise {
  cardioCategory: 'other';
  targetDurationMinutes?: number;
  notes?: string;
}

// Cardio Template Exercise Union Type
export type CardioTemplateExercise =
  | DistanceCardioTemplateExercise
  | IntervalCardioTemplateExercise
  | LapCardioTemplateExercise
  | DurationCardioTemplateExercise
  | OtherCardioTemplateExercise;

// Template Exercise Union Type
export type TemplateExercise = StrengthTemplateExercise | CardioTemplateExercise;

// Attribution for copied templates
export interface TemplateCopiedFrom {
  userId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}

// Workout Template
export interface WorkoutTemplate {
  id: string;
  name: string;
  templateType: TemplateType;  // 'strength' or 'cardio'
  exercises: TemplateExercise[];
  copiedFrom?: TemplateCopiedFrom;  // Attribution if copied from another user
  inRotation: boolean;  // Whether this template is in the current workout rotation
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
// Can track either distance or calories (for HIIT/interval workouts)
export interface CardioCompletedSet {
  type: 'cardio';
  distance?: number;        // Optional - used for distance-based cardio
  distanceUnit?: DistanceUnit; // Optional - only needed when distance is set
  calories?: number;        // Optional - used for HIIT/interval cardio
  durationSeconds: number;
  completedAt: string;
}

// Completed Set Union Type
export type CompletedSet = StrengthCompletedSet | CardioCompletedSet;

// Strength Session Exercise (exercise with logged sets during a workout)
export interface StrengthSessionExercise {
  id?: string;
  type: 'strength';
  exerciseId: string;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  sets: CompletedSet[];
}

// Cardio Session Exercise
export interface CardioSessionExercise {
  id?: string;
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
  customTitle?: string;
  mood?: WorkoutMood;
  progressiveOverloadWeek?: ProgressiveOverloadWeek;
  workoutGoal?: WorkoutGoal;
  personalBests?: PersonalBest[];
  streakCount?: number;
  startedAt: string;
  completedAt?: string;
  exercises: SessionExercise[];
  // AI suggestions for this workout (only used during active session)
  suggestions?: ExerciseSuggestion[];
}

// User Preferences
export interface UserPreferences {
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  defaultRestSeconds: number;
  openaiApiKey?: string;
  darkMode: boolean;
  emailNotificationsEnabled?: boolean;
  firstName?: string;
  lastName?: string;
  experienceLevel?: ExperienceLevel;
  weeklyWorkoutGoal?: number; // Target workouts per week (default 4)
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

// Re-export cycle types
export * from './cycles';
