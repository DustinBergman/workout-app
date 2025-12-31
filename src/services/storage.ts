import {
  WorkoutTemplate,
  WorkoutSession,
  UserPreferences,
  Exercise,
  STORAGE_KEYS,
} from '../types';

const defaultPreferences: UserPreferences = {
  weightUnit: 'lbs',
  defaultRestSeconds: 90,
  darkMode: false,
};

// Templates
export function getTemplates(): WorkoutTemplate[] {
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return data ? JSON.parse(data) : [];
}

export function saveTemplates(templates: WorkoutTemplate[]): void {
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function addTemplate(template: WorkoutTemplate): void {
  const templates = getTemplates();
  templates.push(template);
  saveTemplates(templates);
}

export function updateTemplate(template: WorkoutTemplate): void {
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === template.id);
  if (index !== -1) {
    templates[index] = template;
    saveTemplates(templates);
  }
}

export function deleteTemplate(templateId: string): void {
  const templates = getTemplates().filter((t) => t.id !== templateId);
  saveTemplates(templates);
}

// Sessions
export function getSessions(): WorkoutSession[] {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
}

export function saveSessions(sessions: WorkoutSession[]): void {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
}

export function addSession(session: WorkoutSession): void {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
}

export function updateSession(session: WorkoutSession): void {
  const sessions = getSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index !== -1) {
    sessions[index] = session;
    saveSessions(sessions);
  }
}

// Active Session
export function getActiveSession(): WorkoutSession | null {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
  return data ? JSON.parse(data) : null;
}

export function saveActiveSession(session: WorkoutSession | null): void {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  }
}

// Preferences
export function getPreferences(): UserPreferences {
  const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
  return data ? { ...defaultPreferences, ...JSON.parse(data) } : defaultPreferences;
}

export function savePreferences(preferences: UserPreferences): void {
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(preferences));
}

// Custom Exercises
export function getCustomExercises(): Exercise[] {
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
  return data ? JSON.parse(data) : [];
}

export function saveCustomExercises(exercises: Exercise[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOM_EXERCISES, JSON.stringify(exercises));
}

export function addCustomExercise(exercise: Exercise): void {
  const exercises = getCustomExercises();
  exercises.push(exercise);
  saveCustomExercises(exercises);
}

// Export all data
export function exportAllData(): string {
  return JSON.stringify({
    templates: getTemplates(),
    sessions: getSessions(),
    preferences: getPreferences(),
    customExercises: getCustomExercises(),
  });
}

// Import all data
export function importAllData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    if (data.templates) saveTemplates(data.templates);
    if (data.sessions) saveSessions(data.sessions);
    if (data.preferences) savePreferences(data.preferences);
    if (data.customExercises) saveCustomExercises(data.customExercises);
    return true;
  } catch {
    return false;
  }
}

// Clear all data
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.TEMPLATES);
  localStorage.removeItem(STORAGE_KEYS.SESSIONS);
  localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  localStorage.removeItem(STORAGE_KEYS.CUSTOM_EXERCISES);
}
