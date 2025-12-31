import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { WorkoutSession, WorkoutTemplate, ExerciseSuggestion } from '../types';
import { getPreWorkoutSuggestions } from '../services/openai';

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

interface UseStartWorkoutReturn {
  isLoadingSuggestions: boolean;
  startWorkout: (template: WorkoutTemplate) => Promise<void>;
  startQuickWorkout: () => void;
}

export const useStartWorkout = (): UseStartWorkoutReturn => {
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const navigate = useNavigate();
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const startWorkout = useCallback(async (template: WorkoutTemplate) => {
    const session: WorkoutSession = {
      id: generateId(),
      templateId: template.id,
      name: template.name,
      startedAt: new Date().toISOString(),
      exercises: template.exercises.map((e) => ({
        exerciseId: e.exerciseId,
        targetSets: e.targetSets,
        targetReps: e.targetReps,
        restSeconds: e.restSeconds,
        sets: [],
      })),
    };
    setActiveSession(session);

    // Get AI suggestions if API key exists and there's workout history
    let suggestions: ExerciseSuggestion[] = [];
    if (preferences.openaiApiKey && sessions.length > 0) {
      setIsLoadingSuggestions(true);
      try {
        suggestions = await getPreWorkoutSuggestions(
          preferences.openaiApiKey,
          template,
          sessions,
          preferences.weightUnit
        );
      } catch (err) {
        console.error('Failed to get suggestions:', err);
        // Continue without suggestions on error
      } finally {
        setIsLoadingSuggestions(false);
      }
    }

    navigate('/workout', { state: { suggestions } });
  }, [sessions, preferences, setActiveSession, navigate]);

  const startQuickWorkout = useCallback(() => {
    const session: WorkoutSession = {
      id: generateId(),
      name: 'Quick Workout',
      startedAt: new Date().toISOString(),
      exercises: [],
    };
    setActiveSession(session);
    navigate('/workout');
  }, [setActiveSession, navigate]);

  return {
    isLoadingSuggestions,
    startWorkout,
    startQuickWorkout,
  };
};
