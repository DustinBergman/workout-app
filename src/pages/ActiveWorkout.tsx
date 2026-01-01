import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragEndEvent } from '@dnd-kit/core';
import { RestTimer } from '../components/timer/RestTimer';
import { WorkoutHeader } from '../components/active-workout';
import { ExerciseList } from '../components/active-workout/ExerciseList';
import { EmptyWorkoutState } from '../components/active-workout/EmptyWorkoutState';
import { WorkoutModals } from '../components/active-workout/WorkoutModals';
import { ActiveWorkoutProvider, useActiveWorkoutContext } from '../contexts/ActiveWorkoutContext';
import { useActiveWorkoutPage } from '../hooks/useActiveWorkoutPage';
import { WorkoutSession, Exercise, WorkoutScoreResult } from '../types';

export const ActiveWorkout: FC = () => {
  const navigate = useNavigate();

  const {
    session,
    sessions,
    showTimer,
    timerDuration,
    showExercisePicker,
    setShowExercisePicker,
    exerciseSearch,
    setExerciseSearch,
    showFinishConfirm,
    setShowFinishConfirm,
    updatePlan,
    setUpdatePlan,
    hideTimer,
    addExerciseToSession,
    customExerciseState,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,
    toggleMuscleGroup,
    resetNewExerciseForm,
    historyExerciseId,
    historyExerciseName,
    closeHistory,
    filteredExercises,
    isScoring,
    scoreResult,
    scoreError,
    clearScoreResult,
    finishWorkout,
    cancelWorkout,
    handleCreateExercise,
    handleDragEnd,
    sensors,
  } = useActiveWorkoutPage();

  return (
    <ActiveWorkoutProvider>
      <ActiveWorkoutContent
        navigate={navigate}
        session={session}
        sessions={sessions}
        showExercisePicker={showExercisePicker}
        setShowExercisePicker={setShowExercisePicker}
        exerciseSearch={exerciseSearch}
        setExerciseSearch={setExerciseSearch}
        showFinishConfirm={showFinishConfirm}
        setShowFinishConfirm={setShowFinishConfirm}
        updatePlan={updatePlan}
        setUpdatePlan={setUpdatePlan}
        addExerciseToSession={addExerciseToSession}
        customExerciseState={customExerciseState}
        setIsCreatingExercise={setIsCreatingExercise}
        setNewExerciseName={setNewExerciseName}
        setNewExerciseEquipment={setNewExerciseEquipment}
        toggleMuscleGroup={toggleMuscleGroup}
        resetNewExerciseForm={resetNewExerciseForm}
        historyExerciseId={historyExerciseId}
        historyExerciseName={historyExerciseName}
        closeHistory={closeHistory}
        filteredExercises={filteredExercises}
        isScoring={isScoring}
        scoreResult={scoreResult}
        scoreError={scoreError}
        clearScoreResult={clearScoreResult}
        finishWorkout={finishWorkout}
        cancelWorkout={cancelWorkout}
        handleCreateExercise={handleCreateExercise}
        handleDragEnd={handleDragEnd}
        sensors={sensors}
      />
      {/* Rest Timer - rendered at top level to avoid z-index issues */}
      {showTimer && (
        <RestTimer
          duration={timerDuration}
          autoStart={true}
          onComplete={() => {}}
          onSkip={hideTimer}
        />
      )}
    </ActiveWorkoutProvider>
  );
};

interface ActiveWorkoutContentProps {
  navigate: ReturnType<typeof useNavigate>;
  session: WorkoutSession | null;
  sessions: WorkoutSession[];
  showExercisePicker: boolean;
  setShowExercisePicker: (show: boolean) => void;
  exerciseSearch: string;
  setExerciseSearch: (search: string) => void;
  showFinishConfirm: boolean;
  setShowFinishConfirm: (show: boolean) => void;
  updatePlan: boolean;
  setUpdatePlan: (updatePlan: boolean) => void;
  addExerciseToSession: (exerciseId: string) => void;
  customExerciseState: { isCreating: boolean; name: string; equipment: string; muscleGroups: string[] };
  setIsCreatingExercise: (isCreating: boolean) => void;
  setNewExerciseName: (name: string) => void;
  setNewExerciseEquipment: (equipment: string) => void;
  toggleMuscleGroup: (muscleGroup: string) => void;
  resetNewExerciseForm: () => void;
  historyExerciseId: string | null;
  historyExerciseName: string | undefined;
  closeHistory: () => void;
  filteredExercises: Exercise[];
  isScoring: boolean;
  scoreResult: WorkoutScoreResult | null;
  scoreError: string | null;
  clearScoreResult: () => void;
  finishWorkout: () => void;
  cancelWorkout: () => void;
  handleCreateExercise: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
  sensors: unknown[];
}

const ActiveWorkoutContent: FC<ActiveWorkoutContentProps> = ({
  navigate,
  session,
  sessions,
  showExercisePicker,
  setShowExercisePicker,
  exerciseSearch,
  setExerciseSearch,
  showFinishConfirm,
  setShowFinishConfirm,
  updatePlan,
  setUpdatePlan,
  addExerciseToSession,
  customExerciseState,
  setIsCreatingExercise,
  setNewExerciseName,
  setNewExerciseEquipment,
  toggleMuscleGroup,
  resetNewExerciseForm,
  historyExerciseId,
  historyExerciseName,
  closeHistory,
  filteredExercises,
  isScoring,
  scoreResult,
  scoreError,
  clearScoreResult,
  finishWorkout,
  cancelWorkout,
  handleCreateExercise,
  handleDragEnd,
  sensors,
}) => {
  const {
    elapsedSeconds,
    totalSets,
    totalVolume,
    totalCardioDistance,
    weightUnit,
    distanceUnit,
    hasDeviated,
  } = useActiveWorkoutContext();

  if (!session) return null;

  return (
    <div className="p-4 pb-32">
      {/* Header */}
      <WorkoutHeader
        sessionName={session.name}
        elapsedSeconds={elapsedSeconds}
        totalSets={totalSets}
        totalVolume={totalVolume}
        totalCardioDistance={totalCardioDistance}
        weightUnit={weightUnit}
        distanceUnit={distanceUnit}
        onFinishClick={() => setShowFinishConfirm(true)}
      />

      {/* Scrollable Exercise Accordions */}
      {session.exercises.length > 0 ? (
        <>
          <ExerciseList
            session={session}
            sensors={sensors}
            onDragEnd={handleDragEnd}
          />

          {/* Add Exercise Button */}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full py-4 mt-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + Add Exercise
          </button>
        </>
      ) : (
        <>
          <EmptyWorkoutState onAddExercise={() => setShowExercisePicker(true)} />
        </>
      )}

      {/* Workout Modals */}
      <WorkoutModals
        showExercisePicker={showExercisePicker}
        onSetShowExercisePicker={setShowExercisePicker}
        exerciseSearch={exerciseSearch}
        onSetExerciseSearch={setExerciseSearch}
        filteredExercises={filteredExercises}
        onAddExerciseToSession={addExerciseToSession}
        customExerciseState={customExerciseState}
        onSetIsCreatingExercise={setIsCreatingExercise}
        onSetNewExerciseName={setNewExerciseName}
        onSetNewExerciseEquipment={setNewExerciseEquipment}
        onToggleMuscleGroup={toggleMuscleGroup}
        onResetNewExerciseForm={resetNewExerciseForm}
        onHandleCreateExercise={handleCreateExercise}
        showFinishConfirm={showFinishConfirm}
        onSetShowFinishConfirm={setShowFinishConfirm}
        totalSets={totalSets}
        totalVolume={totalVolume}
        totalCardioDistance={totalCardioDistance}
        weightUnit={weightUnit}
        distanceUnit={distanceUnit}
        hasDeviated={hasDeviated}
        hasTemplateId={!!session.templateId}
        updatePlan={updatePlan}
        onSetUpdatePlan={setUpdatePlan}
        onCancelWorkout={cancelWorkout}
        onFinishWorkout={finishWorkout}
        isScoring={isScoring}
        scoreResult={scoreResult}
        scoreError={scoreError}
        onClearScoreResult={() => {
          clearScoreResult();
          navigate('/history');
        }}
        historyExerciseId={historyExerciseId}
        historyExerciseName={historyExerciseName}
        onCloseHistory={closeHistory}
        sessions={sessions}
      />
    </div>
  );
};
