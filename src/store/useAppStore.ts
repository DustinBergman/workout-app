import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import {
  WorkoutTemplate,
  WorkoutSession,
  UserPreferences,
  Exercise,
  ProgressiveOverloadWeek,
  WorkoutGoal,
  WeightEntry,
} from '../types';

interface AppState {
  // State
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  preferences: UserPreferences;
  customExercises: Exercise[];
  currentWeek: ProgressiveOverloadWeek;
  weekStartedAt: string | null;
  workoutGoal: WorkoutGoal;
  hasCompletedIntro: boolean;
  weightEntries: WeightEntry[];

  // Template actions
  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (templateId: string) => void;

  // Session actions
  addSession: (session: WorkoutSession) => void;
  updateSession: (session: WorkoutSession) => void;
  setActiveSession: (session: WorkoutSession | null) => void;

  // Preference actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Custom exercise actions
  addCustomExercise: (exercise: Exercise) => void;

  // Progressive overload week actions
  setCurrentWeek: (week: ProgressiveOverloadWeek) => void;
  advanceWeek: () => void;

  // Workout goal actions
  setWorkoutGoal: (goal: WorkoutGoal) => void;

  // Intro actions
  setHasCompletedIntro: (value: boolean) => void;

  // Weight tracking actions
  addWeightEntry: (weight: number) => void;
  deleteWeightEntry: (date: string) => void;
}

const defaultPreferences: UserPreferences = {
  weightUnit: 'lbs',
  distanceUnit: 'mi',
  defaultRestSeconds: 90,
  darkMode: false,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        // Initial state
        templates: [],
        sessions: [],
        activeSession: null,
        preferences: defaultPreferences,
        customExercises: [],
        currentWeek: 0 as ProgressiveOverloadWeek,
        weekStartedAt: null,
        workoutGoal: 'build' as WorkoutGoal,
        hasCompletedIntro: false,
        weightEntries: [],

        // Template actions
        addTemplate: (template) =>
          set((state) => ({
            templates: [...state.templates, template],
          })),

        updateTemplate: (template) =>
          set((state) => ({
            templates: state.templates.map((t) =>
              t.id === template.id ? template : t
            ),
          })),

        deleteTemplate: (templateId) =>
          set((state) => ({
            templates: state.templates.filter((t) => t.id !== templateId),
          })),

        // Session actions
        addSession: (session) =>
          set((state) => ({
            sessions: [...state.sessions, session],
          })),

        updateSession: (session) =>
          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === session.id ? session : s
            ),
          })),

        setActiveSession: (session) =>
          set(() => ({
            activeSession: session,
          })),

        // Preference actions
        updatePreferences: (preferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...preferences },
          })),

        // Custom exercise actions
        addCustomExercise: (exercise) =>
          set((state) => ({
            customExercises: [...state.customExercises, exercise],
          })),

        // Progressive overload week actions
        setCurrentWeek: (week) =>
          set(() => ({
            currentWeek: week,
            weekStartedAt: new Date().toISOString(),
          })),

        advanceWeek: () =>
          set((state) => ({
            currentWeek: ((state.currentWeek + 1) % 5) as ProgressiveOverloadWeek,
            weekStartedAt: new Date().toISOString(),
          })),

        // Workout goal actions
        setWorkoutGoal: (goal) =>
          set(() => ({
            workoutGoal: goal,
          })),

        // Intro actions
        setHasCompletedIntro: (value) =>
          set(() => ({
            hasCompletedIntro: value,
          })),

        // Weight tracking actions
        addWeightEntry: (weight) =>
          set((state) => ({
            weightEntries: [
              ...state.weightEntries,
              {
                date: new Date().toISOString(),
                weight,
                unit: state.preferences.weightUnit,
              },
            ],
          })),

        deleteWeightEntry: (date) =>
          set((state) => ({
            weightEntries: state.weightEntries.filter((e) => e.date !== date),
          })),
      }),
      {
        name: 'workout-app-storage',
      }
    )
  )
);

// Subscribe to dark mode changes and update document class
useAppStore.subscribe(
  (state) => state.preferences.darkMode,
  (darkMode) => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
  { fireImmediately: true }
);
