import { FC } from 'react';
import { Card, Button } from '../ui';
import { DeloadRecommendation, DeloadUrgency } from '../../services/deloadDetection';

interface DeloadRecommendationBannerProps {
  recommendation: DeloadRecommendation;
  onDismiss: () => void;
  onStartDeload?: () => void;
}

const urgencyConfig: Record<DeloadUrgency, {
  bgColor: string;
  borderColor: string;
  iconBgColor: string;
  textColor: string;
  subTextColor: string;
  title: string;
}> = {
  immediate: {
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconBgColor: 'bg-red-500/20',
    textColor: 'text-red-700 dark:text-red-300',
    subTextColor: 'text-red-600/80 dark:text-red-400/80',
    title: 'Recovery Recommended',
  },
  soon: {
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    iconBgColor: 'bg-orange-500/20',
    textColor: 'text-orange-700 dark:text-orange-300',
    subTextColor: 'text-orange-600/80 dark:text-orange-400/80',
    title: 'Consider a Deload',
  },
  optional: {
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    iconBgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    subTextColor: 'text-yellow-600/80 dark:text-yellow-400/80',
    title: 'Deload May Help',
  },
};

export const DeloadRecommendationBanner: FC<DeloadRecommendationBannerProps> = ({
  recommendation,
  onDismiss,
  onStartDeload,
}) => {
  const config = urgencyConfig[recommendation.urgency];

  return (
    <Card className={`mb-6 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`p-2 rounded-lg ${config.iconBgColor} flex-shrink-0`}>
          <svg
            className={`w-5 h-5 ${config.textColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.textColor}`}>
            {config.title}
          </p>
          <p className={`text-xs ${config.subTextColor} mt-0.5`}>
            {recommendation.reasons[0] || 'Consider taking a recovery week'}
          </p>
          {recommendation.suggestedAction && (
            <p className={`text-xs ${config.subTextColor} mt-1`}>
              {recommendation.suggestedAction}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {onStartDeload && recommendation.urgency !== 'optional' && (
              <Button
                size="sm"
                onClick={onStartDeload}
                className="text-xs"
              >
                Start Deload Week
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className={`text-xs ${config.subTextColor}`}
            >
              {recommendation.urgency === 'optional' ? 'Got it' : 'Dismiss'}
            </Button>
          </div>
        </div>

        {/* Dismiss X button */}
        <button
          onClick={onDismiss}
          className={`p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 ${config.subTextColor}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </Card>
  );
};
