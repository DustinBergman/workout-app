import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
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
    handleDragStart,
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
        handleDragStart={handleDragStart}
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
  handleDragStart: (event: DragStartEvent) => void;
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
  handleDragStart,
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
    <div className="relative min-h-screen bg-transparent">
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      </div>

      <div className="relative z-10 p-4 pb-32">
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
            onDragStart={handleDragStart}
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
    </div>
  );
};
