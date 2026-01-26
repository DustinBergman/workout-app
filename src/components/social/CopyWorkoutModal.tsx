import { FC, useState } from 'react';
import { Modal, Button, Input } from '../ui';
import { FeedWorkout } from '../../services/supabase/feed';

interface CopyWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: FeedWorkout;
  onCopy: (name: string) => Promise<void>;
}

export const CopyWorkoutModal: FC<CopyWorkoutModalProps> = ({
  isOpen,
  onClose,
  workout,
  onCopy,
}) => {
  const [templateName, setTemplateName] = useState(workout.name || workout.custom_title || '');
  const [isCopying, setIsCopying] = useState(false);

  const displayName = workout.user.username
    ? `@${workout.user.username}`
    : `${workout.user.first_name || ''} ${workout.user.last_name || ''}`.trim() || 'Unknown';

  const handleCopy = async () => {
    if (!templateName.trim()) return;

    setIsCopying(true);
    try {
      await onCopy(templateName.trim());
      onClose();
    } finally {
      setIsCopying(false);
    }
  };

  const handleClose = () => {
    setTemplateName(workout.name || workout.custom_title || '');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Copy Workout to Plans"
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="template-name" className="block text-sm font-medium mb-1.5">
            Plan Name
          </label>
          <Input
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Enter plan name"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>From {displayName}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          This will copy the exercise structure to your plans. Weights will not be included - you&apos;ll add them when you start the workout.
        </p>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isCopying}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleCopy}
            disabled={isCopying || !templateName.trim()}
          >
            {isCopying ? 'Copying...' : 'Copy to Plans'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
