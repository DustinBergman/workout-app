import { FC } from 'react';
import { Card, Button } from '../ui';

interface ActiveWorkoutBannerProps {
  sessionName: string;
  onResume: () => void;
}

export const ActiveWorkoutBanner: FC<ActiveWorkoutBannerProps> = ({
  sessionName,
  onResume,
}) => {
  return (
    <Card className="mb-6 bg-primary/10 border-primary/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-primary font-medium">
            Workout in progress
          </p>
          <p className="text-lg font-semibold text-foreground">
            {sessionName}
          </p>
        </div>
        <Button onClick={onResume}>Resume</Button>
      </div>
    </Card>
  );
};
