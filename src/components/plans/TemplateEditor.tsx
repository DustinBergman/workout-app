import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../ui';
import { TemplateExerciseCard } from './TemplateExerciseCard';
import { ExercisePickerModal } from './ExercisePickerModal';
import { WorkoutTemplate, TemplateExercise, Exercise, MuscleGroup, Equipment } from '../../types';

interface TemplateEditorProps {
  editingTemplate: WorkoutTemplate | null;
  templateName: string;
  templateExercises: TemplateExercise[];
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
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {editingTemplate ? 'Edit Plan' : 'New Plan'}
        </h1>
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

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Exercises
            </label>
            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenPicker}
              disabled={hasIncompleteExercises}
            >
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
        </div>

        <div className="pt-4">
          <Button
            onClick={onSave}
            disabled={!templateName.trim() || templateExercises.length === 0}
            className="w-full"
          >
            {editingTemplate ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      </div>

      <ExercisePickerModal
        isOpen={showExercisePicker}
        onClose={onClosePicker}
        onSelect={onAddExercise}
        exercises={filteredExercises}
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
