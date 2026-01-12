import { FC } from 'react';
import { Trophy, Flame, Star, Medal, Target, Zap } from 'lucide-react';
import { HighlightBadgeComponent } from '../../../services/openai/ptSummary';

interface HighlightBadgeProps {
  component: HighlightBadgeComponent;
}

export const HighlightBadge: FC<HighlightBadgeProps> = ({ component }) => {
  const getIcon = () => {
    const iconClass = "w-5 h-5";
    switch (component.icon) {
      case 'trophy':
        return <Trophy className={`${iconClass} text-yellow-500`} />;
      case 'fire':
        return <Flame className={`${iconClass} text-orange-500`} />;
      case 'star':
        return <Star className={`${iconClass} text-purple-500`} />;
      case 'medal':
        return <Medal className={`${iconClass} text-blue-500`} />;
      case 'target':
        return <Target className={`${iconClass} text-green-500`} />;
      case 'lightning':
        return <Zap className={`${iconClass} text-yellow-400`} />;
      default:
        return <Star className={`${iconClass} text-gray-500`} />;
    }
  };

  const getBgColor = () => {
    switch (component.icon) {
      case 'trophy':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'fire':
        return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'star':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'medal':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'target':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'lightning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div className={`rounded-lg p-3 border ${getBgColor()} flex items-start gap-3`}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {component.title}
        </h4>
        {component.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {component.description}
          </p>
        )}
      </div>
    </div>
  );
};
