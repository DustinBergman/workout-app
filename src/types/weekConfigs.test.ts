import { describe, it, expect } from 'vitest';
import {
  PROGRESSIVE_OVERLOAD_WEEKS,
  LOSE_WEIGHT_WEEKS,
  MAINTAIN_WEEKS,
  getWeekConfigForGoal,
  ProgressiveOverloadWeek,
} from './index';

describe('Week Configurations', () => {
  describe('PROGRESSIVE_OVERLOAD_WEEKS (Build Muscle)', () => {
    it('should have 5 weeks (0-4)', () => {
      expect(Object.keys(PROGRESSIVE_OVERLOAD_WEEKS)).toHaveLength(5);
    });

    it('should have correct week names', () => {
      expect(PROGRESSIVE_OVERLOAD_WEEKS[0].name).toBe('Baseline');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[1].name).toBe('Light Overload');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[2].name).toBe('Volume Focus');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[3].name).toBe('Strength Push');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[4].name).toBe('Deload');
    });

    it('should have weight adjustments based on progression', () => {
      expect(PROGRESSIVE_OVERLOAD_WEEKS[0].weightAdjustment).toBe('Based on recent performance');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[1].weightAdjustment).toBe('Progression-based increase');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[2].weightAdjustment).toBe('Maintain or slight increase');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[3].weightAdjustment).toBe('Push for PR if progression supports it');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[4].weightAdjustment).toBe('Reduce by 20-30%');
    });

    it('should have correct rep ranges', () => {
      expect(PROGRESSIVE_OVERLOAD_WEEKS[0].repRange).toBe('8-10 reps');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[1].repRange).toBe('6-8 reps');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[2].repRange).toBe('7-9 reps');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[3].repRange).toBe('5-6 reps');
      expect(PROGRESSIVE_OVERLOAD_WEEKS[4].repRange).toBe('8-12 reps');
    });
  });

  describe('LOSE_WEIGHT_WEEKS (Fatigue Management)', () => {
    it('should have 5 weeks (0-4)', () => {
      expect(Object.keys(LOSE_WEIGHT_WEEKS)).toHaveLength(5);
    });

    it('should have correct week names', () => {
      expect(LOSE_WEIGHT_WEEKS[0].name).toBe('Baseline Strength');
      expect(LOSE_WEIGHT_WEEKS[1].name).toBe('Volume Reduction');
      expect(LOSE_WEIGHT_WEEKS[2].name).toBe('Intensity Focus');
      expect(LOSE_WEIGHT_WEEKS[3].name).toBe('Moderate Recovery');
      expect(LOSE_WEIGHT_WEEKS[4].name).toBe('Full Deload');
    });

    it('should not suggest weight increases (deficit training)', () => {
      // Weeks 0-2 maintain same weight
      expect(LOSE_WEIGHT_WEEKS[0].weightAdjustment).toBe('Current weights');
      expect(LOSE_WEIGHT_WEEKS[1].weightAdjustment).toBe('Same weight');
      expect(LOSE_WEIGHT_WEEKS[2].weightAdjustment).toBe('Same weight');
      // Weeks 3-4 reduce weight for recovery
      expect(LOSE_WEIGHT_WEEKS[3].weightAdjustment).toBe('-10%');
      expect(LOSE_WEIGHT_WEEKS[4].weightAdjustment).toBe('-30%');
    });

    it('should have lower rep ranges for muscle retention', () => {
      expect(LOSE_WEIGHT_WEEKS[0].repRange).toBe('6-10 reps');
      expect(LOSE_WEIGHT_WEEKS[2].repRange).toBe('4-6 reps');
    });
  });

  describe('MAINTAIN_WEEKS (Intensity Waves)', () => {
    it('should have 5 weeks (0-4)', () => {
      expect(Object.keys(MAINTAIN_WEEKS)).toHaveLength(5);
    });

    it('should have correct week names', () => {
      expect(MAINTAIN_WEEKS[0].name).toBe('Standard');
      expect(MAINTAIN_WEEKS[1].name).toBe('Light Wave');
      expect(MAINTAIN_WEEKS[2].name).toBe('Moderate Push');
      expect(MAINTAIN_WEEKS[3].name).toBe('Heavy Wave');
      expect(MAINTAIN_WEEKS[4].name).toBe('Recovery');
    });

    it('should have intensity wave pattern', () => {
      expect(MAINTAIN_WEEKS[0].weightAdjustment).toBe('Current weights');
      expect(MAINTAIN_WEEKS[1].weightAdjustment).toBe('-10-15%'); // Light
      expect(MAINTAIN_WEEKS[2].weightAdjustment).toBe('+5%'); // Moderate push
      expect(MAINTAIN_WEEKS[3].weightAdjustment).toBe('+10%'); // Heavy peak
      expect(MAINTAIN_WEEKS[4].weightAdjustment).toBe('-20%'); // Recovery
    });

    it('should vary rep ranges with intensity', () => {
      expect(MAINTAIN_WEEKS[1].repRange).toBe('12-15 reps'); // Light - higher reps
      expect(MAINTAIN_WEEKS[3].repRange).toBe('6-8 reps'); // Heavy - lower reps
    });
  });

  describe('getWeekConfigForGoal', () => {
    it('should return PROGRESSIVE_OVERLOAD_WEEKS for build goal', () => {
      const config = getWeekConfigForGoal('build');
      expect(config).toBe(PROGRESSIVE_OVERLOAD_WEEKS);
      expect(config[0].name).toBe('Baseline');
    });

    it('should return LOSE_WEIGHT_WEEKS for lose goal', () => {
      const config = getWeekConfigForGoal('lose');
      expect(config).toBe(LOSE_WEIGHT_WEEKS);
      expect(config[0].name).toBe('Baseline Strength');
    });

    it('should return MAINTAIN_WEEKS for maintain goal', () => {
      const config = getWeekConfigForGoal('maintain');
      expect(config).toBe(MAINTAIN_WEEKS);
      expect(config[0].name).toBe('Standard');
    });

    it('should return correct week info for each goal', () => {
      const weeks: ProgressiveOverloadWeek[] = [0, 1, 2, 3, 4];

      weeks.forEach((week) => {
        const buildConfig = getWeekConfigForGoal('build');
        const loseConfig = getWeekConfigForGoal('lose');
        const maintainConfig = getWeekConfigForGoal('maintain');

        expect(buildConfig[week].week).toBe(week);
        expect(loseConfig[week].week).toBe(week);
        expect(maintainConfig[week].week).toBe(week);
      });
    });
  });

  describe('WeekInfo structure', () => {
    it('all week configs should have required fields', () => {
      const allConfigs = [PROGRESSIVE_OVERLOAD_WEEKS, LOSE_WEIGHT_WEEKS, MAINTAIN_WEEKS];

      allConfigs.forEach((config) => {
        Object.values(config).forEach((weekInfo) => {
          expect(weekInfo).toHaveProperty('week');
          expect(weekInfo).toHaveProperty('name');
          expect(weekInfo).toHaveProperty('description');
          expect(weekInfo).toHaveProperty('weightAdjustment');
          expect(weekInfo).toHaveProperty('repRange');
          expect(typeof weekInfo.week).toBe('number');
          expect(typeof weekInfo.name).toBe('string');
          expect(typeof weekInfo.description).toBe('string');
          expect(typeof weekInfo.weightAdjustment).toBe('string');
          expect(typeof weekInfo.repRange).toBe('string');
        });
      });
    });
  });
});

