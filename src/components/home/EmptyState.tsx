import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button } from '../ui';

export const EmptyState: FC = () => {
  return (
    <Card className="text-center py-8">
      <svg className="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p className="text-muted-foreground mb-4">
        No workouts yet. Create a plan or start an empty workout!
      </p>
      <Link to="/plans">
        <Button>Create Plan</Button>
      </Link>
    </Card>
  );
};
