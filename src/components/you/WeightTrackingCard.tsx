import { FC } from 'react';
import { Card, Button } from '../ui';
import { WeightChart } from './WeightChart';
import { WeightEntry, WeightUnit } from '../../types';

interface WeightTrackingCardProps {
  weightEntries: WeightEntry[];
  weightUnit: WeightUnit;
  onLogWeight: () => void;
}

export const WeightTrackingCard: FC<WeightTrackingCardProps> = ({
  weightEntries,
  weightUnit,
  onLogWeight,
}) => {
  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Weight Trend</h2>
        <Button size="sm" onClick={onLogWeight}>
          Log Weight
        </Button>
      </div>
      <WeightChart entries={weightEntries} weightUnit={weightUnit} />
    </Card>
  );
};
