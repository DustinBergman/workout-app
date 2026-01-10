import { toast } from '../../store/toastStore';

/**
 * Shows a toast notification for Supabase errors.
 * Call this in catch blocks or when error is returned from Supabase.
 */
export const showSupabaseError = (error: Error | unknown, context?: string): void => {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  const displayMessage = context ? `${context}: ${message}` : message;
  toast.error(displayMessage);
};

/**
 * Wraps an async function and shows a toast on error.
 * Returns the result or null if an error occurred.
 */
export const withErrorToast = async <T>(
  fn: () => Promise<T>,
  context?: string
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    showSupabaseError(error, context);
    return null;
  }
};

/**
 * Handles Supabase response pattern { data, error }.
 * Shows toast if error exists and returns data.
 */
export const handleSupabaseResponse = <T>(
  response: { data: T | null; error: Error | null },
  context?: string
): T | null => {
  if (response.error) {
    showSupabaseError(response.error, context);
    return null;
  }
  return response.data;
};
