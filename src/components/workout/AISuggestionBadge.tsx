import { FC } from 'react';
import { ExerciseSuggestion, WeightUnit } from '../../types';

interface AISuggestionBadgeProps {
  suggestion: ExerciseSuggestion;
  weightUnit: WeightUnit;
}

const getConfidenceStyles = (confidence: 'high' | 'medium' | 'low') => {
  switch (confidence) {
    case 'high':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
};

const getProgressStyles = (status: string) => {
  switch (status) {
    case 'improving':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'plateau':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'declining':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
  }
};

export const AISuggestionBadge: FC<AISuggestionBadgeProps> = ({
  suggestion,
  weightUnit,
}) => {
  return (
    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="flex items-center gap-2">
        <svg
          className="w-4 h-4 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <span className="text-sm text-blue-700 dark:text-blue-300">
          AI suggests: {suggestion.suggestedWeight} {weightUnit} x {suggestion.suggestedReps}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded ${getConfidenceStyles(suggestion.confidence)}`}>
          {suggestion.confidence}
        </span>
        {suggestion.progressStatus && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${getProgressStyles(suggestion.progressStatus)}`}>
            {suggestion.progressStatus}
          </span>
        )}
      </div>
      <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
        {suggestion.reasoning}
      </p>

      {/* Technique tip for plateau exercises */}
      {suggestion.techniqueTip && (
        <div className="mt-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {suggestion.techniqueTip}
            </p>
          </div>
          {suggestion.repRangeChange && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 ml-6">
              Rep range: {suggestion.repRangeChange.from} → {suggestion.repRangeChange.to}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
