import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore, migrateToUUIDs } from './useAppStore';
import { createMockTemplate } from '../test/fixtures/templates';
import { createMockSession } from '../test/fixtures/sessions';
import { createMockExercise } from '../test/fixtures/exercises';
import { WorkoutSession, StrengthSessionExercise, StrengthCompletedSet, BUILD_5_WEEK_CYCLE } from '../types';

// Helper to reset store between tests
const resetStore = () => {
  useAppStore.setState({
    templates: [],
    sessions: [],
    activeSession: null,
    preferences: {
      weightUnit: 'lbs',
      distanceUnit: 'mi',
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
    workoutGoal: 'build',
    cycleConfig: BUILD_5_WEEK_CYCLE,
    cycleState: {
      cycleConfigId: BUILD_5_WEEK_CYCLE.id,
      cycleStartDate: new Date().toISOString(),
      currentPhaseIndex: 0,
      currentWeekInPhase: 1,
    },
  });
};

describe('useAppStore', () => {
  beforeEach(() => {
    resetStore();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
  });

  describe('Initial State', () => {
    it('should have default preferences', () => {
      const state = useAppStore.getState();
      expect(state.preferences.weightUnit).toBe('lbs');
      expect(state.preferences.defaultRestSeconds).toBe(90);
      expect(state.preferences.darkMode).toBe(false);
    });

    it('should have empty templates', () => {
      const state = useAppStore.getState();
      expect(state.templates).toEqual([]);
    });

    it('should have empty sessions', () => {
      const state = useAppStore.getState();
      expect(state.sessions).toEqual([]);
    });

    it('should have null active session', () => {
      const state = useAppStore.getState();
      expect(state.activeSession).toBeNull();
    });

    it('should have empty custom exercises', () => {
      const state = useAppStore.getState();
      expect(state.customExercises).toEqual([]);
    });

    it('should have default cycle config (build-5)', () => {
      const state = useAppStore.getState();
      expect(state.cycleConfig.id).toBe('build-5');
      expect(state.cycleState.currentPhaseIndex).toBe(0);
      expect(state.cycleState.currentWeekInPhase).toBe(1);
    });
  });

  describe('Template Actions', () => {
    it('should add a template', () => {
      const template = createMockTemplate({ name: 'New Template' });

      useAppStore.getState().addTemplate(template);

      expect(useAppStore.getState().templates).toContainEqual(template);
    });

    it('should update a template', () => {
      const template = createMockTemplate({ id: '1', name: 'Original' });
      useAppStore.setState({ templates: [template] });

      const updated = { ...template, name: 'Updated' };
      useAppStore.getState().updateTemplate(updated);

      expect(useAppStore.getState().templates[0].name).toBe('Updated');
    });

    it('should delete a template', () => {
      const template = createMockTemplate({ id: '1' });
      useAppStore.setState({ templates: [template] });

      useAppStore.getState().deleteTemplate('1');

      expect(useAppStore.getState().templates).toHaveLength(0);
    });

    it('should handle multiple templates', () => {
      const template1 = createMockTemplate({ id: '1', name: 'Template 1' });
      const template2 = createMockTemplate({ id: '2', name: 'Template 2' });

      useAppStore.getState().addTemplate(template1);
      useAppStore.getState().addTemplate(template2);

      expect(useAppStore.getState().templates).toHaveLength(2);
    });

    it('should only delete the specified template', () => {
      const template1 = createMockTemplate({ id: '1', name: 'Template 1' });
      const template2 = createMockTemplate({ id: '2', name: 'Template 2' });
      useAppStore.setState({ templates: [template1, template2] });

      useAppStore.getState().deleteTemplate('1');

      expect(useAppStore.getState().templates).toHaveLength(1);
      expect(useAppStore.getState().templates[0].id).toBe('2');
    });
  });

  describe('Session Actions', () => {
    it('should add a session', () => {
      const session = createMockSession();

      useAppStore.getState().addSession(session);

      expect(useAppStore.getState().sessions).toContainEqual(session);
    });

    it('should update a session', () => {
      const session = createMockSession({ id: '1', name: 'Original' });
      useAppStore.setState({ sessions: [session] });

      const updated = { ...session, name: 'Updated' };
      useAppStore.getState().updateSession(updated);

      expect(useAppStore.getState().sessions[0].name).toBe('Updated');
    });

    it('should set active session', () => {
      const session = createMockSession();

      useAppStore.getState().setActiveSession(session);

      expect(useAppStore.getState().activeSession).toEqual(session);
    });

    it('should clear active session', () => {
      const session = createMockSession();
      useAppStore.setState({ activeSession: session });

      useAppStore.getState().setActiveSession(null);

      expect(useAppStore.getState().activeSession).toBeNull();
    });
  });

  describe('Preferences Actions', () => {
    it('should update preferences', () => {
      useAppStore.getState().updatePreferences({ weightUnit: 'kg' });

      expect(useAppStore.getState().preferences.weightUnit).toBe('kg');
    });

    it('should update multiple preferences at once', () => {
      useAppStore.getState().updatePreferences({
        weightUnit: 'kg',
        defaultRestSeconds: 120,
      });

      expect(useAppStore.getState().preferences.weightUnit).toBe('kg');
      expect(useAppStore.getState().preferences.defaultRestSeconds).toBe(120);
    });

    it('should preserve other preferences when updating', () => {
      useAppStore.getState().updatePreferences({ weightUnit: 'kg' });

      expect(useAppStore.getState().preferences.defaultRestSeconds).toBe(90);
      expect(useAppStore.getState().preferences.darkMode).toBe(false);
    });

    it('should update openaiApiKey', () => {
      useAppStore.getState().updatePreferences({ openaiApiKey: 'sk-test-123' });

      expect(useAppStore.getState().preferences.openaiApiKey).toBe('sk-test-123');
    });
  });

  describe('Custom Exercise Actions', () => {
    it('should add a custom exercise', () => {
      const exercise = createMockExercise({ id: 'custom-1', name: 'Custom' });

      useAppStore.getState().addCustomExercise(exercise);

      expect(useAppStore.getState().customExercises).toContainEqual(exercise);
    });

    it('should add multiple custom exercises', () => {
      const exercise1 = createMockExercise({ id: 'custom-1', name: 'Custom 1' });
      const exercise2 = createMockExercise({ id: 'custom-2', name: 'Custom 2' });

      useAppStore.getState().addCustomExercise(exercise1);
      useAppStore.getState().addCustomExercise(exercise2);

      expect(useAppStore.getState().customExercises).toHaveLength(2);
    });

    it('should update a custom exercise name', () => {
      const exercise = createMockExercise({ id: 'custom-1', name: 'Original Name' });
      useAppStore.getState().addCustomExercise(exercise);

      useAppStore.getState().updateCustomExercise('custom-1', { name: 'Updated Name' });

      const state = useAppStore.getState();
      expect(state.customExercises[0].name).toBe('Updated Name');
    });

    it('should not modify other custom exercises when updating one', () => {
      const exercise1 = createMockExercise({ id: 'custom-1', name: 'Exercise 1' });
      const exercise2 = createMockExercise({ id: 'custom-2', name: 'Exercise 2' });
      useAppStore.getState().addCustomExercise(exercise1);
      useAppStore.getState().addCustomExercise(exercise2);

      useAppStore.getState().updateCustomExercise('custom-1', { name: 'Updated 1' });

      const state = useAppStore.getState();
      expect(state.customExercises[0].name).toBe('Updated 1');
      expect(state.customExercises[1].name).toBe('Exercise 2');
    });

    it('should do nothing when updating non-existent exercise', () => {
      const exercise = createMockExercise({ id: 'custom-1', name: 'Exercise' });
      useAppStore.getState().addCustomExercise(exercise);

      useAppStore.getState().updateCustomExercise('non-existent', { name: 'New Name' });

      const state = useAppStore.getState();
      expect(state.customExercises).toHaveLength(1);
      expect(state.customExercises[0].name).toBe('Exercise');
    });
  });

  describe('Dark Mode Subscription', () => {
    it('should add dark class when darkMode is enabled', () => {
      useAppStore.getState().updatePreferences({ darkMode: true });

      // The subscription should have added the class
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('should remove dark class when darkMode is disabled', () => {
      document.documentElement.classList.add('dark');
      useAppStore.setState({
        preferences: {
          ...useAppStore.getState().preferences,
          darkMode: true,
        },
      });

      useAppStore.getState().updatePreferences({ darkMode: false });

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Phase/Cycle Actions', () => {
    it('should set current phase', () => {
      useAppStore.getState().setCurrentPhase(2);

      const state = useAppStore.getState();
      expect(state.cycleState.currentPhaseIndex).toBe(2);
      expect(state.cycleState.currentWeekInPhase).toBe(1);
    });

    it('should not set phase to invalid index', () => {
      useAppStore.getState().setCurrentPhase(10);

      const state = useAppStore.getState();
      expect(state.cycleState.currentPhaseIndex).toBe(0); // unchanged
    });

    it('should advance phase within cycle', () => {
      useAppStore.getState().advancePhase();

      const state = useAppStore.getState();
      expect(state.cycleState.currentPhaseIndex).toBe(1);
      expect(state.cycleState.currentWeekInPhase).toBe(1);
    });

    it('should cycle back to phase 0 after last phase', () => {
      // Set to last phase (phase 4 = deload in build-5)
      useAppStore.getState().setCurrentPhase(4);
      useAppStore.getState().advancePhase();

      const state = useAppStore.getState();
      expect(state.cycleState.currentPhaseIndex).toBe(0);
      expect(state.cycleState.currentWeekInPhase).toBe(1);
    });

    it('should reset cycle to phase 0', () => {
      useAppStore.getState().setCurrentPhase(3);
      useAppStore.getState().resetCycle();

      const state = useAppStore.getState();
      expect(state.cycleState.currentPhaseIndex).toBe(0);
      expect(state.cycleState.currentWeekInPhase).toBe(1);
    });
  });

  describe('Workout Goal Actions', () => {
    it('should have workoutGoal default to build', () => {
      const state = useAppStore.getState();
      expect(state.workoutGoal).toBe('build');
    });

    it('should set workout goal to lose and switch to lose-5 cycle', () => {
      useAppStore.getState().setWorkoutGoal('lose');

      const state = useAppStore.getState();
      expect(state.workoutGoal).toBe('lose');
      expect(state.cycleConfig.id).toBe('lose-5');
      expect(state.cycleState.currentPhaseIndex).toBe(0);
    });

    it('should set workout goal to maintain and switch to maintain-5 cycle', () => {
      useAppStore.getState().setWorkoutGoal('maintain');

      const state = useAppStore.getState();
      expect(state.workoutGoal).toBe('maintain');
      expect(state.cycleConfig.id).toBe('maintain-5');
    });

    it('should set workout goal back to build', () => {
      useAppStore.getState().setWorkoutGoal('lose');
      useAppStore.getState().setWorkoutGoal('build');

      const state = useAppStore.getState();
      expect(state.workoutGoal).toBe('build');
      expect(state.cycleConfig.id).toBe('build-5');
    });
  });

  describe('Selector Pattern', () => {
    it('should allow selecting specific state slices', () => {
      const template = createMockTemplate();
      useAppStore.setState({ templates: [template] });

      // This mimics how components use the store
      const templates = useAppStore.getState().templates;
      expect(templates).toHaveLength(1);
    });
  });

  describe('migrateToUUIDs', () => {
    // Valid UUID for testing
    const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
    const VALID_UUID_2 = '550e8400-e29b-41d4-a716-446655440001';

    // Invalid IDs (legacy format - short random strings)
    const INVALID_ID = 'legacy123ab';
    const INVALID_ID_2 = 'old456xyz';

    beforeEach(() => {
      resetStore();
    });

    it('should not modify sessions with valid UUIDs', () => {
      const session = createMockSession({ id: VALID_UUID });
      useAppStore.setState({ sessions: [session] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      expect(state.sessions[0].id).toBe(VALID_UUID);
    });

    it('should migrate sessions with invalid IDs to valid UUIDs', () => {
      const session = createMockSession({ id: INVALID_ID });
      useAppStore.setState({ sessions: [session] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      // Should be a valid UUID now (36 chars with dashes)
      expect(state.sessions[0].id).not.toBe(INVALID_ID);
      expect(state.sessions[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should migrate exercise IDs within sessions', () => {
      const exercise: StrengthSessionExercise = {
        id: INVALID_ID,
        type: 'strength',
        exerciseId: 'bench-press',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 90,
        sets: [],
      };
      const session: WorkoutSession = {
        id: VALID_UUID,
        name: 'Test',
        startedAt: new Date().toISOString(),
        exercises: [exercise],
      };
      useAppStore.setState({ sessions: [session] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      const migratedExercise = state.sessions[0].exercises[0];
      expect(migratedExercise.id).not.toBe(INVALID_ID);
      expect(migratedExercise.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should handle exercises with undefined IDs', () => {
      const exercise: StrengthSessionExercise = {
        id: undefined as unknown as string, // Legacy data might have undefined
        type: 'strength',
        exerciseId: 'bench-press',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 90,
        sets: [],
      };
      const session: WorkoutSession = {
        id: VALID_UUID,
        name: 'Test',
        startedAt: new Date().toISOString(),
        exercises: [exercise],
      };
      useAppStore.setState({ sessions: [session] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      const migratedExercise = state.sessions[0].exercises[0];
      expect(migratedExercise.id).toBeDefined();
      expect(migratedExercise.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should migrate templates with invalid IDs', () => {
      const template = createMockTemplate({ id: INVALID_ID });
      useAppStore.setState({ templates: [template] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      expect(state.templates[0].id).not.toBe(INVALID_ID);
      expect(state.templates[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should not modify templates with valid UUIDs', () => {
      const template = createMockTemplate({ id: VALID_UUID });
      useAppStore.setState({ templates: [template] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      expect(state.templates[0].id).toBe(VALID_UUID);
    });

    it('should migrate custom exercises with invalid IDs', () => {
      const exercise = createMockExercise({ id: INVALID_ID });
      useAppStore.setState({ customExercises: [exercise] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      expect(state.customExercises[0].id).not.toBe(INVALID_ID);
      expect(state.customExercises[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should not modify custom exercises with valid UUIDs', () => {
      const exercise = createMockExercise({ id: VALID_UUID });
      useAppStore.setState({ customExercises: [exercise] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      expect(state.customExercises[0].id).toBe(VALID_UUID);
    });

    it('should handle mixed valid and invalid IDs', () => {
      const validSession = createMockSession({ id: VALID_UUID });
      const invalidSession = createMockSession({ id: INVALID_ID });
      useAppStore.setState({ sessions: [validSession, invalidSession] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      expect(state.sessions[0].id).toBe(VALID_UUID);
      expect(state.sessions[1].id).not.toBe(INVALID_ID);
      expect(state.sessions[1].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should not update store if no changes needed', () => {
      const session = createMockSession({ id: VALID_UUID });
      const template = createMockTemplate({ id: VALID_UUID_2 });
      useAppStore.setState({ sessions: [session], templates: [template] });

      // Capture original state reference
      const originalSessions = useAppStore.getState().sessions;
      const originalTemplates = useAppStore.getState().templates;

      migrateToUUIDs();

      // Should be same reference if no updates needed
      expect(useAppStore.getState().sessions).toBe(originalSessions);
      expect(useAppStore.getState().templates).toBe(originalTemplates);
    });

    it('should preserve all session data after migration', () => {
      const exercise: StrengthSessionExercise = {
        id: INVALID_ID,
        type: 'strength',
        exerciseId: 'bench-press',
        targetSets: 5,
        targetReps: 8,
        restSeconds: 120,
        sets: [
          { type: 'strength', reps: 8, weight: 200, unit: 'lbs', completedAt: '2024-01-01' },
        ],
      };
      const session: WorkoutSession = {
        id: INVALID_ID_2,
        name: 'Heavy Day',
        templateId: 'template-123',
        startedAt: '2024-01-01T10:00:00Z',
        completedAt: '2024-01-01T11:00:00Z',
        exercises: [exercise],
      };
      useAppStore.setState({ sessions: [session] });

      migrateToUUIDs();

      const state = useAppStore.getState();
      const migrated = state.sessions[0];

      // ID should be different
      expect(migrated.id).not.toBe(INVALID_ID_2);

      // All other data should be preserved
      expect(migrated.name).toBe('Heavy Day');
      expect(migrated.templateId).toBe('template-123');
      expect(migrated.startedAt).toBe('2024-01-01T10:00:00Z');
      expect(migrated.completedAt).toBe('2024-01-01T11:00:00Z');

      // Exercise data should be preserved
      const migratedEx = migrated.exercises[0] as StrengthSessionExercise;
      expect(migratedEx.exerciseId).toBe('bench-press');
      expect(migratedEx.targetSets).toBe(5);
      expect(migratedEx.targetReps).toBe(8);
      expect(migratedEx.sets).toHaveLength(1);
      const strengthSet = migratedEx.sets[0] as StrengthCompletedSet;
      expect(strengthSet.reps).toBe(8);
      expect(strengthSet.weight).toBe(200);
    });
  });
});
