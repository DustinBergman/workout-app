import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../ui';
import { TemplateExerciseCard } from './TemplateExerciseCard';
import { ExercisePickerModal } from './ExercisePickerModal';
import { WorkoutTemplate, TemplateExercise, Exercise, MuscleGroup, Equipment, TemplateType } from '../../types';

interface TemplateEditorProps {
  editingTemplate: WorkoutTemplate | null;
  templateName: string;
  templateExercises: TemplateExercise[];
  templateType: TemplateType;
  showExercisePicker: boolean;
  exerciseSearch: string;
  isCreatingExercise: boolean;
  newExerciseName: string;
  newExerciseMuscles: MuscleGroup[];
  newExerciseEquipment: Equipment;
  filteredExercises: Exercise[];
  muscleGroups: MuscleGroup[];
  equipmentOptions: Equipment[];
  // Actions
  onBack: () => void;
  onNameChange: (name: string) => void;
  onTemplateTypeChange: (type: TemplateType) => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onSearchChange: (search: string) => void;
  onAddExercise: (exercise: Exercise) => void;
  onUpdateExercise: (index: number, updates: Partial<TemplateExercise>) => void;
  onRemoveExercise: (index: number) => void;
  onMoveExercise: (index: number, direction: 'up' | 'down') => void;
  onSave: () => void;
  getExerciseName: (id: string) => string;
  // Custom exercise
  onStartCreatingExercise: () => void;
  onCancelCreatingExercise: () => void;
  onNewExerciseNameChange: (name: string) => void;
  onNewExerciseEquipmentChange: (equipment: Equipment) => void;
  onToggleMuscle: (muscle: MuscleGroup) => void;
  onCreateExercise: () => void;
}

export const TemplateEditor: FC<TemplateEditorProps> = ({
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
  filteredExercises,
  muscleGroups,
  equipmentOptions,
  onBack,
  onNameChange,
  onTemplateTypeChange,
  onOpenPicker,
  onClosePicker,
  onSearchChange,
  onAddExercise,
  onUpdateExercise,
  onRemoveExercise,
  onMoveExercise,
  onSave,
  getExerciseName,
  onStartCreatingExercise,
  onCancelCreatingExercise,
  onNewExerciseNameChange,
  onNewExerciseEquipmentChange,
  onToggleMuscle,
  onCreateExercise,
}) => {
  const navigate = useNavigate();

  const hasIncompleteExercises = templateExercises.some(exercise => {
    if (exercise.type === 'strength') {
      return exercise.targetSets === undefined || exercise.targetReps === undefined || exercise.restSeconds === undefined;
    } else {
      return exercise.restSeconds === undefined;
    }
  });

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingTemplate ? 'Edit Plan' : 'New Plan'}
          </h1>
        </div>
        <Button
          onClick={onSave}
          disabled={!templateName.trim() || templateExercises.length === 0}
        >
          Finish
        </Button>
      </div>

      {/* Create with AI button - only show when creating new */}
      {!editingTemplate && (
        <button
          onClick={() => navigate('/plans/create-with-ai')}
          className="w-full mb-4 p-4 border-2 border-dashed border-primary/50 rounded-xl text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Create with AI
        </button>
      )}

      <div className="space-y-4">
        <Input
          label="Plan Name"
          placeholder="e.g., Push Day"
          value={templateName}
          onChange={(e) => onNameChange(e.target.value)}
        />

        {/* Type selector - only show when creating new template with no exercises */}
        {!editingTemplate && templateExercises.length === 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Plan Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onTemplateTypeChange('strength')}
                className={`p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 ${
                  templateType === 'strength'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <svg className={`w-8 h-8 ${templateType === 'strength' ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zm-6 2h4v8h-4V8z" />
                </svg>
                <span className={`font-medium ${templateType === 'strength' ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Strength
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Weights, reps, sets
                </span>
              </button>
              <button
                type="button"
                onClick={() => onTemplateTypeChange('cardio')}
                className={`p-4 rounded-xl border-2 transition-colors flex flex-col items-center gap-2 ${
                  templateType === 'cardio'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <svg className={`w-8 h-8 ${templateType === 'cardio' ? 'text-green-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className={`font-medium ${templateType === 'cardio' ? 'text-green-700 dark:text-green-300' : 'text-gray-600 dark:text-gray-400'}`}>
                  Cardio
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Running, HIIT, cycling
                </span>
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Exercises
          </label>

          {templateExercises.length === 0 ? (
            <Card className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                No exercises added yet
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {templateExercises.map((exercise, index) => (
                <TemplateExerciseCard
                  key={index}
                  exercise={exercise}
                  index={index}
                  exerciseName={getExerciseName(exercise.exerciseId)}
                  onUpdate={onUpdateExercise}
                  onRemove={onRemoveExercise}
                  onMove={onMoveExercise}
                  isFirst={index === 0}
                  isLast={index === templateExercises.length - 1}
                />
              ))}
            </div>
          )}

          {/* Add Exercise button at the bottom of exercises */}
          <button
            onClick={onOpenPicker}
            disabled={hasIncompleteExercises}
            className="w-full mt-3 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Exercise
          </button>
        </div>
      </div>

      <ExercisePickerModal
        isOpen={showExercisePicker}
        onClose={onClosePicker}
        onSelect={onAddExercise}
        exercises={filteredExercises}
        templateType={templateType}
        search={exerciseSearch}
        onSearchChange={onSearchChange}
        isCreatingExercise={isCreatingExercise}
        onStartCreating={onStartCreatingExercise}
        newExerciseName={newExerciseName}
        newExerciseMuscles={newExerciseMuscles}
        newExerciseEquipment={newExerciseEquipment}
        muscleGroups={muscleGroups}
        equipmentOptions={equipmentOptions}
        onNewExerciseNameChange={onNewExerciseNameChange}
        onNewExerciseEquipmentChange={onNewExerciseEquipmentChange}
        onToggleMuscle={onToggleMuscle}
        onCreateExercise={onCreateExercise}
        onCancelCreateExercise={onCancelCreatingExercise}
      />
    </div>
  );
};
