import { FC, useId } from 'react';

interface NumberInputProps {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  min?: number;
  step?: number;
  suffix?: string;
}

export const NumberInput: FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  step = 1,
  suffix,
}) => {
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={min}
          step={step}
          value={value ?? ''}
          onChange={(e) => {
            if (e.target.value === '') {
              onChange(undefined);
              return;
            }
            const parsed = Number.parseInt(e.target.value, 10);
            onChange(Number.isNaN(parsed) ? undefined : Math.max(min, parsed));
          }}
          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-center"
        />
        {suffix && <span className="text-xs text-gray-500 dark:text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
};
