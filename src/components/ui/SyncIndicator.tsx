import { FC } from 'react';
import { useSync } from '../../hooks/useSync';
import { useAuth } from '../../hooks/useAuth';

/**
 * Small indicator that shows sync status in the header
 */
export const SyncIndicator: FC = () => {
  const { isAuthenticated } = useAuth();
  const { status } = useSync();

  // Don't show anything if not authenticated
  if (!isAuthenticated) return null;

  // Only show indicator when syncing, offline, or error
  if (status === 'syncing') {
    return (
      <div className="flex items-center">
        <div className="w-4 h-4 border-2 border-interactive border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-orange-500">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-error">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="hidden sm:inline">Sync error</span>
      </div>
    );
  }

  // Don't show anything for synced or idle states
  return null;
};
