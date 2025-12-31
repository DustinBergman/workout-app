import { FC, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useCurrentWorkoutStore } from '../store/currentWorkoutStore';
import { Button, Card } from '../components/ui';
import { RestTimer } from '../components/timer/RestTimer';
import { ExerciseAccordion } from '../components/workout/ExerciseAccordion';
import { CardioAccordion } from '../components/workout/CardioAccordion';
import { ExerciseHistorySheet } from '../components/workout/ExerciseHistorySheet';
import {
  WorkoutHeader,
  ExercisePickerModal,
  CreateExerciseForm,
  FinishWorkoutModal,
  ScoringModal,
  ScoreResultModal,
  ScoreErrorToast,
} from '../components/active-workout';
import { getExerciseById } from '../data/exercises';
import { StrengthExercise, CardioExercise } from '../types';
import {
  useActiveWorkout,
  useRestTimer,
  useExerciseManagement,
  useCustomExercise,
  useExerciseHistory,
} from '../hooks/useActiveWorkout';

export const ActiveWorkout: FC = () => {
  const navigate = useNavigate();

  // App store (direct access)
  const session = useAppStore((state) => state.activeSession);
  const sessions = useAppStore((state) => state.sessions);
  const customExercises = useAppStore((state) => state.customExercises);
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);
  const distanceUnit = useAppStore((state) => state.preferences.distanceUnit);

  // Current workout store (direct access)
  const expandedIndex = useCurrentWorkoutStore((state) => state.expandedIndex);
  const setExpandedIndex = useCurrentWorkoutStore((state) => state.setExpandedIndex);
  const showTimer = useCurrentWorkoutStore((state) => state.showTimer);
  const timerDuration = useCurrentWorkoutStore((state) => state.timerDuration);
  const showExercisePicker = useCurrentWorkoutStore((state) => state.showExercisePicker);
  const setShowExercisePicker = useCurrentWorkoutStore((state) => state.setShowExercisePicker);
  const exerciseSearch = useCurrentWorkoutStore((state) => state.exerciseSearch);
  const setExerciseSearch = useCurrentWorkoutStore((state) => state.setExerciseSearch);
  const showFinishConfirm = useCurrentWorkoutStore((state) => state.showFinishConfirm);
  const setShowFinishConfirm = useCurrentWorkoutStore((state) => state.setShowFinishConfirm);
  const updatePlan = useCurrentWorkoutStore((state) => state.updatePlan);
  const setUpdatePlan = useCurrentWorkoutStore((state) => state.setUpdatePlan);

  // Sub-hooks
  const { handleStartTimer, hideTimer } = useRestTimer();
  const {
    logSetForExercise,
    logCardioForExercise,
    removeLastSetForExercise,
    addExerciseToSession,
    removeExercise,
    updateTargetSets,
  } = useExerciseManagement();
  const {
    customExerciseState,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,
    toggleMuscleGroup,
    resetNewExerciseForm,
    createExercise,
  } = useCustomExercise();
  const {
    historyExerciseId,
    historyExerciseName,
    handleShowHistory,
    closeHistory,
  } = useExerciseHistory();

  // Main hook (computed values + orchestrated actions)
  const {
    elapsedSeconds,
    hasDeviated,
    totalSets,
    totalVolume,
    totalCardioDistance,
    filteredExercises,
    getSuggestionForExercise,
    isScoring,
    scoreResult,
    scoreError,
    clearScoreResult,
    finishWorkout,
    cancelWorkout,
  } = useActiveWorkout();

  // Custom exercise creation handler
  const handleCreateExercise = useCallback(() => {
    const newExercise = createExercise();
    if (newExercise) {
      addExerciseToSession(newExercise.id);
    }
  }, [createExercise, addExerciseToSession]);

  if (!session) return null;

  return (
    <div className="p-4 pb-24">
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
        <div className="space-y-3">
          {session.exercises.map((exercise, index) => {
            const exerciseInfo = getExerciseById(exercise.exerciseId, customExercises);

            if (exercise.type === 'cardio') {
              return (
                <CardioAccordion
                  key={index}
                  exercise={exercise}
                  exerciseInfo={exerciseInfo as CardioExercise | undefined}
                  isExpanded={expandedIndex === index}
                  onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                  onLogCardio={(distance, unit, durationSeconds) =>
                    logCardioForExercise(index, distance, unit, durationSeconds)
                  }
                  onRemoveLastSet={() => removeLastSetForExercise(index)}
                  onRemoveExercise={() => removeExercise(index)}
                  onShowHistory={() => handleShowHistory(exercise.exerciseId)}
                  distanceUnit={distanceUnit}
                />
              );
            }

            return (
              <ExerciseAccordion
                key={index}
                exercise={exercise}
                exerciseInfo={exerciseInfo as StrengthExercise | undefined}
                isExpanded={expandedIndex === index}
                onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
                onLogSet={(reps, weight) => logSetForExercise(index, reps, weight)}
                onRemoveLastSet={() => removeLastSetForExercise(index)}
                onRemoveExercise={() => removeExercise(index)}
                onStartTimer={handleStartTimer}
                onUpdateTargetSets={(delta) => updateTargetSets(exercise.exerciseId, delta)}
                onShowHistory={() => handleShowHistory(exercise.exerciseId)}
                weightUnit={weightUnit}
                suggestion={getSuggestionForExercise(exercise.exerciseId)}
              />
            );
          })}

          {/* Add Exercise Button */}
          <button
            onClick={() => setShowExercisePicker(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + Add Exercise
          </button>
        </div>
      ) : (
        <Card className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No exercises in this workout yet
          </p>
          <Button onClick={() => setShowExercisePicker(true)}>
            Add Exercise
          </Button>
        </Card>
      )}

      {/* Rest Timer */}
      {showTimer && (
        <RestTimer
          duration={timerDuration}
          autoStart={true}
          onComplete={() => {}}
          onSkip={hideTimer}
        />
      )}

      {/* Exercise Picker Modal */}
      <ExercisePickerModal
        isOpen={showExercisePicker}
        onClose={() => {
          setShowExercisePicker(false);
          setExerciseSearch('');
          resetNewExerciseForm();
        }}
        title={customExerciseState.isCreating ? "Create New Exercise" : "Add Exercise"}
        exerciseSearch={exerciseSearch}
        onSearchChange={setExerciseSearch}
        filteredExercises={filteredExercises}
        onSelectExercise={addExerciseToSession}
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

      {/* Finish Confirm Modal */}
      <FinishWorkoutModal
        isOpen={showFinishConfirm}
        onClose={() => setShowFinishConfirm(false)}
        totalSets={totalSets}
        totalVolume={totalVolume}
        totalCardioDistance={totalCardioDistance}
        weightUnit={weightUnit}
        distanceUnit={distanceUnit}
        hasDeviated={hasDeviated}
        hasTemplateId={!!session.templateId}
        updatePlan={updatePlan}
        onUpdatePlanChange={setUpdatePlan}
        onKeepGoing={() => setShowFinishConfirm(false)}
        onDiscard={cancelWorkout}
        onSaveAndFinish={finishWorkout}
      />

      {/* Scoring Loading Modal */}
      <ScoringModal isOpen={isScoring} />

      {/* Score Result Modal */}
      <ScoreResultModal
        isOpen={!!scoreResult}
        scoreResult={scoreResult}
        onClose={() => {
          clearScoreResult();
          navigate('/history');
        }}
      />

      {/* Score Error Toast */}
      <ScoreErrorToast error={scoreError} />

      {/* Exercise History Sheet */}
      <ExerciseHistorySheet
        isOpen={historyExerciseId !== null}
        onClose={closeHistory}
        exerciseId={historyExerciseId || ''}
        exerciseName={historyExerciseName}
        sessions={sessions}
        weightUnit={weightUnit}
      />
    </div>
  );
};
