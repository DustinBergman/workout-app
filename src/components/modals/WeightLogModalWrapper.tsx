import { FC, useState } from 'react';
import { useModal } from '../../contexts/ModalContext';
import { useAppStore } from '../../store/useAppStore';
import { Modal, Button } from '../ui';

export const WeightLogModalWrapper: FC = () => {
  const { closeModal } = useModal();
  const weightUnit = useAppStore((state) => state.preferences.weightUnit);
  const addWeightEntry = useAppStore((state) => state.addWeightEntry);
  const [weight, setWeight] = useState('');

  const handleSubmit = () => {
    const weightValue = parseFloat(weight);
    if (!isNaN(weightValue) && weightValue > 0) {
      addWeightEntry(weightValue);
      setWeight('');
      closeModal();
    }
  };

  const handleClose = () => {
    setWeight('');
    closeModal();
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title="Log Your Weight"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!weight || parseFloat(weight) <= 0}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Track your body weight to help personalize workout suggestions.
        </p>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Weight ({weightUnit})
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={`Enter weight in ${weightUnit}`}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            min="0"
            step="0.1"
            autoFocus
          />
        </div>
      </div>
    </Modal>
  );
};
