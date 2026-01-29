import { FC } from 'react';
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core';
import { RestTimer } from '../components/timer/RestTimer';
import { WorkoutHeader } from '../components/active-workout';
import { ExerciseList } from '../components/active-workout/ExerciseList';
import { EmptyWorkoutState } from '../components/active-workout/EmptyWorkoutState';
import { ActiveWorkoutProvider, useActiveWorkoutContext } from '../contexts/ActiveWorkoutContext';
import { useActiveWorkoutPage } from '../hooks/useActiveWorkoutPage';
import { WorkoutSession } from '../types';
import { Button } from '../components/ui';
import { FloatingOrbsBackground } from '../components/home/FloatingOrbsBackground';

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
      <FloatingOrbsBackground />

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
            <Button
              variant="outline"
              onClick={openExercisePicker}
              className="w-full py-4 mt-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500"
            >
              + Add Exercise
            </Button>
          </>
        ) : (
          <EmptyWorkoutState onAddExercise={openExercisePicker} />
        )}
      </div>
    </div>
  );
};
