import { FC } from 'react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card, Modal } from '../components/ui';
import { TemplateEditor } from '../components/plans';
import { WorkoutTemplate } from '../types';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import { useStartWorkout } from '../hooks/useStartWorkout';

// Sortable template card component
interface SortableTemplateCardProps {
  template: WorkoutTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
  getExerciseName: (id: string) => string;
  isNext: boolean;
}

const SortableTemplateCard: FC<SortableTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onStart,
  getExerciseName,
  isNext,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`${isDragging ? 'ring-2 ring-primary' : ''} ${isNext ? 'border-primary/50' : ''}`}>
        {/* Drag handle at top */}
        <div
          {...attributes}
          {...listeners}
          className="flex justify-center pb-2 mb-2 -mt-1 cursor-grab active:cursor-grabbing touch-none border-b border-gray-100 dark:border-gray-700"
          aria-label="Drag to reorder"
        >
          <svg className="w-6 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {template.name}
              </h3>
              {isNext && (
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  Next
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {template.exercises.length} exercises
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          {template.exercises.slice(0, 4).map((exercise, index) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              {getExerciseName(exercise.exerciseId)} - {exercise.type === 'cardio' ? 'Cardio' : `${exercise.targetSets}x${exercise.targetReps}`}
            </p>
          ))}
          {template.exercises.length > 4 && (
            <p className="text-sm text-gray-400">
              +{template.exercises.length - 4} more
            </p>
          )}
        </div>

        <Button className="w-full" onClick={onStart}>
          Start Workout
        </Button>
      </Card>
    </div>
  );
};

export const WorkoutPlans: FC = () => {
  const {
    // Store data
    templates,
    deleteTemplate,
    // State
    isCreating,
    editingTemplate,
    templateName,
    templateExercises,
    showExercisePicker,
    exerciseSearch,
    isCreatingExercise,
    newExerciseName,
    newExerciseMuscles,
    newExerciseEquipment,
    nextWorkoutId,
    filteredExercises,
    // Setters
    setTemplateName,
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
    // Constants
    MUSCLE_GROUPS,
    EQUIPMENT_OPTIONS,
  } = useWorkoutPlans();

  const { isLoadingSuggestions, startWorkout } = useStartWorkout();

  if (isCreating) {
    return (
      <TemplateEditor
        editingTemplate={editingTemplate}
        templateName={templateName}
        templateExercises={templateExercises}
        showExercisePicker={showExercisePicker}
        exerciseSearch={exerciseSearch}
        isCreatingExercise={isCreatingExercise}
        newExerciseName={newExerciseName}
        newExerciseMuscles={newExerciseMuscles}
        newExerciseEquipment={newExerciseEquipment}
        filteredExercises={filteredExercises}
        muscleGroups={MUSCLE_GROUPS}
        equipmentOptions={EQUIPMENT_OPTIONS}
        onBack={resetForm}
        onNameChange={setTemplateName}
        onOpenPicker={() => setShowExercisePicker(true)}
        onClosePicker={() => {
          setShowExercisePicker(false);
          setExerciseSearch('');
          resetNewExerciseForm();
        }}
        onSearchChange={setExerciseSearch}
        onAddExercise={addExercise}
        onUpdateExercise={updateExercise}
        onRemoveExercise={removeExercise}
        onMoveExercise={moveExercise}
        onSave={saveTemplate}
        getExerciseName={getExerciseName}
        onStartCreatingExercise={() => setIsCreatingExercise(true)}
        onCancelCreatingExercise={resetNewExerciseForm}
        onNewExerciseNameChange={setNewExerciseName}
        onNewExerciseEquipmentChange={setNewExerciseEquipment}
        onToggleMuscle={toggleMuscleGroup}
        onCreateExercise={handleCreateExercise}
      />
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Workout Plans
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
            No workout plans yet. Create your first one!
          </p>
          <Button onClick={startCreating}>Create Plan</Button>
        </Card>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Drag to reorder your workout rotation.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={templates.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {templates.map((template) => (
                  <SortableTemplateCard
                    key={template.id}
                    template={template}
                    onEdit={() => startEditing(template)}
                    onDelete={() => {
                      if (confirm('Delete this template?')) {
                        deleteTemplate(template.id);
                      }
                    }}
                    onStart={() => startWorkout(template)}
                    getExerciseName={getExerciseName}
                    isNext={template.id === nextWorkoutId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
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
};
