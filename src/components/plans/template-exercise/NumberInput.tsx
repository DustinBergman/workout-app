import { FC } from 'react';

interface NumberInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  step?: number;
  suffix?: string;
}

export const NumberInput: FC<NumberInputProps> = ({ label, value, onChange, min = 0, step = 1, suffix }) => (
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
