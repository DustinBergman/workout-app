import { FC } from 'react';
import { PTComponent } from '../../../services/openai/ptSummary';
import { StatCard } from './StatCard';
import { ProgressIndicator } from './ProgressIndicator';
import { HighlightBadge } from './HighlightBadge';
import { TipCard } from './TipCard';

interface PTComponentRendererProps {
  component: PTComponent;
}

export const PTComponentRenderer: FC<PTComponentRendererProps> = ({ component }) => {
  switch (component.type) {
    case 'stat_card':
      return <StatCard component={component} />;
    case 'progress_indicator':
      return <ProgressIndicator component={component} />;
    case 'highlight_badge':
      return <HighlightBadge component={component} />;
    case 'tip':
      return <TipCard component={component} />;
    default:
      return null;
  }
};
