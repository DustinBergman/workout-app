import { FC } from 'react';
import { Button } from '../ui';

export interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  onSubmit?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  showBack?: boolean;
}

export const StepNavigation: FC<StepNavigationProps> = ({
  onBack,
  onNext,
  onSubmit = false,
  nextLabel = 'Next',
  nextDisabled = false,
  showBack = true,
}) => {
  return (
    <div className="flex gap-3">
      {showBack && onBack && (
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex-1"
          size="lg"
        >
          Back
        </Button>
      )}
      <Button
        type={onSubmit ? 'submit' : 'button'}
        onClick={onSubmit ? undefined : onNext}
        disabled={nextDisabled}
        className="flex-1"
        size="lg"
      >
        {nextLabel}
      </Button>
    </div>
  );
};
