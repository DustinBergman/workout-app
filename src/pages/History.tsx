import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Card, Modal } from '../components/ui';
import { getExerciseById } from '../data/exercises';
import { WorkoutSession, SessionExercise } from '../types';
import { WorkoutHeatmap } from '../components/history/WorkoutHeatmap';

export function History() {
  const { state } = useApp();
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'heatmap'>('list');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sortedSessions = [...state.sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const getSessionStats = (session: WorkoutSession) => {
    let totalSets = 0;
    let totalVolume = 0;
    let totalReps = 0;

    session.exercises.forEach((ex: SessionExercise) => {
      ex.sets.forEach((set) => {
        totalSets++;
        totalVolume += set.weight * set.reps;
        totalReps += set.reps;
      });
    });

    return { totalSets, totalVolume, totalReps };
  };

  const formatDuration = (session: WorkoutSession) => {
    if (!session.completedAt) return 'In progress';
    const start = new Date(session.startedAt);
    const end = new Date(session.completedAt);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return `${hours}h ${remainingMins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  // Group sessions by date
  const groupedSessions: { [key: string]: WorkoutSession[] } = {};
  sortedSessions.forEach((session) => {
    const dateKey = new Date(session.startedAt).toDateString();
    if (!groupedSessions[dateKey]) {
      groupedSessions[dateKey] = [];
    }
    groupedSessions[dateKey].push(session);
  });

  // Filter sessions by selected date (for heatmap click)
  const filteredSessions = selectedDate
    ? sortedSessions.filter(
        (s) => new Date(s.startedAt).toDateString() === selectedDate.toDateString()
      )
    : sortedSessions;

  const handleDayClick = (date: Date, daySessions: WorkoutSession[]) => {
    if (daySessions.length > 0) {
      setSelectedDate(date);
      // Scroll list into view
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      setSelectedDate(null);
    }
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  return (
    <div className="p-4 pb-20">
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
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <WorkoutHeatmap
                sessions={sortedSessions}
                onDayClick={handleDayClick}
              />
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
                Showing workouts from {selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
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
            {(selectedDate ? [[selectedDate.toDateString(), filteredSessions]] : Object.entries(groupedSessions)).map(([dateKey, sessions]) => (
              <div key={dateKey as string} className="mb-6">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  {formatDate((sessions as WorkoutSession[])[0]?.startedAt || dateKey as string)}
                </h2>
                <div className="space-y-3">
                  {(sessions as WorkoutSession[]).map((session) => {
                    const stats = getSessionStats(session);
                    return (
                      <Card
                        key={session.id}
                        className="cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                        onClick={() => setSelectedSession(session)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {session.name}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {session.exercises.length} exercises | {formatDuration(session)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {stats.totalSets} sets
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {stats.totalVolume.toLocaleString()} {state.preferences.weightUnit}
                            </p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
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

      {/* Session Detail Modal */}
      <Modal
        isOpen={!!selectedSession}
        onClose={() => setSelectedSession(null)}
        title={selectedSession?.name || 'Workout Details'}
      >
        {selectedSession && (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>{new Date(selectedSession.startedAt).toLocaleString()}</span>
              <span>{formatDuration(selectedSession)}</span>
            </div>

            {selectedSession.exercises.map((exercise, index) => {
              const info = getExerciseById(exercise.exerciseId, state.customExercises);
              return (
                <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {info?.name || 'Unknown Exercise'}
                  </h4>
                  {exercise.sets.length > 0 ? (
                    <div className="space-y-1">
                      {exercise.sets.map((set, setIndex) => (
                        <div
                          key={setIndex}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-500 dark:text-gray-400">
                            Set {setIndex + 1}
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {set.weight} {set.unit} x {set.reps} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No sets recorded</p>
                  )}
                </div>
              );
            })}

            {/* Summary */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {getSessionStats(selectedSession).totalSets}
                  </p>
                  <p className="text-xs text-gray-500">Sets</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {getSessionStats(selectedSession).totalReps}
                  </p>
                  <p className="text-xs text-gray-500">Reps</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {getSessionStats(selectedSession).totalVolume.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{state.preferences.weightUnit}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
