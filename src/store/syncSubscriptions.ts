import { useAppStore } from './useAppStore';
import { supabase } from '../lib/supabase';
import {
  syncPreferences,
  syncWorkoutGoal,
  syncCurrentWeek,
  syncHasCompletedIntro,
  syncAddTemplate,
  syncUpdateTemplate,
  syncDeleteTemplate,
  syncReorderTemplates,
  syncAddSession,
  syncUpdateSession,
  syncSetActiveSession,
  syncAddCustomExercise,
  syncAddWeightEntry,
  syncDeleteWeightEntry,
} from '../services/supabase/sync';
import { clearFeedCache } from '../hooks/useFeed';

// Track if sync is enabled (user is authenticated)
let syncEnabled = false;
let previousTemplateIds: string[] = [];
let previousSessionIds: string[] = [];
let previousExerciseIds: string[] = [];
let previousWeightDates: string[] = [];

/**
 * Enable/disable sync based on auth state
 */
export const setSyncEnabled = (enabled: boolean) => {
  syncEnabled = enabled;

  if (enabled) {
    // Capture current state for change detection
    const state = useAppStore.getState();
    previousTemplateIds = state.templates.map((t) => t.id);
    previousSessionIds = state.sessions.map((s) => s.id);
    previousExerciseIds = state.customExercises.map((e) => e.id);
    previousWeightDates = state.weightEntries.map((e) => e.date);
  }
};

/**
 * Check if user is authenticated
 */
const isAuthenticated = async (): Promise<boolean> => {
  if (!syncEnabled) return false;

  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
};

/**
 * Setup subscriptions for syncing store changes to Supabase
 */
export const setupSyncSubscriptions = () => {
  // Preferences sync
  useAppStore.subscribe(
    (state) => state.preferences,
    async (preferences, prevPreferences) => {
      if (!await isAuthenticated()) return;
      if (JSON.stringify(preferences) === JSON.stringify(prevPreferences)) return;

      // Only sync the changed fields
      const changes: Partial<typeof preferences> = {};
      const keys = Object.keys(preferences) as Array<keyof typeof preferences>;

      for (const key of keys) {
        if (preferences[key] !== prevPreferences[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (changes as any)[key] = preferences[key];
        }
      }

      if (Object.keys(changes).length > 0) {
        syncPreferences(changes).catch(console.error);
      }
    }
  );

  // Workout goal sync
  useAppStore.subscribe(
    (state) => state.workoutGoal,
    async (goal) => {
      if (!await isAuthenticated()) return;
      syncWorkoutGoal(goal).catch(console.error);
    }
  );

  // Current week sync
  useAppStore.subscribe(
    (state) => ({ week: state.currentWeek, startedAt: state.weekStartedAt }),
    async ({ week, startedAt }) => {
      if (!await isAuthenticated()) return;
      syncCurrentWeek(week, startedAt).catch(console.error);
    }
  );

  // Has completed intro sync
  useAppStore.subscribe(
    (state) => state.hasCompletedIntro,
    async (value) => {
      if (!await isAuthenticated()) return;
      syncHasCompletedIntro(value).catch(console.error);
    }
  );

  // Templates sync
  useAppStore.subscribe(
    (state) => state.templates,
    async (templates, prevTemplates) => {
      if (!await isAuthenticated()) return;

      const currentIds = templates.map((t) => t.id);
      const prevIds = prevTemplates.map((t) => t.id);

      // Check for added templates
      for (const template of templates) {
        if (!prevIds.includes(template.id) && !previousTemplateIds.includes(template.id)) {
          syncAddTemplate(template).catch(console.error);
        }
      }

      // Check for deleted templates
      for (const prevTemplate of prevTemplates) {
        if (!currentIds.includes(prevTemplate.id)) {
          syncDeleteTemplate(prevTemplate.id).catch(console.error);
        }
      }

      // Check for updated templates
      for (const template of templates) {
        const prevTemplate = prevTemplates.find((t) => t.id === template.id);
        if (prevTemplate && JSON.stringify(template) !== JSON.stringify(prevTemplate)) {
          syncUpdateTemplate(template).catch(console.error);
        }
      }

      // Check for reordering
      if (
        currentIds.length === prevIds.length &&
        currentIds.every((id) => prevIds.includes(id)) &&
        JSON.stringify(currentIds) !== JSON.stringify(prevIds)
      ) {
        syncReorderTemplates(currentIds).catch(console.error);
      }

      previousTemplateIds = currentIds;
    }
  );

  // Sessions sync
  useAppStore.subscribe(
    (state) => state.sessions,
    async (sessions, prevSessions) => {
      if (!await isAuthenticated()) return;

      const currentIds = sessions.map((s) => s.id);
      const prevIds = prevSessions.map((s) => s.id);

      // Check for added sessions
      for (const session of sessions) {
        if (!prevIds.includes(session.id) && !previousSessionIds.includes(session.id)) {
          syncAddSession(session).catch(console.error);
          // Clear feed cache so newly completed workouts show up immediately
          clearFeedCache();
        }
      }

      // Check for updated sessions
      for (const session of sessions) {
        const prevSession = prevSessions.find((s) => s.id === session.id);
        if (prevSession && JSON.stringify(session) !== JSON.stringify(prevSession)) {
          syncUpdateSession(session).catch(console.error);
        }
      }

      previousSessionIds = currentIds;
    }
  );

  // Active session sync
  useAppStore.subscribe(
    (state) => state.activeSession,
    async (session, prevSession) => {
      if (!await isAuthenticated()) return;

      // Only sync significant changes
      if (JSON.stringify(session) !== JSON.stringify(prevSession)) {
        syncSetActiveSession(session).catch(console.error);
      }
    }
  );

  // Custom exercises sync
  useAppStore.subscribe(
    (state) => state.customExercises,
    async (exercises, prevExercises) => {
      if (!await isAuthenticated()) return;

      const prevIds = prevExercises.map((e) => e.id);

      // Check for added exercises
      for (const exercise of exercises) {
        if (!prevIds.includes(exercise.id) && !previousExerciseIds.includes(exercise.id)) {
          syncAddCustomExercise(exercise).catch(console.error);
        }
      }

      previousExerciseIds = exercises.map((e) => e.id);
    }
  );

  // Weight entries sync
  useAppStore.subscribe(
    (state) => state.weightEntries,
    async (entries, prevEntries) => {
      if (!await isAuthenticated()) return;

      const currentDates = entries.map((e) => e.date);
      const prevDates = prevEntries.map((e) => e.date);

      // Check for added entries
      for (const entry of entries) {
        if (!prevDates.includes(entry.date) && !previousWeightDates.includes(entry.date)) {
          syncAddWeightEntry(entry).catch(console.error);
        }
      }

      // Check for deleted entries
      for (const prevEntry of prevEntries) {
        if (!currentDates.includes(prevEntry.date)) {
          syncDeleteWeightEntry(prevEntry.date).catch(console.error);
        }
      }

      previousWeightDates = currentDates;
    }
  );
};
