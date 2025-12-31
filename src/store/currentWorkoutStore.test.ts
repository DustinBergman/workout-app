import { describe, it, expect, beforeEach } from 'vitest';
import { useCurrentWorkoutStore } from './currentWorkoutStore';

describe('currentWorkoutStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCurrentWorkoutStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have expandedIndex as null', () => {
      expect(useCurrentWorkoutStore.getState().expandedIndex).toBeNull();
    });

    it('should have showTimer as false', () => {
      expect(useCurrentWorkoutStore.getState().showTimer).toBe(false);
    });

    it('should have default timerDuration of 90', () => {
      expect(useCurrentWorkoutStore.getState().timerDuration).toBe(90);
    });

    it('should have showExercisePicker as false', () => {
      expect(useCurrentWorkoutStore.getState().showExercisePicker).toBe(false);
    });

    it('should have empty exerciseSearch', () => {
      expect(useCurrentWorkoutStore.getState().exerciseSearch).toBe('');
    });

    it('should have showFinishConfirm as false', () => {
      expect(useCurrentWorkoutStore.getState().showFinishConfirm).toBe(false);
    });

    it('should have historyExerciseId as null', () => {
      expect(useCurrentWorkoutStore.getState().historyExerciseId).toBeNull();
    });

    it('should have updatePlan as false', () => {
      expect(useCurrentWorkoutStore.getState().updatePlan).toBe(false);
    });
  });

  describe('setExpandedIndex', () => {
    it('should set expanded index', () => {
      useCurrentWorkoutStore.getState().setExpandedIndex(2);
      expect(useCurrentWorkoutStore.getState().expandedIndex).toBe(2);
    });

    it('should set expanded index to null', () => {
      useCurrentWorkoutStore.getState().setExpandedIndex(2);
      useCurrentWorkoutStore.getState().setExpandedIndex(null);
      expect(useCurrentWorkoutStore.getState().expandedIndex).toBeNull();
    });
  });

  describe('setShowTimer', () => {
    it('should show timer', () => {
      useCurrentWorkoutStore.getState().setShowTimer(true);
      expect(useCurrentWorkoutStore.getState().showTimer).toBe(true);
    });

    it('should hide timer', () => {
      useCurrentWorkoutStore.getState().setShowTimer(true);
      useCurrentWorkoutStore.getState().setShowTimer(false);
      expect(useCurrentWorkoutStore.getState().showTimer).toBe(false);
    });
  });

  describe('setTimerDuration', () => {
    it('should set timer duration', () => {
      useCurrentWorkoutStore.getState().setTimerDuration(120);
      expect(useCurrentWorkoutStore.getState().timerDuration).toBe(120);
    });

    it('should allow any positive duration', () => {
      useCurrentWorkoutStore.getState().setTimerDuration(300);
      expect(useCurrentWorkoutStore.getState().timerDuration).toBe(300);
    });
  });

  describe('setShowExercisePicker', () => {
    it('should show exercise picker', () => {
      useCurrentWorkoutStore.getState().setShowExercisePicker(true);
      expect(useCurrentWorkoutStore.getState().showExercisePicker).toBe(true);
    });

    it('should hide exercise picker', () => {
      useCurrentWorkoutStore.getState().setShowExercisePicker(true);
      useCurrentWorkoutStore.getState().setShowExercisePicker(false);
      expect(useCurrentWorkoutStore.getState().showExercisePicker).toBe(false);
    });
  });

  describe('setExerciseSearch', () => {
    it('should set exercise search', () => {
      useCurrentWorkoutStore.getState().setExerciseSearch('bench');
      expect(useCurrentWorkoutStore.getState().exerciseSearch).toBe('bench');
    });

    it('should clear exercise search', () => {
      useCurrentWorkoutStore.getState().setExerciseSearch('bench');
      useCurrentWorkoutStore.getState().setExerciseSearch('');
      expect(useCurrentWorkoutStore.getState().exerciseSearch).toBe('');
    });
  });

  describe('setShowFinishConfirm', () => {
    it('should show finish confirm', () => {
      useCurrentWorkoutStore.getState().setShowFinishConfirm(true);
      expect(useCurrentWorkoutStore.getState().showFinishConfirm).toBe(true);
    });

    it('should hide finish confirm', () => {
      useCurrentWorkoutStore.getState().setShowFinishConfirm(true);
      useCurrentWorkoutStore.getState().setShowFinishConfirm(false);
      expect(useCurrentWorkoutStore.getState().showFinishConfirm).toBe(false);
    });
  });

  describe('setHistoryExerciseId', () => {
    it('should set history exercise id', () => {
      useCurrentWorkoutStore.getState().setHistoryExerciseId('bench-press');
      expect(useCurrentWorkoutStore.getState().historyExerciseId).toBe('bench-press');
    });

    it('should clear history exercise id', () => {
      useCurrentWorkoutStore.getState().setHistoryExerciseId('bench-press');
      useCurrentWorkoutStore.getState().setHistoryExerciseId(null);
      expect(useCurrentWorkoutStore.getState().historyExerciseId).toBeNull();
    });
  });

  describe('setUpdatePlan', () => {
    it('should set update plan flag', () => {
      useCurrentWorkoutStore.getState().setUpdatePlan(true);
      expect(useCurrentWorkoutStore.getState().updatePlan).toBe(true);
    });

    it('should clear update plan flag', () => {
      useCurrentWorkoutStore.getState().setUpdatePlan(true);
      useCurrentWorkoutStore.getState().setUpdatePlan(false);
      expect(useCurrentWorkoutStore.getState().updatePlan).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set various state
      useCurrentWorkoutStore.getState().setExpandedIndex(5);
      useCurrentWorkoutStore.getState().setShowTimer(true);
      useCurrentWorkoutStore.getState().setTimerDuration(180);
      useCurrentWorkoutStore.getState().setShowExercisePicker(true);
      useCurrentWorkoutStore.getState().setExerciseSearch('squat');
      useCurrentWorkoutStore.getState().setShowFinishConfirm(true);
      useCurrentWorkoutStore.getState().setHistoryExerciseId('deadlift');
      useCurrentWorkoutStore.getState().setUpdatePlan(true);

      // Reset
      useCurrentWorkoutStore.getState().reset();

      // Verify all reset
      const state = useCurrentWorkoutStore.getState();
      expect(state.expandedIndex).toBeNull();
      expect(state.showTimer).toBe(false);
      expect(state.timerDuration).toBe(90);
      expect(state.showExercisePicker).toBe(false);
      expect(state.exerciseSearch).toBe('');
      expect(state.showFinishConfirm).toBe(false);
      expect(state.historyExerciseId).toBeNull();
      expect(state.updatePlan).toBe(false);
    });
  });

  describe('persistence', () => {
    it('should persist state to localStorage', () => {
      useCurrentWorkoutStore.getState().setTimerDuration(120);

      // The store uses persist middleware, so changes should be saved
      const stored = localStorage.getItem('workout-app-current-workout');
      expect(stored).not.toBeNull();
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.state.timerDuration).toBe(120);
      }
    });
  });
});
