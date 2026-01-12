import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeekBadge } from '../components/ui';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { useHome } from '../hooks/useHome';
import {
  FloatingOrbsBackground,
  ApiKeyBanner,
  WeightReminderBanner,
  PTSummaryCard,
  ActiveWorkoutBanner,
  QuickStartSection,
  ActivitySection,
  PlansSection,
  RecentWorkoutsSection,
  EmptyState,
  WeekSelectorModal,
  LoadingModal,
} from '../components/home';
import { WeightLogModal } from '../components/weight';

export const Home: FC = () => {
  const navigate = useNavigate();
  const { isLoadingSuggestions, startWorkout, startQuickWorkout } = useStartWorkout();

  const {
    templates,
    sessions,
    activeSession,
    preferences,
    currentWeek,
    workoutGoal,
    hasApiKey,
    recentSessions,
    nextWorkout,
    shouldShowWeightReminder,
    showWeightModal,
    setShowWeightModal,
    ptSummary,
    loadingPTSummary,
    showWeekSelector,
    setShowWeekSelector,
    selectWeek,
  } = useHome();

  const resumeWorkout = () => {
    navigate('/workout');
  };

  return (
    <div className="relative min-h-screen">
      <FloatingOrbsBackground />

      <div className="relative z-10 p-4 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {preferences.firstName ? `Hello ${preferences.firstName}` : 'Lift'}
          </h1>
          <WeekBadge
            week={currentWeek}
            workoutGoal={workoutGoal}
            onClick={() => setShowWeekSelector(true)}
          />
        </div>

        {/* API Key Banner */}
        {!preferences.openaiApiKey && <ApiKeyBanner />}

        {/* Weight Reminder Banner */}
        {shouldShowWeightReminder && (
          <WeightReminderBanner onClick={() => setShowWeightModal(true)} />
        )}

        {/* PT Summary */}
        {hasApiKey && sessions.length >= 2 && (
          <PTSummaryCard
            summary={ptSummary}
            loading={loadingPTSummary}
          />
        )}

        {/* Active Workout Banner */}
        {activeSession && (
          <ActiveWorkoutBanner
            sessionName={activeSession.name}
            startedAt={activeSession.startedAt}
            onResume={resumeWorkout}
          />
        )}

        {/* Quick Start */}
        <QuickStartSection
          nextWorkout={nextWorkout}
          onStartWorkout={startWorkout}
          onStartQuickWorkout={startQuickWorkout}
        />

        {/* Activity Heatmap */}
        {sessions.length > 0 && (
          <ActivitySection sessions={sessions} />
        )}

        {/* Your Plans */}
        {templates.length > 0 && (
          <PlansSection
            templates={templates}
            onStartWorkout={startWorkout}
          />
        )}

        {/* Recent Workouts */}
        {recentSessions.length > 0 && (
          <RecentWorkoutsSection
            sessions={recentSessions}
            weightUnit={preferences.weightUnit}
          />
        )}

        {/* Empty State */}
        {templates.length === 0 && sessions.length === 0 && <EmptyState />}

        {/* Modals */}
        <LoadingModal isOpen={isLoadingSuggestions} />

        <WeekSelectorModal
          isOpen={showWeekSelector}
          onClose={() => setShowWeekSelector(false)}
          currentWeek={currentWeek}
          workoutGoal={workoutGoal}
          onSelectWeek={selectWeek}
        />

        <WeightLogModal
          isOpen={showWeightModal}
          onClose={() => setShowWeightModal(false)}
        />
      </div>
    </div>
  );
};
