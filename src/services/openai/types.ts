export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  recentSets: Array<{
    date: string;
    weight: number;
    reps: number;
    unit: string;
  }>;
  averageWeight: number;
  averageReps: number;
  trend: 'improving' | 'plateau' | 'declining' | 'insufficient_data';
}
