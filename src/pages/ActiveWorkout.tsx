import { FC } from 'react';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { RestTimer } from '../components/timer/RestTimer';
import { WorkoutHeader } from '../components/active-workout';
import { ExerciseList } from '../components/active-workout/ExerciseList';
import { EmptyWorkoutState } from '../components/active-workout/EmptyWorkoutState';
import { ActiveWorkoutProvider, useActiveWorkoutContext } from '../contexts/ActiveWorkoutContext';
import { useActiveWorkoutPage } from '../hooks/useActiveWorkoutPage';
import { WorkoutSession } from '../types';

export const ActiveWorkout: FC = () => {
  const {
    session,
    showTimer,
    timerDuration,
    openExercisePicker,
    openFinishConfirm,
    hideTimer,
    handleDragStart,
    handleDragEnd,
    sensors,
  } = useActiveWorkoutPage();

  if (!session) return null;

  return (
    <ActiveWorkoutProvider>
      <ActiveWorkoutContent
        session={session}
        openExercisePicker={openExercisePicker}
        openFinishConfirm={openFinishConfirm}
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
  session: WorkoutSession;
  openExercisePicker: () => void;
  openFinishConfirm: () => void;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  sensors: unknown[];
}

const ActiveWorkoutContent: FC<ActiveWorkoutContentProps> = ({
  session,
  openExercisePicker,
  openFinishConfirm,
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
  } = useActiveWorkoutContext();

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
          onFinishClick={openFinishConfirm}
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
              onClick={openExercisePicker}
              className="w-full py-4 mt-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              + Add Exercise
            </button>
          </>
        ) : (
          <EmptyWorkoutState onAddExercise={openExercisePicker} />
        )}
      </div>
    </div>
  );
};
