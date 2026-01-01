import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { useAppStore } from './useAppStore';

interface CurrentWorkoutState {
  // UI State
  expandedIndex: number | null;
  showTimer: boolean;
  timerDuration: number;
  timerEndTime: number | null;
  showExercisePicker: boolean;
  exerciseSearch: string;
  showFinishConfirm: boolean;
  historyExerciseId: string | null;
  updatePlan: boolean;
  skipAutoExpand: boolean;

  // Actions
  setExpandedIndex: (index: number | null) => void;
  setShowTimer: (show: boolean) => void;
  setTimerDuration: (duration: number) => void;
  setTimerEndTime: (endTime: number | null) => void;
  setShowExercisePicker: (show: boolean) => void;
  setExerciseSearch: (search: string) => void;
  setShowFinishConfirm: (show: boolean) => void;
  setHistoryExerciseId: (id: string | null) => void;
  setUpdatePlan: (update: boolean) => void;
  setSkipAutoExpand: (skip: boolean) => void;
  reset: () => void;
}

const initialState = {
  expandedIndex: null as number | null,
  showTimer: false,
  timerDuration: 90,
  timerEndTime: null as number | null,
  showExercisePicker: false,
  exerciseSearch: '',
  showFinishConfirm: false,
  historyExerciseId: null as string | null,
  updatePlan: false,
  skipAutoExpand: false,
};

export const useCurrentWorkoutStore = create<CurrentWorkoutState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        ...initialState,

        setExpandedIndex: (index) => set({ expandedIndex: index }),
        setShowTimer: (show) => set({ showTimer: show }),
        setTimerDuration: (duration) => set({ timerDuration: duration }),
        setTimerEndTime: (endTime) => set({ timerEndTime: endTime }),
        setShowExercisePicker: (show) => set({ showExercisePicker: show }),
        setExerciseSearch: (search) => set({ exerciseSearch: search }),
        setShowFinishConfirm: (show) => set({ showFinishConfirm: show }),
        setHistoryExerciseId: (id) => set({ historyExerciseId: id }),
        setUpdatePlan: (update) => set({ updatePlan: update }),
        setSkipAutoExpand: (skip) => set({ skipAutoExpand: skip }),
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
