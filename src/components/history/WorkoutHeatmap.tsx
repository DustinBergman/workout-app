import { useMemo, useEffect, useRef, FC } from 'react';
import { WorkoutSession } from '../../types';

interface WorkoutHeatmapProps {
  sessions: WorkoutSession[];
  onDayClick?: (date: Date, sessions: WorkoutSession[]) => void;
}

type WorkoutType = 'none' | 'strength' | 'cardio' | 'both';

// Determine if a session is strength or cardio based on its exercises
const getSessionType = (session: WorkoutSession): 'strength' | 'cardio' => {
  const hasStrength = session.exercises.some(ex => ex.type === 'strength');
  const hasCardio = session.exercises.some(ex => ex.type === 'cardio');
  // If mixed or only strength, treat as strength; only cardio if all cardio
  return hasCardio && !hasStrength ? 'cardio' : 'strength';
};

// Determine what types of workouts happened on a day
const getDayWorkoutType = (sessions: WorkoutSession[]): WorkoutType => {
  if (sessions.length === 0) return 'none';

  const types = sessions.map(getSessionType);
  const hasStrength = types.includes('strength');
  const hasCardio = types.includes('cardio');

  if (hasStrength && hasCardio) return 'both';
  if (hasCardio) return 'cardio';
  return 'strength';
};

export const WorkoutHeatmap: FC<WorkoutHeatmapProps> = ({ sessions, onDayClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the right (most recent) on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, []);

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create map of workouts by date string
    const workoutMap = new Map<string, WorkoutSession[]>();
    sessions.forEach((session) => {
      const date = new Date(session.startedAt);
      const dateKey = date.toDateString();
      const existing = workoutMap.get(dateKey) || [];
      existing.push(session);
      workoutMap.set(dateKey, existing);
    });

    // Generate 52 weeks of data (plus partial current week)
    const weeksData: Array<Array<{ date: Date; workoutType: WorkoutType; sessions: WorkoutSession[] }>> = [];
    const months: Array<{ label: string; weekIndex: number }> = [];

    // Start from 52 weeks ago, aligned to Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // Go back ~52 weeks
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentMonth = -1;
    let weekIndex = 0;

    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const week: Array<{ date: Date; workoutType: WorkoutType; sessions: WorkoutSession[] }> = [];

      for (let day = 0; day < 7; day++) {
        const dateKey = currentDate.toDateString();
        const daySessions = workoutMap.get(dateKey) || [];

        // Track month labels
        if (currentDate.getMonth() !== currentMonth && day === 0) {
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
  }, [sessions]);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Render the day cell based on workout type
  const renderDayCell = (workoutType: WorkoutType, isToday: boolean, isFuture: boolean) => {
    const baseClasses = `w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-125 hover:ring-1 hover:ring-gray-400 ${isToday ? 'ring-1 ring-blue-500' : ''}`;

    if (isFuture) {
      return <div className={`${baseClasses} bg-transparent`} />;
    }

    switch (workoutType) {
      case 'none':
        return <div className={`${baseClasses} bg-gray-200 dark:bg-gray-700`} />;
      case 'strength':
        return <div className={`${baseClasses} bg-blue-500 dark:bg-blue-600`} />;
      case 'cardio':
        return <div className={`${baseClasses} bg-green-500 dark:bg-green-600`} />;
      case 'both':
        // Split vertically: blue on left, green on right
        return (
          <div className={`${baseClasses} overflow-hidden flex`}>
            <div className="w-1/2 h-full bg-blue-500 dark:bg-blue-600" />
            <div className="w-1/2 h-full bg-green-500 dark:bg-green-600" />
          </div>
        );
    }
  };

  const getWorkoutLabel = (workoutType: WorkoutType, count: number): string => {
    if (count === 0) return 'No workouts';
    const typeLabel = workoutType === 'both' ? 'strength & cardio' : workoutType;
    return `${count} ${typeLabel} workout${count !== 1 ? 's' : ''}`;
  };

  return (
    <div ref={scrollContainerRef} className="overflow-x-auto pb-2">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="flex ml-8 mb-1">
          {monthLabels.map((month, index) => {
            // Calculate position based on week index
            const nextMonth = monthLabels[index + 1];
            const width = nextMonth
              ? (nextMonth.weekIndex - month.weekIndex) * 14
              : (weeks.length - month.weekIndex) * 14;

            // Only show label if there's enough space (at least 30px)
            const showLabel = width >= 30;

            return (
              <div
                key={`${month.label}-${index}`}
                className="text-xs text-gray-500 dark:text-gray-400 overflow-hidden"
                style={{ width: `${width}px` }}
              >
                {showLabel ? month.label : ''}
              </div>
            );
          })}
        </div>

        {/* Heatmap grid */}
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col justify-around mr-1 text-xs text-gray-500 dark:text-gray-400">
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className="h-3 flex items-center"
                style={{ visibility: index % 2 === 1 ? 'visible' : 'hidden' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Weeks grid */}
          <div className="flex gap-[2px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[2px]">
                {week.map((day, dayIndex) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const isFuture = day.date > new Date();

                  return (
                    <div
                      key={dayIndex}
                      title={`${day.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} - ${getWorkoutLabel(day.workoutType, day.sessions.length)}`}
                      onClick={() => {
                        if (!isFuture && onDayClick) {
                          onDayClick(day.date, day.sessions);
                        }
                      }}
                    >
                      {renderDayCell(day.workoutType, isToday, isFuture)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end mt-2 gap-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-blue-500 dark:bg-blue-600" />
            <span>Strength</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-600" />
            <span>Cardio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm overflow-hidden flex">
              <div className="w-1/2 h-full bg-blue-500 dark:bg-blue-600" />
              <div className="w-1/2 h-full bg-green-500 dark:bg-green-600" />
            </div>
            <span>Both</span>
          </div>
        </div>
      </div>
    </div>
  );
}
