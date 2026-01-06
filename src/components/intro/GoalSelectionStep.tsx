import { FC } from 'react';
import { WorkoutGoal } from '../../types';
import { StepNavigation } from './StepNavigation';

export interface GoalOption {
  value: WorkoutGoal;
  label: string;
  description: string;
}

export interface GoalSelectionStepProps {
  selectedGoal: WorkoutGoal;
  onSelectGoal: (goal: WorkoutGoal) => void;
  goalOptions: GoalOption[];
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
}

export const GoalSelectionStep: FC<GoalSelectionStepProps> = ({
  selectedGoal,
  onSelectGoal,
  goalOptions,
  onBack,
  onNext,
  showBack = true,
}) => {
  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          What's your goal?
        </h2>
        <p className="text-muted-foreground">
          This helps us tailor your workout experience
        </p>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {goalOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectGoal(option.value)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedGoal === option.value
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-card/60 backdrop-blur-lg hover:border-primary/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-foreground">
                {option.label}
              </span>
              {selectedGoal === option.value && (
                <svg
                  className="w-5 h-5 text-primary"
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
            <p className="text-sm text-muted-foreground">
              {option.description}
            </p>
          </button>
        ))}
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} showBack={showBack} />
    </div>
  );
};
