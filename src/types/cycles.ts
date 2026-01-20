import type { ExperienceLevel, WorkoutGoal } from './index';

// ============================================
// Phase Types
// ============================================

export type StrengthPhaseType =
  | 'baseline'
  | 'accumulation'
  | 'intensification'
  | 'realization'
  | 'deload';

export type CardioPhaseType = 'easy' | 'moderate' | 'hard' | 'deload';

// ============================================
// Phase Configurations
// ============================================

export interface StrengthPhaseConfig {
  type: StrengthPhaseType;
  name: string;
  description: string;
  durationWeeks: number;
  repRangeMin: number;
  repRangeMax: number;
  intensityDescription: string;
  aiGuidance: string;
}

export interface CardioPhaseConfig {
  type: CardioPhaseType;
  name: string;
  description: string;
  durationWeeks: number;
  intensityDescription: string;
  aiGuidance: string;
}

export type PhaseConfig = StrengthPhaseConfig | CardioPhaseConfig;

// ============================================
// Cycle Configuration
// ============================================

export interface TrainingCycleConfig {
  id: string;
  name: string;
  description: string;
  cycleType: 'strength' | 'cardio';
  phases: PhaseConfig[];
  totalWeeks: number;
  recommendedForExperience: ExperienceLevel[];
  recommendedForGoals: WorkoutGoal[];
}

// ============================================
// User Cycle State
// ============================================

export interface UserCycleState {
  cycleConfigId: string;
  cycleStartDate: string;
  currentPhaseIndex: number;
  currentWeekInPhase: number;
}

// ============================================
// Helper Functions
// ============================================

export const isStrengthPhase = (phase: PhaseConfig): phase is StrengthPhaseConfig => {
  return 'repRangeMin' in phase;
};

export const isCardioPhase = (phase: PhaseConfig): phase is CardioPhaseConfig => {
  return !('repRangeMin' in phase);
};

export const getCurrentPhase = (
  cycleConfig: TrainingCycleConfig,
  cycleState: UserCycleState
): PhaseConfig | null => {
  if (cycleState.currentPhaseIndex >= cycleConfig.phases.length) {
    return null;
  }
  return cycleConfig.phases[cycleState.currentPhaseIndex];
};

export const getTotalWeeksCompleted = (cycleState: UserCycleState, cycleConfig: TrainingCycleConfig): number => {
  let total = 0;
  for (let i = 0; i < cycleState.currentPhaseIndex; i++) {
    total += cycleConfig.phases[i].durationWeeks;
  }
  return total + cycleState.currentWeekInPhase;
};

// ============================================
// Predefined Strength Cycles
// ============================================

export const BEGINNER_4_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'beginner-4',
  name: 'Beginner (4 weeks)',
  description: 'Simple 4-week cycle perfect for new lifters. Build foundation then recover.',
  cycleType: 'strength',
  totalWeeks: 4,
  recommendedForExperience: ['beginner'],
  recommendedForGoals: ['build', 'maintain'],
  phases: [
    {
      type: 'baseline',
      name: 'Foundation',
      description: 'Learn movements, establish working weights',
      durationWeeks: 1,
      repRangeMin: 10,
      repRangeMax: 12,
      intensityDescription: 'Light to moderate',
      aiGuidance: 'Focus on form and technique. Suggest conservative weights. RPE 6-7.',
    },
    {
      type: 'accumulation',
      name: 'Build',
      description: 'Increase work capacity with moderate weights',
      durationWeeks: 1,
      repRangeMin: 8,
      repRangeMax: 10,
      intensityDescription: 'Moderate',
      aiGuidance: 'Gradual progression. Add 5-10% when hitting all reps easily. RPE 7.',
    },
    {
      type: 'accumulation',
      name: 'Build',
      description: 'Continue building with slightly more intensity',
      durationWeeks: 1,
      repRangeMin: 8,
      repRangeMax: 10,
      intensityDescription: 'Moderate to challenging',
      aiGuidance: 'Push a bit harder. Small weight increases allowed. RPE 7-8.',
    },
    {
      type: 'deload',
      name: 'Recovery',
      description: 'Active recovery week - reduce load',
      durationWeeks: 1,
      repRangeMin: 10,
      repRangeMax: 15,
      intensityDescription: 'Light',
      aiGuidance: 'Reduce all weights 30-40%. Focus on movement quality and recovery. RPE 5-6.',
    },
  ],
};

export const INTERMEDIATE_6_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'intermediate-6',
  name: 'Intermediate (6 weeks)',
  description: 'Block periodization with volume, strength, and peak phases.',
  cycleType: 'strength',
  totalWeeks: 6,
  recommendedForExperience: ['intermediate'],
  recommendedForGoals: ['build'],
  phases: [
    {
      type: 'accumulation',
      name: 'Volume',
      description: 'Build work capacity with moderate weights and higher volume',
      durationWeeks: 2,
      repRangeMin: 8,
      repRangeMax: 12,
      intensityDescription: 'Moderate',
      aiGuidance: 'Higher volume focus. 3-4 sets per exercise. Moderate weight progression. RPE 7.',
    },
    {
      type: 'intensification',
      name: 'Strength',
      description: 'Reduce volume, increase intensity',
      durationWeeks: 2,
      repRangeMin: 5,
      repRangeMax: 8,
      intensityDescription: 'Heavy',
      aiGuidance: 'Push for heavier weights. Lower rep targets. Allow longer rest. RPE 8.',
    },
    {
      type: 'realization',
      name: 'Peak',
      description: 'Test strength, attempt PRs',
      durationWeeks: 1,
      repRangeMin: 3,
      repRangeMax: 5,
      intensityDescription: 'Very heavy',
      aiGuidance: 'PR attempts encouraged. Low volume, high intensity. Full recovery between sets. RPE 9.',
    },
    {
      type: 'deload',
      name: 'Recovery',
      description: 'Active recovery',
      durationWeeks: 1,
      repRangeMin: 10,
      repRangeMax: 15,
      intensityDescription: 'Light',
      aiGuidance: 'Light weights, focus on mobility and form. RPE 5.',
    },
  ],
};

export const ADVANCED_8_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'advanced-8',
  name: 'Advanced (8 weeks)',
  description: 'Comprehensive periodization with multiple training blocks.',
  cycleType: 'strength',
  totalWeeks: 8,
  recommendedForExperience: ['advanced'],
  recommendedForGoals: ['build'],
  phases: [
    {
      type: 'accumulation',
      name: 'Hypertrophy',
      description: 'High volume, moderate intensity for muscle growth',
      durationWeeks: 2,
      repRangeMin: 8,
      repRangeMax: 12,
      intensityDescription: 'Moderate',
      aiGuidance: 'High volume focus. 4+ sets. Moderate weights. Focus on time under tension. RPE 7.',
    },
    {
      type: 'intensification',
      name: 'Strength',
      description: 'Build maximal strength',
      durationWeeks: 2,
      repRangeMin: 4,
      repRangeMax: 6,
      intensityDescription: 'Heavy',
      aiGuidance: 'Heavier weights, lower reps. Push intensity. Longer rest periods. RPE 8.',
    },
    {
      type: 'accumulation',
      name: 'Volume',
      description: 'Return to volume work at higher weights',
      durationWeeks: 2,
      repRangeMin: 6,
      repRangeMax: 10,
      intensityDescription: 'Moderate to heavy',
      aiGuidance: 'Moderate to high volume. Build from previous strength block. RPE 7-8.',
    },
    {
      type: 'realization',
      name: 'Peak',
      description: 'Maximize performance, test limits',
      durationWeeks: 1,
      repRangeMin: 1,
      repRangeMax: 3,
      intensityDescription: 'Maximal',
      aiGuidance: 'Max effort attempts. Minimal volume. Full recovery. RPE 9-10.',
    },
    {
      type: 'deload',
      name: 'Recovery',
      description: 'Complete recovery before next cycle',
      durationWeeks: 1,
      repRangeMin: 12,
      repRangeMax: 15,
      intensityDescription: 'Very light',
      aiGuidance: 'Very light weights. Focus on movement quality and recovery. RPE 5.',
    },
  ],
};

// ============================================
// Predefined Cardio Cycles
// ============================================

export const CARDIO_4_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'cardio-4',
  name: 'Cardio Base (4 weeks)',
  description: 'Build aerobic base with progressive intensity.',
  cycleType: 'cardio',
  totalWeeks: 4,
  recommendedForExperience: ['beginner', 'intermediate'],
  recommendedForGoals: ['lose', 'maintain'],
  phases: [
    {
      type: 'easy',
      name: 'Easy',
      description: 'Low intensity, build aerobic base',
      durationWeeks: 1,
      intensityDescription: 'Zone 1-2, conversational pace',
      aiGuidance: 'Keep heart rate low. Focus on consistency over speed. Can hold conversation.',
    },
    {
      type: 'moderate',
      name: 'Moderate',
      description: 'Increase duration and moderate intensity',
      durationWeeks: 1,
      intensityDescription: 'Zone 2-3, comfortable but challenging',
      aiGuidance: 'Comfortable but challenging. Breathing harder but controlled.',
    },
    {
      type: 'hard',
      name: 'Hard',
      description: 'Higher intensity, test limits',
      durationWeeks: 1,
      intensityDescription: 'Zone 3-4, pushing pace',
      aiGuidance: 'Push pace. Include tempo or interval work. Challenging effort.',
    },
    {
      type: 'deload',
      name: 'Recovery',
      description: 'Active recovery',
      durationWeeks: 1,
      intensityDescription: 'Zone 1-2, very easy',
      aiGuidance: 'Very easy pace. Reduce duration. Recovery focus.',
    },
  ],
};

export const CARDIO_6_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'cardio-6',
  name: 'Cardio Performance (6 weeks)',
  description: 'Progressive cardio training for improved performance.',
  cycleType: 'cardio',
  totalWeeks: 6,
  recommendedForExperience: ['intermediate', 'advanced'],
  recommendedForGoals: ['lose', 'maintain'],
  phases: [
    {
      type: 'easy',
      name: 'Base',
      description: 'Establish aerobic foundation',
      durationWeeks: 2,
      intensityDescription: 'Zone 2, easy effort',
      aiGuidance: 'Build aerobic base. Longer, slower sessions. Focus on consistency.',
    },
    {
      type: 'moderate',
      name: 'Build',
      description: 'Progressive overload on cardio',
      durationWeeks: 2,
      intensityDescription: 'Zone 2-3, steady state',
      aiGuidance: 'Increase duration or intensity gradually. Steady challenging effort.',
    },
    {
      type: 'hard',
      name: 'Peak',
      description: 'High intensity work',
      durationWeeks: 1,
      intensityDescription: 'Zone 4-5, high effort',
      aiGuidance: 'Interval training, tempo work. Push limits. Shorter but intense.',
    },
    {
      type: 'deload',
      name: 'Recovery',
      description: 'Active recovery',
      durationWeeks: 1,
      intensityDescription: 'Zone 1-2, recovery',
      aiGuidance: 'Easy effort. Reduced duration. Focus on recovery.',
    },
  ],
};

// ============================================
// All Predefined Cycles
// ============================================

export const PREDEFINED_CYCLES: TrainingCycleConfig[] = [
  BEGINNER_4_WEEK_CYCLE,
  INTERMEDIATE_6_WEEK_CYCLE,
  ADVANCED_8_WEEK_CYCLE,
  CARDIO_4_WEEK_CYCLE,
  CARDIO_6_WEEK_CYCLE,
];

export const getDefaultCycleForExperience = (
  experienceLevel: ExperienceLevel,
  cycleType: 'strength' | 'cardio' = 'strength'
): TrainingCycleConfig => {
  const cycles = PREDEFINED_CYCLES.filter(c => c.cycleType === cycleType);

  // Find cycle that matches experience level
  const matched = cycles.find(c => c.recommendedForExperience.includes(experienceLevel));

  // Fallback to first cycle of that type
  return matched || cycles[0] || BEGINNER_4_WEEK_CYCLE;
};

export const getCycleById = (id: string): TrainingCycleConfig | undefined => {
  return PREDEFINED_CYCLES.find(c => c.id === id);
};
