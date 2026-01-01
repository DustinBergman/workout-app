import { FC } from 'react';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableExerciseItem } from './SortableExerciseItem';
import { SessionExercise, WorkoutSession } from '../../types';

interface ExerciseListProps {
  session: WorkoutSession;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sensors: any[];
  onDragEnd: (event: DragEndEvent) => void;
}

export const ExerciseList: FC<ExerciseListProps> = ({
  session,
  sensors,
  onDragEnd,
}) => {
  if (session.exercises.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={session.exercises.map((ex: SessionExercise) => ex.id!)}
          strategy={verticalListSortingStrategy}
        >
          {session.exercises.map((exercise: SessionExercise, index: number) => (
            <SortableExerciseItem
              key={exercise.id}
              exercise={exercise}
              index={index}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
