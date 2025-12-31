import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { WorkoutHeatmap } from '../history/WorkoutHeatmap';
import { WorkoutSession } from '../../types';

interface ActivitySectionProps {
  sessions: WorkoutSession[];
}

export const ActivitySection: FC<ActivitySectionProps> = ({ sessions }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">
          Activity
        </h2>
        <Link to="/history" className="text-sm text-primary">
          View history
        </Link>
      </div>
      <Card padding="sm">
        <WorkoutHeatmap sessions={sessions} />
      </Card>
    </section>
  );
};
