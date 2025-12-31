import { FC } from 'react';
import { Button, Input } from '../ui';
import { MuscleGroup, Equipment } from '../../types';

interface CustomExerciseFormProps {
  name: string;
  muscles: MuscleGroup[];
  equipment: Equipment;
  muscleGroups: MuscleGroup[];
  equipmentOptions: Equipment[];
  onNameChange: (name: string) => void;
  onEquipmentChange: (equipment: Equipment) => void;
  onToggleMuscle: (muscle: MuscleGroup) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export const CustomExerciseForm: FC<CustomExerciseFormProps> = ({
  name,
  muscles,
  equipment,
  muscleGroups,
  equipmentOptions,
  onNameChange,
  onEquipmentChange,
  onToggleMuscle,
  onCreate,
  onCancel,
}) => {
  return (
    <div className="space-y-4">
      <Input
        label="Exercise Name"
        placeholder="e.g., Cable Lateral Raise"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
      />

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Muscle Groups
        </label>
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((muscle) => (
            <button
              key={muscle}
              type="button"
              onClick={() => onToggleMuscle(muscle)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                muscles.includes(muscle)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          Equipment
        </label>
        <select
          value={equipment}
          onChange={(e) => onEquipmentChange(e.target.value as Equipment)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          {equipmentOptions.map((equip) => (
            <option key={equip} value={equip}>
              {equip.charAt(0).toUpperCase() + equip.slice(1).replace('-', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={onCreate} disabled={!name.trim()} className="flex-1">
          Create & Add
        </Button>
      </div>
    </div>
  );
};
