import { FC, createElement, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeekBadge } from '../components/ui';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { useHome } from '../hooks/useHome';
import { useModal } from '../contexts/ModalContext';
import {
  FloatingOrbsBackground,
  ApiKeyBanner,
  DeloadRecommendationBanner,
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
  WeekSelectorModalWrapper,
} from '../components/modals';

export const Home: FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { isLoadingSuggestions, startWorkout, startQuickWorkout } = useStartWorkout();

  const {
    templates,
    rotationTemplates,
    otherTemplates,
    sessions,
    activeSession,
    preferences,
    currentWeek,
    workoutGoal,
    hasApiKey,
    recentSessions,
    nextWorkout,
    memberSince,
    ptSummary,
    loadingPTSummary,
    deloadRecommendation,
    dismissDeloadRecommendation,
  } = useHome();

  const resumeWorkout = () => {
    navigate('/workout');
  };

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

        {/* Deload Recommendation Banner */}
        {deloadRecommendation && (
          <DeloadRecommendationBanner
            recommendation={deloadRecommendation}
            onDismiss={dismissDeloadRecommendation}
          />
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

        {/* Current Workout Rotation */}
        {rotationTemplates.length > 0 && (
          <PlansSection
            templates={rotationTemplates}
            onStartWorkout={startWorkout}
            title="Current Rotation"
          />
        )}

        {/* Other Workouts */}
        {otherTemplates.length > 0 && (
          <PlansSection
            templates={otherTemplates}
            onStartWorkout={startWorkout}
            title="Other Workouts"
            showViewAll={rotationTemplates.length === 0}
          />
        )}

        {/* Recent Workouts */}
        {recentSessions.length > 0 && (
          <RecentWorkoutsSection
            sessions={recentSessions}
            weightUnit={preferences.weightUnit}
            distanceUnit={preferences.distanceUnit}
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
