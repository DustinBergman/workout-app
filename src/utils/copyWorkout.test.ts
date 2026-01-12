import { describe, it, expect, vi, beforeEach } from 'vitest';
import { convertFeedWorkoutToTemplate, isUUID } from './copyWorkout';
import { FeedWorkout, FeedSessionExercise } from '../services/supabase/feed';
import { StrengthExercise } from '../types';

// Mock crypto.randomUUID to return predictable values
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  randomUUID: () => `mocked-uuid-${++uuidCounter}`,
});

beforeEach(() => {
  uuidCounter = 0;
});

// Helper to create a FeedWorkout with minimal required fields
const createFeedWorkout = (overrides: Partial<FeedWorkout> = {}): FeedWorkout => ({
  id: 'workout-123',
  user_id: 'user-456',
  name: 'Test Workout',
  custom_title: null,
  mood: null,
  progressive_overload_week: null,
  workout_goal: null,
  personal_bests: null,
  streak_count: null,
  started_at: '2025-01-10T10:00:00Z',
  completed_at: '2025-01-10T11:00:00Z',
  user: {
    id: 'user-456',
    first_name: 'John',
    last_name: 'Doe',
    username: 'johndoe',
    avatar_url: null,
  },
  session_exercises: [],
  ...overrides,
});

// Helper to create a FeedSessionExercise
const createStrengthExercise = (overrides: Partial<FeedSessionExercise> = {}): FeedSessionExercise => ({
  id: 'ex-1',
  exercise_id: 'bench-press', // Built-in exercise ID
  custom_exercise_name: null,
  type: 'strength',
  sort_order: 0,
  target_sets: 3,
  target_reps: 10,
  rest_seconds: 90,
  completed_sets: [
    {
      id: 'set-1',
      type: 'strength',
      reps: 10,
      weight: 135,
      weight_unit: 'lbs',
      distance: null,
      distance_unit: null,
      duration_seconds: null,
      completed_at: '2025-01-10T10:05:00Z',
    },
  ],
  ...overrides,
});

const createCardioExercise = (overrides: Partial<FeedSessionExercise> = {}): FeedSessionExercise => ({
  id: 'ex-2',
  exercise_id: 'outdoor-run', // Built-in cardio exercise ID
  custom_exercise_name: null,
  type: 'cardio',
  sort_order: 0,
  target_sets: null,
  target_reps: null,
  rest_seconds: 60,
  completed_sets: [
    {
      id: 'set-1',
      type: 'cardio',
      reps: null,
      weight: null,
      weight_unit: null,
      distance: 3.5,
      distance_unit: 'mi',
      duration_seconds: 1800,
      completed_at: '2025-01-10T10:30:00Z',
    },
  ],
  ...overrides,
});

describe('isUUID', () => {
  it('returns true for valid lowercase UUIDs', () => {
    expect(isUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
    expect(isUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    expect(isUUID('ffffffff-ffff-ffff-ffff-ffffffffffff')).toBe(true);
  });

  it('returns true for valid uppercase UUIDs', () => {
    expect(isUUID('A1B2C3D4-E5F6-7890-ABCD-EF1234567890')).toBe(true);
    expect(isUUID('FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF')).toBe(true);
  });

  it('returns true for mixed case UUIDs', () => {
    expect(isUUID('A1b2C3d4-E5f6-7890-AbCd-Ef1234567890')).toBe(true);
  });

  it('returns false for built-in exercise IDs (kebab-case)', () => {
    expect(isUUID('bench-press')).toBe(false);
    expect(isUUID('running')).toBe(false);
    expect(isUUID('barbell-squat')).toBe(false);
  });

  it('returns false for invalid UUID formats', () => {
    expect(isUUID('')).toBe(false);
    expect(isUUID('not-a-uuid')).toBe(false);
    expect(isUUID('a1b2c3d4-e5f6-7890-abcd')).toBe(false); // Too short
    expect(isUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890-extra')).toBe(false); // Too long
    expect(isUUID('a1b2c3d4e5f67890abcdef1234567890')).toBe(false); // No dashes
    expect(isUUID('g1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(false); // Invalid character 'g'
  });
});

describe('convertFeedWorkoutToTemplate', () => {
  describe('basic conversion', () => {
    it('creates a template with correct metadata', () => {
      const workout = createFeedWorkout({
        session_exercises: [createStrengthExercise()],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'My New Template');

      expect(result.template.name).toBe('My New Template');
      expect(result.template.id).toBe('mocked-uuid-1');
      expect(result.template.createdAt).toBeDefined();
      expect(result.template.updatedAt).toBeDefined();
    });

    it('includes copiedFrom attribution', () => {
      const workout = createFeedWorkout({
        session_exercises: [createStrengthExercise()],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Copy');

      expect(result.template.copiedFrom).toEqual({
        userId: 'user-456',
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('handles empty session_exercises array', () => {
      const workout = createFeedWorkout({ session_exercises: [] });

      const result = convertFeedWorkoutToTemplate(workout, 'Empty');

      expect(result.template.exercises).toEqual([]);
      expect(result.newCustomExercises).toEqual([]);
    });
  });

  describe('template type determination', () => {
    it('sets templateType to "strength" for strength-only workouts', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({ sort_order: 0 }),
          createStrengthExercise({ id: 'ex-2', exercise_id: 'squat', sort_order: 1 }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Strength');

      expect(result.template.templateType).toBe('strength');
    });

    it('sets templateType to "cardio" for cardio-only workouts', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({ sort_order: 0 }),
          createCardioExercise({ id: 'ex-2', exercise_id: 'cycling', sort_order: 1 }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Cardio');

      expect(result.template.templateType).toBe('cardio');
    });

    it('sets templateType to "strength" for mixed workouts', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({ sort_order: 0 }),
          createCardioExercise({ sort_order: 1 }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Mixed');

      expect(result.template.templateType).toBe('strength');
    });
  });

  describe('strength exercise conversion', () => {
    it('converts strength exercises with correct properties', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            exercise_id: 'bench-press',
            target_sets: 4,
            target_reps: 8,
            rest_seconds: 120,
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises).toHaveLength(1);
      expect(result.template.exercises[0]).toEqual({
        type: 'strength',
        exerciseId: 'bench-press',
        targetSets: 4,
        targetReps: 8,
        restSeconds: 120,
      });
    });

    it('uses default values when target_sets/reps are null', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            target_sets: null,
            target_reps: null,
            rest_seconds: null,
            completed_sets: [
              { id: 's1', type: 'strength', reps: 10, weight: 100, weight_unit: 'lbs', distance: null, distance_unit: null, duration_seconds: null, completed_at: '' },
              { id: 's2', type: 'strength', reps: 10, weight: 100, weight_unit: 'lbs', distance: null, distance_unit: null, duration_seconds: null, completed_at: '' },
            ],
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      // target_sets should fall back to completed_sets.length (2), target_reps to 10, restSeconds to 90
      expect(result.template.exercises[0]).toMatchObject({
        type: 'strength',
        targetSets: 2,
        targetReps: 10,
        restSeconds: 90,
      });
    });

    it('uses default of 3 sets when both target_sets and completed_sets are empty', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            target_sets: null,
            completed_sets: [],
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises[0]).toMatchObject({
        targetSets: 3,
      });
    });
  });

  describe('cardio exercise conversion', () => {
    it('converts distance cardio exercises (outdoor-run)', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: 'outdoor-run',
            rest_seconds: 45,
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises[0]).toEqual({
        type: 'cardio',
        exerciseId: 'outdoor-run',
        cardioCategory: 'distance',
        targetDurationMinutes: 30,
        restSeconds: 45,
      });
    });

    it('converts interval cardio exercises (hiit)', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: 'hiit',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises[0]).toEqual({
        type: 'cardio',
        exerciseId: 'hiit',
        cardioCategory: 'interval',
        rounds: 4,
        workSeconds: 30,
        restBetweenRoundsSeconds: 15,
        restSeconds: 60,
      });
    });

    it('converts laps cardio exercises (lap-swimming)', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: 'lap-swimming',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises[0]).toEqual({
        type: 'cardio',
        exerciseId: 'lap-swimming',
        cardioCategory: 'laps',
        targetLaps: 20,
        restSeconds: 60,
      });
    });

    it('converts duration cardio exercises (rowing-machine)', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: 'rowing-machine',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises[0]).toEqual({
        type: 'cardio',
        exerciseId: 'rowing-machine',
        cardioCategory: 'duration',
        targetDurationMinutes: 20,
        targetIntensity: 'moderate',
        restSeconds: 60,
      });
    });

    it('uses "other" category for unknown cardio exercises', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: 'unknown-cardio-exercise',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises[0]).toEqual({
        type: 'cardio',
        exerciseId: 'unknown-cardio-exercise',
        cardioCategory: 'other',
        targetDurationMinutes: 20,
        restSeconds: 60,
      });
    });
  });

  describe('exercise ordering', () => {
    it('sorts exercises by sort_order', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({ id: 'ex-3', exercise_id: 'deadlift', sort_order: 2 }),
          createStrengthExercise({ id: 'ex-1', exercise_id: 'squat', sort_order: 0 }),
          createStrengthExercise({ id: 'ex-2', exercise_id: 'bench-press', sort_order: 1 }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.template.exercises.map(e => e.exerciseId)).toEqual([
        'squat',
        'bench-press',
        'deadlift',
      ]);
    });
  });

  describe('custom exercise handling', () => {
    const customExerciseUUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

    it('creates new custom exercise when copying unknown custom exercise', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            exercise_id: customExerciseUUID,
            custom_exercise_name: 'My Custom Lift',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      // Should create a new custom exercise
      expect(result.newCustomExercises).toHaveLength(1);
      expect(result.newCustomExercises[0]).toMatchObject({
        id: 'mocked-uuid-1',
        name: 'My Custom Lift',
        type: 'strength',
        muscleGroups: ['chest'], // Default
        equipment: 'other',
      });

      // Template should use the new ID
      expect(result.template.exercises[0].exerciseId).toBe('mocked-uuid-1');
    });

    it('creates new custom cardio exercise with correct type', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: customExerciseUUID,
            custom_exercise_name: 'My Custom Cardio',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.newCustomExercises).toHaveLength(1);
      expect(result.newCustomExercises[0]).toMatchObject({
        id: 'mocked-uuid-1',
        name: 'My Custom Cardio',
        type: 'cardio',
        cardioType: 'other',
      });
    });

    it('does not create custom exercise when user already has it', () => {
      const existingCustomExercise: StrengthExercise = {
        id: customExerciseUUID,
        name: 'Already Have This',
        type: 'strength',
        muscleGroups: ['back'],
        equipment: 'dumbbell',
      };

      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            exercise_id: customExerciseUUID,
            custom_exercise_name: 'Already Have This',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test', [existingCustomExercise]);

      // Should NOT create a new custom exercise
      expect(result.newCustomExercises).toHaveLength(0);

      // Template should use the original ID
      expect(result.template.exercises[0].exerciseId).toBe(customExerciseUUID);
    });

    it('throws error when custom_exercise_name is missing', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            exercise_id: customExerciseUUID,
            custom_exercise_name: null, // Missing name - should throw error
          }),
        ],
      });

      expect(() => convertFeedWorkoutToTemplate(workout, 'Test')).toThrow(
        'Unable to copy workout: custom exercise name not found'
      );
    });

    it('uses original ID for built-in exercises (non-UUID)', () => {
      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            exercise_id: 'bench-press', // Built-in, not a UUID
            custom_exercise_name: null,
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.newCustomExercises).toHaveLength(0);
      expect(result.template.exercises[0].exerciseId).toBe('bench-press');
    });

    it('handles multiple custom exercises correctly', () => {
      const uuid1 = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
      const uuid2 = 'ffffffff-1111-2222-3333-444444444444';

      const workout = createFeedWorkout({
        session_exercises: [
          createStrengthExercise({
            id: 'ex-1',
            exercise_id: uuid1,
            custom_exercise_name: 'Custom Exercise 1',
            sort_order: 0,
          }),
          createStrengthExercise({
            id: 'ex-2',
            exercise_id: 'squat', // Built-in
            sort_order: 1,
          }),
          createStrengthExercise({
            id: 'ex-3',
            exercise_id: uuid2,
            custom_exercise_name: 'Custom Exercise 2',
            sort_order: 2,
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      expect(result.newCustomExercises).toHaveLength(2);
      expect(result.newCustomExercises[0].name).toBe('Custom Exercise 1');
      expect(result.newCustomExercises[1].name).toBe('Custom Exercise 2');

      // First and third should have new UUIDs, second should keep 'squat'
      expect(result.template.exercises[0].exerciseId).toBe('mocked-uuid-1');
      expect(result.template.exercises[1].exerciseId).toBe('squat');
      expect(result.template.exercises[2].exerciseId).toBe('mocked-uuid-2');
    });

    it('correctly maps custom cardio exercise to template with "other" category', () => {
      const customCardioUUID = 'cccccccc-dddd-eeee-ffff-000000000000';

      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: customCardioUUID,
            custom_exercise_name: 'My Cardio Machine',
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Test');

      // Custom cardio exercises should use 'other' category
      expect(result.template.exercises[0]).toMatchObject({
        type: 'cardio',
        cardioCategory: 'other',
        targetDurationMinutes: 20,
      });
    });

    it('throws error for custom cardio exercise when custom_exercise_name is missing', () => {
      const customCardioUUID = 'cccccccc-dddd-eeee-ffff-111111111111';

      const workout = createFeedWorkout({
        session_exercises: [
          createCardioExercise({
            exercise_id: customCardioUUID,
            custom_exercise_name: null, // Missing name - should throw error
          }),
        ],
      });

      expect(() => convertFeedWorkoutToTemplate(workout, 'Test')).toThrow(
        'Unable to copy workout: custom exercise name not found'
      );
    });
  });

  describe('mixed scenarios', () => {
    it('handles a realistic workout with multiple exercise types', () => {
      const customUUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      const workout = createFeedWorkout({
        user_id: 'friend-123', // Must match user.id for copiedFrom
        user: {
          id: 'friend-123',
          first_name: 'Jane',
          last_name: 'Smith',
          username: 'janesmith',
          avatar_url: 'https://example.com/avatar.jpg',
        },
        session_exercises: [
          createStrengthExercise({
            id: 'ex-1',
            exercise_id: 'squat',
            target_sets: 5,
            target_reps: 5,
            rest_seconds: 180,
            sort_order: 0,
          }),
          createStrengthExercise({
            id: 'ex-2',
            exercise_id: customUUID,
            custom_exercise_name: 'Banded Hip Thrusts',
            target_sets: 3,
            target_reps: 12,
            rest_seconds: 60,
            sort_order: 1,
          }),
          createCardioExercise({
            id: 'ex-3',
            exercise_id: 'outdoor-run', // Use correct exercise ID
            rest_seconds: 30,
            sort_order: 2,
          }),
        ],
      });

      const result = convertFeedWorkoutToTemplate(workout, 'Jane\'s Leg Day');

      // Check template metadata
      expect(result.template.name).toBe('Jane\'s Leg Day');
      expect(result.template.templateType).toBe('strength'); // Mixed defaults to strength
      expect(result.template.copiedFrom).toEqual({
        userId: 'friend-123',
        username: 'janesmith',
        firstName: 'Jane',
        lastName: 'Smith',
      });

      // Check exercises
      expect(result.template.exercises).toHaveLength(3);

      // First: built-in squat
      expect(result.template.exercises[0]).toEqual({
        type: 'strength',
        exerciseId: 'squat',
        targetSets: 5,
        targetReps: 5,
        restSeconds: 180,
      });

      // Second: custom exercise (gets new UUID)
      expect(result.template.exercises[1]).toEqual({
        type: 'strength',
        exerciseId: 'mocked-uuid-1', // New mapped ID
        targetSets: 3,
        targetReps: 12,
        restSeconds: 60,
      });

      // Third: built-in outdoor-run (cardio)
      expect(result.template.exercises[2]).toEqual({
        type: 'cardio',
        exerciseId: 'outdoor-run',
        cardioCategory: 'distance',
        targetDurationMinutes: 30,
        restSeconds: 30,
      });

      // Check new custom exercise created
      expect(result.newCustomExercises).toHaveLength(1);
      expect(result.newCustomExercises[0]).toEqual({
        id: 'mocked-uuid-1',
        name: 'Banded Hip Thrusts',
        type: 'strength',
        muscleGroups: ['chest'],
        equipment: 'other',
      });
    });
  });
});
