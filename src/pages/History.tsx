import { FC, createElement, useCallback } from 'react';
import { Card } from '../components/ui';
import {
  WorkoutHeatmap,
  HistorySessionCard,
} from '../components/history';
import {
  useWorkoutHistory,
  formatHistoryDate,
} from '../hooks/useWorkoutHistory';
import { useModal } from '../contexts/ModalContext';
import {
  SessionDetailModalWrapper,
  DeleteSessionModalWrapper,
} from '../components/modals';
import { WorkoutSession } from '../types';

export const History: FC = () => {
  const { openModal } = useModal();
  const {
    preferences,
    viewMode,
    selectedDate,
    listRef,
    setViewMode,
    sortedSessions,
    groupedSessions,
    filteredSessions,
    handleDayClick,
    clearDateFilter,
  } = useWorkoutHistory();

  const openSessionDetail = useCallback((session: WorkoutSession) => {
    openModal(createElement(SessionDetailModalWrapper, { session }));
  }, [openModal]);

  const openDeleteConfirmation = useCallback((session: WorkoutSession) => {
    openModal(createElement(DeleteSessionModalWrapper, { session }));
  }, [openModal]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, session: WorkoutSession) => {
    e.stopPropagation();
    openDeleteConfirmation(session);
  }, [openDeleteConfirmation]);

  return (
    <div className="relative min-h-screen bg-transparent">
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
      </div>

      <div className="relative z-10 p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Workout History
          </h1>
          <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        {sortedSessions.length === 0 ? (
          <Card className="text-center py-8">
            <svg
              className="w-12 h-12 mx-auto text-gray-400 mb-4"
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
            <p className="text-gray-600 dark:text-gray-400">
              No workout history yet. Complete a workout to see it here!
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Heatmap View */}
            {viewMode === 'heatmap' && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Workout Activity
                </h2>
                <WorkoutHeatmap sessions={sortedSessions} onDayClick={handleDayClick} />
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sortedSessions.length} total workouts | Click a day to see details
                  </p>
                </div>
              </Card>
            )}

            {/* Date filter indicator */}
            {selectedDate && (
              <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 rounded-lg px-4 py-2">
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Showing workouts from{' '}
                  {selectedDate.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <button
                  onClick={clearDateFilter}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Session List */}
            <div ref={listRef}>
              {(selectedDate
                ? [[selectedDate.toDateString(), filteredSessions]]
                : Object.entries(groupedSessions)
              ).map(([dateKey, sessions]) => (
                <div key={dateKey as string} className="mb-6">
                  <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {formatHistoryDate(
                      (sessions as WorkoutSession[])[0]?.startedAt || (dateKey as string)
                    )}
                  </h2>
                  <div className="space-y-3">
                    {(sessions as WorkoutSession[]).map((session) => (
                      <HistorySessionCard
                        key={session.id}
                        session={session}
                        weightUnit={preferences.weightUnit}
                        distanceUnit={preferences.distanceUnit}
                        onClick={() => openSessionDetail(session)}
                        onDeleteClick={(e) => handleDeleteClick(e, session)}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {selectedDate && filteredSessions.length === 0 && (
                <Card className="text-center py-6">
                  <p className="text-gray-500 dark:text-gray-400">No workouts on this day</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
