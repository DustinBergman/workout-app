import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../ui';

export const ApiKeyBanner: FC = () => {
  return (
    <Link to="/settings">
      <Card className="mb-6 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
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
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Enable AI Features
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
              Add your OpenAI API key in settings for smart suggestions
            </p>
          </div>
          <svg
            className="w-5 h-5 text-amber-600 dark:text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </Card>
    </Link>
  );
};
