// Types
export type { ChatMessage, ExerciseStats } from './types';

// Client utilities
export { callOpenAI, parseJSONResponse } from './client';

// History utilities
export { createHistoryContext, analyzeExercisePerformance } from './history';

// Main functions
export { sendChatMessage } from './chat';
export { getProgressiveOverloadRecommendations } from './recommendations';
export { getPreWorkoutSuggestions } from './suggestions';
export { getWorkoutScore } from './scoring';
