import { FC } from 'react';
import { Card } from '../ui';
import { WorkoutRecommendation, WeightUnit } from '../../types';

interface RecommendationsCardProps {
  recommendations: WorkoutRecommendation[];
  loadingRecommendations: boolean;
  weightUnit: WeightUnit;
}

export const RecommendationsCard: FC<RecommendationsCardProps> = ({
  recommendations,
  loadingRecommendations,
  weightUnit,
}) => {
  return (
    <section className="mb-6">
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Progressive Overload Recommendations
        </h2>
        <div className="space-y-2">
          {recommendations.slice(0, 3).map((rec, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {rec.exerciseName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {rec.reason}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  rec.type === 'increase'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : rec.type === 'decrease'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {rec.type === 'increase' && '+'}
                {rec.recommendedWeight} {weightUnit}
              </span>
            </div>
          ))}
        </div>
        {loadingRecommendations && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Loading...</p>
        )}
      </Card>
    </section>
  );
};
