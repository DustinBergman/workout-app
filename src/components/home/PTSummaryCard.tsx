import { FC, useState } from 'react';
import { Sparkles, Target, ChevronDown } from 'lucide-react';
import { Card } from '../ui';
import { PTSummaryResponse } from '../../services/openai/ptSummary';
import { PTComponentRenderer } from './pt-components';
import { cn } from '@/lib/utils';

interface PTSummaryCardProps {
  summary: PTSummaryResponse | null;
  loading: boolean;
}

export const PTSummaryCard: FC<PTSummaryCardProps> = ({ summary, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <section className="mb-6">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
          <div className="animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-200 dark:bg-purple-700 rounded" />
              <div className="h-4 w-32 bg-purple-200 dark:bg-purple-700 rounded" />
            </div>
          </div>
        </Card>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  const hasExpandableContent = summary.components.length > 0 || summary.nextSessionFocus;

  return (
    <section className="mb-6">
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-purple-900 dark:text-purple-100 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
            AI Suggestions
          </h2>
          {hasExpandableContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
            >
              {isExpanded ? 'Less' : 'More'}
              <ChevronDown
                className={cn(
                  'w-3 h-3 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            </button>
          )}
        </div>

        {/* Summary Paragraph - Always visible */}
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {summary.summary}
        </p>

        {/* Expandable Content */}
        {hasExpandableContent && (
          <div
            className={cn(
              'overflow-hidden transition-all duration-200 ease-in-out',
              isExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'
            )}
          >
            {/* Dynamic Components Grid */}
            {summary.components.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {summary.components.map((component, index) => (
                  <div
                    key={index}
                    className={
                      // Make tips and progress indicators span full width
                      component.type === 'tip' || component.type === 'progress_indicator'
                        ? 'col-span-2'
                        : ''
                    }
                  >
                    <PTComponentRenderer component={component} />
                  </div>
                ))}
              </div>
            )}

            {/* Next Session Focus */}
            {summary.nextSessionFocus && (
              <div className="mt-4 pt-3 border-t border-purple-200 dark:border-purple-700">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                      Next Session Focus
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-0.5">
                      {summary.nextSessionFocus}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </section>
  );
};
