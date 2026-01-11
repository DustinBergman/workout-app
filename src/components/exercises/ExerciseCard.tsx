import { FC } from 'react';
import { Card, Badge } from '../ui';
import { Exercise, MuscleGroup } from '../../types';
import {
  MUSCLE_GROUP_COLORS,
  formatMuscleGroup,
  formatEquipment,
} from '../../hooks/useExerciseLibrary';

interface ExerciseCardProps {
  exercise: Exercise;
  isCustom: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ExerciseCard: FC<ExerciseCardProps> = ({
  exercise,
  isCustom,
  isExpanded,
  onToggle,
}) => {
  return (
    <Card className="cursor-pointer" onClick={onToggle}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-foreground">{exercise.name}</h3>
            {isCustom && (
              <Badge
                variant="secondary"
                className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-0"
              >
                Custom
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {exercise.type === 'cardio' ? (
              <Badge
                variant="secondary"
                className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-0"
              >
                {exercise.cardioType}
              </Badge>
            ) : (
              <>
                {exercise.muscleGroups.map((muscle: MuscleGroup) => (
                  <Badge
                    key={muscle}
                    variant="secondary"
                    className={`text-xs border-0 ${MUSCLE_GROUP_COLORS[muscle]}`}
                  >
                    {formatMuscleGroup(muscle)}
                  </Badge>
                ))}
                <Badge variant="secondary" className="text-xs">
                  {formatEquipment(exercise.equipment)}
                </Badge>
              </>
            )}
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-muted-foreground transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-border">
          {exercise.imageUrl && (
            <div className="mb-3">
              <img
                src={exercise.imageUrl}
                alt={exercise.name}
                className="w-full max-w-xs mx-auto rounded-lg"
                loading="lazy"
              />
            </div>
          )}
          {exercise.instructions && (
            <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
          )}
        </div>
      )}
    </Card>
  );
};
