import { FC } from 'react';
import {
  DndContext,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Link } from 'react-router-dom';
import { Button, Card, Modal } from '../components/ui';
import { TemplateEditor, SortableTemplateCard } from '../components/plans';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import { useStartWorkout } from '../hooks/useStartWorkout';

export const WorkoutPlans: FC = () => {
  const {
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
  } = useWorkoutPlans();

  const { isLoadingSuggestions, startWorkout } = useStartWorkout();

  if (isCreating) {
    return (
      <TemplateEditor
        editingTemplate={editingTemplate}
        templateName={templateName}
        templateExercises={templateExercises}
        templateType={templateType}
        showExercisePicker={showExercisePicker}
        exerciseSearch={exerciseSearch}
        isCreatingExercise={isCreatingExercise}
        newExerciseName={newExerciseName}
        newExerciseMuscles={newExerciseMuscles}
        newExerciseEquipment={newExerciseEquipment}
        filteredExercises={filteredExercises}
        muscleGroups={MUSCLE_GROUPS}
        equipmentOptions={EQUIPMENT_OPTIONS}
        editingCustomExercise={editingCustomExercise}
        isOwnCustomExercise={isOwnCustomExercise}
        onBack={resetForm}
        onNameChange={setTemplateName}
        onTemplateTypeChange={setTemplateType}
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
        onEditCustomExercise={openEditCustomExercise}
        onSaveCustomExerciseName={saveCustomExerciseName}
        onCloseEditCustomExercise={closeEditCustomExercise}
      />
    );
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      </div>

      <div className="relative z-10 p-4 pb-20">
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
                    onToggleRotation={() => toggleTemplateRotation(template.id)}
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

      {/* Exercise Library Link */}
      <div className="mt-8 pt-6 border-t border-border">
        <Link
          to="/exercises"
          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <div>
              <p className="font-medium">Exercise Library</p>
              <p className="text-sm text-muted-foreground">Browse all exercises</p>
            </div>
          </div>
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      </div>
    </div>
  );
};
