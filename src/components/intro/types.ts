import { WorkoutGoal, WeightUnit } from '../../types';

export interface IntroFormData {
  firstName: string;
  lastName: string;
  goal: WorkoutGoal;
  weightUnit: WeightUnit;
  darkMode: boolean;
  openaiApiKey: string;
}
