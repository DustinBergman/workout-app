import { FC } from 'react';
import { StepNavigation } from './StepNavigation';

export interface WorkoutFrequencyStepProps {
  selectedFrequency: number;
  onSelectFrequency: (frequency: number) => void;
  onBack: () => void;
  onNext: () => void;
}

interface FrequencyOption {
  value: number;
  label: string;
  description: string;
}

const frequencyOptions: FrequencyOption[] = [
  { value: 2, label: '2 days/week', description: 'Light commitment, great for busy schedules' },
  { value: 3, label: '3 days/week', description: 'Balanced approach for steady progress' },
  { value: 4, label: '4 days/week', description: 'Recommended for most people' },
  { value: 5, label: '5 days/week', description: 'Dedicated training schedule' },
  { value: 6, label: '6 days/week', description: 'Intensive training with one rest day' },
  { value: 7, label: '7 days/week', description: 'Daily activity (active recovery counts!)' },
];

export const WorkoutFrequencyStep: FC<WorkoutFrequencyStepProps> = ({
  selectedFrequency,
  onSelectFrequency,
  onBack,
  onNext,
}) => {
  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          How often do you want to train?
        </h2>
        <p className="text-muted-foreground">
          Set your weekly workout goal - we'll track your consistency based on this
        </p>
      </div>

      <div className="flex-1 space-y-2 mb-6">
        {frequencyOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectFrequency(option.value)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedFrequency === option.value
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-card/60 backdrop-blur-lg hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {option.label}
                  </span>
                  {option.value === 4 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                      Recommended
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {option.description}
                </p>
              </div>
              {selectedFrequency === option.value && (
                <svg
                  className="w-5 h-5 text-primary flex-shrink-0 ml-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground mb-4">
        Your streak will track consecutive weeks you hit this goal
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
};
