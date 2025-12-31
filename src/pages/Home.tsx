import { FC, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Button, Card, Modal, WeekBadge } from '../components/ui';
import { WorkoutHeatmap } from '../components/history/WorkoutHeatmap';
import { calculateSessionStats } from '../hooks/useSessionStats';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { ProgressiveOverloadWeek, PROGRESSIVE_OVERLOAD_WEEKS } from '../types';

export const Home: FC = () => {
  const templates = useAppStore((state) => state.templates);
  const sessions = useAppStore((state) => state.sessions);
  const activeSession = useAppStore((state) => state.activeSession);
  const preferences = useAppStore((state) => state.preferences);
  const currentWeek = useAppStore((state) => state.currentWeek);
  const setCurrentWeek = useAppStore((state) => state.setCurrentWeek);
  const navigate = useNavigate();
  const { isLoadingSuggestions, startWorkout, startQuickWorkout } = useStartWorkout();
  const [showWeekSelector, setShowWeekSelector] = useState(false);

  const resumeWorkout = () => {
    navigate('/workout');
  };

  const recentSessions = [...sessions]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 3);

  // Find the next suggested workout based on the most recent session
  const nextWorkout = useMemo(() => {
    if (templates.length === 0) return null;
    if (sessions.length === 0) return templates[0]; // No history, suggest first template

    // Find the most recent completed session with a template
    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    const lastSessionWithTemplate = sortedSessions.find(s => s.templateId);

    if (!lastSessionWithTemplate) return templates[0];

    // Find the index of the last used template
    const lastTemplateIndex = templates.findIndex(
      t => t.id === lastSessionWithTemplate.templateId
    );

    if (lastTemplateIndex === -1) return templates[0];

    // Get the next template (cycle back to start if at end)
    const nextIndex = (lastTemplateIndex + 1) % templates.length;
    return templates[nextIndex];
  }, [templates, sessions]);

  return (
    <div className="relative min-h-screen">
      {/* Floating Orbs Gradient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Top right orb - blue to purple */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-1" />
        {/* Bottom left orb - purple to pink */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-pink-500 rounded-full blur-3xl opacity-30 dark:opacity-20 animate-float-2" />
        {/* Center accent orb - cyan */}
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur-3xl opacity-15 dark:opacity-10 animate-float-3" />
        {/* Top left orb - teal to emerald */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full blur-3xl opacity-25 dark:opacity-15 animate-float-4" />
        {/* Bottom right orb - indigo to violet */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-tl from-indigo-400 to-violet-500 rounded-full blur-3xl opacity-25 dark:opacity-15 animate-float-5" />
        {/* Middle right orb - rose to orange */}
        <div className="absolute top-1/3 -right-10 w-56 h-56 bg-gradient-to-bl from-rose-400 to-orange-400 rounded-full blur-3xl opacity-20 dark:opacity-10 animate-float-6" />
      </div>

      <div className="relative z-10 p-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Workout Tracker
          </h1>
          <WeekBadge
            week={currentWeek}
            onClick={() => setShowWeekSelector(true)}
          />
        </div>

        {/* Progressive Overload Week Card */}
        <section className="mb-6">
          <WeekBadge
            week={currentWeek}
            showDetails
            onClick={() => setShowWeekSelector(true)}
          />
        </section>

      {/* Active Workout Banner */}
      {activeSession && (
        <Card className="mb-6 bg-primary/10 border-primary/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-primary font-medium">
                Workout in progress
              </p>
              <p className="text-lg font-semibold text-foreground">
                {activeSession.name}
              </p>
            </div>
            <Button onClick={resumeWorkout}>Resume</Button>
          </div>
        </Card>
      )}

      {/* Quick Start */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Quick Start
        </h2>

        {/* Next Workout Suggestion */}
        {nextWorkout && (
          <Card className="mb-3 bg-primary/10 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-primary font-medium uppercase tracking-wide mb-1">
                  Up Next
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {nextWorkout.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {nextWorkout.exercises.length} exercises
                </p>
              </div>
              <Button onClick={() => startWorkout(nextWorkout)}>
                Start
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={startQuickWorkout}
            className="h-20 flex flex-col items-center justify-center bg-card/60 backdrop-blur-lg border border-border/50 hover:bg-card/80"
            variant="ghost"
          >
            <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Empty Workout
          </Button>
          <Link to="/templates" className="block">
            <Button
              className="w-full h-20 flex flex-col items-center justify-center bg-card/60 backdrop-blur-lg border border-border/50 hover:bg-card/80"
              variant="ghost"
            >
              <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              From Template
            </Button>
          </Link>
        </div>
      </section>

      {/* Workout Heatmap */}
      {sessions.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Activity
            </h2>
            <Link to="/history" className="text-sm text-primary">
              View history
            </Link>
          </div>
          <Card padding="sm">
            <WorkoutHeatmap sessions={sessions} />
          </Card>
        </section>
      )}

      {/* Your Templates */}
      {templates.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              Your Templates
            </h2>
            <Link to="/templates" className="text-sm text-primary">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {templates.slice(0, 3).map((template) => (
              <Card key={template.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {template.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
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
            <h2 className="text-lg font-semibold text-foreground">
              Recent Workouts
            </h2>
            <Link to="/history" className="text-sm text-primary">
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
                      <p className="font-medium text-foreground">
                        {session.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {stats.totalSets} sets
                      </p>
                      <p className="text-sm text-muted-foreground">
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
          <svg className="w-12 h-12 mx-auto text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-muted-foreground mb-4">
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
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Getting AI recommendations...
          </p>
        </div>
      </Modal>

      {/* Week Selector Modal */}
      <Modal
        isOpen={showWeekSelector}
        onClose={() => setShowWeekSelector(false)}
        title="Select Training Week"
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            Choose your current progressive overload week. AI suggestions will be adjusted accordingly.
          </p>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
          {([0, 1, 2, 3, 4] as ProgressiveOverloadWeek[]).map((week) => {
            const weekInfo = PROGRESSIVE_OVERLOAD_WEEKS[week];
            const isSelected = week === currentWeek;
            return (
              <button
                key={week}
                onClick={() => {
                  setCurrentWeek(week);
                  setShowWeekSelector(false);
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">
                    Week {week + 1}: {weekInfo.name}
                  </span>
                  {isSelected && (
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {weekInfo.description}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Weight: {weekInfo.weightAdjustment}</span>
                  <span>Reps: {weekInfo.repRange}</span>
                </div>
              </button>
            );
          })}
          </div>
        </div>
      </Modal>
      </div>
    </div>
  );
}
