import { FC } from 'react';
import { WorkoutMood, WORKOUT_MOOD_CONFIG } from '../../types';

export interface MoodSelectorProps {
  onSelect: (mood: WorkoutMood) => void;
}

export const MoodSelector: FC<MoodSelectorProps> = ({ onSelect }) => {
  const moods = Object.entries(WORKOUT_MOOD_CONFIG) as [string, { emoji: string; label: string }][];

  return (
    <div className="text-center py-6">
      <h3 className="text-lg font-semibold text-foreground mb-2">
        How was your workout?
      </h3>
      <p className="text-muted-foreground mb-6">Tap to select your mood</p>
      <div className="flex justify-center gap-3">
        {moods.map(([value, config]) => (
          <button
            key={value}
            onClick={() => onSelect(Number(value) as WorkoutMood)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-muted active:scale-95 transition-all"
          >
            <span className="text-4xl">{config.emoji}</span>
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
