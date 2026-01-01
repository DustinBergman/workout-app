import { FC } from 'react';
import { Modal, Button } from '../ui';
import { WeightUnit, DistanceUnit } from '../../types';

export interface FinishWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onSaveAndFinish: () => void;
}

export const FinishWorkoutModal: FC<FinishWorkoutModalProps> = ({
  isOpen,
  onClose,
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
  onSaveAndFinish,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finish Workout?"
      footer={
        <>
          <Button variant="ghost" onClick={onKeepGoing}>
            Keep Going
          </Button>
          <Button variant="danger" onClick={onDiscard}>
            Discard
          </Button>
          <Button onClick={onSaveAndFinish}>
            Save & Finish
          </Button>
        </>
      }
    >
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
    </Modal>
  );
};
