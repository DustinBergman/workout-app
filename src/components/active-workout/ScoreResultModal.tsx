import { FC } from 'react';
import { Modal, Button } from '../ui';
import { WorkoutScoreResult } from '../../types';

export interface ScoreResultModalProps {
  isOpen: boolean;
  scoreResult: WorkoutScoreResult | null;
  onClose: () => void;
}

export const ScoreResultModal: FC<ScoreResultModalProps> = ({
  isOpen,
  scoreResult,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workout Score"
      footer={
        <Button onClick={onClose}>
          Done
        </Button>
      }
    >
      {scoreResult && (
        <div className="py-4">
          {/* Score Circle */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-2">
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {scoreResult.grade}
              </span>
            </div>
            <p className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              {scoreResult.score}/100
            </p>
          </div>

          {/* Summary */}
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            {scoreResult.summary}
          </p>

          {/* Highlights */}
          {scoreResult.highlights.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                What went well
              </h4>
              <ul className="space-y-1">
                {scoreResult.highlights.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-green-500">+</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvements */}
          {scoreResult.improvements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2">
                Areas to improve
              </h4>
              <ul className="space-y-1">
                {scoreResult.improvements.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-orange-500">-</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
