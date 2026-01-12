import { FC, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { Modal, Button } from '../ui';
import { WorkoutSession } from '../../types';
import { deleteSession as deleteSessionFromDb } from '../../services/supabase/sessions';
import { toast } from '../../store/toastStore';

interface DeleteSessionModalWrapperProps {
  session: WorkoutSession;
}

export const DeleteSessionModalWrapper: FC<DeleteSessionModalWrapperProps> = ({ session }) => {
  const { closeModal } = useModal();
  const deleteSessionFromStore = useAppStore((state) => state.deleteSession);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await deleteSessionFromDb(session.id);
      if (error) {
        toast.error('Failed to delete workout');
        console.error('Delete error:', error);
      } else {
        deleteSessionFromStore(session.id);
        toast.success('Workout deleted');
        closeModal();
      }
    } catch (err) {
      toast.error('Failed to delete workout');
      console.error('Delete error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={closeModal}
      title="Delete Workout"
    >
      <div className="space-y-4">
        <p className="text-gray-600 dark:text-gray-400">
          Are you sure you want to delete "{session.name}"? This action
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={closeModal}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
