import { FC, createElement, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeekBadge } from '../components/ui';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { useHome } from '../hooks/useHome';
import { useModal } from '../contexts/ModalContext';
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
  LoadingModal,
} from '../components/home';
import {
  WeightLogModalWrapper,
  WeekSelectorModalWrapper,
} from '../components/modals';

export const Home: FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
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
    memberSince,
    shouldShowWeightReminder,
    ptSummary,
    loadingPTSummary,
  } = useHome();

  const resumeWorkout = () => {
    navigate('/workout');
  };

  const openWeightModal = useCallback(() => {
    openModal(createElement(WeightLogModalWrapper));
  }, [openModal]);

  const openWeekSelector = useCallback(() => {
    openModal(createElement(WeekSelectorModalWrapper));
  }, [openModal]);

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
            onClick={openWeekSelector}
          />
        </div>

        {/* API Key Banner */}
        {!preferences.openaiApiKey && <ApiKeyBanner />}

        {/* Weight Reminder Banner */}
        {shouldShowWeightReminder && (
          <WeightReminderBanner onClick={openWeightModal} />
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
          <ActivitySection sessions={sessions} memberSince={memberSince} />
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

        {/* Loading Modal - kept inline as it's controlled by different state */}
        <LoadingModal isOpen={isLoadingSuggestions} />
      </div>
    </div>
  );
};
