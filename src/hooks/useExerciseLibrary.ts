import { useState, useMemo, useCallback } from 'react';
import { exercises, searchExercises } from '../data/exercises';
import { useAppStore } from '../store/useAppStore';
import { MuscleGroup, Equipment, Exercise, ExerciseType } from '../types';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'
];

export const EQUIPMENT_TYPES: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'
];

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  back: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  shoulders: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  biceps: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  triceps: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  forearms: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  core: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  quadriceps: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  hamstrings: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  glutes: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  calves: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  traps: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  lats: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
};

export const formatMuscleGroup = (muscle: string): string => {
  return muscle.charAt(0).toUpperCase() + muscle.slice(1).replace(/-/g, ' ');
};

export const formatEquipment = (equipment: string): string => {
  return equipment.charAt(0).toUpperCase() + equipment.slice(1).replace(/-/g, ' ');
};

export const useExerciseLibrary = () => {
  const customExercises = useAppStore((state) => state.customExercises);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ExerciseType | ''>('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | ''>('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | ''>('');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Combine built-in and custom exercises
  const allExercises = useMemo(
    () => [...exercises, ...customExercises],
    [customExercises]
  );

  // Check if an exercise is custom
  const isCustomExercise = useCallback(
    (exerciseId: string) => customExercises.some((e) => e.id === exerciseId),
    [customExercises]
  );

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    let result: Exercise[] = searchQuery
      ? searchExercises(searchQuery, customExercises)
      : allExercises;

    // Filter by exercise type (strength/cardio)
    if (selectedType) {
      result = result.filter((e) => e.type === selectedType);
    }

    // Filter by muscle group (strength only)
    if (selectedMuscle) {
      result = result.filter(
        (e) => e.type === 'strength' && e.muscleGroups.includes(selectedMuscle)
      );
    }

    // Filter by equipment (strength only)
    if (selectedEquipment) {
      result = result.filter(
        (e) => e.type === 'strength' && e.equipment === selectedEquipment
      );
    }

    return result;
  }, [searchQuery, selectedType, selectedMuscle, selectedEquipment, allExercises, customExercises]);

  // Toggle expanded exercise
  const toggleExercise = useCallback((exerciseId: string) => {
    setExpandedExercise((prev) => (prev === exerciseId ? null : exerciseId));
  }, []);

  return {
    // State
    searchQuery,
    selectedType,
    selectedMuscle,
    selectedEquipment,
    expandedExercise,
    // Setters
    setSearchQuery,
    setSelectedType,
    setSelectedMuscle,
    setSelectedEquipment,
    // Computed
    filteredExercises,
    // Functions
    isCustomExercise,
    toggleExercise,
    // Constants
    MUSCLE_GROUPS,
    EQUIPMENT_TYPES,
    MUSCLE_GROUP_COLORS,
  };
};
