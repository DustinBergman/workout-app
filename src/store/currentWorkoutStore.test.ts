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

    it('should have timerEndTime as null', () => {
      expect(useCurrentWorkoutStore.getState().timerEndTime).toBeNull();
    });

    it('should have timerPaused as false', () => {
      expect(useCurrentWorkoutStore.getState().timerPaused).toBe(false);
    });

    it('should have timerRemainingWhenPaused as null', () => {
      expect(useCurrentWorkoutStore.getState().timerRemainingWhenPaused).toBeNull();
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

    it('should have empty suggestions array', () => {
      expect(useCurrentWorkoutStore.getState().suggestions).toEqual([]);
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

  describe('setTimerEndTime', () => {
    it('should set timer end time', () => {
      const endTime = Date.now() + 60000;
      useCurrentWorkoutStore.getState().setTimerEndTime(endTime);
      expect(useCurrentWorkoutStore.getState().timerEndTime).toBe(endTime);
    });

    it('should reset pause state when setting end time', () => {
      // First pause the timer
      const endTime = Date.now() + 60000;
      useCurrentWorkoutStore.getState().setTimerEndTime(endTime);
      useCurrentWorkoutStore.getState().pauseTimer();

      // Now set a new end time
      const newEndTime = Date.now() + 90000;
      useCurrentWorkoutStore.getState().setTimerEndTime(newEndTime);

      expect(useCurrentWorkoutStore.getState().timerPaused).toBe(false);
      expect(useCurrentWorkoutStore.getState().timerRemainingWhenPaused).toBeNull();
    });

    it('should allow clearing timer end time', () => {
      const endTime = Date.now() + 60000;
      useCurrentWorkoutStore.getState().setTimerEndTime(endTime);
      useCurrentWorkoutStore.getState().setTimerEndTime(null);
      expect(useCurrentWorkoutStore.getState().timerEndTime).toBeNull();
    });
  });

  describe('pauseTimer', () => {
    it('should pause the timer and store remaining seconds', () => {
      // Set end time 60 seconds in the future
      const endTime = Date.now() + 60000;
      useCurrentWorkoutStore.getState().setTimerEndTime(endTime);

      useCurrentWorkoutStore.getState().pauseTimer();

      expect(useCurrentWorkoutStore.getState().timerPaused).toBe(true);
      expect(useCurrentWorkoutStore.getState().timerRemainingWhenPaused).toBe(60);
    });

    it('should not pause if already paused', () => {
      const endTime = Date.now() + 60000;
      useCurrentWorkoutStore.getState().setTimerEndTime(endTime);
      useCurrentWorkoutStore.getState().pauseTimer();

      // Try to pause again - should not change state
      const remaining = useCurrentWorkoutStore.getState().timerRemainingWhenPaused;
      useCurrentWorkoutStore.getState().pauseTimer();

      expect(useCurrentWorkoutStore.getState().timerRemainingWhenPaused).toBe(remaining);
    });

    it('should not pause if no end time', () => {
      useCurrentWorkoutStore.getState().pauseTimer();
      expect(useCurrentWorkoutStore.getState().timerPaused).toBe(false);
    });
  });

  describe('resumeTimer', () => {
    it('should resume the timer and recalculate end time', () => {
      // Set end time and pause
      const endTime = Date.now() + 60000;
      useCurrentWorkoutStore.getState().setTimerEndTime(endTime);
      useCurrentWorkoutStore.getState().pauseTimer();

      const beforeResume = Date.now();
      useCurrentWorkoutStore.getState().resumeTimer();
      const afterResume = Date.now();

      expect(useCurrentWorkoutStore.getState().timerPaused).toBe(false);
      expect(useCurrentWorkoutStore.getState().timerRemainingWhenPaused).toBeNull();

      // New end time should be ~60 seconds from now
      const newEndTime = useCurrentWorkoutStore.getState().timerEndTime;
      expect(newEndTime).not.toBeNull();
      if (newEndTime) {
        expect(newEndTime).toBeGreaterThanOrEqual(beforeResume + 60000);
        expect(newEndTime).toBeLessThanOrEqual(afterResume + 60000);
      }
    });

    it('should not resume if not paused', () => {
      const endTime = Date.now() + 60000;
      useCurrentWorkoutStore.getState().setTimerEndTime(endTime);

      useCurrentWorkoutStore.getState().resumeTimer();

      // End time should not change
      expect(useCurrentWorkoutStore.getState().timerEndTime).toBe(endTime);
    });

    it('should not resume if no remaining time stored', () => {
      useCurrentWorkoutStore.setState({ timerPaused: true, timerRemainingWhenPaused: null });
      useCurrentWorkoutStore.getState().resumeTimer();

      expect(useCurrentWorkoutStore.getState().timerPaused).toBe(true);
    });
  });

  describe('setSuggestions', () => {
    it('should set suggestions', () => {
      const suggestions = [
        { exerciseId: 'bench-press', suggestedWeight: 135, suggestedReps: 10, reasoning: 'test', confidence: 'high' as const },
      ];
      useCurrentWorkoutStore.getState().setSuggestions(suggestions);
      expect(useCurrentWorkoutStore.getState().suggestions).toEqual(suggestions);
    });

    it('should clear suggestions with empty array', () => {
      const suggestions = [
        { exerciseId: 'bench-press', suggestedWeight: 135, suggestedReps: 10, reasoning: 'test', confidence: 'high' as const },
      ];
      useCurrentWorkoutStore.getState().setSuggestions(suggestions);
      useCurrentWorkoutStore.getState().setSuggestions([]);
      expect(useCurrentWorkoutStore.getState().suggestions).toEqual([]);
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
      useCurrentWorkoutStore.getState().setTimerEndTime(Date.now() + 60000);
      useCurrentWorkoutStore.getState().pauseTimer();
      useCurrentWorkoutStore.getState().setSuggestions([
        { exerciseId: 'test', suggestedWeight: 100, suggestedReps: 10, reasoning: 'test', confidence: 'high' as const },
      ]);
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
      expect(state.timerEndTime).toBeNull();
      expect(state.timerPaused).toBe(false);
      expect(state.timerRemainingWhenPaused).toBeNull();
      expect(state.suggestions).toEqual([]);
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
