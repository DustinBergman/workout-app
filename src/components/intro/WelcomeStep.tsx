import { FC } from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Card, Input } from '../ui';
import { StepNavigation } from './StepNavigation';
import { IntroFormData } from './types';

export interface WelcomeStepProps {
  register: UseFormRegister<IntroFormData>;
  errors: FieldErrors<IntroFormData>;
  canProceed: boolean;
  onNext: () => void;
}

export const WelcomeStep: FC<WelcomeStepProps> = ({
  register,
  errors,
  canProceed,
  onNext,
}) => {
  return (
    <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-3">
          Welcome to Workout
        </h1>
        <p className="text-muted-foreground">
          Let's personalize your experience
        </p>
      </div>

      <Card padding="lg" className="mb-6 space-y-4">
        <Input
          label="First name"
          placeholder="Enter your first name"
          error={errors.firstName?.message}
          {...register('firstName', {
            required: 'First name is required',
            validate: (value) =>
              value.trim().length > 0 || 'First name is required',
          })}
        />
        <Input
          label="Last name"
          placeholder="Enter your last name"
          error={errors.lastName?.message}
          {...register('lastName', {
            required: 'Last name is required',
            validate: (value) =>
              value.trim().length > 0 || 'Last name is required',
          })}
        />
      </Card>

      <StepNavigation
        onNext={onNext}
        nextDisabled={!canProceed}
        showBack={false}
      />
    </div>
  );
};
