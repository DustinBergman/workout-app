import { FC } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Card } from '../ui';
import { WeightUnit } from '../../types';
import { StepNavigation } from './StepNavigation';
import { IntroFormData } from './types';

export interface WeightStepProps {
  register: UseFormRegister<IntroFormData>;
  weightUnit: WeightUnit;
  onBack: () => void;
  onNext: () => void;
}

export const WeightStep: FC<WeightStepProps> = ({
  register,
  weightUnit,
  onBack,
  onNext,
}) => {
  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Your Weight
        </h2>
        <p className="text-muted-foreground">
          Track your body weight for personalized suggestions
        </p>
      </div>

      <div className="flex-1 space-y-6 mb-6">
        <Card padding="lg">
          <p className="font-medium text-foreground mb-3">
            Current Weight ({weightUnit})
          </p>
          <input
            type="number"
            {...register('initialWeight')}
            placeholder={`Enter your weight in ${weightUnit}`}
            className="w-full px-4 py-3 bg-background border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            min="0"
            step="0.1"
          />
          <p className="mt-3 text-sm text-muted-foreground">
            This helps us give you better workout recommendations. You can update this anytime.
          </p>
        </Card>
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
};
