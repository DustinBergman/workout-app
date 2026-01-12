import { FC } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { useCurrentWorkoutStore } from '../../store/currentWorkoutStore';
import { useActiveWorkout } from '../../hooks/useActiveWorkout';
import { PostWorkoutFlow } from '../active-workout';

interface PostWorkoutModalWrapperProps {
  onCancel: () => void;
}

export const PostWorkoutModalWrapper: FC<PostWorkoutModalWrapperProps> = ({ onCancel }) => {
  const { closeModal } = useModal();

  const session = useAppStore((state) => state.activeSession);
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);
  const distanceUnit = useAppStore((state) => state.preferences.distanceUnit);
  const updatePlan = useCurrentWorkoutStore((state) => state.updatePlan);
  const setUpdatePlan = useCurrentWorkoutStore((state) => state.setUpdatePlan);

  const {
    totalSets,
    totalVolume,
    totalCardioDistance,
    hasDeviated,
    finishWorkout,
  } = useActiveWorkout();

  if (!session) return null;

  return (
    <PostWorkoutFlow
      isOpen={true}
      onClose={closeModal}
      workoutName={session.name}
      totalSets={totalSets}
      totalVolume={totalVolume}
      totalCardioDistance={totalCardioDistance}
      weightUnit={weightUnit}
      distanceUnit={distanceUnit}
      hasDeviated={hasDeviated}
      hasTemplateId={!!session.templateId}
      updatePlan={updatePlan}
      onUpdatePlanChange={setUpdatePlan}
      onKeepGoing={closeModal}
      onDiscard={() => {
        onCancel();
        closeModal();
      }}
      onComplete={finishWorkout}
    />
  );
};
