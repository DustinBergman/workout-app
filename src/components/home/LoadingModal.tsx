import { FC } from 'react';
import { Modal } from '../ui';

interface LoadingModalProps {
  isOpen: boolean;
}

export const LoadingModal: FC<LoadingModalProps> = ({ isOpen }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Preparing Your Workout"
    >
      <div className="text-center py-8">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">
          Getting AI recommendations...
        </p>
      </div>
    </Modal>
  );
};
