import { FC } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { StatCardComponent } from '../../../services/openai/ptSummary';

interface StatCardProps {
  component: StatCardComponent;
}

export const StatCard: FC<StatCardProps> = ({ component }) => {
  const getTrendIcon = () => {
    switch (component.trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (component.trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 flex flex-col">
      <div className="flex items-center gap-1.5 mb-1">
        {getTrendIcon()}
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {component.label}
        </span>
      </div>
      <div className={`text-xl font-bold ${getTrendColor()}`}>
        {component.value}
      </div>
      {component.subtitle && (
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
          {component.subtitle}
        </span>
      )}
    </div>
  );
};
