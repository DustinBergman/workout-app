import { useState } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useAppStore } from '../store/useAppStore';
import { getAllExercises, searchExercises } from '../data/exercises';
import {
  WorkoutTemplate,
  TemplateExercise,
  Exercise,
  MuscleGroup,
  Equipment,
  TemplateType,
  CardioExercise,
  CARDIO_TYPE_TO_CATEGORY,
} from '../types';

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'
];

const EQUIPMENT_OPTIONS: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'
];

const generateId = (): string => {
  return crypto.randomUUID();
};

export const useWorkoutPlans = () => {
  // Store state
  const templates = useAppStore((state) => state.templates);
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const customExercises = useAppStore((state) => state.customExercises);
  const addTemplate = useAppStore((state) => state.addTemplate);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const deleteTemplate = useAppStore((state) => state.deleteTemplate);
  const reorderTemplates = useAppStore((state) => state.reorderTemplates);
  const addCustomExercise = useAppStore((state) => state.addCustomExercise);
  const updateCustomExercise = useAppStore((state) => state.updateCustomExercise);
  const toggleTemplateRotation = useAppStore((state) => state.toggleTemplateRotation);

  // Template editor state
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [templateType, setTemplateType] = useState<TemplateType>('strength');

  // Exercise picker state
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Custom exercise creation state
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscles, setNewExerciseMuscles] = useState<MuscleGroup[]>([]);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>('other');

  // Edit custom exercise modal state
  const [editingCustomExercise, setEditingCustomExercise] = useState<{ id: string; name: string } | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate the next workout based on most recent completed session
  const getNextWorkoutId = (): string | null => {
    if (templates.length === 0) return null;

    const completedSessions = sessions.filter((s) => s.completedAt);
    if (completedSessions.length === 0) {
      return templates[0].id;
    }

    const mostRecent = completedSessions.sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    )[0];

    const lastWorkoutIndex = templates.findIndex((t) => t.name === mostRecent.name);

    if (lastWorkoutIndex === -1) {
      return templates[0].id;
    }

    const nextIndex = (lastWorkoutIndex + 1) % templates.length;
    return templates[nextIndex].id;
  };

  const nextWorkoutId = getNextWorkoutId();

  // All exercises including custom
  const allExercises = getAllExercises(customExercises);

  const getExerciseName = (id: string) => {
    return allExercises.find((e) => e.id === id)?.name || 'Unknown Exercise';
  };

  const filteredExercises = exerciseSearch
    ? searchExercises(exerciseSearch, customExercises)
    : allExercises;

  // Form actions
  const resetForm = () => {
    setTemplateName('');
    setTemplateExercises([]);
    setTemplateType('strength');
    setIsCreating(false);
    setEditingTemplate(null);
  };

  const startCreating = () => {
    resetForm();
    setIsCreating(true);
  };

  const startEditing = (template: WorkoutTemplate) => {
    setEditingTemplate(template);
    setTemplateName(template.name);
    setTemplateExercises([...template.exercises]);
    setTemplateType(template.templateType);
    setIsCreating(true);
  };

  // Exercise management
  const addExercise = (exercise: Exercise) => {
    if (exercise.type === 'cardio') {
      const cardioExercise = exercise as CardioExercise;
      const category = CARDIO_TYPE_TO_CATEGORY[cardioExercise.cardioType];

      // Auto-set template type if first exercise
      if (templateExercises.length === 0) {
        setTemplateType('cardio');
      }

      // Create bespoke cardio template exercise based on category
      const baseCardio = {
        type: 'cardio' as const,
        exerciseId: exercise.id,
        restSeconds: preferences.defaultRestSeconds,
      };

      if (category === 'distance') {
        setTemplateExercises([
          ...templateExercises,
          { ...baseCardio, cardioCategory: 'distance' as const, targetDurationMinutes: 30 },
        ]);
      } else if (category === 'interval') {
        setTemplateExercises([
          ...templateExercises,
          { ...baseCardio, cardioCategory: 'interval' as const, rounds: 4, workSeconds: 30, restBetweenRoundsSeconds: 15 },
        ]);
      } else if (category === 'laps') {
        setTemplateExercises([
          ...templateExercises,
          { ...baseCardio, cardioCategory: 'laps' as const, targetLaps: 20 },
        ]);
      } else if (category === 'duration') {
        setTemplateExercises([
          ...templateExercises,
          { ...baseCardio, cardioCategory: 'duration' as const, targetDurationMinutes: 20, targetIntensity: 'moderate' },
        ]);
      } else {
        setTemplateExercises([
          ...templateExercises,
          { ...baseCardio, cardioCategory: 'other' as const, targetDurationMinutes: 20 },
        ]);
      }
    } else {
      // Auto-set template type if first exercise
      if (templateExercises.length === 0) {
        setTemplateType('strength');
      }

      setTemplateExercises([
        ...templateExercises,
        {
          type: 'strength',
          exerciseId: exercise.id,
          targetSets: 3,
          targetReps: 10,
          restSeconds: preferences.defaultRestSeconds,
        },
      ]);
    }
    setShowExercisePicker(false);
    setExerciseSearch('');
  };

  const updateExercise = (index: number, updates: Partial<TemplateExercise>) => {
    const updated = [...templateExercises];
    updated[index] = { ...updated[index], ...updates } as TemplateExercise;
    setTemplateExercises(updated);
  };

  const removeExercise = (index: number) => {
    setTemplateExercises(templateExercises.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= templateExercises.length) return;

    const updated = [...templateExercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setTemplateExercises(updated);
  };

  // Template save
  const saveTemplate = () => {
    if (!templateName.trim() || templateExercises.length === 0) return;

    const now = new Date().toISOString();

    if (editingTemplate) {
      updateTemplate({
        ...editingTemplate,
        name: templateName,
        templateType,
        exercises: templateExercises,
        updatedAt: now,
      });
    } else {
      addTemplate({
        id: generateId(),
        name: templateName,
        templateType,
        exercises: templateExercises,
        inRotation: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    resetForm();
  };

  // Custom exercise management
  const resetNewExerciseForm = () => {
    setNewExerciseName('');
    setNewExerciseMuscles([]);
    setNewExerciseEquipment('other');
    setIsCreatingExercise(false);
  };

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return;

    const newExercise: Exercise = {
      type: 'strength',
      id: crypto.randomUUID(),
      name: newExerciseName.trim(),
      muscleGroups: newExerciseMuscles.length > 0 ? newExerciseMuscles : ['core'],
      equipment: newExerciseEquipment,
    };

    addCustomExercise(newExercise);
    addExercise(newExercise);
    resetNewExerciseForm();
  };

  const toggleMuscleGroup = (muscle: MuscleGroup) => {
    setNewExerciseMuscles((prev) =>
      prev.includes(muscle)
        ? prev.filter((m) => m !== muscle)
        : [...prev, muscle]
    );
  };

  // Check if an exercise is the user's own custom exercise
  const isOwnCustomExercise = (exerciseId: string): boolean => {
    return customExercises.some((ex) => ex.id === exerciseId);
  };

  // Open the edit custom exercise modal
  const openEditCustomExercise = (exerciseId: string, exerciseName: string) => {
    setEditingCustomExercise({ id: exerciseId, name: exerciseName });
  };

  // Save custom exercise name
  const saveCustomExerciseName = (exerciseId: string, newName: string) => {
    updateCustomExercise(exerciseId, { name: newName });
    setEditingCustomExercise(null);
  };

  // Close the edit custom exercise modal
  const closeEditCustomExercise = () => {
    setEditingCustomExercise(null);
  };

  // Drag and drop
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = templates.findIndex((t) => t.id === active.id);
      const newIndex = templates.findIndex((t) => t.id === over.id);

      const newOrder = [...templates];
      const [removed] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, removed);

      reorderTemplates(newOrder.map((t) => t.id));
    }
  };

  return {
    // Store data
    templates,
    deleteTemplate,
    toggleTemplateRotation,

    // State
    isCreating,
    editingTemplate,
    templateName,
    templateExercises,
    templateType,
    showExercisePicker,
    exerciseSearch,
    isCreatingExercise,
    newExerciseName,
    newExerciseMuscles,
    newExerciseEquipment,
    nextWorkoutId,
    filteredExercises,
    allExercises,

    // Setters
    setTemplateName,
    setTemplateType,
    setExerciseSearch,
    setShowExercisePicker,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,

    // Actions
    resetForm,
    startCreating,
    startEditing,
    saveTemplate,
    addExercise,
    updateExercise,
    removeExercise,
    moveExercise,
    handleCreateExercise,
    toggleMuscleGroup,
    resetNewExerciseForm,
    getExerciseName,

    // Drag-drop
    sensors,
    handleDragEnd,

    // Custom exercise editing
    editingCustomExercise,
    isOwnCustomExercise,
    openEditCustomExercise,
    saveCustomExerciseName,
    closeEditCustomExercise,

    // Constants
    MUSCLE_GROUPS,
    EQUIPMENT_OPTIONS,
  };
};
