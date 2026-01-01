import { FC } from 'react';
import { Button, Card } from '../ui';

interface EmptyWorkoutStateProps {
  onAddExercise: () => void;
}

export const EmptyWorkoutState: FC<EmptyWorkoutStateProps> = ({ onAddExercise }) => {
  return (
    <Card className="text-center py-8">
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        No exercises in this workout yet
      </p>
      <Button onClick={onAddExercise}>
        Add Exercise
      </Button>
    </Card>
  );
};
