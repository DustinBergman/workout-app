import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  WORKOUT_TYPE_MUSCLES,
  generateWorkoutPlan,
  createTemplateFromPlan,
  GeneratePlanInput,
  GeneratedPlan,
} from './planGenerator';
import * as client from './client';

// Mock the client module
vi.mock('./client', () => ({
  callOpenAI: vi.fn(),
  parseJSONResponse: vi.fn(),
}));

describe('planGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('WORKOUT_TYPE_MUSCLES', () => {
    it('should define muscles for full-body workout', () => {
      expect(WORKOUT_TYPE_MUSCLES['full-body']).toContain('chest');
      expect(WORKOUT_TYPE_MUSCLES['full-body']).toContain('back');
      expect(WORKOUT_TYPE_MUSCLES['full-body']).toContain('quadriceps');
      expect(WORKOUT_TYPE_MUSCLES['full-body']).toContain('core');
    });

    it('should define muscles for push workout', () => {
      expect(WORKOUT_TYPE_MUSCLES['push']).toContain('chest');
      expect(WORKOUT_TYPE_MUSCLES['push']).toContain('shoulders');
      expect(WORKOUT_TYPE_MUSCLES['push']).toContain('triceps');
      expect(WORKOUT_TYPE_MUSCLES['push']).not.toContain('back');
    });

    it('should define muscles for pull workout', () => {
      expect(WORKOUT_TYPE_MUSCLES['pull']).toContain('back');
      expect(WORKOUT_TYPE_MUSCLES['pull']).toContain('biceps');
      expect(WORKOUT_TYPE_MUSCLES['pull']).toContain('lats');
      expect(WORKOUT_TYPE_MUSCLES['pull']).not.toContain('chest');
    });

    it('should define muscles for legs workout', () => {
      expect(WORKOUT_TYPE_MUSCLES['legs']).toContain('quadriceps');
      expect(WORKOUT_TYPE_MUSCLES['legs']).toContain('hamstrings');
      expect(WORKOUT_TYPE_MUSCLES['legs']).toContain('glutes');
      expect(WORKOUT_TYPE_MUSCLES['legs']).toContain('calves');
    });

    it('should define muscles for upper workout', () => {
      expect(WORKOUT_TYPE_MUSCLES['upper']).toContain('chest');
      expect(WORKOUT_TYPE_MUSCLES['upper']).toContain('back');
      expect(WORKOUT_TYPE_MUSCLES['upper']).toContain('shoulders');
      expect(WORKOUT_TYPE_MUSCLES['upper']).not.toContain('quadriceps');
    });

    it('should define muscles for lower workout', () => {
      expect(WORKOUT_TYPE_MUSCLES['lower']).toContain('quadriceps');
      expect(WORKOUT_TYPE_MUSCLES['lower']).toContain('hamstrings');
      expect(WORKOUT_TYPE_MUSCLES['lower']).not.toContain('chest');
    });
  });

  describe('createTemplateFromPlan', () => {
    const mockPlan: GeneratedPlan = {
      name: 'Test Workout',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
        { exerciseId: 'squat', targetSets: 4, targetReps: 8, restSeconds: 120 },
      ],
    };

    it('should create a template with correct structure', () => {
      const template = createTemplateFromPlan(mockPlan);

      expect(template).toHaveProperty('id');
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('exercises');
      expect(template).toHaveProperty('createdAt');
      expect(template).toHaveProperty('updatedAt');
    });

    it('should use plan name by default', () => {
      const template = createTemplateFromPlan(mockPlan);
      expect(template.name).toBe('Test Workout');
    });

    it('should use custom name when provided', () => {
      const template = createTemplateFromPlan(mockPlan, 'Custom Name');
      expect(template.name).toBe('Custom Name');
    });

    it('should convert exercises to template format', () => {
      const template = createTemplateFromPlan(mockPlan);

      expect(template.exercises).toHaveLength(2);
      expect(template.exercises[0]).toEqual({
        type: 'strength',
        exerciseId: 'bench-press',
        targetSets: 3,
        targetReps: 10,
        restSeconds: 90,
      });
    });

    it('should generate unique IDs', () => {
      const template1 = createTemplateFromPlan(mockPlan);
      const template2 = createTemplateFromPlan(mockPlan);
      expect(template1.id).not.toBe(template2.id);
    });

    it('should set timestamps', () => {
      const before = new Date().toISOString();
      const template = createTemplateFromPlan(mockPlan);
      const after = new Date().toISOString();

      expect(template.createdAt >= before).toBe(true);
      expect(template.createdAt <= after).toBe(true);
      expect(template.createdAt).toBe(template.updatedAt);
    });
  });

  describe('generateWorkoutPlan', () => {
    const mockInput: GeneratePlanInput = {
      workoutType: 'push',
      numberOfExercises: 4,
      availableEquipment: ['barbell', 'dumbbell'],
      additionalComments: '',
    };

    const mockApiResponse: GeneratedPlan = {
      name: 'Push Day',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 4, targetReps: 8, restSeconds: 90 },
        { exerciseId: 'dumbbell-bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      ],
    };

    it('should call OpenAI with correct parameters', async () => {
      vi.mocked(client.callOpenAI).mockResolvedValue(JSON.stringify(mockApiResponse));
      vi.mocked(client.parseJSONResponse).mockReturnValue(mockApiResponse);

      await generateWorkoutPlan('test-api-key', mockInput);

      expect(client.callOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: 'test-api-key',
          maxTokens: 1500,
          temperature: 0.3,
        })
      );
    });

    it('should return generated plan with valid exercises', async () => {
      vi.mocked(client.callOpenAI).mockResolvedValue(JSON.stringify(mockApiResponse));
      vi.mocked(client.parseJSONResponse).mockReturnValue(mockApiResponse);

      const result = await generateWorkoutPlan('test-api-key', mockInput);

      expect(result.name).toBe('Push Day');
      expect(result.exercises.length).toBeGreaterThan(0);
    });

    it('should filter out invalid exercise IDs', async () => {
      const responseWithInvalidId: GeneratedPlan = {
        name: 'Test',
        exercises: [
          { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
          { exerciseId: 'invalid-exercise', targetSets: 3, targetReps: 10, restSeconds: 90 },
        ],
      };

      vi.mocked(client.callOpenAI).mockResolvedValue(JSON.stringify(responseWithInvalidId));
      vi.mocked(client.parseJSONResponse).mockReturnValue(responseWithInvalidId);

      const result = await generateWorkoutPlan('test-api-key', mockInput);

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].exerciseId).toBe('bench-press');
    });

    it('should throw error when no exercises match equipment and muscles', async () => {
      const inputWithNoMatches: GeneratePlanInput = {
        workoutType: 'legs',
        numberOfExercises: 4,
        availableEquipment: ['kettlebell'], // Limited equipment that may not have leg exercises
        additionalComments: '',
      };

      // This should throw because there are no kettlebell leg exercises
      await expect(generateWorkoutPlan('test-api-key', inputWithNoMatches))
        .rejects.toThrow('No exercises match your selected equipment and muscle groups');
    });

    it('should throw error when AI returns no valid exercises', async () => {
      const invalidResponse: GeneratedPlan = {
        name: 'Test',
        exercises: [
          { exerciseId: 'nonexistent-1', targetSets: 3, targetReps: 10, restSeconds: 90 },
        ],
      };

      vi.mocked(client.callOpenAI).mockResolvedValue(JSON.stringify(invalidResponse));
      vi.mocked(client.parseJSONResponse).mockReturnValue(invalidResponse);

      await expect(generateWorkoutPlan('test-api-key', mockInput))
        .rejects.toThrow('AI failed to generate a valid workout plan');
    });

    it('should use custom muscle groups when workout type is custom', async () => {
      const customInput: GeneratePlanInput = {
        workoutType: 'custom',
        customMuscleGroups: ['biceps', 'triceps'],
        numberOfExercises: 4,
        availableEquipment: ['dumbbell', 'cable'],
        additionalComments: '',
      };

      const customResponse: GeneratedPlan = {
        name: 'Arm Day',
        exercises: [
          { exerciseId: 'dumbbell-curl', targetSets: 3, targetReps: 12, restSeconds: 60 },
        ],
      };

      vi.mocked(client.callOpenAI).mockResolvedValue(JSON.stringify(customResponse));
      vi.mocked(client.parseJSONResponse).mockReturnValue(customResponse);

      const result = await generateWorkoutPlan('test-api-key', customInput);

      expect(result.name).toBe('Arm Day');
    });

    it('should use fallback name when parsed name is empty', async () => {
      const responseNoName: GeneratedPlan = {
        name: '',
        exercises: [
          { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
        ],
      };

      vi.mocked(client.callOpenAI).mockResolvedValue(JSON.stringify(responseNoName));
      vi.mocked(client.parseJSONResponse).mockReturnValue(responseNoName);

      const result = await generateWorkoutPlan('test-api-key', mockInput);

      expect(result.name).toBe('AI Generated Workout');
    });
  });
});
