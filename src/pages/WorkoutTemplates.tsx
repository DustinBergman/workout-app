import { useState, FC } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Input, Modal } from '../components/ui';
import { getAllExercises, searchExercises } from '../data/exercises';
import { WorkoutTemplate, TemplateExercise, Exercise, MuscleGroup, Equipment } from '../types';
import { useStartWorkout } from '../hooks/useStartWorkout';

const MUSCLE_GROUPS: MuscleGroup[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'];
const EQUIPMENT_OPTIONS: Equipment[] = ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'];

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

export const WorkoutTemplates: FC = () => {
  const templates = useAppStore((state) => state.templates);
  const preferences = useAppStore((state) => state.preferences);
  const customExercises = useAppStore((state) => state.customExercises);
  const addTemplate = useAppStore((state) => state.addTemplate);
  const updateTemplate = useAppStore((state) => state.updateTemplate);
  const deleteTemplate = useAppStore((state) => state.deleteTemplate);
  const addCustomExercise = useAppStore((state) => state.addCustomExercise);
  const { isLoadingSuggestions, startWorkout } = useStartWorkout();

  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Custom exercise creation state
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscles, setNewExerciseMuscles] = useState<MuscleGroup[]>([]);
  const [newExerciseEquipment, setNewExerciseEquipment] = useState<Equipment>('other');

  const resetForm = () => {
    setTemplateName('');
    setTemplateExercises([]);
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
    setIsCreating(true);
  };

  const addExercise = (exerciseId: string) => {
    setTemplateExercises([
      ...templateExercises,
      {
        exerciseId,
        targetSets: 3,
        targetReps: 10,
        restSeconds: preferences.defaultRestSeconds,
      },
    ]);
    setShowExercisePicker(false);
    setExerciseSearch('');
  };

  const updateExercise = (index: number, updates: Partial<TemplateExercise>) => {
    const updated = [...templateExercises];
    updated[index] = { ...updated[index], ...updates };
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

  const saveTemplate = () => {
    if (!templateName.trim() || templateExercises.length === 0) return;

    const now = new Date().toISOString();

    if (editingTemplate) {
      updateTemplate({
        ...editingTemplate,
        name: templateName,
        exercises: templateExercises,
        updatedAt: now,
      });
    } else {
      addTemplate({
        id: generateId(),
        name: templateName,
        exercises: templateExercises,
        createdAt: now,
        updatedAt: now,
      });
    }

    resetForm();
  };

  const allExercises = getAllExercises(customExercises);

  const getExerciseName = (id: string) => {
    return allExercises.find((e) => e.id === id)?.name || 'Unknown Exercise';
  };

  const filteredExercises = exerciseSearch
    ? searchExercises(exerciseSearch, customExercises)
    : allExercises;

  const resetNewExerciseForm = () => {
    setNewExerciseName('');
    setNewExerciseMuscles([]);
    setNewExerciseEquipment('other');
    setIsCreatingExercise(false);
  };

  const handleCreateExercise = () => {
    if (!newExerciseName.trim()) return;

    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: newExerciseName.trim(),
      muscleGroups: newExerciseMuscles.length > 0 ? newExerciseMuscles : ['core'],
      equipment: newExerciseEquipment,
    };

    addCustomExercise(newExercise);
    addExercise(newExercise.id);
    resetNewExerciseForm();
  };

  const toggleMuscleGroup = (muscle: MuscleGroup) => {
    setNewExerciseMuscles(prev =>
      prev.includes(muscle)
        ? prev.filter(m => m !== muscle)
        : [...prev, muscle]
    );
  };

  if (isCreating) {
    return (
      <div className="p-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingTemplate ? 'Edit Template' : 'New Template'}
          </h1>
        </div>

        <div className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g., Push Day"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Exercises
              </label>
              <Button size="sm" variant="secondary" onClick={() => setShowExercisePicker(true)}>
                Add Exercise
              </Button>
            </div>

            {templateExercises.length === 0 ? (
              <Card className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400">
                  No exercises added yet
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {templateExercises.map((exercise, index) => (
                  <Card key={index} padding="sm">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveExercise(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveExercise(index, 'down')}
                          disabled={index === templateExercises.length - 1}
                          className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {getExerciseName(exercise.exerciseId)}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-gray-500">Sets</label>
                            <input
                              type="number"
                              min="1"
                              value={exercise.targetSets}
                              onChange={(e) => updateExercise(index, { targetSets: parseInt(e.target.value) || 1 })}
                              className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Reps</label>
                            <input
                              type="number"
                              min="1"
                              value={exercise.targetReps}
                              onChange={(e) => updateExercise(index, { targetReps: parseInt(e.target.value) || 1 })}
                              className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Rest (s)</label>
                            <input
                              type="number"
                              min="0"
                              step="15"
                              value={exercise.restSeconds}
                              onChange={(e) => updateExercise(index, { restSeconds: parseInt(e.target.value) || 0 })}
                              className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeExercise(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <Button
              onClick={saveTemplate}
              disabled={!templateName.trim() || templateExercises.length === 0}
              className="w-full"
            >
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </div>

        {/* Exercise Picker Modal */}
        <Modal
          isOpen={showExercisePicker}
          onClose={() => {
            setShowExercisePicker(false);
            setExerciseSearch('');
            resetNewExerciseForm();
          }}
          title={isCreatingExercise ? "Create New Exercise" : "Add Exercise"}
        >
          {isCreatingExercise ? (
            <div className="space-y-4">
              <Input
                label="Exercise Name"
                placeholder="e.g., Cable Lateral Raise"
                value={newExerciseName}
                onChange={(e) => setNewExerciseName(e.target.value)}
              />

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Muscle Groups
                </label>
                <div className="flex flex-wrap gap-2">
                  {MUSCLE_GROUPS.map((muscle) => (
                    <button
                      key={muscle}
                      type="button"
                      onClick={() => toggleMuscleGroup(muscle)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        newExerciseMuscles.includes(muscle)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {muscle}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Equipment
                </label>
                <select
                  value={newExerciseEquipment}
                  onChange={(e) => setNewExerciseEquipment(e.target.value as Equipment)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  {EQUIPMENT_OPTIONS.map((equip) => (
                    <option key={equip} value={equip}>
                      {equip.charAt(0).toUpperCase() + equip.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="ghost" onClick={resetNewExerciseForm} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleCreateExercise} disabled={!newExerciseName.trim()} className="flex-1">
                  Create & Add
                </Button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setIsCreatingExercise(true)}
                className="w-full mb-4 p-3 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Exercise
              </button>

              <Input
                placeholder="Search exercises..."
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                className="mb-4"
              />
              <div className="max-h-80 overflow-y-auto space-y-2">
                {filteredExercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    onClick={() => addExercise(exercise.id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {exercise.name}
                      </p>
                      {exercise.id.startsWith('custom-') && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                          Custom
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exercise.muscleGroups.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Templates
        </h1>
        <Button onClick={startCreating}>
          <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workout templates yet. Create your first one!
          </p>
          <Button onClick={startCreating}>Create Template</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {template.exercises.length} exercises
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => startEditing(template)}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Delete this template?')) {
                        deleteTemplate(template.id);
                      }
                    }}
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>

              <div className="space-y-1 mb-4">
                {template.exercises.slice(0, 4).map((exercise, index) => (
                  <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
                    {getExerciseName(exercise.exerciseId)} - {exercise.targetSets}x{exercise.targetReps}
                  </p>
                ))}
                {template.exercises.length > 4 && (
                  <p className="text-sm text-gray-400">
                    +{template.exercises.length - 4} more
                  </p>
                )}
              </div>

              <Button className="w-full" onClick={() => startWorkout(template)}>
                Start Workout
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* AI Suggestions Loading Modal */}
      <Modal
        isOpen={isLoadingSuggestions}
        onClose={() => {}}
        title="Preparing Your Workout"
      >
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Getting AI recommendations...
          </p>
        </div>
      </Modal>
    </div>
  );
}
