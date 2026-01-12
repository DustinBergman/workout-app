import { useMemo, useEffect, useRef, RefObject } from 'react';
import { WorkoutSession } from '../types';

export type WorkoutType = 'none' | 'strength' | 'cardio' | 'both';

export interface HeatmapDay {
  date: Date;
  workoutType: WorkoutType;
  sessions: WorkoutSession[];
}

export interface MonthLabel {
  label: string;
  weekIndex: number;
}

export interface UseWorkoutHeatmapProps {
  sessions: WorkoutSession[];
  memberSince?: Date | string;
}

export interface UseWorkoutHeatmapReturn {
  weeks: HeatmapDay[][];
  monthLabels: MonthLabel[];
  dayLabels: string[];
  scrollContainerRef: RefObject<HTMLDivElement>;
  getWorkoutLabel: (workoutType: WorkoutType, count: number) => string;
}

// Determine if a session is strength or cardio based on its exercises
export const getSessionType = (session: WorkoutSession): 'strength' | 'cardio' => {
  const hasStrength = session.exercises.some(ex => ex.type === 'strength');
  const hasCardio = session.exercises.some(ex => ex.type === 'cardio');
  // If mixed or only strength, treat as strength; only cardio if all cardio
  return hasCardio && !hasStrength ? 'cardio' : 'strength';
};

// Determine what types of workouts happened on a day
export const getDayWorkoutType = (sessions: WorkoutSession[]): WorkoutType => {
  if (sessions.length === 0) return 'none';

  const types = sessions.map(getSessionType);
  const hasStrength = types.includes('strength');
  const hasCardio = types.includes('cardio');

  if (hasStrength && hasCardio) return 'both';
  if (hasCardio) return 'cardio';
  return 'strength';
};

// Get a human-readable label for workout type and count
export const getWorkoutLabel = (workoutType: WorkoutType, count: number): string => {
  if (count === 0) return 'No workouts';
  const typeLabel = workoutType === 'both' ? 'strength & cardio' : workoutType;
  return `${count} ${typeLabel} workout${count !== 1 ? 's' : ''}`;
};

// Align a date to the Monday of its week
export const alignToMonday = (date: Date): Date => {
  const result = new Date(date);
  const daysSinceMonday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - daysSinceMonday);
  return result;
};

// Generate heatmap data from sessions
export const generateHeatmapData = (
  sessions: WorkoutSession[],
  memberSince?: Date | string,
  today: Date = new Date()
): { weeks: HeatmapDay[][]; monthLabels: MonthLabel[] } => {
  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  // Create map of workouts by date string
  const workoutMap = new Map<string, WorkoutSession[]>();
  let firstWorkoutDate: Date | null = null;

  sessions.forEach((session) => {
    const date = new Date(session.startedAt);
    const dateKey = date.toDateString();
    const existing = workoutMap.get(dateKey) || [];
    existing.push(session);
    workoutMap.set(dateKey, existing);

    // Track earliest workout date
    if (!firstWorkoutDate || date < firstWorkoutDate) {
      firstWorkoutDate = new Date(date);
    }
  });

  // Determine the active since date (earlier of memberSince or first workout)
  let activeDate: Date | null = null;

  if (memberSince) {
    activeDate = new Date(memberSince);
    activeDate.setHours(0, 0, 0, 0);
  }

  if (firstWorkoutDate !== null) {
    const normalizedFirstWorkout = new Date(firstWorkoutDate);
    normalizedFirstWorkout.setHours(0, 0, 0, 0);
    if (!activeDate || normalizedFirstWorkout < activeDate) {
      activeDate = normalizedFirstWorkout;
    }
  }

  // Generate weeks of data starting from activeDate (or 52 weeks ago if no activeDate)
  const weeksData: HeatmapDay[][] = [];
  const months: MonthLabel[] = [];

  // Determine start date - use activeDate aligned to Monday, or default to 52 weeks ago
  let startDate: Date;
  if (activeDate) {
    startDate = alignToMonday(activeDate);
  } else {
    // Default: start from 52 weeks ago, aligned to Monday
    startDate = new Date(normalizedToday);
    startDate.setDate(startDate.getDate() - 364);
    startDate = alignToMonday(startDate);
  }

  let currentMonth = -1;
  let weekIndex = 0;

  const currentDate = new Date(startDate);
  while (currentDate <= normalizedToday) {
    const week: HeatmapDay[] = [];

    for (let day = 0; day < 7; day++) {
      const dateKey = currentDate.toDateString();
      const daySessions = workoutMap.get(dateKey) || [];

      // Track month labels based on Thursday (middle of week) for better alignment at month boundaries
      if (currentDate.getMonth() !== currentMonth && day === 3) {
        currentMonth = currentDate.getMonth();
        months.push({
          label: currentDate.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex,
        });
      }

      week.push({
        date: new Date(currentDate),
        workoutType: getDayWorkoutType(daySessions),
        sessions: daySessions,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    weeksData.push(week);
    weekIndex++;
  }

  return {
    weeks: weeksData,
    monthLabels: months,
  };
};

export const useWorkoutHeatmap = ({
  sessions,
  memberSince,
}: UseWorkoutHeatmapProps): UseWorkoutHeatmapReturn => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the right (most recent) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  const { weeks, monthLabels } = useMemo(
    () => generateHeatmapData(sessions, memberSince),
    [sessions, memberSince]
  );

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return {
    weeks,
    monthLabels,
    dayLabels,
    scrollContainerRef: scrollContainerRef as RefObject<HTMLDivElement>,
    getWorkoutLabel,
  };
};
