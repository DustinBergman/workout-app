import { FC } from 'react';
import { CardioTrackingMode } from '../../../types';

interface TrackingModeToggleProps {
  mode: CardioTrackingMode;
  onChange: (mode: CardioTrackingMode) => void;
}

export const TrackingModeToggle: FC<TrackingModeToggleProps> = ({ mode, onChange }) => (
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
