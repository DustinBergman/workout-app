import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { MuscleGroup, Equipment, StrengthExercise } from '../types';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'
];

export const EQUIPMENT_OPTIONS: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'
];

export interface CustomExerciseState {
  isCreating: boolean;
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment;
}

interface UseCustomExerciseReturn {
  customExerciseState: CustomExerciseState;
  setIsCreatingExercise: (value: boolean) => void;
  setNewExerciseName: (name: string) => void;
  setNewExerciseEquipment: (equipment: Equipment) => void;
  toggleMuscleGroup: (muscle: MuscleGroup) => void;
  resetNewExerciseForm: () => void;
  createExercise: () => StrengthExercise | null;
}

export const useCustomExercise = (): UseCustomExerciseReturn => {
  const addCustomExercise = useAppStore((state) => state.addCustomExercise);

  const [customExerciseState, setCustomExerciseState] = useState<CustomExerciseState>({
    isCreating: false,
    name: '',
    muscles: [],
    equipment: 'other',
  });

  const setIsCreatingExercise = useCallback((value: boolean) => {
    setCustomExerciseState(prev => ({ ...prev, isCreating: value }));
  }, []);

  const setNewExerciseName = useCallback((name: string) => {
    setCustomExerciseState(prev => ({ ...prev, name }));
  }, []);

  const setNewExerciseEquipment = useCallback((equipment: Equipment) => {
    setCustomExerciseState(prev => ({ ...prev, equipment }));
  }, []);

  const toggleMuscleGroup = useCallback((muscle: MuscleGroup) => {
    setCustomExerciseState(prev => ({
      ...prev,
      muscles: prev.muscles.includes(muscle)
        ? prev.muscles.filter(m => m !== muscle)
        : [...prev.muscles, muscle]
    }));
  }, []);

  const resetNewExerciseForm = useCallback(() => {
    setCustomExerciseState({
      isCreating: false,
      name: '',
      muscles: [],
      equipment: 'other',
    });
  }, []);

  // Create a new custom exercise and return it (or null if invalid)
  const createExercise = useCallback((): StrengthExercise | null => {
    if (!customExerciseState.name.trim()) return null;

    const newExercise: StrengthExercise = {
      id: crypto.randomUUID(),
      type: 'strength',
      name: customExerciseState.name.trim(),
      muscleGroups: customExerciseState.muscles.length > 0 ? customExerciseState.muscles : ['core'],
      equipment: customExerciseState.equipment,
    };

    addCustomExercise(newExercise);
    resetNewExerciseForm();
    return newExercise;
  }, [customExerciseState, addCustomExercise, resetNewExerciseForm]);

  return {
    customExerciseState,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,
    toggleMuscleGroup,
    resetNewExerciseForm,
    createExercise,
  };
};
