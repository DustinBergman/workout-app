import { FC, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { useCustomExercise } from '../../hooks/useActiveWorkout';
import { searchExercises } from '../../data/exercises';
import { ExercisePickerModal, CreateExerciseForm } from '../active-workout';

interface ExercisePickerModalWrapperProps {
  onSelect: (exerciseId: string) => void;
}

export const ExercisePickerModalWrapper: FC<ExercisePickerModalWrapperProps> = ({ onSelect }) => {
  const { closeModal } = useModal();
  const customExercises = useAppStore((state) => state.customExercises);
  const [exerciseSearch, setExerciseSearch] = useState('');

  const {
    customExerciseState,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,
    toggleMuscleGroup,
    resetNewExerciseForm,
    createExercise,
  } = useCustomExercise();

  const filteredExercises = searchExercises(exerciseSearch, customExercises);

  const handleClose = () => {
    setExerciseSearch('');
    resetNewExerciseForm();
    closeModal();
  };

  const handleSelect = (exerciseId: string) => {
    onSelect(exerciseId);
    handleClose();
  };

  const handleCreateExercise = () => {
    const newExercise = createExercise();
    if (newExercise) {
      onSelect(newExercise.id);
    }
    handleClose();
  };

  return (
    <ExercisePickerModal
      isOpen={true}
      onClose={handleClose}
      title={customExerciseState.isCreating ? "Create New Exercise" : "Add Exercise"}
      exerciseSearch={exerciseSearch}
      onSearchChange={setExerciseSearch}
      filteredExercises={filteredExercises}
      onSelectExercise={handleSelect}
      onCreateExerciseClick={() => setIsCreatingExercise(true)}
      isCreating={customExerciseState.isCreating}
    >
      <CreateExerciseForm
        name={customExerciseState.name}
        onNameChange={setNewExerciseName}
        selectedMuscles={customExerciseState.muscles}
        onToggleMuscle={toggleMuscleGroup}
        equipment={customExerciseState.equipment}
        onEquipmentChange={setNewExerciseEquipment}
        onCancel={resetNewExerciseForm}
        onCreate={handleCreateExercise}
        isCreateDisabled={!customExerciseState.name.trim()}
      />
    </ExercisePickerModal>
  );
};
