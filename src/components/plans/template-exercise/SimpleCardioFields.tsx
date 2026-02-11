import { FC } from 'react';
import { CardioTemplateExercise, TemplateExercise } from '../../../types';
import { NumberInput } from './NumberInput';

interface SimpleCardioFieldsProps {
  exercise: CardioTemplateExercise;
  index: number;
  onUpdate: (index: number, updates: Partial<TemplateExercise>) => void;
}

export const SimpleCardioFields: FC<SimpleCardioFieldsProps> = ({ exercise, index, onUpdate }) => (
  <div className="grid grid-cols-3 gap-2">
    <NumberInput
      label="Duration (min)"
      value={'targetDurationMinutes' in exercise ? exercise.targetDurationMinutes : undefined}
      onChange={(v) => onUpdate(index, { targetDurationMinutes: v })}
    />
    <NumberInput
      label="Calories"
      value={exercise.targetCalories}
      onChange={(v) => onUpdate(index, { targetCalories: v })}
    />
    <NumberInput
      label="Rest (s)"
      value={exercise.restSeconds}
      onChange={(v) => onUpdate(index, { restSeconds: v })}
      step={15}
    />
  </div>
);
