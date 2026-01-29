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
        <Card className="bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800">
          <div className="animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-200 dark:bg-emerald-700 rounded" />
              <div className="h-4 w-32 bg-emerald-200 dark:bg-emerald-700 rounded" />
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
      <Card className="bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
            AI Suggestions
          </h2>
          {hasExpandableContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
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
        <p className="text-sm text-emerald-800 dark:text-emerald-100 leading-relaxed">
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
              <div className="mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-700">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                      Next Session Focus
                    </span>
                    <p className="text-sm text-emerald-800 dark:text-emerald-100 mt-0.5">
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
