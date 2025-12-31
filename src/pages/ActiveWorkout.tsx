import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
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
import { useActiveWorkout } from '../hooks/useActiveWorkout';

export const ActiveWorkout: FC = () => {
  const navigate = useNavigate();
  const sessions = useAppStore((state) => state.sessions);
  const customExercises = useAppStore((state) => state.customExercises);

  const {
    // Session state
    session,
    elapsedSeconds,
    hasDeviated,
    totalSets,
    totalVolume,
    totalCardioDistance,

    // Exercise management
    expandedIndex,
    setExpandedIndex,
    logSetForExercise,
    logCardioForExercise,
    removeLastSetForExercise,
    addExerciseToSession,
    removeExercise,
    updateTargetSets,
    getSuggestionForExercise,

    // Custom exercise creation
    customExerciseState,
    setIsCreatingExercise,
    setNewExerciseName,
    setNewExerciseEquipment,
    toggleMuscleGroup,
    resetNewExerciseForm,
    handleCreateExercise,

    // Timer
    timerDuration,
    showTimer,
    handleStartTimer,
    hideTimer,

    // Modals
    showExercisePicker,
    setShowExercisePicker,
    exerciseSearch,
    setExerciseSearch,
    showFinishConfirm,
    setShowFinishConfirm,
    filteredExercises,

    // Exercise history
    historyExerciseId,
    historyExerciseName,
    handleShowHistory,
    closeHistory,

    // Template update
    updatePlan,
    setUpdatePlan,

    // Scoring
    isScoring,
    scoreResult,
    scoreError,
    clearScoreResult,

    // Actions
    finishWorkout,
    cancelWorkout,

    // Preferences
    preferences,
  } = useActiveWorkout();

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
        weightUnit={preferences.weightUnit}
        distanceUnit={preferences.distanceUnit}
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
                  onLogCardio={(distance, distanceUnit, durationSeconds) =>
                    logCardioForExercise(index, distance, distanceUnit, durationSeconds)
                  }
                  onRemoveLastSet={() => removeLastSetForExercise(index)}
                  onRemoveExercise={() => removeExercise(index)}
                  onShowHistory={() => handleShowHistory(exercise.exerciseId)}
                  distanceUnit={preferences.distanceUnit}
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
                weightUnit={preferences.weightUnit}
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
        weightUnit={preferences.weightUnit}
        distanceUnit={preferences.distanceUnit}
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
        weightUnit={preferences.weightUnit}
      />
    </div>
  );
};
