import { FC } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Card } from '../ui';
import { WorkoutTemplate, TemplateExercise } from '../../types';
import { toast } from '../../store/toastStore';

interface SortableTemplateCardProps {
  template: WorkoutTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
  onToggleRotation: () => void;
  getExerciseName: (id: string) => string;
  isNext: boolean;
}

const getExerciseDescription = (exercise: TemplateExercise): string => {
  if (exercise.type === 'cardio') {
    const cardio = exercise;
    if ('rounds' in cardio && cardio.rounds) {
      return `${cardio.rounds} rounds`;
    }
    if ('targetDurationMinutes' in cardio && cardio.targetDurationMinutes) {
      return `${cardio.targetDurationMinutes} min`;
    }
    if ('targetLaps' in cardio && cardio.targetLaps) {
      return `${cardio.targetLaps} laps`;
    }
    return 'Cardio';
  }
  return `${exercise.targetSets}x${exercise.targetReps}`;
};

export const SortableTemplateCard: FC<SortableTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
  onStart,
  onToggleRotation,
  getExerciseName,
  isNext,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCardio = template.templateType === 'cardio';
  const borderColor = isCardio
    ? 'border-l-4 border-l-green-500'
    : 'border-l-4 border-l-blue-500';

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`${borderColor} ${isDragging ? 'ring-2 ring-primary' : ''} ${isNext ? 'ring-2 ring-primary/50' : ''}`}>
        {/* Drag handle at top */}
        <div
          {...attributes}
          {...listeners}
          className="flex justify-center pb-2 mb-2 -mt-1 cursor-grab active:cursor-grabbing touch-none border-b border-gray-100 dark:border-gray-700"
          aria-label="Drag to reorder"
        >
          <svg className="w-6 h-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {/* Type icon */}
              {isCardio ? (
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h4v12H4V6zm12 0h4v12h-4V6zm-6 2h4v8h-4V8z" />
                </svg>
              )}
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {template.name}
              </h3>
              {isNext && (
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                  Next
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded ${
                isCardio
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                {isCardio ? 'Cardio' : 'Strength'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {template.exercises.length} exercises
              </span>
            </div>
            {template.copiedFrom && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>
                  From {template.copiedFrom.username ? `@${template.copiedFrom.username}` :
                    `${template.copiedFrom.firstName || ''} ${template.copiedFrom.lastName || ''}`.trim() || 'a friend'}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const willBeInRotation = template.inRotation === false;
                onToggleRotation();
                toast.success(
                  willBeInRotation
                    ? `${template.name} added to rotation`
                    : `${template.name} removed from rotation`
                );
              }}
              title={template.inRotation !== false ? 'Remove from rotation' : 'Add to rotation'}
            >
              <svg
                className={`w-4 h-4 ${template.inRotation !== false ? 'text-primary' : 'text-gray-400'}`}
                fill={template.inRotation !== false ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </Button>
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </Button>
          </div>
        </div>

        <div className="space-y-1 mb-4">
          {template.exercises.slice(0, 4).map((exercise, index) => (
            <p key={index} className="text-sm text-gray-600 dark:text-gray-400">
              {getExerciseName(exercise.exerciseId)} - {getExerciseDescription(exercise)}
            </p>
          ))}
          {template.exercises.length > 4 && (
            <p className="text-sm text-gray-400">
              +{template.exercises.length - 4} more
            </p>
          )}
        </div>

        <Button className="w-full" onClick={onStart}>
          Start Workout
        </Button>
      </Card>
    </div>
  );
};
