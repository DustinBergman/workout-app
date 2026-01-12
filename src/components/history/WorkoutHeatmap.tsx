import { FC } from 'react';
import { WorkoutSession } from '../../types';
import { useWorkoutHeatmap, WorkoutType } from '../../hooks/useWorkoutHeatmap';

interface WorkoutHeatmapProps {
  sessions: WorkoutSession[];
  onDayClick?: (date: Date, sessions: WorkoutSession[]) => void;
  /** The date the user signed up. Days before this will not show dots. */
  memberSince?: Date | string;
}

export const WorkoutHeatmap: FC<WorkoutHeatmapProps> = ({ sessions, onDayClick, memberSince }) => {
  const {
    weeks,
    monthLabels,
    dayLabels,
    scrollContainerRef,
    getWorkoutLabel,
  } = useWorkoutHeatmap({ sessions, memberSince });

  // Render the day cell based on workout type
  const renderDayCell = (workoutType: WorkoutType, isToday: boolean, isFuture: boolean) => {
    const baseClasses = `w-3 h-3 rounded-sm cursor-pointer transition-all hover:scale-125 hover:ring-1 hover:ring-gray-400 ${isToday ? 'ring-1 ring-blue-500' : ''}`;

    // Don't show dots for future days
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

  return (
    <div ref={scrollContainerRef} className="overflow-x-auto py-2">
      <div className="inline-block min-w-max">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {monthLabels.map((month, index) => {
            // Calculate position based on week index
            const nextMonth = monthLabels[index + 1];
            const width = nextMonth
              ? (nextMonth.weekIndex - month.weekIndex) * 14
              : (weeks.length - month.weekIndex) * 14;

            return (
              <div
                key={`${month.label}-${index}`}
                className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
                style={{ width: `${Math.max(width, 28)}px` }}
              >
                {month.label}
              </div>
            );
          })}
        </div>

        {/* Heatmap grid */}
        <div className="flex">
          {/* Day labels - sticky to left */}
          <div className="sticky left-0 z-10 flex flex-col gap-[2px] mr-1 text-xs text-gray-500 dark:text-gray-400">
            {dayLabels.map((day, index) => (
              <div
                key={day}
                className="h-3 flex items-center justify-end pr-1"
                style={{ visibility: index % 2 === 0 ? 'visible' : 'hidden' }}
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
                      title={isFuture ? undefined : `${day.date.toLocaleDateString('en-US', {
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
};
