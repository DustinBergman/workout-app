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
          <label className="flex items-center justify-center gap-2 mt-6 cursor-pointer">
            <input
              type="checkbox"
              checked={updatePlan}
              onChange={(e) => onUpdatePlanChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Update saved plan with these changes
            </span>
          </label>
        )}
      </div>
    </Modal>
  );
};
