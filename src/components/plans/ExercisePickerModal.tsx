import { FC, useMemo } from 'react';
import { Modal, Input } from '../ui';
import { CustomExerciseForm } from './CustomExerciseForm';
import { Exercise, MuscleGroup, Equipment, TemplateType } from '../../types';

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  exercises: Exercise[];
  templateType: TemplateType;
  search: string;
  onSearchChange: (search: string) => void;
  isCreatingExercise: boolean;
  onStartCreating: () => void;
  // Custom exercise form props
  newExerciseName: string;
  newExerciseMuscles: MuscleGroup[];
  newExerciseEquipment: Equipment;
  muscleGroups: MuscleGroup[];
  equipmentOptions: Equipment[];
  onNewExerciseNameChange: (name: string) => void;
  onNewExerciseEquipmentChange: (equipment: Equipment) => void;
  onToggleMuscle: (muscle: MuscleGroup) => void;
  onCreateExercise: () => void;
  onCancelCreateExercise: () => void;
}

export const ExercisePickerModal: FC<ExercisePickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  exercises,
  templateType,
  search,
  onSearchChange,
  isCreatingExercise,
  onStartCreating,
  newExerciseName,
  newExerciseMuscles,
  newExerciseEquipment,
  muscleGroups,
  equipmentOptions,
  onNewExerciseNameChange,
  onNewExerciseEquipmentChange,
  onToggleMuscle,
  onCreateExercise,
  onCancelCreateExercise,
}) => {
  // Filter exercises based on template type
  const filteredByType = useMemo(() => {
    return exercises.filter((exercise) => {
      if (templateType === 'cardio') {
        return exercise.type === 'cardio';
      }
      return exercise.type === 'strength';
    });
  }, [exercises, templateType]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCreatingExercise ? "Create New Exercise" : "Add Exercise"}
    >
      {isCreatingExercise ? (
        <CustomExerciseForm
          name={newExerciseName}
          muscles={newExerciseMuscles}
          equipment={newExerciseEquipment}
          muscleGroups={muscleGroups}
          equipmentOptions={equipmentOptions}
          onNameChange={onNewExerciseNameChange}
          onEquipmentChange={onNewExerciseEquipmentChange}
          onToggleMuscle={onToggleMuscle}
          onCreate={onCreateExercise}
          onCancel={onCancelCreateExercise}
        />
      ) : (
        <div className="flex flex-col h-full">
          {/* Only show create custom exercise for strength templates */}
          {templateType === 'strength' && (
            <button
              onClick={onStartCreating}
              className="w-full mb-4 p-3 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Exercise
            </button>
          )}

          <Input
            placeholder={`Search ${templateType} exercises...`}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="mb-4 flex-shrink-0"
          />
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {filteredByType.map((exercise) => (
              <button
                key={exercise.id}
                onClick={() => onSelect(exercise)}
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
                  {exercise.type === 'cardio' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                      Cardio
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {exercise.type === 'cardio' ? exercise.cardioType : exercise.muscleGroups.join(', ')}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};
