import { FC, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/useAppStore';
import {
  AnimatedBackground,
  ProgressIndicator,
  WelcomeStep,
  GoalSelectionStep,
  PreferencesStep,
  ApiKeyStep,
  GoalOption,
  UnitOption,
  IntroFormData,
} from '../components/intro';

const GOAL_OPTIONS: GoalOption[] = [
  { value: 'build', label: 'Build Muscle', description: 'Progressive overload to gain strength and size' },
  { value: 'lose', label: 'Lose Weight', description: 'Preserve muscle while in caloric deficit' },
  { value: 'maintain', label: 'Maintain', description: 'Keep current fitness level steady' },
];

const UNIT_OPTIONS: UnitOption[] = [
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
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col min-h-screen p-6">
        <ProgressIndicator currentStep={step} totalSteps={4} />

        <form onSubmit={handleSubmit(completeIntro)} className="flex-1 flex flex-col">
          {step === 1 && (
            <WelcomeStep
              register={register}
              errors={errors}
              canProceed={canProceedFromStep1}
              onNext={nextStep}
            />
          )}

          {step === 2 && (
            <GoalSelectionStep
              selectedGoal={selectedGoal}
              onSelectGoal={(goal) => setValue('goal', goal)}
              goalOptions={GOAL_OPTIONS}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}

          {step === 3 && (
            <PreferencesStep
              selectedUnit={selectedUnit}
              onSelectUnit={(unit) => setValue('weightUnit', unit)}
              unitOptions={UNIT_OPTIONS}
              darkMode={darkMode}
              onSelectDarkMode={(dark) => setValue('darkMode', dark)}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}

          {step === 4 && (
            <ApiKeyStep
              register={register}
              onBack={prevStep}
            />
          )}
        </form>
      </div>
    </div>
  );
};
