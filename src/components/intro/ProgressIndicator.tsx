import { FC } from 'react';

export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator: FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
}) => {
  return (
    <div className="flex justify-center gap-2 mb-8 pt-4">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
        <div
          key={s}
          className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
            s === currentStep
              ? 'bg-primary w-8'
              : s < currentStep
              ? 'bg-primary/50'
              : 'bg-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
};
