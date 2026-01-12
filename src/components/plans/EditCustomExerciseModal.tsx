import { FC, useState, useEffect } from 'react';
import { Modal, Button } from '../ui';

interface EditCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  currentName: string;
  onSave: (exerciseId: string, newName: string) => void;
}

export const EditCustomExerciseModal: FC<EditCustomExerciseModalProps> = ({
  isOpen,
  onClose,
  exerciseId,
  currentName,
  onSave,
}) => {
  const [name, setName] = useState(currentName);

  // Reset name when modal opens with different exercise
  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName && trimmedName !== currentName) {
      onSave(exerciseId, trimmedName);
    }
    onClose();
  };

  const handleClose = () => {
    setName(currentName);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Exercise Name"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Exercise Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter exercise name"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
};
