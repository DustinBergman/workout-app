import { useState, useMemo } from 'react';
import { exercises, searchExercises } from '../data/exercises';
import { Card, Input } from '../components/ui';
import { MuscleGroup, Equipment } from '../types';

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'
];

const equipmentTypes: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'
];

export function ExerciseLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | ''>('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | ''>('');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    let result = searchQuery ? searchExercises(searchQuery) : exercises;

    if (selectedMuscle) {
      result = result.filter((e) => e.muscleGroups.includes(selectedMuscle));
    }

    if (selectedEquipment) {
      result = result.filter((e) => e.equipment === selectedEquipment);
    }

    return result;
  }, [searchQuery, selectedMuscle, selectedEquipment]);

  const formatMuscleGroup = (muscle: string) => {
    return muscle.charAt(0).toUpperCase() + muscle.slice(1).replace(/-/g, ' ');
  };

  const formatEquipment = (equipment: string) => {
    return equipment.charAt(0).toUpperCase() + equipment.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        Exercise Library
      </h1>

      {/* Search */}
      <div className="mb-4">
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <select
          value={selectedMuscle}
          onChange={(e) => setSelectedMuscle(e.target.value as MuscleGroup | '')}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="">All Muscles</option>
          {muscleGroups.map((muscle) => (
            <option key={muscle} value={muscle}>
              {formatMuscleGroup(muscle)}
            </option>
          ))}
        </select>

        <select
          value={selectedEquipment}
          onChange={(e) => setSelectedEquipment(e.target.value as Equipment | '')}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        >
          <option value="">All Equipment</option>
          {equipmentTypes.map((equipment) => (
            <option key={equipment} value={equipment}>
              {formatEquipment(equipment)}
            </option>
          ))}
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
      </p>

      {/* Exercise List */}
      <div className="space-y-3">
        {filteredExercises.map((exercise) => (
          <Card
            key={exercise.id}
            className="cursor-pointer"
            onClick={() => setExpandedExercise(
              expandedExercise === exercise.id ? null : exercise.id
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {exercise.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {exercise.muscleGroups.map((muscle) => (
                    <span
                      key={muscle}
                      className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    >
                      {formatMuscleGroup(muscle)}
                    </span>
                  ))}
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    {formatEquipment(exercise.equipment)}
                  </span>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedExercise === exercise.id ? 'rotate-180' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Expanded content */}
            {expandedExercise === exercise.id && exercise.instructions && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {exercise.instructions}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredExercises.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No exercises found matching your criteria.
          </p>
        </Card>
      )}
    </div>
  );
}
