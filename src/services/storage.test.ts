import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTemplates,
  saveTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  getSessions,
  saveSessions,
  addSession,
  updateSession,
  getActiveSession,
  saveActiveSession,
  getPreferences,
  savePreferences,
  getCustomExercises,
  saveCustomExercises,
  addCustomExercise,
  exportAllData,
  importAllData,
  clearAllData,
} from './storage';
import { STORAGE_KEYS } from '../types';
import { createMockTemplate } from '../test/fixtures/templates';
import { createMockSession } from '../test/fixtures/sessions';
import { createMockExercise } from '../test/fixtures/exercises';

describe('Storage Service', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Templates', () => {
    it('should return empty array when no templates exist', () => {
      expect(getTemplates()).toEqual([]);
    });

    it('should save and retrieve templates', () => {
      const templates = [createMockTemplate({ name: 'Push Day' })];
      saveTemplates(templates);
      expect(getTemplates()).toEqual(templates);
    });

    it('should add a template to existing templates', () => {
      const template1 = createMockTemplate({ id: '1', name: 'Push Day' });
      const template2 = createMockTemplate({ id: '2', name: 'Pull Day' });

      addTemplate(template1);
      addTemplate(template2);

      const templates = getTemplates();
      expect(templates).toHaveLength(2);
      expect(templates[1].name).toBe('Pull Day');
    });

    it('should update an existing template', () => {
      const template = createMockTemplate({ id: '1', name: 'Original' });
      addTemplate(template);

      const updated = { ...template, name: 'Updated' };
      updateTemplate(updated);

      expect(getTemplates()[0].name).toBe('Updated');
    });

    it('should not update non-existent template', () => {
      const template = createMockTemplate({ id: '1' });
      addTemplate(template);

      const nonExistent = createMockTemplate({ id: 'non-existent' });
      updateTemplate(nonExistent);

      expect(getTemplates()).toHaveLength(1);
      expect(getTemplates()[0].id).toBe('1');
    });

    it('should delete a template', () => {
      const template = createMockTemplate({ id: '1' });
      addTemplate(template);
      deleteTemplate('1');
      expect(getTemplates()).toEqual([]);
    });

    it('should handle deleting non-existent template gracefully', () => {
      const template = createMockTemplate({ id: '1' });
      addTemplate(template);
      deleteTemplate('non-existent');
      expect(getTemplates()).toHaveLength(1);
    });
  });

  describe('Sessions', () => {
    it('should return empty array when no sessions exist', () => {
      expect(getSessions()).toEqual([]);
    });

    it('should save and retrieve sessions', () => {
      const sessions = [createMockSession()];
      saveSessions(sessions);
      expect(getSessions()).toEqual(sessions);
    });

    it('should add a session', () => {
      const session = createMockSession();
      addSession(session);
      expect(getSessions()).toHaveLength(1);
    });

    it('should add multiple sessions', () => {
      addSession(createMockSession({ id: '1' }));
      addSession(createMockSession({ id: '2' }));
      addSession(createMockSession({ id: '3' }));
      expect(getSessions()).toHaveLength(3);
    });

    it('should update an existing session', () => {
      const session = createMockSession({ id: '1', name: 'Original' });
      addSession(session);

      const updated = { ...session, name: 'Updated' };
      updateSession(updated);

      expect(getSessions()[0].name).toBe('Updated');
    });

    it('should not update non-existent session', () => {
      const session = createMockSession({ id: '1', name: 'Original' });
      addSession(session);

      const nonExistent = createMockSession({ id: 'non-existent', name: 'New' });
      updateSession(nonExistent);

      expect(getSessions()).toHaveLength(1);
      expect(getSessions()[0].name).toBe('Original');
    });
  });

  describe('Active Session', () => {
    it('should return null when no active session', () => {
      expect(getActiveSession()).toBeNull();
    });

    it('should save and retrieve active session', () => {
      const session = createMockSession();
      saveActiveSession(session);
      expect(getActiveSession()).toEqual(session);
    });

    it('should clear active session when null is passed', () => {
      const session = createMockSession();
      saveActiveSession(session);
      expect(getActiveSession()).toEqual(session);

      saveActiveSession(null);
      expect(getActiveSession()).toBeNull();
    });

    it('should overwrite existing active session', () => {
      const session1 = createMockSession({ id: '1', name: 'First' });
      const session2 = createMockSession({ id: '2', name: 'Second' });

      saveActiveSession(session1);
      saveActiveSession(session2);

      expect(getActiveSession()?.name).toBe('Second');
    });
  });

  describe('Preferences', () => {
    it('should return default preferences when none saved', () => {
      const prefs = getPreferences();
      expect(prefs.weightUnit).toBe('lbs');
      expect(prefs.defaultRestSeconds).toBe(90);
      expect(prefs.darkMode).toBe(false);
    });

    it('should save and retrieve preferences', () => {
      const prefs = { weightUnit: 'kg' as const, distanceUnit: 'mi' as const, defaultRestSeconds: 120, darkMode: true };
      savePreferences(prefs);
      expect(getPreferences().weightUnit).toBe('kg');
      expect(getPreferences().defaultRestSeconds).toBe(120);
      expect(getPreferences().darkMode).toBe(true);
    });

    it('should merge with defaults for partial preferences', () => {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify({ darkMode: true }));
      const prefs = getPreferences();
      expect(prefs.darkMode).toBe(true);
      expect(prefs.weightUnit).toBe('lbs'); // default
      expect(prefs.defaultRestSeconds).toBe(90); // default
    });

    it('should preserve API key', () => {
      const prefs = {
        weightUnit: 'lbs' as const,
        distanceUnit: 'mi' as const,
        defaultRestSeconds: 90,
        darkMode: false,
        openaiApiKey: 'test-key-123',
      };
      savePreferences(prefs);
      expect(getPreferences().openaiApiKey).toBe('test-key-123');
    });
  });

  describe('Custom Exercises', () => {
    it('should return empty array when no custom exercises', () => {
      expect(getCustomExercises()).toEqual([]);
    });

    it('should save and retrieve custom exercises', () => {
      const exercises = [createMockExercise({ id: 'custom-1', name: 'My Exercise' })];
      saveCustomExercises(exercises);
      expect(getCustomExercises()).toEqual(exercises);
    });

    it('should add a custom exercise', () => {
      const exercise = createMockExercise({ id: 'custom-1', name: 'My Exercise' });
      addCustomExercise(exercise);
      expect(getCustomExercises()).toHaveLength(1);
      expect(getCustomExercises()[0].name).toBe('My Exercise');
    });

    it('should add multiple custom exercises', () => {
      addCustomExercise(createMockExercise({ id: '1', name: 'Exercise 1' }));
      addCustomExercise(createMockExercise({ id: '2', name: 'Exercise 2' }));
      expect(getCustomExercises()).toHaveLength(2);
    });
  });

  describe('Export/Import', () => {
    it('should export all data as JSON string', () => {
      const template = createMockTemplate();
      const session = createMockSession();
      const exercise = createMockExercise();
      addTemplate(template);
      addSession(session);
      addCustomExercise(exercise);

      const exported = exportAllData();
      const parsed = JSON.parse(exported);

      expect(parsed.templates).toHaveLength(1);
      expect(parsed.sessions).toHaveLength(1);
      expect(parsed.customExercises).toHaveLength(1);
      expect(parsed.preferences).toBeDefined();
    });

    it('should export default preferences when none saved', () => {
      const exported = exportAllData();
      const parsed = JSON.parse(exported);

      expect(parsed.preferences.weightUnit).toBe('lbs');
      expect(parsed.preferences.defaultRestSeconds).toBe(90);
    });

    it('should import all data from JSON string', () => {
      const data = {
        templates: [createMockTemplate({ name: 'Imported Template' })],
        sessions: [createMockSession({ name: 'Imported Session' })],
        preferences: { weightUnit: 'kg', distanceUnit: 'mi' as const, defaultRestSeconds: 60, darkMode: true },
        customExercises: [createMockExercise({ name: 'Imported Exercise' })],
      };

      const result = importAllData(JSON.stringify(data));

      expect(result).toBe(true);
      expect(getTemplates()).toHaveLength(1);
      expect(getTemplates()[0].name).toBe('Imported Template');
      expect(getSessions()).toHaveLength(1);
      expect(getPreferences().weightUnit).toBe('kg');
      expect(getCustomExercises()).toHaveLength(1);
    });

    it('should return false for invalid JSON', () => {
      expect(importAllData('invalid json')).toBe(false);
    });

    it('should handle partial import data', () => {
      const data = { templates: [createMockTemplate()] };
      const result = importAllData(JSON.stringify(data));
      expect(result).toBe(true);
      expect(getTemplates()).toHaveLength(1);
    });

    it('should handle empty import data', () => {
      const result = importAllData('{}');
      expect(result).toBe(true);
    });
  });

  describe('Clear All Data', () => {
    it('should clear all stored data', () => {
      addTemplate(createMockTemplate());
      addSession(createMockSession());
      saveActiveSession(createMockSession());
      savePreferences({ weightUnit: 'kg', distanceUnit: 'mi' as const, defaultRestSeconds: 120, darkMode: true });
      addCustomExercise(createMockExercise());

      clearAllData();

      expect(getTemplates()).toEqual([]);
      expect(getSessions()).toEqual([]);
      expect(getActiveSession()).toBeNull();
      expect(getCustomExercises()).toEqual([]);
      // Preferences return defaults after clear
      expect(getPreferences().weightUnit).toBe('lbs');
    });

    it('should handle clearing already empty storage', () => {
      clearAllData();
      expect(getTemplates()).toEqual([]);
      expect(getSessions()).toEqual([]);
    });
  });
});
