import { FC, createElement, useCallback } from 'react';
import { WeekBadge } from '../components/ui';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { useHome } from '../hooks/useHome';
import { useModal } from '../contexts/ModalContext';
import {
  FloatingOrbsBackground,
  ApiKeyBanner,
  DeloadRecommendationBanner,
  PTSummaryCard,
  QuickStartSection,
  ActivitySection,
  EmptyState,
  LoadingModal,
  FriendsLeaderboard,
} from '../components/home';
import {
  WeekSelectorModalWrapper,
} from '../components/modals';

export const Home: FC = () => {
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
    nextWorkout,
    memberSince,
    ptSummary,
    loadingPTSummary,
    deloadRecommendation,
    dismissDeloadRecommendation,
  } = useHome();

  const openWeekSelector = useCallback(() => {
    openModal(createElement(WeekSelectorModalWrapper));
  }, [openModal]);

  return (
    <div className="relative">
      <FloatingOrbsBackground />

      <div className="relative z-10 p-4 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            {preferences.firstName ? `Hello ${preferences.firstName}` : 'Welcome'}
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

        {/* Quick Start - only show when no active workout */}
        {!activeSession && (
          <QuickStartSection
            nextWorkout={nextWorkout}
            onStartWorkout={startWorkout}
            onStartQuickWorkout={startQuickWorkout}
          />
        )}

        {/* Friends Leaderboard */}
        <FriendsLeaderboard />

        {/* Activity Heatmap */}
        {sessions.length > 0 && (
          <ActivitySection sessions={sessions} memberSince={memberSince} />
        )}

        
        {/* Empty State */}
        {templates.length === 0 && sessions.length === 0 && <EmptyState />}

        {/* Loading Modal - kept inline as it's controlled by different state */}
        <LoadingModal isOpen={isLoadingSuggestions} />
      </div>
    </div>
  );
};
