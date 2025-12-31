// Types
export type { ChatMessage, ExerciseStats } from './types';

// Client utilities
export { callOpenAI, parseJSONResponse } from './client';

// History utilities
export { createHistoryContext, analyzeExercisePerformance } from './history';

// Main functions
export { getProgressiveOverloadRecommendations } from './recommendations';
export { getPreWorkoutSuggestions } from './suggestions';
export { getWorkoutScore } from './scoring';
export { generateWorkoutPlan, createTemplateFromPlan, WORKOUT_TYPE_MUSCLES } from './planGenerator';
export type { WorkoutType, GeneratePlanInput, GeneratedPlan } from './planGenerator';
