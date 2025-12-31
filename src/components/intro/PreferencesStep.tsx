import { FC } from 'react';
import { Card } from '../ui';
import { WeightUnit } from '../../types';
import { StepNavigation } from './StepNavigation';

export interface UnitOption {
  value: WeightUnit;
  label: string;
}

export interface PreferencesStepProps {
  selectedUnit: WeightUnit;
  onSelectUnit: (unit: WeightUnit) => void;
  unitOptions: UnitOption[];
  darkMode: boolean;
  onSelectDarkMode: (dark: boolean) => void;
  onBack: () => void;
  onNext: () => void;
}

export const PreferencesStep: FC<PreferencesStepProps> = ({
  selectedUnit,
  onSelectUnit,
  unitOptions,
  darkMode,
  onSelectDarkMode,
  onBack,
  onNext,
}) => {
  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Preferences
        </h2>
        <p className="text-muted-foreground">
          Customize your settings
        </p>
      </div>

      <div className="flex-1 space-y-6 mb-6">
        {/* Weight Unit */}
        <Card padding="lg">
          <p className="font-medium text-foreground mb-3">
            Weight Unit
          </p>
          <div className="flex gap-3">
            {unitOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelectUnit(option.value)}
                className={`flex-1 p-3 rounded-lg border transition-all ${
                  selectedUnit === option.value
                    ? 'border-primary bg-primary/10 text-primary font-medium'
                    : 'border-border/50 bg-background hover:border-primary/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Theme */}
        <Card padding="lg">
          <p className="font-medium text-foreground mb-3">Theme</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onSelectDarkMode(false)}
              className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                !darkMode
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border/50 bg-background hover:border-primary/50'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Light
            </button>
            <button
              type="button"
              onClick={() => onSelectDarkMode(true)}
              className={`flex-1 p-3 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                darkMode
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border/50 bg-background hover:border-primary/50'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              Dark
            </button>
          </div>
        </Card>
      </div>

      <StepNavigation onBack={onBack} onNext={onNext} />
    </div>
  );
};
