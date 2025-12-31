import { useState, useMemo, FC } from 'react';
import { exercises, searchExercises } from '../data/exercises';
import {
  Card,
  Input,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import { MuscleGroup, Equipment } from '../types';

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'
];

const equipmentTypes: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'
];

export const ExerciseLibrary: FC = () => {
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
      <h1 className="text-2xl font-bold text-foreground mb-4">
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
        <Select
          value={selectedMuscle || 'all'}
          onValueChange={(value) => setSelectedMuscle(value === 'all' ? '' : value as MuscleGroup)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Muscles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Muscles</SelectItem>
            {muscleGroups.map((muscle) => (
              <SelectItem key={muscle} value={muscle}>
                {formatMuscleGroup(muscle)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedEquipment || 'all'}
          onValueChange={(value) => setSelectedEquipment(value === 'all' ? '' : value as Equipment)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            {equipmentTypes.map((equipment) => (
              <SelectItem key={equipment} value={equipment}>
                {formatEquipment(equipment)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
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
                <h3 className="font-medium text-foreground">
                  {exercise.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {exercise.muscleGroups.map((muscle) => (
                    <Badge key={muscle} variant="default" className="text-xs">
                      {formatMuscleGroup(muscle)}
                    </Badge>
                  ))}
                  <Badge variant="secondary" className="text-xs">
                    {formatEquipment(exercise.equipment)}
                  </Badge>
                </div>
              </div>
              <svg
                className={`w-5 h-5 text-muted-foreground transition-transform ${
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
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
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
          <p className="text-muted-foreground">
            No exercises found matching your criteria.
          </p>
        </Card>
      )}
    </div>
  );
}
