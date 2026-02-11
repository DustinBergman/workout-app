import { FC } from 'react';
import { CardioTemplateExercise, CardioCategory, CardioTrackingMode, TemplateExercise } from '../../../types';
import { NumberInput } from './NumberInput';
import { IntensitySelector } from './IntensitySelector';
import { TrackingModeToggle } from './TrackingModeToggle';
import { SimpleCardioFields } from './SimpleCardioFields';

interface CardioFieldsProps {
  exercise: CardioTemplateExercise;
  index: number;
  onUpdate: (index: number, updates: Partial<TemplateExercise>) => void;
}

export const CardioFields: FC<CardioFieldsProps> = ({ exercise, index, onUpdate }) => {
  const category: CardioCategory = exercise.cardioCategory;
  const trackingMode: CardioTrackingMode = exercise.trackingMode || 'detailed';

  const handleModeChange = (mode: CardioTrackingMode) => {
    onUpdate(index, { trackingMode: mode });
  };

  const renderDistanceFields = () => (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        label="Duration (min)"
        value={'targetDurationMinutes' in exercise ? exercise.targetDurationMinutes : undefined}
        onChange={(v) => onUpdate(index, { targetDurationMinutes: v })}
      />
      <NumberInput
        label="Rest (s)"
        value={exercise.restSeconds}
        onChange={(v) => onUpdate(index, { restSeconds: v })}
        step={15}
      />
    </div>
  );

  const renderIntervalFields = () => (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        label="Rounds"
        value={'rounds' in exercise ? exercise.rounds : undefined}
        onChange={(v) => onUpdate(index, { rounds: v })}
        min={1}
      />
      <NumberInput
        label="Work (s)"
        value={'workSeconds' in exercise ? exercise.workSeconds : undefined}
        onChange={(v) => onUpdate(index, { workSeconds: v })}
      />
      <NumberInput
        label="Rest between (s)"
        value={'restBetweenRoundsSeconds' in exercise ? exercise.restBetweenRoundsSeconds : undefined}
        onChange={(v) => onUpdate(index, { restBetweenRoundsSeconds: v })}
        step={5}
      />
      <NumberInput
        label="Rest after (s)"
        value={exercise.restSeconds}
        onChange={(v) => onUpdate(index, { restSeconds: v })}
        step={15}
      />
    </div>
  );

  const renderLapsFields = () => (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        label="Laps"
        value={'targetLaps' in exercise ? exercise.targetLaps : undefined}
        onChange={(v) => onUpdate(index, { targetLaps: v })}
        min={1}
      />
      <NumberInput
        label="Rest (s)"
        value={exercise.restSeconds}
        onChange={(v) => onUpdate(index, { restSeconds: v })}
        step={15}
      />
    </div>
  );

  const renderDurationFields = () => (
    <div className="grid grid-cols-3 gap-2">
      <NumberInput
        label="Duration (min)"
        value={'targetDurationMinutes' in exercise ? exercise.targetDurationMinutes : undefined}
        onChange={(v) => onUpdate(index, { targetDurationMinutes: v })}
      />
      <IntensitySelector
        value={'targetIntensity' in exercise ? exercise.targetIntensity : undefined}
        onChange={(v) => onUpdate(index, { targetIntensity: v })}
      />
      <NumberInput
        label="Rest (s)"
        value={exercise.restSeconds}
        onChange={(v) => onUpdate(index, { restSeconds: v })}
        step={15}
      />
    </div>
  );

  const renderOtherFields = () => (
    <div className="grid grid-cols-2 gap-2">
      <NumberInput
        label="Duration (min)"
        value={'targetDurationMinutes' in exercise ? exercise.targetDurationMinutes : undefined}
        onChange={(v) => onUpdate(index, { targetDurationMinutes: v })}
      />
      <NumberInput
        label="Rest (s)"
        value={exercise.restSeconds}
        onChange={(v) => onUpdate(index, { restSeconds: v })}
        step={15}
      />
    </div>
  );

  const renderDetailedFields = () => {
    switch (category) {
      case 'distance':
        return renderDistanceFields();
      case 'interval':
        return renderIntervalFields();
      case 'laps':
        return renderLapsFields();
      case 'duration':
        return renderDurationFields();
      case 'other':
      default:
        return renderOtherFields();
    }
  };

  return (
    <div>
      <TrackingModeToggle mode={trackingMode} onChange={handleModeChange} />
      {trackingMode === 'simple' ? (
        <SimpleCardioFields exercise={exercise} index={index} onUpdate={onUpdate} />
      ) : (
        renderDetailedFields()
      )}
    </div>
  );
};
