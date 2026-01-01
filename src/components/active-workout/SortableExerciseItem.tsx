import { FC, useEffect, DOMAttributes } from 'react';
import { useDndContext } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getExerciseById } from '../../data/exercises';
import { ExerciseAccordion } from '../workout/ExerciseAccordion';
import { CardioAccordion } from '../workout/CardioAccordion';
import { SessionExercise, StrengthSessionExercise, CardioSessionExercise, StrengthExercise, CardioExercise } from '../../types';
import { useActiveWorkoutContext } from '../../contexts/ActiveWorkoutContext';

interface SortableExerciseItemProps {
  exercise: SessionExercise;
  index: number;
}

export const SortableExerciseItem: FC<SortableExerciseItemProps> = ({
  exercise,
  index,
}) => {
  const {
    session,
    customExercises,
    expandedIndex,
    setExpandedIndex,
  } = useActiveWorkoutContext();

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

  const exerciseInfo = getExerciseById(exercise.exerciseId, customExercises);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: isDragging ? 'none' : undefined,
  };

  // If dragging this item, collapse it
  useEffect(() => {
    const isExpanded = expandedIndex === index;
    if (isDragging && isExpanded) {
      setExpandedIndex(null);
    }
  }, [isDragging, expandedIndex, index, setExpandedIndex]);

  if (exercise.type === 'cardio') {
    return (
      <div ref={setNodeRef} style={style}>
        {isOver && !showPlaceholderBelow && (
          <div className="mb-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
        )}
        <CardioAccordion
          exercise={exercise as CardioSessionExercise}
          exerciseInfo={exerciseInfo as CardioExercise | undefined}
          listeners={listeners as Partial<DOMAttributes<HTMLElement>>}
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
        listeners={listeners as Partial<DOMAttributes<HTMLElement>>}
        attributes={attributes}
        isDragging={isDragging}
      />
      {isOver && showPlaceholderBelow && (
        <div className="mt-2 h-1 bg-blue-500 dark:bg-blue-400 rounded-full" />
      )}
    </div>
  );
};
