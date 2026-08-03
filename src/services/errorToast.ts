import { toast } from '../store/toastStore';

const DEDUPE_WINDOW_MS = 3000;
let lastMessage = '';
let lastShownAt = 0;

export const getErrorMessage = (
  error: unknown,
  fallback?: string
): string => {
  if (fallback) return fallback;
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 200);
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim().slice(0, 200);
  }
  return 'Something went wrong. Please try again.';
};

export const enqueueErrorToast = (
  error: unknown,
  fallback?: string
): void => {
  const message = getErrorMessage(error, fallback);
  const now = Date.now();
  if (message === lastMessage && now - lastShownAt < DEDUPE_WINDOW_MS) return;

  lastMessage = message;
  lastShownAt = now;
  toast.error(message);
};
