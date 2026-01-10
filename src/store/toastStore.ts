import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));

// Convenience functions for showing toasts
export const toast = {
  success: (message: string, duration = 3000) => {
    return useToastStore.getState().addToast({ type: 'success', message, duration });
  },
  error: (message: string, duration = 5000) => {
    return useToastStore.getState().addToast({ type: 'error', message, duration });
  },
  warning: (message: string, duration = 4000) => {
    return useToastStore.getState().addToast({ type: 'warning', message, duration });
  },
  info: (message: string, duration = 3000) => {
    return useToastStore.getState().addToast({ type: 'info', message, duration });
  },
};
