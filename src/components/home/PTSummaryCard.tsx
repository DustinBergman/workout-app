import { FC, useState } from 'react';
import { Target, ChevronDown } from 'lucide-react';
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
        <Card>
          <div className="animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-fg-3/20 rounded" />
              <div className="h-4 w-32 bg-fg-3/20 rounded" />
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
      <Card
        padding="sm"
        className={cn(
          hasExpandableContent && 'cursor-pointer hover:bg-bg-2 transition-colors'
        )}
        onClick={hasExpandableContent ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-fg-1 flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="rainbow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ec4899" />
                  <stop offset="20%" stopColor="#a855f7" />
                  <stop offset="40%" stopColor="#3b82f6" />
                  <stop offset="60%" stopColor="#06b6d4" />
                  <stop offset="80%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
              </defs>
              <path
                d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"
                stroke="url(#rainbow-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"
                stroke="url(#rainbow-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 5v13"
                stroke="url(#rainbow-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            AI Suggestions
          </h2>
          {hasExpandableContent && (
            <ChevronDown
              className={cn(
                'w-4 h-4 text-fg-3 transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </div>

        {/* Summary Paragraph - Always visible */}
        <p className={cn(
          "text-sm text-fg-2",
          !isExpanded && "line-clamp-2"
        )}>
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
              <div className="mt-4 pt-3 border-t border-border-1">
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-interactive mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-medium text-fg-3 uppercase tracking-wide">
                      Next Session Focus
                    </span>
                    <p className="text-sm text-fg-2 mt-0.5">
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
