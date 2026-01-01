import { FC, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDndContext,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { StrengthExercise, CardioExercise, StrengthSessionExercise, CardioSessionExercise, SessionExercise, WorkoutSession, WeightUnit, DistanceUnit, ExerciseSuggestion } from '../types';
import {
  useActiveWorkout,
  useRestTimer,
  useExerciseManagement,
  useCustomExercise,
  useExerciseHistory,
} from '../hooks/useActiveWorkout';

// Sortable wrapper for exercises
interface SortableExerciseItemProps {
  exercise: SessionExercise;
  exerciseInfo: StrengthExercise | CardioExercise | undefined;
  index: number;
  expandedIndex: number | null;
  setExpandedIndex: (index: number | null) => void;
  onLogSet: (reps: number, weight: number) => void;
  onLogCardio: (distance: number, unit: DistanceUnit, durationSeconds: number) => void;
  onRemoveLastSet: () => void;
  onRemoveExercise: () => void;
  onStartTimer: (duration: number) => void;
  onUpdateTargetSets: (delta: number) => void;
  onShowHistory: () => void;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  suggestion: ExerciseSuggestion | undefined;
  session: WorkoutSession | null;
}

const SortableExerciseItem: FC<SortableExerciseItemProps> = ({
  exercise,
  exerciseInfo,
  index,
  expandedIndex,
  setExpandedIndex,
  onLogSet,
  onLogCardio,
  onRemoveLastSet,
  onRemoveExercise,
  onStartTimer,
  onUpdateTargetSets,
  onShowHistory,
  weightUnit,
  distanceUnit,
  suggestion,
  session,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id! });

  const { active, over } = useDndContext();
  const isOver = over?.id === exercise.id!;

  // Determine if placeholder should appear below (when dragging from above)
  let showPlaceholderBelow = false;
  if (isOver && active && session) {
    // Find the actual index of the active item in the session
    const activeIndex = session.exercises.findIndex((ex: SessionExercise) => ex.id === active.id);
    // If dragging from above the target, show placeholder below
    // If dragging from below the target, show placeholder above
    if (activeIndex !== -1 && activeIndex < index) {
      showPlaceholderBelow = true;
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: isDragging ? 'none' : undefined,
  };

  const isExpanded = expandedIndex === index;
  // Collapse accordion when dragging starts
  const handleToggle = () => {
    if (isDragging) return; // Prevent toggling while dragging
    setExpandedIndex(isExpanded ? null : index);
  };

  // If dragging this item, collapse it
  useEffect(() => {
    if (isDragging && isExpanded) {
      setExpandedIndex(null);
    }
  }, [isDragging, isExpanded, setExpandedIndex]);

  if (exercise.type === 'cardio') {
    return (
      <div ref={setNodeRef} style={style}>
        {isOver && !showPlaceholderBelow && (
          <div className="mb-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
        )}
        <CardioAccordion
          exercise={exercise as CardioSessionExercise}
          exerciseInfo={exerciseInfo as CardioExercise | undefined}
          isExpanded={isExpanded}
          onToggle={handleToggle}
          onLogCardio={onLogCardio}
          onRemoveLastSet={onRemoveLastSet}
          onRemoveExercise={onRemoveExercise}
          onShowHistory={onShowHistory}
          distanceUnit={distanceUnit}
          listeners={listeners}
          attributes={attributes}
          isDragging={isDragging}
        />
        {isOver && showPlaceholderBelow && (
          <div className="mt-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
        )}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      {isOver && !showPlaceholderBelow && (
        <div className="mb-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
      )}
      <ExerciseAccordion
        exercise={exercise as StrengthSessionExercise}
        exerciseInfo={exerciseInfo as StrengthExercise | undefined}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        onLogSet={onLogSet}
        onRemoveLastSet={onRemoveLastSet}
        onRemoveExercise={onRemoveExercise}
        onStartTimer={onStartTimer}
        onUpdateTargetSets={onUpdateTargetSets}
        onShowHistory={onShowHistory}
        weightUnit={weightUnit}
        suggestion={suggestion}
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
      />
      {isOver && showPlaceholderBelow && (
        <div className="mt-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
      )}
    </div>
  );
};

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
    reorderExercises,
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

  // DND sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      // Skip auto-expand of accordions when reordering
      const { setSkipAutoExpand } = useCurrentWorkoutStore.getState();
      setSkipAutoExpand(true);

      // Reset expanded index to keep accordion collapsed
      setExpandedIndex(null);

      // Then reorder exercises
      reorderExercises(active.id as string, over.id as string);
    }
  };

  // Migration: Add IDs to exercises that don't have them
  useEffect(() => {
    if (session && session.exercises.some(ex => !ex.id)) {
      const setActiveSession = useAppStore.getState().setActiveSession;
      const migratedSession = {
        ...session,
        exercises: session.exercises.map((ex, idx) => ({
          ...ex,
          id: ex.id || `migrated-${session.id}-${idx}`,
        })),
      };
      setActiveSession(migratedSession);
    }
  }, [session]);

  // Prevent horizontal scroll entirely
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Block any horizontal scroll attempts
      if (e.deltaX !== 0) {
        e.preventDefault();
      }
    };

    const handleScroll = () => {
      // Reset scroll position if somehow scrolled horizontally
      if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={session.exercises.map((ex) => ex.id!)}
              strategy={verticalListSortingStrategy}
            >
              {session.exercises.map((exercise, index) => {
                const exerciseInfo = getExerciseById(exercise.exerciseId, customExercises);

                return (
                  <SortableExerciseItem
                    key={exercise.id}
                    exercise={exercise}
                    exerciseInfo={exerciseInfo}
                    index={index}
                    expandedIndex={expandedIndex}
                    setExpandedIndex={setExpandedIndex}
                    onLogSet={(reps, weight) => logSetForExercise(index, reps, weight)}
                    onLogCardio={(distance, unit, durationSeconds) =>
                      logCardioForExercise(index, distance, unit, durationSeconds)
                    }
                    onRemoveLastSet={() => removeLastSetForExercise(index)}
                    onRemoveExercise={() => removeExercise(index)}
                    onStartTimer={handleStartTimer}
                    onUpdateTargetSets={(delta) => updateTargetSets(exercise.exerciseId, delta)}
                    onShowHistory={() => handleShowHistory(exercise.exerciseId)}
                    weightUnit={weightUnit}
                    distanceUnit={distanceUnit}
                    suggestion={getSuggestionForExercise(exercise.exerciseId)}
                    session={session}
                  />
                );
              })}
            </SortableContext>
          </DndContext>

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
