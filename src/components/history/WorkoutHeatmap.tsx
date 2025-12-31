import { useMemo, useEffect, useRef, FC } from 'react';
import { WorkoutSession } from '../../types';

interface WorkoutHeatmapProps {
  sessions: WorkoutSession[];
  onDayClick?: (date: Date, sessions: WorkoutSession[]) => void;
}

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
    const weeksData: Array<Array<{ date: Date; count: number; sessions: WorkoutSession[] }>> = [];
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
      const week: Array<{ date: Date; count: number; sessions: WorkoutSession[] }> = [];

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
          count: daySessions.length,
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

  const getColorClass = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (count === 1) return 'bg-green-200 dark:bg-green-900';
    if (count === 2) return 'bg-green-400 dark:bg-green-700';
    return 'bg-green-600 dark:bg-green-500';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
                      className={`w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-125 hover:ring-1 hover:ring-gray-400 ${
                        isFuture ? 'bg-transparent' : getColorClass(day.count)
                      } ${isToday ? 'ring-1 ring-blue-500' : ''}`}
                      title={`${day.date.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} - ${day.count} workout${day.count !== 1 ? 's' : ''}`}
                      onClick={() => {
                        if (!isFuture && onDayClick) {
                          onDayClick(day.date, day.sessions);
                        }
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end mt-2 gap-1 text-xs text-gray-500 dark:text-gray-400">
          <span>Less</span>
          <div className={`w-3 h-3 rounded-sm ${getColorClass(0)}`} />
          <div className={`w-3 h-3 rounded-sm ${getColorClass(1)}`} />
          <div className={`w-3 h-3 rounded-sm ${getColorClass(2)}`} />
          <div className={`w-3 h-3 rounded-sm ${getColorClass(3)}`} />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
