// Types
export type { ChatMessage, ExerciseStats } from './types';

// Client utilities
export { callOpenAI, parseJSONResponse } from './client';

// History utilities
export { createHistoryContext, analyzeExercisePerformance } from './history';

// Main functions
export { getProgressiveOverloadRecommendations, createSessionsHash, hasValidRecommendationsCache } from './recommendations';
export { getPreWorkoutSuggestions } from './suggestions';
export { getWorkoutScore } from './scoring';
export { generateWorkoutPlan, generateCardioPlan, createTemplateFromPlan, createCardioTemplateFromPlan, WORKOUT_TYPE_MUSCLES } from './planGenerator';
export type { WorkoutType, GeneratePlanInput, GeneratedPlan, GeneratedCardioPlan } from './planGenerator';

// PT Summary
export { getPTSummary, hasValidPTSummaryCache, clearPTSummaryCache } from './ptSummary';
export type { PTSummaryResponse, PTComponent, StatCardComponent, ProgressIndicatorComponent, HighlightBadgeComponent, TipComponent } from './ptSummary';
