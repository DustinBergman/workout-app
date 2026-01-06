import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Input } from '../components/ui';
import { MuscleGroup, Equipment, CardioType } from '../types';
import { getAllExercises } from '../data/exercises';
import {
  generateWorkoutPlan,
  generateCardioPlan,
  createTemplateFromPlan,
  createCardioTemplateFromPlan,
  WorkoutType,
  GeneratedPlan,
  GeneratedCardioPlan,
} from '../services/openai/planGenerator';

// Workout type options
const WORKOUT_TYPE_OPTIONS: { value: WorkoutType; label: string; description: string }[] = [
  { value: 'full-body', label: 'Full Body', description: 'Train all major muscle groups' },
  { value: 'push', label: 'Push', description: 'Chest, shoulders, triceps' },
  { value: 'pull', label: 'Pull', description: 'Back, biceps, rear delts' },
  { value: 'legs', label: 'Legs', description: 'Quads, hamstrings, glutes, calves' },
  { value: 'upper', label: 'Upper Body', description: 'All upper body muscles' },
  { value: 'lower', label: 'Lower Body', description: 'All lower body muscles' },
  { value: 'custom', label: 'Custom', description: 'Select specific muscle groups' },
  { value: 'cardio', label: 'Cardio', description: 'Running, cycling, HIIT, and more' },
];

// Equipment options
const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'cable', label: 'Cable' },
  { value: 'machine', label: 'Machine' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'ez-bar', label: 'EZ Bar' },
  { value: 'smith-machine', label: 'Smith Machine' },
  { value: 'resistance-band', label: 'Resistance Band' },
];

// Muscle group options for custom selection
const MUSCLE_GROUP_OPTIONS: { value: MuscleGroup; label: string }[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'biceps', label: 'Biceps' },
  { value: 'triceps', label: 'Triceps' },
  { value: 'forearms', label: 'Forearms' },
  { value: 'core', label: 'Core' },
  { value: 'quadriceps', label: 'Quadriceps' },
  { value: 'hamstrings', label: 'Hamstrings' },
  { value: 'glutes', label: 'Glutes' },
  { value: 'calves', label: 'Calves' },
  { value: 'lats', label: 'Lats' },
  { value: 'traps', label: 'Traps' },
];

// Cardio type options
const CARDIO_TYPE_OPTIONS: { value: CardioType; label: string }[] = [
  { value: 'running', label: 'Running' },
  { value: 'walking', label: 'Walking' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'rowing', label: 'Rowing' },
  { value: 'elliptical', label: 'Elliptical' },
  { value: 'stair-climber', label: 'Stair Climber' },
  { value: 'swimming', label: 'Swimming' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'boxing', label: 'Boxing' },
];

interface AIWorkoutFormData {
  workoutType: WorkoutType;
  customMuscleGroups: MuscleGroup[];
  selectedCardioTypes: CardioType[];
  numberOfExercises: number;
  availableEquipment: Equipment[];
  additionalComments: string;
  planName: string;
}

export const AIWorkoutCreator: FC = () => {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | GeneratedCardioPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const apiKey = useAppStore((state) => state.preferences.openaiApiKey);
  const addTemplate = useAppStore((state) => state.addTemplate);
  const customExercises = useAppStore((state) => state.customExercises);

  const { watch, setValue } = useForm<AIWorkoutFormData>({
    defaultValues: {
      workoutType: 'full-body',
      customMuscleGroups: [],
      selectedCardioTypes: [],
      numberOfExercises: 6,
      availableEquipment: ['barbell', 'dumbbell', 'cable', 'machine', 'bodyweight'],
      additionalComments: '',
      planName: '',
    },
  });

  const selectedWorkoutType = watch('workoutType');
  const selectedEquipment = watch('availableEquipment');
  const selectedMuscleGroups = watch('customMuscleGroups');
  const selectedCardioTypes = watch('selectedCardioTypes');
  const numberOfExercises = watch('numberOfExercises');
  const additionalComments = watch('additionalComments');
  const planName = watch('planName');

  const isCardioWorkout = selectedWorkoutType === 'cardio';

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const toggleEquipment = (equipment: Equipment) => {
    const current = selectedEquipment;
    if (current.includes(equipment)) {
      setValue('availableEquipment', current.filter((e) => e !== equipment));
    } else {
      setValue('availableEquipment', [...current, equipment]);
    }
  };

  const toggleMuscleGroup = (muscle: MuscleGroup) => {
    const current = selectedMuscleGroups;
    if (current.includes(muscle)) {
      setValue('customMuscleGroups', current.filter((m) => m !== muscle));
    } else {
      setValue('customMuscleGroups', [...current, muscle]);
    }
  };

  const toggleCardioType = (cardioType: CardioType) => {
    const current = selectedCardioTypes;
    if (current.includes(cardioType)) {
      setValue('selectedCardioTypes', current.filter((c) => c !== cardioType));
    } else {
      setValue('selectedCardioTypes', [...current, cardioType]);
    }
  };

  const canProceedFromStep1 = selectedWorkoutType === 'cardio' || selectedWorkoutType !== 'custom' || selectedMuscleGroups.length > 0;
  const canProceedFromStep2 = isCardioWorkout ? selectedCardioTypes.length > 0 : selectedEquipment.length > 0;

  const handleGenerate = async () => {
    if (!apiKey) {
      setError('Please add your OpenAI API key in Settings to use AI features.');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      if (isCardioWorkout) {
        const plan = await generateCardioPlan(
          apiKey,
          {
            workoutType: 'cardio',
            selectedCardioTypes: selectedCardioTypes,
            numberOfExercises,
            availableEquipment: [],
            additionalComments,
          },
          customExercises
        );
        setGeneratedPlan(plan);
        setValue('planName', plan.name);
      } else {
        const plan = await generateWorkoutPlan(
          apiKey,
          {
            workoutType: selectedWorkoutType,
            customMuscleGroups: selectedMuscleGroups,
            numberOfExercises,
            availableEquipment: selectedEquipment,
            additionalComments,
          },
          customExercises
        );
        setGeneratedPlan(plan);
        setValue('planName', plan.name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate workout plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!generatedPlan) return;

    const template = isCardioWorkout
      ? createCardioTemplateFromPlan(generatedPlan as GeneratedCardioPlan, planName || generatedPlan.name)
      : createTemplateFromPlan(generatedPlan as GeneratedPlan, planName || generatedPlan.name);
    addTemplate(template);
    navigate('/plans');
  };

  const handleRegenerate = () => {
    setGeneratedPlan(null);
    setError(null);
    handleGenerate();
  };

  const allExercises = getAllExercises(customExercises);
  const getExerciseName = (id: string) => {
    return allExercises.find((e) => e.id === id)?.name || 'Unknown Exercise';
  };

  return (
    <div className="relative overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      </div>

      <div className="relative z-10 flex flex-col h-full p-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => navigate('/plans')}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold text-foreground">Create with AI</h1>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8 flex-shrink-0">
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

        {/* Step 1: Workout Type */}
        {step === 1 && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full overflow-hidden">
            <div className="text-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What type of workout?
              </h2>
              <p className="text-muted-foreground">
                Select your workout focus
              </p>
            </div>

            <div className="flex-1 space-y-3 mb-6 overflow-y-auto">
              {WORKOUT_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('workoutType', option.value)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedWorkoutType === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border/50 bg-card/60 backdrop-blur-lg hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground">
                      {option.label}
                    </span>
                    {selectedWorkoutType === option.value && (
                      <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              ))}

              {/* Custom muscle group selection - inside scrollable area */}
              {selectedWorkoutType === 'custom' && (
                <Card padding="md" className="mt-4">
                  <p className="font-medium text-foreground mb-3">Select muscle groups</p>
                  <div className="flex flex-wrap gap-2">
                    {MUSCLE_GROUP_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleMuscleGroup(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                          selectedMuscleGroups.includes(option.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            <Button
              type="button"
              onClick={nextStep}
              disabled={!canProceedFromStep1}
              className="w-full flex-shrink-0"
              size="lg"
            >
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Preferences */}
        {step === 2 && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full overflow-hidden">
            <div className="text-center mb-6 flex-shrink-0">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isCardioWorkout ? 'Choose cardio types' : 'Customize your workout'}
              </h2>
              <p className="text-muted-foreground">
                {isCardioWorkout ? 'Select the types of cardio you want' : 'Set your preferences'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pb-4">
              {/* Number of exercises */}
              <Card padding="lg">
                <p className="font-medium text-foreground mb-3">
                  Number of exercises: {numberOfExercises}
                </p>
                <input
                  type="range"
                  min={isCardioWorkout ? 1 : 4}
                  max={isCardioWorkout ? 5 : 10}
                  value={numberOfExercises}
                  onChange={(e) => setValue('numberOfExercises', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{isCardioWorkout ? 1 : 4}</span>
                  <span>{isCardioWorkout ? 5 : 10}</span>
                </div>
              </Card>

              {/* Cardio type selection - shown for cardio workouts */}
              {isCardioWorkout && (
                <Card padding="lg">
                  <p className="font-medium text-foreground mb-3">
                    Cardio types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CARDIO_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleCardioType(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                          selectedCardioTypes.includes(option.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {selectedCardioTypes.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      Please select at least one cardio type
                    </p>
                  )}
                </Card>
              )}

              {/* Equipment selection - shown for strength workouts */}
              {!isCardioWorkout && (
                <Card padding="lg">
                  <p className="font-medium text-foreground mb-3">
                    Available equipment
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleEquipment(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                          selectedEquipment.includes(option.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {selectedEquipment.length === 0 && (
                    <p className="text-sm text-red-500 mt-2">
                      Please select at least one equipment type
                    </p>
                  )}
                </Card>
              )}
            </div>

            <div className="flex gap-3 flex-shrink-0 pt-4">
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
                disabled={!canProceedFromStep2}
                className="flex-1"
                size="lg"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Additional Comments */}
        {step === 3 && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Any special requests?
              </h2>
              <p className="text-muted-foreground">
                Tell the AI about your preferences
              </p>
            </div>

            <div className="flex-1 mb-6">
              <Card padding="lg">
                <textarea
                  placeholder="e.g., I don't like leg press, focus on compound movements, include warmup exercises..."
                  value={additionalComments}
                  onChange={(e) => setValue('additionalComments', e.target.value.slice(0, 500))}
                  className="w-full h-40 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2 text-right">
                  {additionalComments.length}/500
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

        {/* Step 4: Review & Generate */}
        {step === 4 && (
          <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {generatedPlan ? 'Your workout plan' : 'Review & Generate'}
              </h2>
              <p className="text-muted-foreground">
                {generatedPlan ? 'Review and save your plan' : 'Ready to create your workout'}
              </p>
            </div>

            {/* No API Key Warning */}
            {!apiKey && (
              <Card className="mb-4 bg-amber-500/10 border-amber-500/30">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      API Key Required
                    </p>
                    <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
                      Add your OpenAI key in{' '}
                      <Link to="/settings" className="underline">Settings</Link>
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Message */}
            {error && (
              <Card className="mb-4 bg-red-500/10 border-red-500/30">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </Card>
            )}

            {/* Summary before generation */}
            {!generatedPlan && !isGenerating && (
              <Card padding="lg" className="mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workout Type</span>
                    <span className="font-medium text-foreground capitalize">
                      {selectedWorkoutType.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exercises</span>
                    <span className="font-medium text-foreground">{numberOfExercises}</span>
                  </div>
                  {isCardioWorkout ? (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cardio Types</span>
                      <span className="font-medium text-foreground text-right max-w-[60%]">
                        {selectedCardioTypes.length} selected
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Equipment</span>
                      <span className="font-medium text-foreground text-right max-w-[60%]">
                        {selectedEquipment.length} types
                      </span>
                    </div>
                  )}
                  {additionalComments && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground text-sm">Notes: </span>
                      <span className="text-sm text-foreground">{additionalComments}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Loading State */}
            {isGenerating && (
              <Card padding="lg" className="mb-6">
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Creating your workout plan...</p>
                </div>
              </Card>
            )}

            {/* Generated Plan Preview */}
            {generatedPlan && !isGenerating && (
              <div className="flex-1 mb-6 space-y-4">
                <Input
                  label="Plan Name"
                  value={planName}
                  onChange={(e) => setValue('planName', e.target.value)}
                  placeholder="Enter plan name"
                />

                <Card padding="md" className="max-h-[40vh] overflow-y-auto">
                  <p className="font-medium text-foreground mb-3">
                    Exercises ({generatedPlan.exercises.length})
                  </p>
                  <div className="space-y-2">
                    {generatedPlan.exercises.map((ex, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {index + 1}. {getExerciseName(ex.exerciseId)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isCardioWorkout
                            ? `${(ex as GeneratedCardioPlan['exercises'][0]).restSeconds || 60}s rest`
                            : `${(ex as GeneratedPlan['exercises'][0]).targetSets}x${(ex as GeneratedPlan['exercises'][0]).targetReps}`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!generatedPlan && !isGenerating && (
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
                    onClick={handleGenerate}
                    disabled={!apiKey}
                    className="flex-1"
                    size="lg"
                  >
                    Generate Plan
                  </Button>
                </div>
              )}

              {generatedPlan && !isGenerating && (
                <>
                  <Button
                    type="button"
                    onClick={handleSave}
                    className="w-full"
                    size="lg"
                  >
                    Save Plan
                  </Button>
                  <Button
                    type="button"
                    onClick={handleRegenerate}
                    variant="outline"
                    className="w-full"
                    size="lg"
                  >
                    Regenerate
                  </Button>
                  <Button
                    type="button"
                    onClick={prevStep}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to edit
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
