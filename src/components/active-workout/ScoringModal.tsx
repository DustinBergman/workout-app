import { FC } from 'react';
import { Modal } from '../ui';

export interface ScoringModalProps {
  isOpen: boolean;
}

export const ScoringModal: FC<ScoringModalProps> = ({ isOpen }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Analyzing Your Workout"
    >
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          AI is analyzing your performance...
        </p>
      </div>
    </Modal>
  );
};
