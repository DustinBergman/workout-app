import { FC } from 'react';

export type IntensityLevel = 'low' | 'moderate' | 'high';

interface IntensitySelectorProps {
  value: IntensityLevel | undefined;
  onChange: (value: IntensityLevel) => void;
}

export const IntensitySelector: FC<IntensitySelectorProps> = ({ value, onChange }) => (
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
