import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { WorkoutSession, WorkoutTemplate } from '../types';
import { getPreWorkoutSuggestions } from '../services/openai';
import { getLocalSuggestions } from '../services/localSuggestions';

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
  const cycleConfig = useAppStore((state) => state.cycleConfig);
  const cycleState = useAppStore((state) => state.cycleState);
  const navigate = useNavigate();
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Get current phase if using new cycle system
  const currentPhase = cycleConfig && cycleState
    ? cycleConfig.phases[cycleState.currentPhaseIndex]
    : undefined;

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

    // Get AI suggestions if API key exists, there's workout history, and not in baseline week
    // Week 0 is the baseline week - no AI suggestions needed since we're establishing baseline performance
    if (preferences.openaiApiKey && sessions.length > 0 && currentWeek !== 0) {
      setIsLoadingSuggestions(true);
      try {
        // Add timeout to ensure workout starts even if API is slow/hanging
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Suggestions request timed out')), 30000)
        );

        const suggestions = await Promise.race([
          getPreWorkoutSuggestions(
            preferences.openaiApiKey,
            template,
            sessions,
            preferences.weightUnit,
            currentWeek,
            workoutGoal,
            weightEntries,
            preferences.experienceLevel || 'intermediate',
            currentPhase
          ),
          timeoutPromise,
        ]);
        // Save suggestions to the session so they persist
        setActiveSession({ ...session, suggestions });
      } catch (err) {
        console.error('Failed to get suggestions:', err);
        // Continue without suggestions on error (API failure, timeout, out of credits, etc.)
      } finally {
        setIsLoadingSuggestions(false);
      }
    } else if (!preferences.openaiApiKey && sessions.length > 0 && currentWeek !== 0) {
      // No API key — use local suggestion engine (synchronous, no loading state needed)
      try {
        const suggestions = getLocalSuggestions(
          template,
          sessions,
          preferences.weightUnit,
          currentWeek,
          workoutGoal,
          preferences.experienceLevel || 'intermediate',
          currentPhase
        );
        if (suggestions.length > 0) {
          setActiveSession({ ...session, suggestions });
        }
      } catch (err) {
        console.error('Failed to get local suggestions:', err);
      }
    }

    navigate('/workout');
  }, [sessions, preferences, currentWeek, workoutGoal, weightEntries, setActiveSession, navigate, currentPhase]);

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
