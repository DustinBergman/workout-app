import { FC } from 'react';
import { Card, Button } from '../ui';
import { useWorkoutTimer } from '../../hooks/useWorkoutTimer';
import { formatDuration } from '../../utils/workoutUtils';

interface ActiveWorkoutBannerProps {
  sessionName: string;
  startedAt: string;
  onResume: () => void;
}

export const ActiveWorkoutBanner: FC<ActiveWorkoutBannerProps> = ({
  sessionName,
  startedAt,
  onResume,
}) => {
  const { elapsedSeconds } = useWorkoutTimer({ startedAt });

  return (
    <Card
      className="mb-6 bg-primary/10 border-primary/30 cursor-pointer hover:bg-primary/15 transition-colors"
      onClick={onResume}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-primary font-medium">
            Workout in progress • {formatDuration(elapsedSeconds)}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {sessionName}
          </p>
        </div>
        <Button tabIndex={-1}>Resume</Button>
      </div>
    </Card>
  );
};
