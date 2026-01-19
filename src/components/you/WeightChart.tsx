import { FC, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { WeightEntry, WeightUnit } from '../../types';

interface WeightChartProps {
  entries: WeightEntry[];
  weightUnit: WeightUnit;
}

export const WeightChart: FC<WeightChartProps> = ({ entries, weightUnit }) => {
  const chartData = useMemo(() => {
    // Sort entries by date and take last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    return [...entries]
      .filter((e) => new Date(e.date) >= sixtyDaysAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        timestamp: new Date(entry.date).getTime(),
        weight: entry.weight,
        date: entry.date,
      }));
  }, [entries]);

  // Calculate time domain for x-axis
  const timeDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 0];
    const timestamps = chartData.map((d) => d.timestamp);
    return [Math.min(...timestamps), Math.max(...timestamps)];
  }, [chartData]);

  // Format timestamp for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const weightStats = useMemo(() => {
    if (chartData.length === 0) return null;

    const weights = chartData.map((d) => d.weight);
    const current = weights[weights.length - 1];
    const first = weights[0];
    const change = current - first;
    const min = Math.min(...weights);
    const max = Math.max(...weights);

    return { current, change, min, max };
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground text-sm">
          No weight data yet. Start tracking your weight to see trends.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Weight Stats */}
      {weightStats && (
        <div className="flex gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-xl font-bold text-foreground">
              {weightStats.current.toFixed(1)} {weightUnit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Change (60d)</p>
            <p
              className={`text-xl font-bold ${
                weightStats.change > 0
                  ? 'text-red-500'
                  : weightStats.change < 0
                  ? 'text-green-500'
                  : 'text-foreground'
              }`}
            >
              {weightStats.change > 0 ? '+' : ''}
              {weightStats.change.toFixed(1)} {weightUnit}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={timeDomain}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tickFormatter={formatDate}
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toFixed(0)}
            />
            {weightStats && (
              <ReferenceLine
                y={weightStats.current}
                stroke="var(--primary)"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value) => [`${(value as number).toFixed(1)} ${weightUnit}`, 'Weight']}
              labelFormatter={(timestamp) => formatDate(timestamp as number)}
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: 'var(--primary)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
