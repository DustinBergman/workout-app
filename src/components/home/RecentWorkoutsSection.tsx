import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';
import { calculateSessionStats } from '../../hooks/useSessionStats';
import { WorkoutSession, WeightUnit, DistanceUnit } from '../../types';

interface RecentWorkoutsSectionProps {
  sessions: WorkoutSession[];
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
}

const getSecondaryMetric = (
  stats: ReturnType<typeof calculateSessionStats>,
  weightUnit: WeightUnit,
  distanceUnit: DistanceUnit
): string => {
  // Prefer showing volume for strength workouts
  if (stats.totalVolume > 0) {
    return `${stats.totalVolume.toLocaleString()} ${weightUnit}`;
  }

  // Show distance for cardio workouts
  if (stats.totalCardioDistance > 0) {
    return `${stats.totalCardioDistance.toFixed(1)} ${distanceUnit}`;
  }

  // Show calories if no volume or distance
  if (stats.totalCardioCalories > 0) {
    return `${stats.totalCardioCalories.toLocaleString()} cal`;
  }

  return '';
};

export const RecentWorkoutsSection: FC<RecentWorkoutsSectionProps> = ({
  sessions,
  weightUnit,
  distanceUnit,
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
          const secondaryMetric = getSecondaryMetric(stats, weightUnit, distanceUnit);

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
                  {secondaryMetric && (
                    <p className="text-sm text-muted-foreground">
                      {secondaryMetric}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
};
