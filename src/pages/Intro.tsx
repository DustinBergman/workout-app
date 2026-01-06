import { FC, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppStore } from '../store/useAppStore';
import {
  AnimatedBackground,
  ProgressIndicator,
  GoalSelectionStep,
  ExperienceLevelStep,
  PreferencesStep,
  WeightStep,
  ApiKeyStep,
  GoalOption,
  UnitOption,
  DistanceUnitOption,
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

const DISTANCE_UNIT_OPTIONS: DistanceUnitOption[] = [
  { value: 'mi', label: 'Miles (mi)' },
  { value: 'km', label: 'Kilometers (km)' },
];

export const Intro: FC = () => {
  const [step, setStep] = useState(1);
  const updatePreferences = useAppStore((state) => state.updatePreferences);
  const setWorkoutGoal = useAppStore((state) => state.setWorkoutGoal);
  const setHasCompletedIntro = useAppStore((state) => state.setHasCompletedIntro);
  const addWeightEntry = useAppStore((state) => state.addWeightEntry);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
  } = useForm<IntroFormData>({
    defaultValues: {
      goal: 'build',
      experienceLevel: 'intermediate',
      weightUnit: 'lbs',
      distanceUnit: 'mi',
      darkMode: false,
      initialWeight: '',
      openaiApiKey: '',
    },
  });

  const selectedGoal = watch('goal');
  const selectedExperienceLevel = watch('experienceLevel');
  const selectedUnit = watch('weightUnit');
  const selectedDistanceUnit = watch('distanceUnit');
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
    // Update preferences (names are now collected during signup)
    updatePreferences({
      experienceLevel: data.experienceLevel,
      weightUnit: data.weightUnit,
      distanceUnit: data.distanceUnit,
      darkMode: data.darkMode,
      openaiApiKey: data.openaiApiKey.trim() || undefined,
    });
    setWorkoutGoal(data.goal);

    // Save initial weight if provided
    const initialWeight = parseFloat(data.initialWeight);
    if (!isNaN(initialWeight) && initialWeight > 0) {
      addWeightEntry(initialWeight);
    }

    // Ensure theme is applied before transitioning
    if (data.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    setHasCompletedIntro(true);
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 5));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <div className="relative z-10 flex flex-col min-h-screen p-6">
        <ProgressIndicator currentStep={step} totalSteps={5} />

        <form onSubmit={handleSubmit(completeIntro)} className="flex-1 flex flex-col">
          {step === 1 && (
            <GoalSelectionStep
              selectedGoal={selectedGoal}
              onSelectGoal={(goal) => setValue('goal', goal)}
              goalOptions={GOAL_OPTIONS}
              onBack={prevStep}
              onNext={nextStep}
              showBack={false}
            />
          )}

          {step === 2 && (
            <ExperienceLevelStep
              selectedLevel={selectedExperienceLevel}
              onSelectLevel={(level) => setValue('experienceLevel', level)}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}

          {step === 3 && (
            <PreferencesStep
              selectedUnit={selectedUnit}
              onSelectUnit={(unit) => setValue('weightUnit', unit)}
              unitOptions={UNIT_OPTIONS}
              selectedDistanceUnit={selectedDistanceUnit}
              onSelectDistanceUnit={(unit) => setValue('distanceUnit', unit)}
              distanceUnitOptions={DISTANCE_UNIT_OPTIONS}
              darkMode={darkMode}
              onSelectDarkMode={(dark) => setValue('darkMode', dark)}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}

          {step === 4 && (
            <WeightStep
              register={register}
              weightUnit={selectedUnit}
              onBack={prevStep}
              onNext={nextStep}
            />
          )}

          {step === 5 && (
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
