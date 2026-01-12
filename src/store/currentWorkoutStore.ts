import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { useAppStore } from './useAppStore';
import { ExerciseSuggestion, WorkoutScoreResult } from '../types';

interface CurrentWorkoutState {
  // UI State
  expandedIndex: number | null;
  showTimer: boolean;
  timerDuration: number;
  timerEndTime: number | null;
  timerPaused: boolean;
  timerRemainingWhenPaused: number | null;
  showExercisePicker: boolean;
  exerciseSearch: string;
  showFinishConfirm: boolean;
  historyExerciseId: string | null;
  historyExerciseName: string | null;
  updatePlan: boolean;
  skipAutoExpand: boolean;
  suggestions: ExerciseSuggestion[];

  // Scoring State
  isScoring: boolean;
  scoreResult: WorkoutScoreResult | null;
  scoreError: string | null;

  // Actions
  setExpandedIndex: (index: number | null) => void;
  setShowTimer: (show: boolean) => void;
  setTimerDuration: (duration: number) => void;
  setTimerEndTime: (endTime: number | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setShowExercisePicker: (show: boolean) => void;
  setExerciseSearch: (search: string) => void;
  setShowFinishConfirm: (show: boolean) => void;
  setHistoryExerciseId: (id: string | null) => void;
  setHistoryExerciseName: (name: string | null) => void;
  setUpdatePlan: (update: boolean) => void;
  setSkipAutoExpand: (skip: boolean) => void;
  setSuggestions: (suggestions: ExerciseSuggestion[]) => void;
  setIsScoring: (isScoring: boolean) => void;
  setScoreResult: (result: WorkoutScoreResult | null) => void;
  setScoreError: (error: string | null) => void;
  clearScoreResult: () => void;
  reset: () => void;
}

const initialState = {
  expandedIndex: null as number | null,
  showTimer: false,
  timerDuration: 90,
  timerEndTime: null as number | null,
  timerPaused: false,
  timerRemainingWhenPaused: null as number | null,
  showExercisePicker: false,
  exerciseSearch: '',
  showFinishConfirm: false,
  historyExerciseId: null as string | null,
  historyExerciseName: null as string | null,
  updatePlan: false,
  skipAutoExpand: false,
  suggestions: [] as ExerciseSuggestion[],
  isScoring: false,
  scoreResult: null as WorkoutScoreResult | null,
  scoreError: null as string | null,
};

export const useCurrentWorkoutStore = create<CurrentWorkoutState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        ...initialState,

        setExpandedIndex: (index) => set({ expandedIndex: index }),
        setShowTimer: (show) => set({ showTimer: show }),
        setTimerDuration: (duration) => set({ timerDuration: duration }),
        setTimerEndTime: (endTime) => set({ timerEndTime: endTime, timerPaused: false, timerRemainingWhenPaused: null }),
        pauseTimer: () => set((state) => {
          if (!state.timerEndTime || state.timerPaused) return state;
          const remaining = Math.max(0, Math.ceil((state.timerEndTime - Date.now()) / 1000));
          return { timerPaused: true, timerRemainingWhenPaused: remaining };
        }),
        resumeTimer: () => set((state) => {
          if (!state.timerPaused || state.timerRemainingWhenPaused === null) return state;
          const newEndTime = Date.now() + state.timerRemainingWhenPaused * 1000;
          return { timerPaused: false, timerRemainingWhenPaused: null, timerEndTime: newEndTime };
        }),
        setShowExercisePicker: (show) => set({ showExercisePicker: show }),
        setExerciseSearch: (search) => set({ exerciseSearch: search }),
        setShowFinishConfirm: (show) => set({ showFinishConfirm: show }),
        setHistoryExerciseId: (id) => set({ historyExerciseId: id }),
        setHistoryExerciseName: (name) => set({ historyExerciseName: name }),
        setUpdatePlan: (update) => set({ updatePlan: update }),
        setSkipAutoExpand: (skip) => set({ skipAutoExpand: skip }),
        setSuggestions: (suggestions) => set({ suggestions }),
        setIsScoring: (isScoring) => set({ isScoring }),
        setScoreResult: (result) => set({ scoreResult: result }),
        setScoreError: (error) => set({ scoreError: error }),
        clearScoreResult: () => set({ scoreResult: null, scoreError: null }),
        reset: () => set(initialState),
      }),
      {
        name: 'workout-app-current-workout',
      }
    )
  )
);

// Auto-clear when workout ends (activeSession becomes null)
useAppStore.subscribe(
  (state) => state.activeSession,
  (activeSession) => {
    if (activeSession === null) {
      useCurrentWorkoutStore.getState().reset();
    }
  }
);
