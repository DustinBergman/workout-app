import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { WorkoutSession, WorkoutTemplate } from '../types';
import { getPreWorkoutSuggestions } from '../services/openai';

const generateId = (): string => {
  return crypto.randomUUID();
};

interface UseStartWorkoutReturn {
  isLoadingSuggestions: boolean;
  startWorkout: (template: WorkoutTemplate) => Promise<void>;
  startQuickWorkout: () => void;
}

export const useStartWorkout = (): UseStartWorkoutReturn => {
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const currentWeek = useAppStore((state) => state.currentWeek);
  const workoutGoal = useAppStore((state) => state.workoutGoal);
  const weightEntries = useAppStore((state) => state.weightEntries);
  const setActiveSession = useAppStore((state) => state.setActiveSession);
  const setSuggestions = useCurrentWorkoutStore((state) => state.setSuggestions);
  const navigate = useNavigate();
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const startWorkout = useCallback(async (template: WorkoutTemplate) => {
    const session: WorkoutSession = {
      id: generateId(),
      templateId: template.id,
      name: template.name,
      startedAt: new Date().toISOString(),
      exercises: template.exercises.map((e) => {
        if (e.type === 'cardio') {
          return {
            id: generateId(),
            type: 'cardio' as const,
            exerciseId: e.exerciseId,
            restSeconds: e.restSeconds ?? preferences.defaultRestSeconds,
            sets: [],
          };
        }
        return {
          id: generateId(),
          type: 'strength' as const,
          exerciseId: e.exerciseId,
          targetSets: e.targetSets ?? 3,
          targetReps: e.targetReps ?? 10,
          restSeconds: e.restSeconds ?? preferences.defaultRestSeconds,
          sets: [],
        };
      }),
    };
    setActiveSession(session);

    // Get AI suggestions if API key exists and there's workout history
    if (preferences.openaiApiKey && sessions.length > 0) {
      setIsLoadingSuggestions(true);
      try {
        const suggestions = await getPreWorkoutSuggestions(
          preferences.openaiApiKey,
          template,
          sessions,
          preferences.weightUnit,
          currentWeek,
          workoutGoal,
          weightEntries,
          preferences.experienceLevel || 'intermediate'
        );
        setSuggestions(suggestions);
      } catch (err) {
        console.error('Failed to get suggestions:', err);
        // Continue without suggestions on error
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else {
      setSuggestions([]);
    }

    navigate('/workout');
  }, [sessions, preferences, currentWeek, workoutGoal, weightEntries, setActiveSession, setSuggestions, navigate]);

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
