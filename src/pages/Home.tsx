import { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Modal } from '../components/ui';
import { calculateSessionStats } from '../hooks/useSessionStats';
import { useStartWorkout } from '../hooks/useStartWorkout';

export const Home: FC = () => {
  const templates = useAppStore((state) => state.templates);
  const sessions = useAppStore((state) => state.sessions);
  const activeSession = useAppStore((state) => state.activeSession);
  const preferences = useAppStore((state) => state.preferences);
  const navigate = useNavigate();
  const { isLoadingSuggestions, startWorkout, startQuickWorkout } = useStartWorkout();

  const resumeWorkout = () => {
    navigate('/workout');
  };

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 3);

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Workout Tracker
      </h1>

      {/* Active Workout Banner */}
      {activeSession && (
        <Card className="mb-6 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Workout in progress
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {activeSession.name}
              </p>
            </div>
            <Button onClick={resumeWorkout}>Resume</Button>
          </div>
        </Card>
      )}

      {/* Quick Start */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          Quick Start
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={startQuickWorkout}
            className="h-20 flex flex-col items-center justify-center"
            variant="secondary"
          >
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Empty Workout
          </Button>
          <Link to="/templates" className="block">
            <Button
              className="w-full h-20 flex flex-col items-center justify-center"
              variant="secondary"
            >
              <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              From Template
            </Button>
          </Link>
        </div>
      </section>

      {/* Your Templates */}
      {templates.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Your Templates
            </h2>
            <Link to="/templates" className="text-sm text-blue-600 dark:text-blue-400">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {templates.slice(0, 3).map((template) => (
              <Card key={template.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {template.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {template.exercises.length} exercises
                  </p>
                </div>
                <Button size="sm" onClick={() => startWorkout(template)}>
                  Start
                </Button>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent Workouts */}
      {recentSessions.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Workouts
            </h2>
            <Link to="/history" className="text-sm text-blue-600 dark:text-blue-400">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentSessions.map((session) => {
              const stats = calculateSessionStats(session);
              return (
                <Card key={session.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {session.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {stats.totalSets} sets
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {stats.totalVolume.toLocaleString()} {preferences.weightUnit}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty State */}
      {templates.length === 0 && sessions.length === 0 && (
        <Card className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workouts yet. Create a template or start an empty workout!
          </p>
          <Link to="/templates">
            <Button>Create Template</Button>
          </Link>
        </Card>
      )}

      {/* AI Suggestions Loading Modal */}
      <Modal
        isOpen={isLoadingSuggestions}
        onClose={() => {}}
        title="Preparing Your Workout"
      >
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Getting AI recommendations...
          </p>
        </div>
      </Modal>
    </div>
  );
}
