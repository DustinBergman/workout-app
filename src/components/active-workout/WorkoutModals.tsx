import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ExercisePickerModal,
  CreateExerciseForm,
  FinishWorkoutModal,
  ScoringModal,
  ScoreResultModal,
  ScoreErrorToast,
} from './index';
import { ExerciseHistorySheet } from '../workout/ExerciseHistorySheet';
import { WorkoutScoreResult } from '../../types';

interface WorkoutModalsProps {
  // Exercise picker modal
  showExercisePicker: boolean;
  onSetShowExercisePicker: (show: boolean) => void;
  exerciseSearch: string;
  onSetExerciseSearch: (search: string) => void;
  filteredExercises: any[];
  onAddExerciseToSession: (exerciseId: string) => void;
  customExerciseState: any;
  onSetIsCreatingExercise: (isCreating: boolean) => void;
  onSetNewExerciseName: (name: string) => void;
  onSetNewExerciseEquipment: (equipment: string) => void;
  onToggleMuscleGroup: (muscleGroup: string) => void;
  onResetNewExerciseForm: () => void;
  onHandleCreateExercise: () => void;

  // Finish workout modal
  showFinishConfirm: boolean;
  onSetShowFinishConfirm: (show: boolean) => void;
  totalSets: number;
  totalVolume: number;
  totalCardioDistance: number;
  weightUnit: any;
  distanceUnit: any;
  hasDeviated: boolean;
  hasTemplateId: boolean;
  updatePlan: boolean;
  onSetUpdatePlan: (updatePlan: boolean) => void;
  onCancelWorkout: () => void;
  onFinishWorkout: () => void;

  // Scoring
  isScoring: boolean;
  scoreResult: WorkoutScoreResult | null;
  scoreError: string | null;
  onClearScoreResult: () => void;

  // History sheet
  historyExerciseId: string | null;
  historyExerciseName?: string;
  onCloseHistory: () => void;
  sessions: any[];
}

export const WorkoutModals: FC<WorkoutModalsProps> = ({
  // Exercise picker modal
  showExercisePicker,
  onSetShowExercisePicker,
  exerciseSearch,
  onSetExerciseSearch,
  filteredExercises,
  onAddExerciseToSession,
  customExerciseState,
  onSetIsCreatingExercise,
  onSetNewExerciseName,
  onSetNewExerciseEquipment,
  onToggleMuscleGroup,
  onResetNewExerciseForm,
  onHandleCreateExercise,

  // Finish workout modal
  showFinishConfirm,
  onSetShowFinishConfirm,
  totalSets,
  totalVolume,
  totalCardioDistance,
  weightUnit,
  distanceUnit,
  hasDeviated,
  hasTemplateId,
  updatePlan,
  onSetUpdatePlan,
  onCancelWorkout,
  onFinishWorkout,

  // Scoring
  isScoring,
  scoreResult,
  scoreError,
  onClearScoreResult,

  // History sheet
  historyExerciseId,
  historyExerciseName,
  onCloseHistory,
  sessions,
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={showExercisePicker}
        onClose={() => {
          onSetShowExercisePicker(false);
          onSetExerciseSearch('');
          onResetNewExerciseForm();
        }}
        title={customExerciseState.isCreating ? "Create New Exercise" : "Add Exercise"}
        exerciseSearch={exerciseSearch}
        onSearchChange={onSetExerciseSearch}
        filteredExercises={filteredExercises}
        onSelectExercise={onAddExerciseToSession}
        onCreateExerciseClick={() => onSetIsCreatingExercise(true)}
        isCreating={customExerciseState.isCreating}
      >
        <CreateExerciseForm
          name={customExerciseState.name}
          onNameChange={onSetNewExerciseName}
          selectedMuscles={customExerciseState.muscles}
          onToggleMuscle={onToggleMuscleGroup}
          equipment={customExerciseState.equipment}
          onEquipmentChange={onSetNewExerciseEquipment}
          onCancel={onResetNewExerciseForm}
          onCreate={onHandleCreateExercise}
          isCreateDisabled={!customExerciseState.name.trim()}
        />
      </ExercisePickerModal>

      {/* Finish Confirm Modal */}
      <FinishWorkoutModal
        isOpen={showFinishConfirm}
        onClose={() => onSetShowFinishConfirm(false)}
        totalSets={totalSets}
        totalVolume={totalVolume}
        totalCardioDistance={totalCardioDistance}
        weightUnit={weightUnit}
        distanceUnit={distanceUnit}
        hasDeviated={hasDeviated}
        hasTemplateId={hasTemplateId}
        updatePlan={updatePlan}
        onUpdatePlanChange={onSetUpdatePlan}
        onKeepGoing={() => onSetShowFinishConfirm(false)}
        onDiscard={onCancelWorkout}
        onSaveAndFinish={onFinishWorkout}
      />

      {/* Scoring Loading Modal */}
      <ScoringModal isOpen={isScoring} />

      {/* Score Result Modal */}
      <ScoreResultModal
        isOpen={!!scoreResult}
        scoreResult={scoreResult}
        onClose={() => {
          onClearScoreResult();
          navigate('/history');
        }}
      />

      {/* Score Error Toast */}
      <ScoreErrorToast error={scoreError} />

      {/* Exercise History Sheet */}
      <ExerciseHistorySheet
        isOpen={historyExerciseId !== null}
        onClose={onCloseHistory}
        exerciseId={historyExerciseId || ''}
        exerciseName={historyExerciseName || ''}
        sessions={sessions}
        weightUnit={weightUnit}
      />
    </>
  );
};
