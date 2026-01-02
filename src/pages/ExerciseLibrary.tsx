import { useState, useMemo, FC } from 'react';
import { exercises, searchExercises } from '../data/exercises';
import { useAppStore } from '../store/useAppStore';
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
import { MuscleGroup, Equipment, Exercise, ExerciseType } from '../types';

const muscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'traps', 'lats'
];

const equipmentTypes: Equipment[] = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band', 'other'
];

// Unique colors for each muscle group
const muscleGroupColors: Record<MuscleGroup, string> = {
  chest: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  back: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  shoulders: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  biceps: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  triceps: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
  forearms: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  core: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  quadriceps: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  hamstrings: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  glutes: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
  calves: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300',
  traps: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
  lats: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300',
};

export const ExerciseLibrary: FC = () => {
  const customExercises = useAppStore((state) => state.customExercises);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ExerciseType | ''>('');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | ''>('');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | ''>('');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Combine built-in and custom exercises
  const allExercises = useMemo(() => [...exercises, ...customExercises], [customExercises]);

  // Check if an exercise is custom
  const isCustomExercise = (exerciseId: string) => {
    return customExercises.some((e) => e.id === exerciseId);
  };

  const filteredExercises = useMemo(() => {
    let result: Exercise[] = searchQuery ? searchExercises(searchQuery, customExercises) : allExercises;

    // Filter by exercise type (strength/cardio)
    if (selectedType) {
      result = result.filter((e) => e.type === selectedType);
    }

    if (selectedMuscle) {
      result = result.filter((e) => e.type === 'strength' && e.muscleGroups.includes(selectedMuscle));
    }

    if (selectedEquipment) {
      result = result.filter((e) => e.type === 'strength' && e.equipment === selectedEquipment);
    }

    return result;
  }, [searchQuery, selectedType, selectedMuscle, selectedEquipment]);

  const formatMuscleGroup = (muscle: string) => {
    return muscle.charAt(0).toUpperCase() + muscle.slice(1).replace(/-/g, ' ');
  };

  const formatEquipment = (equipment: string) => {
    return equipment.charAt(0).toUpperCase() + equipment.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      </div>

      <div className="relative z-10 p-4 pb-20">
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

      {/* Exercise Type Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 mb-4">
        <button
          onClick={() => setSelectedType('')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectedType === ''
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSelectedType('strength')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectedType === 'strength'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Strength
        </button>
        <button
          onClick={() => setSelectedType('cardio')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            selectedType === 'cardio'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Cardio
        </button>
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
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">
                    {exercise.name}
                  </h3>
                  {isCustomExercise(exercise.id) && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-0">
                      Custom
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {exercise.type === 'cardio' ? (
                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-0">
                      {exercise.cardioType}
                    </Badge>
                  ) : (
                    <>
                      {exercise.muscleGroups.map((muscle: MuscleGroup) => (
                        <Badge
                          key={muscle}
                          variant="secondary"
                          className={`text-xs border-0 ${muscleGroupColors[muscle]}`}
                        >
                          {formatMuscleGroup(muscle)}
                        </Badge>
                      ))}
                      <Badge variant="secondary" className="text-xs">
                        {formatEquipment(exercise.equipment)}
                      </Badge>
                    </>
                  )}
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
            {expandedExercise === exercise.id && (
              <div className="mt-3 pt-3 border-t border-border">
                {exercise.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={exercise.imageUrl}
                      alt={exercise.name}
                      className="w-full max-w-xs mx-auto rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}
                {exercise.instructions && (
                  <p className="text-sm text-muted-foreground">
                    {exercise.instructions}
                  </p>
                )}
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
    </div>
  );
}
