import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAppStore } from './useAppStore';
import { createMockTemplate } from '../test/fixtures/templates';
import { createMockSession } from '../test/fixtures/sessions';
import { createMockExercise } from '../test/fixtures/exercises';

// Helper to reset store between tests
const resetStore = () => {
  useAppStore.setState({
    templates: [],
    sessions: [],
    activeSession: null,
    preferences: {
      weightUnit: 'lbs',
      defaultRestSeconds: 90,
      darkMode: false,
    },
    customExercises: [],
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

  describe('Selector Pattern', () => {
    it('should allow selecting specific state slices', () => {
      const template = createMockTemplate();
      useAppStore.setState({ templates: [template] });

      // This mimics how components use the store
      const templates = useAppStore.getState().templates;
      expect(templates).toHaveLength(1);
    });
  });
});
