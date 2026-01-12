import { FC } from 'react';
import { ProgressIndicatorComponent } from '../../../services/openai/ptSummary';

interface ProgressIndicatorProps {
  component: ProgressIndicatorComponent;
}

export const ProgressIndicator: FC<ProgressIndicatorProps> = ({ component }) => {
  const getStatusConfig = () => {
    switch (component.status) {
      case 'improving':
        return {
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
          dotColor: 'bg-green-500',
          label: 'Improving',
        };
      case 'maintaining':
        return {
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
          dotColor: 'bg-yellow-500',
          label: 'Maintaining',
        };
      case 'plateau':
        return {
          color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
          dotColor: 'bg-orange-500',
          label: 'Plateau',
        };
      case 'declining':
        return {
          color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
          dotColor: 'bg-red-500',
          label: 'Needs Attention',
        };
      default:
        return {
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
          dotColor: 'bg-gray-500',
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`rounded-lg p-3 ${config.color}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{component.area}</span>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>
      {component.detail && (
        <p className="text-xs mt-1 opacity-80">{component.detail}</p>
      )}
    </div>
  );
};
