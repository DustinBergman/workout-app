import { FC, ReactNode } from 'react';
import { WeightUnit, DistanceUnit } from '../types';
import { ActiveWorkoutContextValue, ActiveWorkoutContext } from '../contexts/ActiveWorkoutContext';
import { vi } from 'vitest';

interface MockActiveWorkoutProviderProps {
  children: ReactNode;
  value?: Partial<ActiveWorkoutContextValue>;
}

// Create default mock values
const createDefaultMockValue = (overrides?: Partial<ActiveWorkoutContextValue>): ActiveWorkoutContextValue => ({
  // Session data
  session: {
    id: 'mock-session',
    name: 'Mock Workout',
    startedAt: new Date().toISOString(),
    exercises: [],
  },
  weightUnit: 'lb' as WeightUnit,
  distanceUnit: 'mi' as DistanceUnit,
  customExercises: [],

  // Computed stats
  elapsedSeconds: 0,
  totalSets: 0,
  totalVolume: 0,
  totalCardioDistance: 0,
  hasDeviated: false,

  // Exercise operations (mocked)
  logSetForExercise: vi.fn(),
  logCardioForExercise: vi.fn(),
  removeLastSetForExercise: vi.fn(),
  removeExercise: vi.fn(),
  updateTargetSets: vi.fn(),

  // Timer operations
  handleStartTimer: vi.fn(),

  // UI state
  expandedIndex: null,
  setExpandedIndex: vi.fn(),

  // Utilities
  getSuggestionForExercise: vi.fn(),
  handleShowHistory: vi.fn(),

  // Apply overrides
  ...overrides,
});

export const MockActiveWorkoutProvider: FC<MockActiveWorkoutProviderProps> = ({
  children,
  value,
}) => {
  const contextValue = createDefaultMockValue(value);

  return (
    <ActiveWorkoutContext.Provider value={contextValue}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
};
