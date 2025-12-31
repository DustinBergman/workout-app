import { FC } from 'react';

export interface ScoreErrorToastProps {
  error: string | null;
}

export const ScoreErrorToast: FC<ScoreErrorToastProps> = ({ error }) => {
  if (!error) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
      <p className="text-sm">Failed to get score: {error}</p>
      <p className="text-xs mt-1">Redirecting to history...</p>
    </div>
  );
};
