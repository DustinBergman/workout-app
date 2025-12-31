import { FC } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Card, Input } from '../ui';
import { StepNavigation } from './StepNavigation';
import { IntroFormData } from './types';

export interface ApiKeyStepProps {
  register: UseFormRegister<IntroFormData>;
  onBack: () => void;
}

export const ApiKeyStep: FC<ApiKeyStepProps> = ({
  register,
  onBack,
}) => {
  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          AI Features
        </h2>
        <p className="text-muted-foreground">
          Enable smart workout suggestions
        </p>
      </div>

      <div className="flex-1 space-y-6 mb-6">
        <Card padding="lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-foreground">
                OpenAI API Key
              </p>
              <p className="text-sm text-muted-foreground">
                Powers AI workout suggestions, scoring, and chat assistant
              </p>
            </div>
          </div>
          <Input
            placeholder="sk-..."
            type="password"
            {...register('openaiApiKey')}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Your key is stored locally and never shared. Get one at{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              platform.openai.com
            </a>
          </p>
        </Card>
      </div>

      <StepNavigation
        onBack={onBack}
        onSubmit={true}
        nextLabel="Get Started"
      />
      <button
        type="submit"
        className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Skip for now
      </button>
    </div>
  );
};
