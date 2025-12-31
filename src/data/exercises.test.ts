import { describe, it, expect } from 'vitest';
import {
  exercises,
  getExerciseById,
  getExercisesByMuscleGroup,
  getExercisesByEquipment,
  searchExercises,
  getAllExercises,
} from './exercises';
import { Exercise } from '../types';

describe('Exercise Data', () => {
  describe('exercises array', () => {
    it('should contain exercises', () => {
      expect(exercises.length).toBeGreaterThan(0);
    });

    it('should have valid structure for all exercises', () => {
      exercises.forEach((exercise) => {
        expect(exercise.id).toBeDefined();
        expect(exercise.name).toBeDefined();
        expect(exercise.muscleGroups.length).toBeGreaterThan(0);
        expect(exercise.equipment).toBeDefined();
      });
    });

    it('should have unique IDs', () => {
      const ids = exercises.map((e) => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have non-empty names', () => {
      exercises.forEach((exercise) => {
        expect(exercise.name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('getExerciseById', () => {
    it('should find existing exercise by ID', () => {
      const exercise = getExerciseById('bench-press');
      expect(exercise).toBeDefined();
      expect(exercise?.name).toBe('Barbell Bench Press');
    });

    it('should return undefined for non-existent ID', () => {
      expect(getExerciseById('non-existent')).toBeUndefined();
    });

    it('should return undefined for empty string ID', () => {
      expect(getExerciseById('')).toBeUndefined();
    });

    it('should prioritize custom exercises over built-in', () => {
      const customExercises: Exercise[] = [
        {
          id: 'bench-press',
          name: 'Custom Bench Press',
          muscleGroups: ['chest'],
          equipment: 'barbell',
        },
      ];

      const exercise = getExerciseById('bench-press', customExercises);
      expect(exercise?.name).toBe('Custom Bench Press');
    });

    it('should find custom exercise when not in built-in list', () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-1',
          name: 'My Custom Exercise',
          muscleGroups: ['chest'],
          equipment: 'dumbbell',
        },
      ];

      const exercise = getExerciseById('custom-1', customExercises);
      expect(exercise?.name).toBe('My Custom Exercise');
    });

    it('should fall back to built-in when custom not found', () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-1',
          name: 'Custom',
          muscleGroups: ['chest'],
          equipment: 'dumbbell',
        },
      ];

      const exercise = getExerciseById('deadlift', customExercises);
      expect(exercise?.name).toBe('Conventional Deadlift');
    });

    it('should work with empty custom exercises array', () => {
      const exercise = getExerciseById('bench-press', []);
      expect(exercise?.name).toBe('Barbell Bench Press');
    });
  });

  describe('getExercisesByMuscleGroup', () => {
    it('should return chest exercises', () => {
      const chestExercises = getExercisesByMuscleGroup('chest');
      expect(chestExercises.length).toBeGreaterThan(0);
      chestExercises.forEach((e) => {
        expect(e.muscleGroups).toContain('chest');
      });
    });

    it('should return back exercises', () => {
      const backExercises = getExercisesByMuscleGroup('back');
      expect(backExercises.length).toBeGreaterThan(0);
      backExercises.forEach((e) => {
        expect(e.muscleGroups).toContain('back');
      });
    });

    it('should return empty array for invalid muscle group', () => {
      const result = getExercisesByMuscleGroup('invalid');
      expect(result).toEqual([]);
    });

    it('should include exercises with secondary muscle groups', () => {
      const tricepsExercises = getExercisesByMuscleGroup('triceps');
      // Bench press should be included as triceps is secondary
      const hasBenchPress = tricepsExercises.some((e) => e.id === 'bench-press');
      expect(hasBenchPress).toBe(true);
    });

    it('should return empty array for empty string', () => {
      expect(getExercisesByMuscleGroup('')).toEqual([]);
    });
  });

  describe('getExercisesByEquipment', () => {
    it('should return barbell exercises', () => {
      const barbellExercises = getExercisesByEquipment('barbell');
      expect(barbellExercises.length).toBeGreaterThan(0);
      barbellExercises.forEach((e) => {
        expect(e.equipment).toBe('barbell');
      });
    });

    it('should return dumbbell exercises', () => {
      const dumbbellExercises = getExercisesByEquipment('dumbbell');
      expect(dumbbellExercises.length).toBeGreaterThan(0);
      dumbbellExercises.forEach((e) => {
        expect(e.equipment).toBe('dumbbell');
      });
    });

    it('should return bodyweight exercises', () => {
      const bodyweightExercises = getExercisesByEquipment('bodyweight');
      expect(bodyweightExercises.length).toBeGreaterThan(0);
      bodyweightExercises.forEach((e) => {
        expect(e.equipment).toBe('bodyweight');
      });
    });

    it('should return empty array for non-existent equipment', () => {
      expect(getExercisesByEquipment('invalid')).toEqual([]);
    });

    it('should return empty array for empty string', () => {
      expect(getExercisesByEquipment('')).toEqual([]);
    });
  });

  describe('searchExercises', () => {
    it('should search by exercise name', () => {
      const results = searchExercises('bench');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((e) => e.name.toLowerCase().includes('bench'))).toBe(true);
    });

    it('should search by muscle group', () => {
      const results = searchExercises('chest');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should search by equipment', () => {
      const results = searchExercises('dumbbell');
      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every(
          (e) =>
            e.equipment === 'dumbbell' || e.name.toLowerCase().includes('dumbbell')
        )
      ).toBe(true);
    });

    it('should be case insensitive', () => {
      const lowerResults = searchExercises('bench');
      const upperResults = searchExercises('BENCH');
      const mixedResults = searchExercises('BeNcH');

      expect(lowerResults.length).toBe(upperResults.length);
      expect(lowerResults.length).toBe(mixedResults.length);
    });

    it('should include custom exercises in search', () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-1',
          name: 'Custom Chest Press',
          muscleGroups: ['chest'],
          equipment: 'machine',
        },
      ];

      const results = searchExercises('custom', customExercises);
      expect(results.some((e) => e.id === 'custom-1')).toBe(true);
    });

    it('should search custom exercises by muscle group', () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-1',
          name: 'My Special Move',
          muscleGroups: ['glutes'],
          equipment: 'bodyweight',
        },
      ];

      const results = searchExercises('glutes', customExercises);
      expect(results.some((e) => e.id === 'custom-1')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      expect(searchExercises('xyznonexistent')).toEqual([]);
    });

    it('should return all exercises for empty query', () => {
      // Empty string matches everything since includes('') is always true
      const results = searchExercises('');
      expect(results.length).toBe(exercises.length);
    });

    it('should find partial matches', () => {
      const results = searchExercises('press');
      expect(results.length).toBeGreaterThan(0);
      // Should find bench press, overhead press, etc.
      expect(results.some((e) => e.name.toLowerCase().includes('press'))).toBe(true);
    });
  });

  describe('getAllExercises', () => {
    it('should return all built-in exercises', () => {
      const all = getAllExercises();
      expect(all.length).toBe(exercises.length);
    });

    it('should combine built-in and custom exercises', () => {
      const customExercises: Exercise[] = [
        {
          id: 'custom-1',
          name: 'Custom Exercise',
          muscleGroups: ['chest'],
          equipment: 'other',
        },
      ];

      const all = getAllExercises(customExercises);
      expect(all.length).toBe(exercises.length + 1);
    });

    it('should preserve order with built-in first, custom at end', () => {
      const customExercises: Exercise[] = [
        { id: 'custom-1', name: 'Custom', muscleGroups: ['chest'], equipment: 'other' },
      ];

      const all = getAllExercises(customExercises);
      // First exercise should be from built-in list
      expect(all[0].id).toBe(exercises[0].id);
      // Last exercise should be custom
      expect(all[all.length - 1].id).toBe('custom-1');
    });

    it('should work with empty custom exercises array', () => {
      const all = getAllExercises([]);
      expect(all.length).toBe(exercises.length);
    });

    it('should handle multiple custom exercises', () => {
      const customExercises: Exercise[] = [
        { id: 'custom-1', name: 'Custom 1', muscleGroups: ['chest'], equipment: 'other' },
        { id: 'custom-2', name: 'Custom 2', muscleGroups: ['back'], equipment: 'other' },
        { id: 'custom-3', name: 'Custom 3', muscleGroups: ['quadriceps'], equipment: 'other' },
      ];

      const all = getAllExercises(customExercises);
      expect(all.length).toBe(exercises.length + 3);
    });
  });
});
