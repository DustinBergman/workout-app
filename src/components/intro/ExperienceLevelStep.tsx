import { FC } from 'react';
import { ExperienceLevel } from '../../types';
import { StepNavigation } from './StepNavigation';

export interface ExperienceLevelOption {
  value: ExperienceLevel;
  label: string;
  description: string;
  icon: JSX.Element;
}

export interface ExperienceLevelStepProps {
  selectedLevel: ExperienceLevel;
  onSelectLevel: (level: ExperienceLevel) => void;
  onBack: () => void;
  onNext: () => void;
}

const experienceLevelOptions: ExperienceLevelOption[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Less than a year of training',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: '1-2 years of training',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: '2+ years of consistent training',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
  },
];

export const ExperienceLevelStep: FC<ExperienceLevelStepProps> = ({
  selectedLevel,
  onSelectLevel,
  onBack,
  onNext,
}) => {
  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          What's your experience level?
        </h2>
        <p className="text-muted-foreground">
          This helps us personalize your progression recommendations
        </p>
      </div>

      <div className="flex-1 space-y-3 mb-6">
        {experienceLevelOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectLevel(option.value)}
            className={`w-full p-4 rounded-xl border text-left transition-all ${
              selectedLevel === option.value
                ? 'border-primary bg-primary/10'
                : 'border-border/50 bg-card/60 backdrop-blur-lg hover:border-primary/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                selectedLevel === option.value
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {option.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-foreground">
                    {option.label}
                  </span>
                  {selectedLevel === option.value && (
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
              </div>
            </div>
          </button>
        ))}
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
};
