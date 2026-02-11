import { FC, useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui';
import { WorkoutSession, Exercise, WeightUnit, StrengthCompletedSet } from '../../types';
import { getExerciseById } from '../../data/exercises';
import { filterOutliers } from '../../utils/outlierFilter';

type MetricType = 'avgWeight' | 'estimated1RM';

interface ExerciseDataPoint {
  timestamp: number;
  date: string;
  avgWeight: number;
  estimated1RM: number;
  maxWeight: number;
  avgReps: number;
}

interface ExerciseOption {
  id: string;
  name: string;
  sessionCount: number;
}

interface ExerciseProgressChartProps {
  sessions: WorkoutSession[];
  customExercises: Exercise[];
  weightUnit: WeightUnit;
}

/**
 * Calculate estimated 1RM using Epley formula
 */
const calculateEpley1RM = (weight: number, reps: number): number => {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

/**
 * Get all exercises that have been done at least twice
 */
const getEligibleExercises = (
  sessions: WorkoutSession[],
  customExercises: Exercise[]
): ExerciseOption[] => {
  const exerciseCounts = new Map<string, number>();

  sessions.forEach((session) => {
    if (!session.completedAt) return;

    session.exercises.forEach((ex) => {
      if (ex.type === 'strength') {
        const current = exerciseCounts.get(ex.exerciseId) || 0;
        exerciseCounts.set(ex.exerciseId, current + 1);
      }
    });
  });

  const eligible: ExerciseOption[] = [];

  exerciseCounts.forEach((count, exerciseId) => {
    if (count >= 2) {
      const exerciseInfo = getExerciseById(exerciseId, customExercises);
      eligible.push({
        id: exerciseId,
        name: exerciseInfo?.name || exerciseId,
        sessionCount: count,
      });
    }
  });

  // Sort by session count descending, then by name
  return eligible.sort((a, b) => {
    if (b.sessionCount !== a.sessionCount) {
      return b.sessionCount - a.sessionCount;
    }
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get chart data for a specific exercise
 */
const getExerciseChartData = (
  exerciseId: string,
  sessions: WorkoutSession[]
): ExerciseDataPoint[] => {
  const dataPoints: ExerciseDataPoint[] = [];

  sessions.forEach((session) => {
    if (!session.completedAt) return;

    session.exercises.forEach((ex) => {
      if (ex.exerciseId !== exerciseId) return;
      if (ex.type !== 'strength') return;

      const strengthSets = ex.sets.filter(
        (set): set is StrengthCompletedSet =>
          set.type === 'strength' || !('type' in set)
      );

      if (strengthSets.length === 0) return;

      const filteredSets = filterOutliers(strengthSets, (s) => s.weight);
      const weights = filteredSets.map((s) => s.weight);
      const reps = filteredSets.map((s) => s.reps);
      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      const avgReps = reps.reduce((a, b) => a + b, 0) / reps.length;
      const maxWeight = Math.max(...weights);
      const estimated1RM = calculateEpley1RM(maxWeight, Math.round(avgReps));

      dataPoints.push({
        timestamp: new Date(session.completedAt!).getTime(),
        date: session.completedAt!,
        avgWeight: Math.round(avgWeight * 10) / 10,
        estimated1RM: Math.round(estimated1RM * 10) / 10,
        maxWeight,
        avgReps: Math.round(avgReps * 10) / 10,
      });
    });
  });

  // Sort by date ascending
  return dataPoints.sort((a, b) => a.timestamp - b.timestamp);
};

export const ExerciseProgressChart: FC<ExerciseProgressChartProps> = ({
  sessions,
  customExercises,
  weightUnit,
}) => {
  const [metric, setMetric] = useState<MetricType>('estimated1RM');

  // Get all eligible exercises
  const eligibleExercises = useMemo(
    () => getEligibleExercises(sessions, customExercises),
    [sessions, customExercises]
  );

  // Default to the most frequently done exercise
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    eligibleExercises[0]?.id || ''
  );

  // Update selected exercise if the current one is no longer valid
  const currentExerciseId = useMemo(() => {
    if (eligibleExercises.find((e) => e.id === selectedExerciseId)) {
      return selectedExerciseId;
    }
    return eligibleExercises[0]?.id || '';
  }, [selectedExerciseId, eligibleExercises]);

  // Get chart data for selected exercise
  const chartData = useMemo(
    () => getExerciseChartData(currentExerciseId, sessions),
    [currentExerciseId, sessions]
  );

  // Calculate progress stats
  const progressStats = useMemo(() => {
    if (chartData.length < 2) return null;

    const first = chartData[0];
    const last = chartData[chartData.length - 1];

    const firstValue = metric === 'estimated1RM' ? first.estimated1RM : first.avgWeight;
    const lastValue = metric === 'estimated1RM' ? last.estimated1RM : last.avgWeight;

    const change = lastValue - firstValue;
    const percentChange = firstValue > 0 ? (change / firstValue) * 100 : 0;

    return {
      firstValue,
      lastValue,
      change,
      percentChange,
    };
  }, [chartData, metric]);

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

  // Don't render if no eligible exercises
  if (eligibleExercises.length === 0) {
    return null;
  }

  const selectedExercise = eligibleExercises.find((e) => e.id === currentExerciseId);
  const metricLabel = metric === 'estimated1RM' ? 'Est. 1RM' : 'Avg Weight';

  return (
    <Card padding="lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Exercise Progress</h3>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <Select value={currentExerciseId} onValueChange={setSelectedExerciseId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select exercise" />
          </SelectTrigger>
          <SelectContent>
            {eligibleExercises.map((ex) => (
              <SelectItem key={ex.id} value={ex.id}>
                {ex.name} ({ex.sessionCount})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={metric} onValueChange={(v) => setMetric(v as MetricType)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="estimated1RM">Est. 1RM</SelectItem>
            <SelectItem value="avgWeight">Avg Weight</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Progress Stats */}
      {progressStats && (
        <div className="flex gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Current {metricLabel}</p>
            <p className="text-xl font-bold text-foreground">
              {progressStats.lastValue.toFixed(1)} {weightUnit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Change</p>
            <p
              className={`text-xl font-bold ${
                progressStats.change > 0
                  ? 'text-green-500'
                  : progressStats.change < 0
                  ? 'text-red-500'
                  : 'text-foreground'
              }`}
            >
              {progressStats.change > 0 ? '+' : ''}
              {progressStats.change.toFixed(1)} {weightUnit}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">% Change</p>
            <p
              className={`text-xl font-bold ${
                progressStats.percentChange > 0
                  ? 'text-green-500'
                  : progressStats.percentChange < 0
                  ? 'text-red-500'
                  : 'text-foreground'
              }`}
            >
              {progressStats.percentChange > 0 ? '+' : ''}
              {progressStats.percentChange.toFixed(1)}%
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length >= 2 ? (
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
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value, name) => {
                  const label = name === 'estimated1RM' ? 'Est. 1RM' : 'Avg Weight';
                  return [`${(value as number).toFixed(1)} ${weightUnit}`, label];
                }}
                labelFormatter={(timestamp) => formatDate(timestamp as number)}
              />
              <Line
                type="monotone"
                dataKey={metric}
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: 'var(--primary)', strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, fill: 'var(--primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            Complete {selectedExercise?.name || 'this exercise'} at least twice to see progress
          </p>
        </div>
      )}

      {chartData.length >= 2 && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Based on {chartData.length} session{chartData.length !== 1 ? 's' : ''}
        </p>
      )}
    </Card>
  );
};
