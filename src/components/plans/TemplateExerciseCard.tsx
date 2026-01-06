import { FC } from 'react';
import { Card } from '../ui';
import { TemplateExercise, CardioTemplateExercise, CardioCategory, CardioTrackingMode } from '../../types';

// Input field component for consistent styling
const NumberInput: FC<{
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  step?: number;
  suffix?: string;
}> = ({ label, value, onChange, min = 0, step = 1, suffix }) => (
  <div>
    <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
    <div className="flex items-center gap-1">
      <input
        type="number"
        min={min}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
        className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
      />
      {suffix && <span className="text-xs text-gray-500 dark:text-gray-400">{suffix}</span>}
    </div>
  </div>
);

type IntensityLevel = 'low' | 'moderate' | 'high';

// Intensity selector for duration-based cardio
const IntensitySelector: FC<{
  value: IntensityLevel | undefined;
  onChange: (value: IntensityLevel) => void;
}> = ({ value, onChange }) => (
  <div>
    <label className="text-xs text-gray-500 dark:text-gray-400">Intensity</label>
    <select
      value={value || 'moderate'}
      onChange={(e) => onChange(e.target.value as IntensityLevel)}
      className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
    >
      <option value="low">Low</option>
      <option value="moderate">Moderate</option>
      <option value="high">High</option>
    </select>
  </div>
);

// Tracking mode toggle
const TrackingModeToggle: FC<{
  mode: CardioTrackingMode;
  onChange: (mode: CardioTrackingMode) => void;
}> = ({ mode, onChange }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="text-xs text-gray-500 dark:text-gray-400">Track:</span>
    <div className="flex rounded-md overflow-hidden border border-gray-300 dark:border-gray-600">
      <button
        type="button"
        onClick={() => onChange('detailed')}
        className={`px-2 py-0.5 text-xs transition-colors ${
          mode === 'detailed'
            ? 'bg-green-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        Detailed
      </button>
      <button
        type="button"
        onClick={() => onChange('simple')}
        className={`px-2 py-0.5 text-xs transition-colors ${
          mode === 'simple'
            ? 'bg-green-500 text-white'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        Simple
      </button>
    </div>
  </div>
);

// Simple mode fields (duration + calories)
const SimpleCardioFields: FC<{
  exercise: CardioTemplateExercise;
  index: number;
  onUpdate: (index: number, updates: Partial<TemplateExercise>) => void;
}> = ({ exercise, index, onUpdate }) => (
  <div className="grid grid-cols-3 gap-2">
    <NumberInput
      label="Duration (min)"
      value={'targetDurationMinutes' in exercise ? exercise.targetDurationMinutes : undefined}
      onChange={(v) => onUpdate(index, { targetDurationMinutes: v })}
    />
    <NumberInput
      label="Calories"
      value={exercise.targetCalories}
      onChange={(v) => onUpdate(index, { targetCalories: v })}
    />
    <NumberInput
      label="Rest (s)"
      value={exercise.restSeconds}
      onChange={(v) => onUpdate(index, { restSeconds: v })}
      step={15}
    />
  </div>
);

// Cardio-specific fields based on category
const CardioFields: FC<{
  exercise: CardioTemplateExercise;
  index: number;
  onUpdate: (index: number, updates: Partial<TemplateExercise>) => void;
}> = ({ exercise, index, onUpdate }) => {
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

interface TemplateExerciseCardProps {
  exercise: TemplateExercise;
  index: number;
  exerciseName: string;
  onUpdate: (index: number, updates: Partial<TemplateExercise>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

export const TemplateExerciseCard: FC<TemplateExerciseCardProps> = ({
  exercise,
  index,
  exerciseName,
  onUpdate,
  onRemove,
  onMove,
  isFirst,
  isLast,
}) => {
  return (
    <Card padding="sm">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onMove(index, 'up')}
            disabled={isFirst}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            onClick={() => onMove(index, 'down')}
            disabled={isLast}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {exerciseName}
            </p>
            {exercise.type === 'cardio' && (
              <span className="text-xs px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                Cardio
              </span>
            )}
          </div>
          {exercise.type === 'cardio' ? (
            <CardioFields exercise={exercise} index={index} onUpdate={onUpdate} />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-gray-500">Sets</label>
                <input
                  type="number"
                  min="1"
                  value={exercise.targetSets ?? ''}
                  onChange={(e) => onUpdate(index, { targetSets: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Reps</label>
                <input
                  type="number"
                  min="1"
                  value={exercise.targetReps ?? ''}
                  onChange={(e) => onUpdate(index, { targetReps: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Rest (s)</label>
                <input
                  type="number"
                  min="0"
                  step="15"
                  value={exercise.restSeconds ?? ''}
                  onChange={(e) => onUpdate(index, { restSeconds: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                  className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(index)}
          className="p-1 text-red-500 hover:text-red-700"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </Card>
  );
};
