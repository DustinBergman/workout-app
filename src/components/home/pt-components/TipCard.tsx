import { FC } from 'react';
import { Wrench, Heart, TrendingUp, Shuffle, Brain } from 'lucide-react';
import { TipComponent } from '../../../services/openai/ptSummary';

interface TipCardProps {
  component: TipComponent;
}

export const TipCard: FC<TipCardProps> = ({ component }) => {
  const getCategoryConfig = () => {
    switch (component.category) {
      case 'technique':
        return {
          icon: <Wrench className="w-4 h-4 text-blue-500" />,
          label: 'Technique',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        };
      case 'recovery':
        return {
          icon: <Heart className="w-4 h-4 text-pink-500" />,
          label: 'Recovery',
          bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        };
      case 'progression':
        return {
          icon: <TrendingUp className="w-4 h-4 text-green-500" />,
          label: 'Progression',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
        };
      case 'variety':
        return {
          icon: <Shuffle className="w-4 h-4 text-purple-500" />,
          label: 'Variety',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        };
      case 'mindset':
        return {
          icon: <Brain className="w-4 h-4 text-indigo-500" />,
          label: 'Mindset',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        };
      default:
        return {
          icon: <TrendingUp className="w-4 h-4 text-gray-500" />,
          label: 'Tip',
          bgColor: 'bg-gray-50 dark:bg-gray-800',
        };
    }
  };

  const config = getCategoryConfig();

  return (
    <div className={`rounded-lg p-3 ${config.bgColor}`}>
      <div className="flex items-center gap-2 mb-1.5">
        {config.icon}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {config.label}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {component.message}
      </p>
    </div>
  );
};
