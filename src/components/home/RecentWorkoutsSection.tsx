import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { calculateSessionStats } from '../../hooks/useSessionStats';
import { WorkoutSession, WeightUnit } from '../../types';

interface RecentWorkoutsSectionProps {
  sessions: WorkoutSession[];
  weightUnit: WeightUnit;
}

export const RecentWorkoutsSection: FC<RecentWorkoutsSectionProps> = ({
  sessions,
  weightUnit,
}) => {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">
          Recent Workouts
        </h2>
        <Link to="/history" className="text-sm text-primary">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {sessions.map((session) => {
          const stats = calculateSessionStats(session);
          return (
            <Card key={session.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {session.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">
                    {stats.totalSets} sets
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.totalVolume.toLocaleString()} {weightUnit}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
