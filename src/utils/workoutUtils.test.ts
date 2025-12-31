import { describe, it, expect } from 'vitest';
import {
  convertWeight,
  hasSessionDeviatedFromTemplate,
  extractExerciseHistory,
  formatDuration,
} from './workoutUtils';
import { WorkoutSession, WorkoutTemplate } from '../types';

// Helper to create mock sessions
const createMockSession = (overrides: Partial<WorkoutSession> = {}): WorkoutSession => ({
  id: 'session-1',
  name: 'Test Workout',
  startedAt: new Date().toISOString(),
  exercises: [],
  ...overrides,
});

// Helper to create mock templates
const createMockTemplate = (overrides: Partial<WorkoutTemplate> = {}): WorkoutTemplate => ({
  id: 'template-1',
  name: 'Test Template',
  exercises: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('convertWeight', () => {
  describe('same unit conversion', () => {
    it('should return same value when converting lbs to lbs', () => {
      expect(convertWeight(100, 'lbs', 'lbs')).toBe(100);
    });

    it('should return same value when converting kg to kg', () => {
      expect(convertWeight(50, 'kg', 'kg')).toBe(50);
    });
  });

  describe('lbs to kg conversion', () => {
    it('should convert 100 lbs to approximately 45.4 kg', () => {
      expect(convertWeight(100, 'lbs', 'kg')).toBe(45.4);
    });

    it('should convert 225 lbs to approximately 102.1 kg', () => {
      expect(convertWeight(225, 'lbs', 'kg')).toBe(102.1);
    });

    it('should convert 0 lbs to 0 kg', () => {
      expect(convertWeight(0, 'lbs', 'kg')).toBe(0);
    });

    it('should handle decimal weights', () => {
      expect(convertWeight(2.5, 'lbs', 'kg')).toBe(1.1);
    });
  });

  describe('kg to lbs conversion', () => {
    it('should convert 100 kg to approximately 220.5 lbs', () => {
      expect(convertWeight(100, 'kg', 'lbs')).toBe(220.5);
    });

    it('should convert 60 kg to approximately 132.3 lbs', () => {
      expect(convertWeight(60, 'kg', 'lbs')).toBe(132.3);
    });

    it('should convert 0 kg to 0 lbs', () => {
      expect(convertWeight(0, 'kg', 'lbs')).toBe(0);
    });

    it('should handle decimal weights', () => {
      expect(convertWeight(1.25, 'kg', 'lbs')).toBe(2.8);
    });
  });
});

describe('hasSessionDeviatedFromTemplate', () => {
  it('should return false when session has no templateId', () => {
    const session = createMockSession({ templateId: undefined });
    const templates: WorkoutTemplate[] = [];

    expect(hasSessionDeviatedFromTemplate(session, templates)).toBe(false);
  });

  it('should return false when template is not found', () => {
    const session = createMockSession({ templateId: 'non-existent' });
    const templates = [createMockTemplate({ id: 'template-1' })];

    expect(hasSessionDeviatedFromTemplate(session, templates)).toBe(false);
  });

  it('should return false when session matches template exactly', () => {
    const exercises = [
      { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      { exerciseId: 'squat', targetSets: 4, targetReps: 8, restSeconds: 120 },
    ];

    const session = createMockSession({
      templateId: 'template-1',
      exercises: exercises.map(e => ({ ...e, sets: [] })),
    });

    const template = createMockTemplate({
      id: 'template-1',
      exercises,
    });

    expect(hasSessionDeviatedFromTemplate(session, [template])).toBe(false);
  });

  it('should return true when exercise count differs', () => {
    const session = createMockSession({
      templateId: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90, sets: [] },
        { exerciseId: 'squat', targetSets: 4, targetReps: 8, restSeconds: 120, sets: [] },
        { exerciseId: 'deadlift', targetSets: 3, targetReps: 5, restSeconds: 180, sets: [] },
      ],
    });

    const template = createMockTemplate({
      id: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
        { exerciseId: 'squat', targetSets: 4, targetReps: 8, restSeconds: 120 },
      ],
    });

    expect(hasSessionDeviatedFromTemplate(session, [template])).toBe(true);
  });

  it('should return true when exerciseId differs', () => {
    const session = createMockSession({
      templateId: 'template-1',
      exercises: [
        { exerciseId: 'incline-bench', targetSets: 3, targetReps: 10, restSeconds: 90, sets: [] },
      ],
    });

    const template = createMockTemplate({
      id: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      ],
    });

    expect(hasSessionDeviatedFromTemplate(session, [template])).toBe(true);
  });

  it('should return true when targetSets differs', () => {
    const session = createMockSession({
      templateId: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 5, targetReps: 10, restSeconds: 90, sets: [] },
      ],
    });

    const template = createMockTemplate({
      id: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      ],
    });

    expect(hasSessionDeviatedFromTemplate(session, [template])).toBe(true);
  });

  it('should return true when targetReps differs', () => {
    const session = createMockSession({
      templateId: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 12, restSeconds: 90, sets: [] },
      ],
    });

    const template = createMockTemplate({
      id: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      ],
    });

    expect(hasSessionDeviatedFromTemplate(session, [template])).toBe(true);
  });

  it('should ignore restSeconds changes (not considered deviation)', () => {
    const session = createMockSession({
      templateId: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 120, sets: [] },
      ],
    });

    const template = createMockTemplate({
      id: 'template-1',
      exercises: [
        { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90 },
      ],
    });

    expect(hasSessionDeviatedFromTemplate(session, [template])).toBe(false);
  });
});

describe('extractExerciseHistory', () => {
  it('should return empty array when exerciseId is empty', () => {
    const sessions = [createMockSession()];
    expect(extractExerciseHistory(sessions, '')).toEqual([]);
  });

  it('should return empty array when no sessions contain the exercise', () => {
    const sessions = [
      createMockSession({
        completedAt: new Date().toISOString(),
        exercises: [
          { exerciseId: 'squat', targetSets: 3, targetReps: 10, restSeconds: 90, sets: [] },
        ],
      }),
    ];

    expect(extractExerciseHistory(sessions, 'bench-press')).toEqual([]);
  });

  it('should exclude incomplete sessions (no completedAt)', () => {
    const sessions = [
      createMockSession({
        completedAt: undefined,
        exercises: [
          {
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [{ weight: 100, reps: 10, unit: 'lbs', completedAt: new Date().toISOString() }],
          },
        ],
      }),
    ];

    expect(extractExerciseHistory(sessions, 'bench-press')).toEqual([]);
  });

  it('should exclude entries with no sets', () => {
    const sessions = [
      createMockSession({
        completedAt: new Date().toISOString(),
        exercises: [
          { exerciseId: 'bench-press', targetSets: 3, targetReps: 10, restSeconds: 90, sets: [] },
        ],
      }),
    ];

    expect(extractExerciseHistory(sessions, 'bench-press')).toEqual([]);
  });

  it('should extract history for an exercise', () => {
    const date = '2024-01-15T10:00:00.000Z';
    const sessions = [
      createMockSession({
        startedAt: date,
        completedAt: '2024-01-15T11:00:00.000Z',
        exercises: [
          {
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 135, reps: 10, unit: 'lbs', completedAt: date },
              { weight: 135, reps: 8, unit: 'lbs', completedAt: date },
            ],
          },
        ],
      }),
    ];

    const result = extractExerciseHistory(sessions, 'bench-press');

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(date);
    expect(result[0].sets).toEqual([
      { weight: 135, reps: 10, unit: 'lbs' },
      { weight: 135, reps: 8, unit: 'lbs' },
    ]);
  });

  it('should sort by date descending (most recent first)', () => {
    const sessions = [
      createMockSession({
        id: 'older',
        startedAt: '2024-01-10T10:00:00.000Z',
        completedAt: '2024-01-10T11:00:00.000Z',
        exercises: [
          {
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [{ weight: 125, reps: 10, unit: 'lbs', completedAt: '2024-01-10T10:30:00.000Z' }],
          },
        ],
      }),
      createMockSession({
        id: 'newer',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T11:00:00.000Z',
        exercises: [
          {
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [{ weight: 135, reps: 10, unit: 'lbs', completedAt: '2024-01-15T10:30:00.000Z' }],
          },
        ],
      }),
    ];

    const result = extractExerciseHistory(sessions, 'bench-press');

    expect(result).toHaveLength(2);
    expect(result[0].date).toBe('2024-01-15T10:00:00.000Z');
    expect(result[1].date).toBe('2024-01-10T10:00:00.000Z');
  });

  it('should limit results to specified count', () => {
    const sessions = Array.from({ length: 15 }, (_, i) =>
      createMockSession({
        id: `session-${i}`,
        startedAt: new Date(2024, 0, i + 1).toISOString(),
        completedAt: new Date(2024, 0, i + 1, 1).toISOString(),
        exercises: [
          {
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [{ weight: 100 + i * 5, reps: 10, unit: 'lbs', completedAt: new Date().toISOString() }],
          },
        ],
      })
    );

    const result = extractExerciseHistory(sessions, 'bench-press', 10);
    expect(result).toHaveLength(10);

    const resultWithCustomLimit = extractExerciseHistory(sessions, 'bench-press', 5);
    expect(resultWithCustomLimit).toHaveLength(5);
  });

  it('should handle mixed units in sets', () => {
    const sessions = [
      createMockSession({
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T11:00:00.000Z',
        exercises: [
          {
            exerciseId: 'bench-press',
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
            sets: [
              { weight: 60, reps: 10, unit: 'kg', completedAt: '2024-01-15T10:30:00.000Z' },
              { weight: 135, reps: 8, unit: 'lbs', completedAt: '2024-01-15T10:35:00.000Z' },
            ],
          },
        ],
      }),
    ];

    const result = extractExerciseHistory(sessions, 'bench-press');

    expect(result[0].sets).toEqual([
      { weight: 60, reps: 10, unit: 'kg' },
      { weight: 135, reps: 8, unit: 'lbs' },
    ]);
  });
});

describe('formatDuration', () => {
  it('should format 0 seconds as 00:00:00', () => {
    expect(formatDuration(0)).toBe('00:00:00');
  });

  it('should format seconds only', () => {
    expect(formatDuration(45)).toBe('00:00:45');
  });

  it('should format minutes and seconds', () => {
    expect(formatDuration(125)).toBe('00:02:05');
  });

  it('should format hours, minutes, and seconds', () => {
    expect(formatDuration(3661)).toBe('01:01:01');
  });

  it('should handle exactly one hour', () => {
    expect(formatDuration(3600)).toBe('01:00:00');
  });

  it('should handle large durations', () => {
    expect(formatDuration(7384)).toBe('02:03:04');
  });

  it('should pad single digits with zeros', () => {
    expect(formatDuration(61)).toBe('00:01:01');
  });
});
