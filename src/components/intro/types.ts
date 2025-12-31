import { WorkoutGoal, WeightUnit, DistanceUnit } from '../../types';

export interface IntroFormData {
  firstName: string;
  lastName: string;
  goal: WorkoutGoal;
  weightUnit: WeightUnit;
  distanceUnit: DistanceUnit;
  darkMode: boolean;
  initialWeight: string;
  openaiApiKey: string;
}
