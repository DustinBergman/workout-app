import { FC, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Input } from '../components/ui';
import { WorkoutGoal, WeightUnit } from '../types';

interface IntroFormData {
  firstName: string;
  lastName: string;
  goal: WorkoutGoal;
  weightUnit: WeightUnit;
  darkMode: boolean;
  openaiApiKey: string;
}

const GOAL_OPTIONS: { value: WorkoutGoal; label: string; description: string }[] = [
  { value: 'build', label: 'Build Muscle', description: 'Progressive overload to gain strength and size' },
  { value: 'lose', label: 'Lose Weight', description: 'Preserve muscle while in caloric deficit' },
  { value: 'maintain', label: 'Maintain', description: 'Keep current fitness level steady' },
];

const UNIT_OPTIONS: { value: WeightUnit; label: string }[] = [
  { value: 'lbs', label: 'Pounds (lbs)' },
  { value: 'kg', label: 'Kilograms (kg)' },
];

export const Intro: FC = () => {
  const [step, setStep] = useState(1);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const setWorkoutGoal = useAppStore((state) => state.setWorkoutGoal);
  const setHasCompletedIntro = useAppStore((state) => state.setHasCompletedIntro);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IntroFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      goal: 'build',
      weightUnit: 'lbs',
      darkMode: false,
      openaiApiKey: '',
    },
  });

  const selectedGoal = watch('goal');
  const selectedUnit = watch('weightUnit');
  const darkMode = watch('darkMode');

  // Live preview for dark mode during intro
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const completeIntro = (data: IntroFormData) => {
    // Update preferences
    updatePreferences({
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      weightUnit: data.weightUnit,
      darkMode: data.darkMode,
      openaiApiKey: data.openaiApiKey.trim() || undefined,
    });
    setWorkoutGoal(data.goal);

    // Ensure theme is applied before transitioning
    if (data.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setHasCompletedIntro(true);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const firstNameValue = watch('firstName');
  const lastNameValue = watch('lastName');
  const canProceedFromStep1 = firstNameValue.trim().length > 0 && lastNameValue.trim().length > 0;

  return (
    <div className="relative min-h-screen">
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen p-6">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8 pt-4">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                s === step
                  ? 'bg-primary w-8'
                  : s < step
                  ? 'bg-primary/50'
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(completeIntro)} className="flex-1 flex flex-col">
          {/* Step 1: Welcome + Name */}
          {step === 1 && (
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

              <Button
                type="button"
                onClick={nextStep}
                disabled={!canProceedFromStep1}
                className="w-full"
                size="lg"
              >
                Next
              </Button>
            </div>
          )}

          {/* Step 2: Goal Selection */}
          {step === 2 && (
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
                {GOAL_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setValue('goal', option.value)}
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1"
                  size="lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Preferences */}
          {step === 3 && (
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
                    {UNIT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('weightUnit', option.value)}
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
                      onClick={() => setValue('darkMode', false)}
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
                      onClick={() => setValue('darkMode', true)}
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1"
                  size="lg"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: OpenAI API Key (Optional) */}
          {step === 4 && (
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

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" size="lg">
                  Get Started
                </Button>
              </div>
              <button
                type="submit"
                className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
