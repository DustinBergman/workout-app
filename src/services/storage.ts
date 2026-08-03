import {
  WorkoutTemplate,
  WorkoutSession,
  UserPreferences,
  Exercise,
  WorkoutGoal,
  WeightEntry,
  TrainingCycleConfig,
  UserCycleState,
  BUILD_5_WEEK_CYCLE,
  STORAGE_KEYS,
} from '../types';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { supabase } from '../lib/supabase';
import { getAuthUser } from './supabase/authHelper';
import { waitForQueuedSyncs } from './supabase/sync';
import {
  pauseSyncForDataClear,
  resumeSyncAfterDataClear,
} from '../store/syncSubscriptions';
import { invalidateCloudSyncs } from './syncCoordinator';

const BACKUP_VERSION = 1;

const defaultPreferences: UserPreferences = {
  weightUnit: 'lbs',
  distanceUnit: 'mi',
  defaultRestSeconds: 90,
  darkMode: false,
  experienceLevel: 'intermediate',
  weeklyWorkoutGoal: 4,
};

const createDefaultCycleState = (): UserCycleState => ({
  cycleConfigId: BUILD_5_WEEK_CYCLE.id,
  cycleStartDate: new Date().toISOString(),
  currentPhaseIndex: 0,
  currentWeekInPhase: 1,
});

interface WorkoutDataBackup {
  version: number;
  exportedAt: string;
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  preferences: UserPreferences;
  customExercises: Exercise[];
  workoutGoal: WorkoutGoal;
  hasCompletedIntro: boolean;
  weightEntries: WeightEntry[];
  cycleConfig: TrainingCycleConfig;
  cycleState: UserCycleState;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isBackup = (value: unknown): value is WorkoutDataBackup => {
  if (!isRecord(value)) return false;
  return (
    (value.version === undefined || value.version === BACKUP_VERSION) &&
    Array.isArray(value.templates) &&
    Array.isArray(value.sessions) &&
    Array.isArray(value.customExercises) &&
    isRecord(value.preferences)
  );
};

// Templates
export const getTemplates = (): WorkoutTemplate[] =>
  useAppStore.getState().templates;

export const saveTemplates = (templates: WorkoutTemplate[]): void => {
  useAppStore.setState({ templates });
};

export const addTemplate = (template: WorkoutTemplate): void => {
  useAppStore.getState().addTemplate(template);
};

export const updateTemplate = (template: WorkoutTemplate): void => {
  useAppStore.getState().updateTemplate(template);
};

export const deleteTemplate = (templateId: string): void => {
  useAppStore.getState().deleteTemplate(templateId);
};

// Sessions
export const getSessions = (): WorkoutSession[] =>
  useAppStore.getState().sessions;

export const saveSessions = (sessions: WorkoutSession[]): void => {
  useAppStore.setState({ sessions });
};

export const addSession = (session: WorkoutSession): void => {
  useAppStore.getState().addSession(session);
};

export const updateSession = (session: WorkoutSession): void => {
  useAppStore.getState().updateSession(session);
};

// Active Session
export const getActiveSession = (): WorkoutSession | null =>
  useAppStore.getState().activeSession;

export const saveActiveSession = (session: WorkoutSession | null): void => {
  useAppStore.getState().setActiveSession(session);
};

// Preferences
export const getPreferences = (): UserPreferences =>
  useAppStore.getState().preferences;

export const savePreferences = (preferences: UserPreferences): void => {
  useAppStore.setState({ preferences: { ...defaultPreferences, ...preferences } });
};

// Custom Exercises
export const getCustomExercises = (): Exercise[] =>
  useAppStore.getState().customExercises;

export const saveCustomExercises = (customExercises: Exercise[]): void => {
  useAppStore.setState({ customExercises });
};

export const addCustomExercise = (exercise: Exercise): void => {
  useAppStore.getState().addCustomExercise(exercise);
};

// Export all data
export const exportAllData = (): string => {
  const state = useAppStore.getState();
  const backup: WorkoutDataBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    templates: state.templates,
    sessions: state.sessions,
    activeSession: state.activeSession,
    preferences: state.preferences,
    customExercises: state.customExercises,
    workoutGoal: state.workoutGoal,
    hasCompletedIntro: state.hasCompletedIntro,
    weightEntries: state.weightEntries,
    cycleConfig: state.cycleConfig,
    cycleState: state.cycleState,
  };
  return JSON.stringify(backup);
};

// Import all data
export const importAllData = (jsonData: string): boolean => {
  try {
    const data: unknown = JSON.parse(jsonData);
    if (!isBackup(data)) return false;

    useAppStore.setState({
      templates: data.templates,
      sessions: data.sessions,
      activeSession: data.activeSession ?? null,
      preferences: { ...defaultPreferences, ...data.preferences },
      customExercises: data.customExercises,
      workoutGoal: data.workoutGoal ?? 'build',
      hasCompletedIntro: data.hasCompletedIntro ?? false,
      weightEntries: data.weightEntries ?? [],
      cycleConfig: data.cycleConfig ?? BUILD_5_WEEK_CYCLE,
      cycleState: data.cycleState ?? createDefaultCycleState(),
    });
    useCurrentWorkoutStore.getState().reset();
    return true;
  } catch {
    return false;
  }
};

const clearCloudWorkoutData = async (userId: string): Promise<void> => {
  for (const table of ['workout_sessions', 'workout_templates', 'custom_exercises', 'weight_entries']) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) {
      throw new Error(`Failed to clear ${table}: ${error.message}`);
    }
  }

  const cycleState = createDefaultCycleState();
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      weight_unit: defaultPreferences.weightUnit,
      distance_unit: defaultPreferences.distanceUnit,
      default_rest_seconds: defaultPreferences.defaultRestSeconds,
      dark_mode: defaultPreferences.darkMode,
      experience_level: defaultPreferences.experienceLevel,
      weekly_workout_goal: defaultPreferences.weeklyWorkoutGoal,
      workout_goal: 'build',
      has_completed_intro: false,
      openai_api_key: null,
      cycle_config_id: BUILD_5_WEEK_CYCLE.id,
      cycle_state: cycleState,
    })
    .eq('id', userId);

  if (profileError) {
    throw new Error(`Failed to reset profile settings: ${profileError.message}`);
  }

};

const clearLocalWorkoutData = (userId: string | null): void => {
  useAppStore.persist.clearStorage();
  useAppStore.setState({
    templates: [],
    sessions: [],
    activeSession: null,
    preferences: defaultPreferences,
    customExercises: [],
    workoutGoal: 'build',
    hasCompletedIntro: false,
    weightEntries: [],
    cycleConfig: BUILD_5_WEEK_CYCLE,
    cycleState: createDefaultCycleState(),
  });
  useCurrentWorkoutStore.getState().reset();

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  [
    'workout-app-current-workout',
    'workout-app-failed-syncs',
    'workout-app-dedupe-fix-v1',
    'weekAdvancementDismissedAt',
  ].forEach((key) => localStorage.removeItem(key));
  if (userId) {
    localStorage.removeItem(`workout-app-account-state-v2:${userId}`);
    localStorage.removeItem(`workout-app-pending-sync-v2:${userId}`);
    localStorage.removeItem(`workout-app-dedupe-fix-v1:${userId}`);
  }
};

// Clear all workout data without deleting authentication or unrelated origin storage.
export const clearAllData = async (): Promise<void> => {
  const user = await getAuthUser();
  if (!user) {
    clearLocalWorkoutData(null);
    return;
  }

  await invalidateCloudSyncs();
  const previousSyncState = await pauseSyncForDataClear(user.id);
  try {
    await waitForQueuedSyncs();
    await clearCloudWorkoutData(user.id);
    clearLocalWorkoutData(user.id);
  } finally {
    resumeSyncAfterDataClear({
      ...previousSyncState,
      enabled: true,
      identity: user.id,
      syncingFromCloud: false,
    });
  }
};
