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
              {template.copiedFrom && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  From {template.copiedFrom.username ? `@${template.copiedFrom.username}` :
                    `${template.copiedFrom.firstName || ''} ${template.copiedFrom.lastName || ''}`.trim() || 'a friend'}
                </p>
              )}
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
