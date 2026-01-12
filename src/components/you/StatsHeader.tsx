import { FC } from 'react';
import { TimePeriod } from '../../hooks/useUserStats';

interface StatsHeaderProps {
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
}

export const StatsHeader: FC<StatsHeaderProps> = ({ timePeriod, onTimePeriodChange }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-foreground">Your Stats</h1>
      <select
        value={timePeriod}
        onChange={(e) => onTimePeriodChange(e.target.value as TimePeriod)}
        className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="all">All time</option>
      </select>
    </div>
  );
};
