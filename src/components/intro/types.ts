import { WorkoutGoal, WeightUnit, DistanceUnit, ExperienceLevel } from '../../types';

export interface IntroFormData {
  goal: WorkoutGoal;
  experienceLevel: ExperienceLevel;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  darkMode: boolean;
  initialWeight: string;
  openaiApiKey: string;
}
