import { FC, useState } from 'react';
import { Modal, Button } from '../ui';
import { MoodSelector } from './MoodSelector';
import { TitleInput } from './TitleInput';
import { WorkoutMood, WeightUnit, DistanceUnit } from '../../types';

type PostWorkoutStep = 'summary' | 'mood' | 'title' | 'saving';

export interface PostWorkoutFlowProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  totalSets: number;
  totalVolume: number;
  totalCardioDistance: number;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  hasDeviated: boolean;
  hasTemplateId: boolean;
  updatePlan: boolean;
  onUpdatePlanChange: (value: boolean) => void;
  onKeepGoing: () => void;
  onDiscard: () => void;
  onComplete: (mood: WorkoutMood, customTitle: string | null) => Promise<void>;
}

export const PostWorkoutFlow: FC<PostWorkoutFlowProps> = ({
  isOpen,
  onClose,
  workoutName,
  totalSets,
  totalVolume,
  totalCardioDistance,
  weightUnit,
  distanceUnit,
  hasDeviated,
  hasTemplateId,
  updatePlan,
  onUpdatePlanChange,
  onKeepGoing,
  onDiscard,
  onComplete,
}) => {
  const [step, setStep] = useState<PostWorkoutStep>('summary');
  const [selectedMood, setSelectedMood] = useState<WorkoutMood | null>(null);

  const handleSaveAndFinish = () => {
    setStep('mood');
  };

  const handleMoodSelect = (mood: WorkoutMood) => {
    setSelectedMood(mood);
    setStep('title');
  };

  const handleTitleSubmit = async (customTitle: string | null) => {
    if (selectedMood) {
      setStep('saving');
      await onComplete(selectedMood, customTitle);
      // Reset state for next time (modal will close after onComplete)
      setStep('summary');
      setSelectedMood(null);
    }
  };

  const handleClose = () => {
    setStep('summary');
    setSelectedMood(null);
    onClose();
  };

  const handleKeepGoing = () => {
    setStep('summary');
    setSelectedMood(null);
    onKeepGoing();
  };

  const getTitle = () => {
    switch (step) {
      case 'summary':
        return 'Finish Workout?';
      case 'mood':
        return 'Rate Your Workout';
      case 'title':
        return 'Add a Title';
      case 'saving':
        return 'Saving...';
      default:
        return 'Finish Workout?';
    }
  };

  const renderSummary = () => (
    <>
      <div className="text-center py-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Great workout! Here's your summary:
        </p>
        <div className="flex justify-center gap-8 flex-wrap">
          <div>
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalSets}</p>
            <p className="text-sm text-gray-500">Total Sets</p>
          </div>
          {totalVolume > 0 && (
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {totalVolume.toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Total {weightUnit}</p>
            </div>
          )}
          {totalCardioDistance > 0 && (
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {totalCardioDistance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Total {distanceUnit}</p>
            </div>
          )}
        </div>
        {hasDeviated && hasTemplateId && (
          <label className="flex items-center justify-center gap-4 mt-6 p-4 rounded-lg border-2 border-primary/20 bg-primary/5 dark:bg-primary/10 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/15 transition-colors">
            <input
              type="checkbox"
              checked={updatePlan}
              onChange={(e) => onUpdatePlanChange(e.target.checked)}
              className="w-6 h-6 rounded border-2 border-gray-400 dark:border-gray-500 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 cursor-pointer"
            />
            <span className="text-base font-medium text-gray-700 dark:text-gray-300">
              Update saved plan with these changes
            </span>
          </label>
        )}
      </div>
    </>
  );

  const renderFooter = () => {
    if (step === 'summary') {
      return (
        <>
          <Button variant="ghost" onClick={handleKeepGoing}>
            Keep Going
          </Button>
          <Button variant="danger" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={handleSaveAndFinish}>
            Save & Finish
          </Button>
        </>
      );
    }
    return null;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      footer={renderFooter()}
    >
      {step === 'summary' && renderSummary()}
      {step === 'mood' && <MoodSelector onSelect={handleMoodSelect} />}
      {step === 'title' && (
        <TitleInput
          defaultName={workoutName}
          onSubmit={handleTitleSubmit}
        />
      )}
      {step === 'saving' && (
        <div className="flex flex-col items-center justify-center py-8 gap-4">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Saving your workout...</p>
        </div>
      )}
    </Modal>
  );
};
