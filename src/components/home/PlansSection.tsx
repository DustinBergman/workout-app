import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../ui';
import { WorkoutTemplate } from '../../types';

interface PlansSectionProps {
  templates: WorkoutTemplate[];
  onStartWorkout: (template: WorkoutTemplate) => void;
}

export const PlansSection: FC<PlansSectionProps> = ({
  templates,
  onStartWorkout,
}) => {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">
          Your Plans
        </h2>
        <Link to="/plans" className="text-sm text-primary">
          View all
        </Link>
      </div>
      <div className="space-y-3">
        {templates.slice(0, 3).map((template) => (
          <Card key={template.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">
                {template.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {template.exercises.length} exercises
              </p>
            </div>
            <Button size="sm" onClick={() => onStartWorkout(template)}>
              Start
            </Button>
          </Card>
        ))}
      </div>
    </section>
  );
};
