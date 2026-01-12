import { FC } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { ExerciseHistorySheet } from '../workout/ExerciseHistorySheet';

interface ExerciseHistoryModalWrapperProps {
  exerciseId: string;
  exerciseName: string;
}

export const ExerciseHistoryModalWrapper: FC<ExerciseHistoryModalWrapperProps> = ({
  exerciseId,
  exerciseName,
}) => {
  const { closeModal } = useModal();
  const sessions = useAppStore((state) => state.sessions);
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);

  return (
    <ExerciseHistorySheet
      isOpen={true}
      onClose={closeModal}
      exerciseId={exerciseId}
      exerciseName={exerciseName}
      sessions={sessions}
      weightUnit={weightUnit}
    />
  );
};
