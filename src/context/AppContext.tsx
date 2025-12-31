import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  WorkoutTemplate,
  WorkoutSession,
  UserPreferences,
  Exercise,
  AppState,
} from '../types';
import * as storage from '../services/storage';

// Action types
type AppAction =
  | { type: 'SET_TEMPLATES'; payload: WorkoutTemplate[] }
  | { type: 'ADD_TEMPLATE'; payload: WorkoutTemplate }
  | { type: 'UPDATE_TEMPLATE'; payload: WorkoutTemplate }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'SET_SESSIONS'; payload: WorkoutSession[] }
  | { type: 'ADD_SESSION'; payload: WorkoutSession }
  | { type: 'UPDATE_SESSION'; payload: WorkoutSession }
  | { type: 'SET_ACTIVE_SESSION'; payload: WorkoutSession | null }
  | { type: 'SET_PREFERENCES'; payload: UserPreferences }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_CUSTOM_EXERCISES'; payload: Exercise[] }
  | { type: 'ADD_CUSTOM_EXERCISE'; payload: Exercise };

// Initial state
const initialState: AppState = {
  templates: [],
  sessions: [],
  activeSession: null,
  preferences: {
    weightUnit: 'lbs',
    defaultRestSeconds: 90,
    darkMode: false,
  },
  customExercises: [],
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_TEMPLATES':
      return { ...state, templates: action.payload };
    case 'ADD_TEMPLATE':
      return { ...state, templates: [...state.templates, action.payload] };
    case 'UPDATE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case 'DELETE_TEMPLATE':
      return {
        ...state,
        templates: state.templates.filter((t) => t.id !== action.payload),
      };
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [...state.sessions, action.payload] };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'SET_ACTIVE_SESSION':
      return { ...state, activeSession: action.payload };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    case 'SET_CUSTOM_EXERCISES':
      return { ...state, customExercises: action.payload };
    case 'ADD_CUSTOM_EXERCISE':
      return { ...state, customExercises: [...state.customExercises, action.payload] };
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load data from localStorage on mount
  useEffect(() => {
    dispatch({ type: 'SET_TEMPLATES', payload: storage.getTemplates() });
    dispatch({ type: 'SET_SESSIONS', payload: storage.getSessions() });
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: storage.getActiveSession() });
    dispatch({ type: 'SET_PREFERENCES', payload: storage.getPreferences() });
    dispatch({ type: 'SET_CUSTOM_EXERCISES', payload: storage.getCustomExercises() });
  }, []);

  // Apply dark mode
  useEffect(() => {
    if (state.preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.preferences.darkMode]);

  // Actions with localStorage sync
  const addTemplate = (template: WorkoutTemplate) => {
    storage.addTemplate(template);
    dispatch({ type: 'ADD_TEMPLATE', payload: template });
  };

  const updateTemplate = (template: WorkoutTemplate) => {
    storage.updateTemplate(template);
    dispatch({ type: 'UPDATE_TEMPLATE', payload: template });
  };

  const deleteTemplate = (templateId: string) => {
    storage.deleteTemplate(templateId);
    dispatch({ type: 'DELETE_TEMPLATE', payload: templateId });
  };

  const addSession = (session: WorkoutSession) => {
    storage.addSession(session);
    dispatch({ type: 'ADD_SESSION', payload: session });
  };

  const updateSession = (session: WorkoutSession) => {
    storage.updateSession(session);
    dispatch({ type: 'UPDATE_SESSION', payload: session });
  };

  const setActiveSession = (session: WorkoutSession | null) => {
    storage.saveActiveSession(session);
    dispatch({ type: 'SET_ACTIVE_SESSION', payload: session });
  };

  const updatePreferences = (preferences: Partial<UserPreferences>) => {
    const newPreferences = { ...state.preferences, ...preferences };
    storage.savePreferences(newPreferences);
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const addCustomExercise = (exercise: Exercise) => {
    storage.addCustomExercise(exercise);
    dispatch({ type: 'ADD_CUSTOM_EXERCISE', payload: exercise });
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        addSession,
        updateSession,
        setActiveSession,
        updatePreferences,
        addCustomExercise,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
