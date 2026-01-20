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
  CARDIO_TYPE_TO_CATEGORY,
  CardioExercise,
  TrainingCycleConfig,
  UserCycleState,
} from '../types';
import { getAllExercises } from '../data/exercises';

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
  cycleConfig: TrainingCycleConfig | null;
  cycleState: UserCycleState | null;

  // Template actions
  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  reorderTemplates: (templateIds: string[]) => void;
  toggleTemplateRotation: (templateId: string) => void;

  // Session actions
  addSession: (session: WorkoutSession) => void;
  updateSession: (session: WorkoutSession) => void;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (session: WorkoutSession | null) => void;

  // Preference actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;

  // Custom exercise actions
  addCustomExercise: (exercise: Exercise) => void;
  updateCustomExercise: (exerciseId: string, updates: Partial<Exercise>) => void;

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

  // Cycle actions
  setCycleConfig: (config: TrainingCycleConfig) => void;
  advancePhase: () => void;
  resetCycle: () => void;
}

const defaultPreferences: UserPreferences = {
  weightUnit: 'lbs',
  distanceUnit: 'mi',
  defaultRestSeconds: 90,
  darkMode: false,
  experienceLevel: 'intermediate',
  weeklyWorkoutGoal: 4,
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
        cycleConfig: null,
        cycleState: null,

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

        reorderTemplates: (templateIds) =>
          set((state) => {
            const templateMap = new Map(state.templates.map((t) => [t.id, t]));
            const reorderedTemplates = templateIds
              .map((id) => templateMap.get(id))
              .filter((t): t is WorkoutTemplate => t !== undefined);
            return { templates: reorderedTemplates };
          }),

        toggleTemplateRotation: (templateId) =>
          set((state) => ({
            templates: state.templates.map((t) =>
              t.id === templateId ? { ...t, inRotation: !t.inRotation, updatedAt: new Date().toISOString() } : t
            ),
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

        deleteSession: (sessionId) =>
          set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== sessionId),
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

        updateCustomExercise: (exerciseId, updates) =>
          set((state) => ({
            customExercises: state.customExercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, ...updates } as Exercise : ex
            ),
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

        // Cycle actions
        setCycleConfig: (config) =>
          set(() => ({
            cycleConfig: config,
            cycleState: {
              cycleConfigId: config.id,
              cycleStartDate: new Date().toISOString(),
              currentPhaseIndex: 0,
              currentWeekInPhase: 1,
            },
          })),

        advancePhase: () =>
          set((state) => {
            if (!state.cycleConfig || !state.cycleState) return state;

            const { cycleConfig, cycleState } = state;
            const currentPhase = cycleConfig.phases[cycleState.currentPhaseIndex];

            // Check if we need to advance to next week in current phase
            if (cycleState.currentWeekInPhase < currentPhase.durationWeeks) {
              return {
                cycleState: {
                  ...cycleState,
                  currentWeekInPhase: cycleState.currentWeekInPhase + 1,
                },
              };
            }

            // Need to advance to next phase
            const nextPhaseIndex = cycleState.currentPhaseIndex + 1;

            // Check if cycle is complete
            if (nextPhaseIndex >= cycleConfig.phases.length) {
              // Reset to start of cycle
              return {
                cycleState: {
                  ...cycleState,
                  cycleStartDate: new Date().toISOString(),
                  currentPhaseIndex: 0,
                  currentWeekInPhase: 1,
                },
              };
            }

            // Advance to next phase
            return {
              cycleState: {
                ...cycleState,
                currentPhaseIndex: nextPhaseIndex,
                currentWeekInPhase: 1,
              },
            };
          }),

        resetCycle: () =>
          set((state) => {
            if (!state.cycleConfig) return state;
            return {
              cycleState: {
                cycleConfigId: state.cycleConfig.id,
                cycleStartDate: new Date().toISOString(),
                currentPhaseIndex: 0,
                currentWeekInPhase: 1,
              },
            };
          }),
      }),
      {
        name: 'workout-app-storage',
        version: 1,
        migrate: (persistedState: unknown, version: number) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const state = persistedState as any;

          // Migration from version 0 to 1: Add templateType and cardioCategory
          if (version === 0) {
            const allExercises = getAllExercises(state.customExercises || []);

            const migratedTemplates = (state.templates || []).map((template: any) => {
              // Skip if template already has templateType
              if (template.templateType) {
                return template;
              }

              // Determine template type from exercises
              const hasCardio = template.exercises.some((ex: any) => ex.type === 'cardio');
              const hasStrength = template.exercises.some((ex: any) => ex.type === 'strength');

              // Default to strength, unless all exercises are cardio
              const templateType = hasCardio && !hasStrength ? 'cardio' : 'strength';

              // Filter exercises to match template type (in case of mixed)
              const filteredExercises = template.exercises
                .filter((ex: any) => {
                  if (templateType === 'cardio') return ex.type === 'cardio';
                  return ex.type === 'strength';
                })
                .map((ex: any) => {
                  // Add cardioCategory to cardio exercises that don't have it
                  if (ex.type === 'cardio' && !ex.cardioCategory) {
                    const exercise = allExercises.find((e) => e.id === ex.exerciseId) as CardioExercise | undefined;
                    const cardioType = exercise?.cardioType || 'other';
                    const category = CARDIO_TYPE_TO_CATEGORY[cardioType];

                    // Return with default fields based on category
                    if (category === 'distance') {
                      return { ...ex, cardioCategory: 'distance', targetDurationMinutes: 30 };
                    } else if (category === 'interval') {
                      return { ...ex, cardioCategory: 'interval', rounds: 4, workSeconds: 30, restBetweenRoundsSeconds: 15 };
                    } else if (category === 'laps') {
                      return { ...ex, cardioCategory: 'laps', targetLaps: 20 };
                    } else if (category === 'duration') {
                      return { ...ex, cardioCategory: 'duration', targetDurationMinutes: 20 };
                    } else {
                      return { ...ex, cardioCategory: 'other', targetDurationMinutes: 30 };
                    }
                  }
                  return ex;
                });

              return {
                ...template,
                templateType,
                exercises: filteredExercises,
              };
            });

            return {
              ...state,
              templates: migratedTemplates,
            };
          }

          return state;
        },
      }
    )
  )
);

// One-time migration function - call this on app startup
// Uses 'any' types since we're dealing with potentially malformed legacy data
export const migrateTemplates = () => {
  const state = useAppStore.getState();
  const allExercises = getAllExercises(state.customExercises);
  let needsUpdate = false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migratedTemplates = state.templates.map((template: any) => {
    // Add inRotation field if missing (default to true for existing templates)
    if (template.inRotation === undefined) {
      needsUpdate = true;
      template = { ...template, inRotation: true };
    }
    // Skip if template already has templateType
    if (template.templateType) {
      // Still check if cardio exercises need cardioCategory
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updatedExercises = template.exercises.map((ex: any) => {
        if (ex.type === 'cardio' && !ex.cardioCategory) {
          needsUpdate = true;
          const exercise = allExercises.find((e) => e.id === ex.exerciseId) as CardioExercise | undefined;
          const cardioType = exercise?.cardioType || 'other';
          const category = CARDIO_TYPE_TO_CATEGORY[cardioType];

          if (category === 'distance') {
            return { ...ex, cardioCategory: 'distance', targetDurationMinutes: 30 };
          } else if (category === 'interval') {
            return { ...ex, cardioCategory: 'interval', rounds: 4, workSeconds: 30, restBetweenRoundsSeconds: 15 };
          } else if (category === 'laps') {
            return { ...ex, cardioCategory: 'laps', targetLaps: 20 };
          } else if (category === 'duration') {
            return { ...ex, cardioCategory: 'duration', targetDurationMinutes: 20 };
          } else {
            return { ...ex, cardioCategory: 'other', targetDurationMinutes: 30 };
          }
        }
        return ex;
      });

      return { ...template, exercises: updatedExercises };
    }

    needsUpdate = true;

    // Determine template type from exercises
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasCardio = template.exercises.some((ex: any) => ex.type === 'cardio');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasStrength = template.exercises.some((ex: any) => ex.type === 'strength');
    const templateType = hasCardio && !hasStrength ? 'cardio' : 'strength';

    // Filter exercises to match template type and add cardioCategory
    const filteredExercises = template.exercises
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((ex: any) => {
        if (templateType === 'cardio') return ex.type === 'cardio';
        return ex.type === 'strength';
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((ex: any) => {
        if (ex.type === 'cardio' && !ex.cardioCategory) {
          const exercise = allExercises.find((e) => e.id === ex.exerciseId) as CardioExercise | undefined;
          const cardioType = exercise?.cardioType || 'other';
          const category = CARDIO_TYPE_TO_CATEGORY[cardioType];

          if (category === 'distance') {
            return { ...ex, cardioCategory: 'distance', targetDurationMinutes: 30 };
          } else if (category === 'interval') {
            return { ...ex, cardioCategory: 'interval', rounds: 4, workSeconds: 30, restBetweenRoundsSeconds: 15 };
          } else if (category === 'laps') {
            return { ...ex, cardioCategory: 'laps', targetLaps: 20 };
          } else if (category === 'duration') {
            return { ...ex, cardioCategory: 'duration', targetDurationMinutes: 20 };
          } else {
            return { ...ex, cardioCategory: 'other', targetDurationMinutes: 30 };
          }
        }
        return ex;
      });

    return {
      ...template,
      templateType,
      exercises: filteredExercises,
    };
  });

  if (needsUpdate) {
    useAppStore.setState({ templates: migratedTemplates as WorkoutTemplate[] });
  }
};

// UUID validation and migration
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

/**
 * Migrate invalid IDs to valid UUIDs
 * This fixes legacy data that used short random strings instead of UUIDs
 */
export const migrateToUUIDs = () => {
  const state = useAppStore.getState();
  let sessionsUpdated = false;
  let templatesUpdated = false;
  let exercisesUpdated = false;

  // Migrate sessions
  const migratedSessions = state.sessions.map((session) => {
    let needsUpdate = false;
    let newSession = { ...session };

    // Fix session ID
    if (!isValidUUID(session.id)) {
      newSession.id = crypto.randomUUID();
      needsUpdate = true;
    }

    // Fix exercise IDs within session
    const migratedExercises = session.exercises.map((ex) => {
      if (!ex.id || !isValidUUID(ex.id)) {
        return { ...ex, id: crypto.randomUUID() };
      }
      return ex;
    });

    if (migratedExercises.some((ex, i) => ex.id !== session.exercises[i].id)) {
      newSession = { ...newSession, exercises: migratedExercises };
      needsUpdate = true;
    }

    if (needsUpdate) {
      sessionsUpdated = true;
      return newSession;
    }
    return session;
  });

  // Migrate templates
  const migratedTemplates = state.templates.map((template) => {
    if (!isValidUUID(template.id)) {
      templatesUpdated = true;
      return { ...template, id: crypto.randomUUID() };
    }
    return template;
  });

  // Migrate custom exercises
  const migratedExercises = state.customExercises.map((exercise) => {
    if (!isValidUUID(exercise.id)) {
      exercisesUpdated = true;
      return { ...exercise, id: crypto.randomUUID() };
    }
    return exercise;
  });

  // Apply updates
  if (sessionsUpdated || templatesUpdated || exercisesUpdated) {
    const updates: Partial<typeof state> = {};
    if (sessionsUpdated) updates.sessions = migratedSessions;
    if (templatesUpdated) updates.templates = migratedTemplates;
    if (exercisesUpdated) updates.customExercises = migratedExercises;
    useAppStore.setState(updates);
    console.log('[Migration] Fixed invalid UUIDs:', {
      sessions: sessionsUpdated,
      templates: templatesUpdated,
      exercises: exercisesUpdated,
    });
  }
};

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
