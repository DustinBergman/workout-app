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
  weightAdjustment?: string;
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
// Goal-Based 5-Week Cycles (replaces legacy week system)
// ============================================

export const BUILD_5_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'build-5',
  name: 'Progressive Overload (5 weeks)',
  description: '5-week progressive overload cycle for building muscle.',
  cycleType: 'strength',
  totalWeeks: 5,
  recommendedForExperience: ['beginner', 'intermediate', 'advanced'],
  recommendedForGoals: ['build'],
  phases: [
    {
      type: 'baseline',
      name: 'Baseline',
      description: 'Establish your current working weights',
      durationWeeks: 1,
      repRangeMin: 8,
      repRangeMax: 10,
      intensityDescription: 'Moderate',
      aiGuidance: 'Use current working weights. Focus on form and establishing baseline. RPE 6-7.',
      weightAdjustment: 'Based on recent performance',
    },
    {
      type: 'accumulation',
      name: 'Light Overload',
      description: 'Small weight increase with lower reps',
      durationWeeks: 1,
      repRangeMin: 6,
      repRangeMax: 8,
      intensityDescription: 'Moderate to challenging',
      aiGuidance: 'Increase weight, target 6-8 reps. Progression-based increase. RPE 7-8.',
      weightAdjustment: 'Progression-based increase',
    },
    {
      type: 'accumulation',
      name: 'Volume Focus',
      description: 'Keep heavier weight, build reps',
      durationWeeks: 1,
      repRangeMin: 7,
      repRangeMax: 9,
      intensityDescription: 'Challenging',
      aiGuidance: 'KEEP previous weight (do NOT reduce). Build to 7-9 reps. RPE 7-8.',
      weightAdjustment: 'Keep previous weight',
    },
    {
      type: 'intensification',
      name: 'Strength Push',
      description: 'Heavy weights with low reps for strength',
      durationWeeks: 1,
      repRangeMin: 5,
      repRangeMax: 6,
      intensityDescription: 'Heavy',
      aiGuidance: 'Push for heavier weights if ready. 5-6 reps. RPE 8-9.',
      weightAdjustment: 'Push for PR',
    },
    {
      type: 'deload',
      name: 'Deload',
      description: 'Recovery week with reduced intensity',
      durationWeeks: 1,
      repRangeMin: 8,
      repRangeMax: 12,
      intensityDescription: 'Light',
      aiGuidance: 'Reduce all weights 20-30%. Focus on movement quality and recovery. RPE 5-6.',
      weightAdjustment: 'Reduce by 20-30%',
    },
  ],
};

export const LOSE_5_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'lose-5',
  name: 'Fatigue Management (5 weeks)',
  description: '5-week fatigue management cycle for losing weight while preserving muscle.',
  cycleType: 'strength',
  totalWeeks: 5,
  recommendedForExperience: ['beginner', 'intermediate', 'advanced'],
  recommendedForGoals: ['lose'],
  phases: [
    {
      type: 'baseline',
      name: 'Baseline Strength',
      description: 'Establish maintenance weights',
      durationWeeks: 1,
      repRangeMin: 6,
      repRangeMax: 10,
      intensityDescription: 'Moderate',
      aiGuidance: 'Maintain current weights. Preserve strength during deficit. RPE 6-7.',
      weightAdjustment: 'Current weights',
    },
    {
      type: 'accumulation',
      name: 'Volume Reduction',
      description: 'Same weights, fewer sets to manage fatigue',
      durationWeeks: 1,
      repRangeMin: 6,
      repRangeMax: 8,
      intensityDescription: 'Moderate',
      aiGuidance: 'Same weights, reduce volume by 1 set per exercise. Manage fatigue. RPE 7.',
      weightAdjustment: 'Same weight',
    },
    {
      type: 'intensification',
      name: 'Intensity Focus',
      description: 'Heavy weights, minimal volume',
      durationWeeks: 1,
      repRangeMin: 4,
      repRangeMax: 6,
      intensityDescription: 'Heavy',
      aiGuidance: 'Heavy weights, low volume. Maintain strength stimulus during deficit. RPE 8.',
      weightAdjustment: 'Same weight',
    },
    {
      type: 'accumulation',
      name: 'Moderate Recovery',
      description: 'Slightly lighter, moderate volume',
      durationWeeks: 1,
      repRangeMin: 8,
      repRangeMax: 10,
      intensityDescription: 'Moderate',
      aiGuidance: 'Reduce 10% from baseline. Moderate volume, focus on recovery. RPE 6-7.',
      weightAdjustment: '-10%',
    },
    {
      type: 'deload',
      name: 'Full Deload',
      description: 'Light recovery week',
      durationWeeks: 1,
      repRangeMin: 10,
      repRangeMax: 12,
      intensityDescription: 'Light',
      aiGuidance: 'Reduce 30%. Light recovery week. Focus on movement quality. RPE 5.',
      weightAdjustment: '-30%',
    },
  ],
};

export const MAINTAIN_5_WEEK_CYCLE: TrainingCycleConfig = {
  id: 'maintain-5',
  name: 'Intensity Waves (5 weeks)',
  description: '5-week intensity wave cycle for maintaining fitness.',
  cycleType: 'strength',
  totalWeeks: 5,
  recommendedForExperience: ['beginner', 'intermediate', 'advanced'],
  recommendedForGoals: ['maintain'],
  phases: [
    {
      type: 'baseline',
      name: 'Standard',
      description: 'Baseline moderate training',
      durationWeeks: 1,
      repRangeMin: 8,
      repRangeMax: 12,
      intensityDescription: 'Moderate',
      aiGuidance: 'Baseline moderate training. Current weights, 8-12 reps. RPE 6-7.',
      weightAdjustment: 'Current weights',
    },
    {
      type: 'accumulation',
      name: 'Light Wave',
      description: 'Reduced intensity, higher reps',
      durationWeeks: 1,
      repRangeMin: 12,
      repRangeMax: 15,
      intensityDescription: 'Light',
      aiGuidance: 'Reduce 10-15%. Higher reps for recovery and endurance. RPE 6.',
      weightAdjustment: '-10-15%',
    },
    {
      type: 'accumulation',
      name: 'Moderate Push',
      description: 'Slightly heavier weights',
      durationWeeks: 1,
      repRangeMin: 8,
      repRangeMax: 10,
      intensityDescription: 'Moderate to challenging',
      aiGuidance: 'Increase 5% from baseline. Moderate push, 8-10 reps. RPE 7.',
      weightAdjustment: '+5%',
    },
    {
      type: 'intensification',
      name: 'Heavy Wave',
      description: 'Intensity peak week',
      durationWeeks: 1,
      repRangeMin: 6,
      repRangeMax: 8,
      intensityDescription: 'Heavy',
      aiGuidance: 'Increase 10% from baseline. Peak intensity, 6-8 reps. RPE 8.',
      weightAdjustment: '+10%',
    },
    {
      type: 'deload',
      name: 'Recovery',
      description: 'Light deload week',
      durationWeeks: 1,
      repRangeMin: 10,
      repRangeMax: 12,
      intensityDescription: 'Light',
      aiGuidance: 'Reduce 20%. Light recovery. Focus on movement quality. RPE 5.',
      weightAdjustment: '-20%',
    },
  ],
};

// ============================================
// All Predefined Cycles
// ============================================

export const PREDEFINED_CYCLES: TrainingCycleConfig[] = [
  BUILD_5_WEEK_CYCLE,
  LOSE_5_WEEK_CYCLE,
  MAINTAIN_5_WEEK_CYCLE,
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

export const GOAL_DEFAULT_CYCLES: Record<WorkoutGoal, string> = {
  build: 'build-5',
  lose: 'lose-5',
  maintain: 'maintain-5',
};

export const getDefaultCycleForGoal = (goal: WorkoutGoal): TrainingCycleConfig => {
  const cycleId = GOAL_DEFAULT_CYCLES[goal];
  return getCycleById(cycleId) || BUILD_5_WEEK_CYCLE;
};
