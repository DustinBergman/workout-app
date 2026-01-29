import { FC, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Play, Pencil, Trash2, RotateCcw, GripVertical } from 'lucide-react';
import { Button, Card } from '../ui';
import { WorkoutTemplate, TemplateExercise } from '../../types';
import { toast } from '../../store/toastStore';
import { cn } from '@/lib/utils';

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
      return `${cardio.rounds}r`;
    }
    if ('targetDurationMinutes' in cardio && cardio.targetDurationMinutes) {
      return `${cardio.targetDurationMinutes}m`;
    }
    if ('targetLaps' in cardio && cardio.targetLaps) {
      return `${cardio.targetLaps}L`;
    }
    return '';
  }
  return `${exercise.targetSets}×${exercise.targetReps}`;
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
  const [showMenu, setShowMenu] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);
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

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        padding="none"
        className={cn(
          'overflow-hidden',
          isDragging && 'ring-2 ring-primary',
          isNext && 'ring-2 ring-interactive/50'
        )}
      >
        {/* Header with gradient accent */}
        <div className={cn(
          'px-4 py-3 flex items-center gap-3',
          isCardio
            ? 'bg-gradient-to-r from-emerald-500/10 to-transparent'
            : 'bg-gradient-to-r from-blue-500/10 to-transparent'
        )}>
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing touch-none text-fg-3 hover:text-fg-2 transition-colors"
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Title and meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-fg-1 truncate">
                {template.name}
              </h3>
              {isNext && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-full bg-interactive/15 text-interactive font-semibold uppercase tracking-wide">
                  Up Next
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'text-xs font-medium',
                isCardio ? 'text-emerald-500' : 'text-blue-500'
              )}>
                {isCardio ? 'Cardio' : 'Strength'}
              </span>
              <span className="text-xs text-fg-3">•</span>
              <span className="text-xs text-fg-3">
                {template.exercises.length} exercises
              </span>
              {template.inRotation !== false && (
                <>
                  <span className="text-xs text-fg-3">•</span>
                  <RotateCcw className="w-3 h-3 text-interactive" />
                </>
              )}
            </div>
          </div>

          {/* Menu button */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-fg-3 hover:text-fg-1 hover:bg-bg-subtle transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-bg-3 border border-border-1 rounded-lg shadow-lg py-1 min-w-[140px]">
                  <button
                    onClick={() => {
                      const willBeInRotation = template.inRotation === false;
                      onToggleRotation();
                      toast.success(
                        willBeInRotation
                          ? `Added to rotation`
                          : `Removed from rotation`
                      );
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-fg-2 hover:bg-bg-subtle flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {template.inRotation !== false ? 'Remove from rotation' : 'Add to rotation'}
                  </button>
                  <button
                    onClick={() => {
                      onEdit();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-fg-2 hover:bg-bg-subtle flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-error hover:bg-bg-subtle flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Exercise chips */}
        <div className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {(showAllExercises ? template.exercises : template.exercises.slice(0, 5)).map((exercise, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-bg-subtle text-fg-2"
              >
                <span className="truncate max-w-[120px]">{getExerciseName(exercise.exerciseId)}</span>
                <span className="text-fg-3 font-medium">{getExerciseDescription(exercise)}</span>
              </span>
            ))}
            {template.exercises.length > 5 && (
              <button
                onClick={() => setShowAllExercises(!showAllExercises)}
                className="inline-flex items-center text-xs px-2 py-1 rounded-md bg-bg-subtle text-interactive hover:bg-interactive/10 transition-colors"
              >
                {showAllExercises ? 'Show less' : `+${template.exercises.length - 5}`}
              </button>
            )}
          </div>

          {template.copiedFrom && (
            <div className="flex items-center gap-1 mt-2 text-xs text-fg-3">
              <span>
                Copied from {template.copiedFrom.username ? `@${template.copiedFrom.username}` :
                  `${template.copiedFrom.firstName || ''} ${template.copiedFrom.lastName || ''}`.trim() || 'a friend'}
              </span>
            </div>
          )}
        </div>

        {/* Start button */}
        <div className="px-4 pb-4">
          <Button className="w-full gap-2" onClick={onStart}>
            <Play className="w-4 h-4" fill="currentColor" />
            Start Workout
          </Button>
        </div>
      </Card>
    </div>
  );
};
