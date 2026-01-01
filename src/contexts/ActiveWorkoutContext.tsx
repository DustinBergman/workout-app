import { createContext, useContext, ReactNode, FC } from 'react';
import { WorkoutSession, WeightUnit, DistanceUnit, ExerciseSuggestion, Exercise } from '../types';
import { useActiveWorkoutPage } from '../hooks/useActiveWorkoutPage';

export interface ActiveWorkoutContextValue {
  // Session data
  session: WorkoutSession | null;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  customExercises: Exercise[];

  // Computed stats
  elapsedSeconds: number;
  totalSets: number;
  totalVolume: number;
  totalCardioDistance: number;
  hasDeviated: boolean;

  // Exercise operations (by index in session.exercises)
  logSetForExercise: (index: number, reps: number, weight: number) => void;
  logCardioForExercise: (index: number, distance: number, unit: DistanceUnit, durationSeconds: number) => void;
  removeLastSetForExercise: (index: number) => void;
  removeSetForExercise: (exerciseIndex: number, setIndex: number) => void;
  updateSetForExercise: (exerciseIndex: number, setIndex: number, reps: number, weight: number) => void;
  removeExercise: (index: number) => void;
  updateTargetSets: (exerciseId: string, delta: number) => void;

  // Timer operations
  handleStartTimer: (duration: number) => void;

  // UI state
  expandedIndex: number | null;
  setExpandedIndex: (index: number | null) => void;

  // Utilities
  getSuggestionForExercise: (exerciseId: string) => ExerciseSuggestion | undefined;
  handleShowHistory: (exerciseId: string) => void;
}

export const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

interface ActiveWorkoutProviderProps {
  children: ReactNode;
}

export const ActiveWorkoutProvider: FC<ActiveWorkoutProviderProps> = ({ children }) => {
  const hookValues = useActiveWorkoutPage();

  // Don't render children if no active session
  if (!hookValues.session) {
    return null;
  }

  const contextValue: ActiveWorkoutContextValue = {
    // Session data
    session: hookValues.session,
    weightUnit: hookValues.weightUnit,
    distanceUnit: hookValues.distanceUnit,
    customExercises: hookValues.customExercises,

    // Computed stats
    elapsedSeconds: hookValues.elapsedSeconds,
    totalSets: hookValues.totalSets,
    totalVolume: hookValues.totalVolume,
    totalCardioDistance: hookValues.totalCardioDistance,
    hasDeviated: hookValues.hasDeviated,

    // Exercise operations
    logSetForExercise: hookValues.logSetForExercise,
    logCardioForExercise: hookValues.logCardioForExercise,
    removeLastSetForExercise: hookValues.removeLastSetForExercise,
    removeSetForExercise: hookValues.removeSetForExercise,
    updateSetForExercise: hookValues.updateSetForExercise,
    removeExercise: hookValues.removeExercise,
    updateTargetSets: hookValues.updateTargetSets,

    // Timer operations
    handleStartTimer: hookValues.handleStartTimer,

    // UI state
    expandedIndex: hookValues.expandedIndex,
    setExpandedIndex: hookValues.setExpandedIndex,

    // Utilities
    getSuggestionForExercise: hookValues.getSuggestionForExercise,
    handleShowHistory: hookValues.handleShowHistory,
  };

  return (
    <ActiveWorkoutContext.Provider value={contextValue}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
};

export const useActiveWorkoutContext = (): ActiveWorkoutContextValue => {
  const context = useContext(ActiveWorkoutContext);
  if (!context) {
    throw new Error('useActiveWorkoutContext must be used within ActiveWorkoutProvider');
  }
  return context;
};
