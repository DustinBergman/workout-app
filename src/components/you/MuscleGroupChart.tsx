import { FC } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '../ui';

export interface PieChartDataItem {
  name: string;
  value: number;
  percentage: number;
  color: string;
  [key: string]: string | number;
}

interface MuscleGroupChartProps {
  pieChartData: PieChartDataItem[];
}

export const MuscleGroupChart: FC<MuscleGroupChartProps> = ({ pieChartData }) => {
  if (pieChartData.length === 0) {
    return null;
  }

  return (
    <Card padding="lg">
      <h2 className="text-lg font-semibold text-foreground mb-4">Muscle Groups Worked</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="var(--card)"
              strokeWidth={2}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value} sets`]}
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />
            <Legend
              formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Top muscle groups list */}
      <div className="mt-4 space-y-2">
        {pieChartData.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-foreground">{item.name}</span>
            </div>
            <span className="text-muted-foreground">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
