import { FC, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useAppStore } from '../store/useAppStore';
import { Card, Button } from '../components/ui';
import { useUserStats, TimePeriod } from '../hooks/useUserStats';
import { MuscleGroup } from '../types';
import { WeightChart } from '../components/you';
import { WeightLogModal } from '../components/weight';

const MUSCLE_GROUP_COLORS: Record<MuscleGroup, string> = {
  chest: '#ef4444',
  back: '#3b82f6',
  shoulders: '#f97316',
  biceps: '#8b5cf6',
  triceps: '#a855f7',
  forearms: '#ec4899',
  core: '#eab308',
  quadriceps: '#22c55e',
  hamstrings: '#14b8a6',
  glutes: '#06b6d4',
  calves: '#84cc16',
  traps: '#6366f1',
  lats: '#0ea5e9',
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const formatMuscleGroup = (mg: MuscleGroup): string => {
  return mg.charAt(0).toUpperCase() + mg.slice(1);
};

export const You: FC = () => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const sessions = useAppStore((state) => state.sessions);
  const preferences = useAppStore((state) => state.preferences);
  const customExercises = useAppStore((state) => state.customExercises);
  const weightEntries = useAppStore((state) => state.weightEntries);

  const stats = useUserStats(sessions, timePeriod, customExercises);

  const pieChartData = stats.muscleGroupBreakdown.map((item) => ({
    name: formatMuscleGroup(item.muscleGroup),
    value: item.setCount,
    percentage: item.percentage,
    color: MUSCLE_GROUP_COLORS[item.muscleGroup],
  }));

  const hasEnoughData = stats.totalSessions >= 1;

  return (
    <div className="relative min-h-screen">
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      </div>

      <div className="relative z-10 p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Your Stats</h1>
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Empty State */}
        {!hasEnoughData && (
          <Card className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-muted-foreground mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Complete your first workout
            </h2>
            <p className="text-muted-foreground">
              Start tracking your progress by completing a workout session.
            </p>
          </Card>
        )}

        {/* Stats Content */}
        {hasEnoughData && (
          <div className="space-y-4">
            {/* Strength Increase */}
            <Card padding="lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                  <svg
                    className="w-6 h-6 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Strength Increase</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.averageStrengthIncrease > 0
                      ? `+${stats.averageStrengthIncrease.toFixed(1)}%`
                      : stats.totalSessions < 2
                      ? 'Need more data'
                      : '0%'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Weight Tracking */}
            <Card padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Weight Trend</h2>
                <Button size="sm" onClick={() => setShowWeightModal(true)}>
                  Log Weight
                </Button>
              </div>
              <WeightChart entries={weightEntries} weightUnit={preferences.weightUnit} />
            </Card>

            {/* Muscle Group Pie Chart */}
            {pieChartData.length > 0 && (
              <Card padding="lg">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                  Muscle Groups Worked
                </h2>
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
                        formatter={(value) => [
                          `${value} sets`,
                        ]}
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span className="text-sm text-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Top muscle groups list */}
                <div className="mt-4 space-y-2">
                  {pieChartData.slice(0, 5).map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Avg Duration */}
              <Card padding="md">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-xs text-muted-foreground">Avg Duration</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {formatDuration(stats.averageSessionDuration)}
                </p>
              </Card>

              {/* Sessions Per Week */}
              <Card padding="md">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-4 h-4 text-muted-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-xs text-muted-foreground">Per Week</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {stats.averageSessionsPerWeek.toFixed(1)}
                </p>
              </Card>
            </div>

            {/* Avg Volume */}
            <Card padding="lg">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30">
                  <svg
                    className="w-6 h-6 text-blue-600 dark:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Volume Per Session</p>
                  <p className="text-2xl font-bold text-foreground">
                    {stats.averageVolumePerSession.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}{' '}
                    {preferences.weightUnit}
                  </p>
                </div>
              </div>
            </Card>

            {/* Total Sessions Info */}
            <p className="text-center text-sm text-muted-foreground">
              Based on {stats.totalSessions} workout{stats.totalSessions !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Weight Log Modal */}
        <WeightLogModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
        />
      </div>
    </div>
  );
};
