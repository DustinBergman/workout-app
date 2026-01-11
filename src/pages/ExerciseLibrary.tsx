import { FC } from 'react';
import {
  Card,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import { ExerciseCard } from '../components/exercises';
import {
  useExerciseLibrary,
  formatMuscleGroup,
  formatEquipment,
} from '../hooks/useExerciseLibrary';
import { MuscleGroup, Equipment } from '../types';

export const ExerciseLibrary: FC = () => {
  const {
    searchQuery,
    selectedType,
    selectedMuscle,
    selectedEquipment,
    expandedExercise,
    setSearchQuery,
    setSelectedType,
    setSelectedMuscle,
    setSelectedEquipment,
    filteredExercises,
    isCustomExercise,
    toggleExercise,
    MUSCLE_GROUPS,
    EQUIPMENT_TYPES,
  } = useExerciseLibrary();

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
            onValueChange={(value) =>
              setSelectedMuscle(value === 'all' ? '' : (value as MuscleGroup))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Muscles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Muscles</SelectItem>
              {MUSCLE_GROUPS.map((muscle) => (
                <SelectItem key={muscle} value={muscle}>
                  {formatMuscleGroup(muscle)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedEquipment || 'all'}
            onValueChange={(value) =>
              setSelectedEquipment(value === 'all' ? '' : (value as Equipment))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              {EQUIPMENT_TYPES.map((equipment) => (
                <SelectItem key={equipment} value={equipment}>
                  {formatEquipment(equipment)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredExercises.length} exercise
          {filteredExercises.length !== 1 ? 's' : ''}
        </p>

        {/* Exercise List */}
        <div className="space-y-3">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isCustom={isCustomExercise(exercise.id)}
              isExpanded={expandedExercise === exercise.id}
              onToggle={() => toggleExercise(exercise.id)}
            />
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
};
