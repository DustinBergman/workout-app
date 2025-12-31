import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { WeekBadge } from '../components/ui';
import { useStartWorkout } from '../hooks/useStartWorkout';
import { useHome } from '../hooks/useHome';
import {
  FloatingOrbsBackground,
  ApiKeyBanner,
  RecommendationsCard,
  ActiveWorkoutBanner,
  QuickStartSection,
  ActivitySection,
  PlansSection,
  RecentWorkoutsSection,
  EmptyState,
  WeekSelectorModal,
  LoadingModal,
} from '../components/home';

export const Home: FC = () => {
  const navigate = useNavigate();
  const { isLoadingSuggestions, startWorkout, startQuickWorkout } = useStartWorkout();

  const {
    templates,
    sessions,
    activeSession,
    preferences,
    currentWeek,
    hasApiKey,
    showProgressiveOverload,
    recentSessions,
    nextWorkout,
    recommendations,
    loadingRecommendations,
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
            {preferences.firstName ? `Hello ${preferences.firstName}` : 'Workout Tracker'}
          </h1>
          {showProgressiveOverload && (
            <WeekBadge
              week={currentWeek}
              onClick={() => setShowWeekSelector(true)}
            />
          )}
        </div>

        {/* API Key Banner */}
        {!preferences.openaiApiKey && <ApiKeyBanner />}

        {/* Progressive Overload Week Card */}
        {showProgressiveOverload && (
          <section className="mb-6">
            <WeekBadge
              week={currentWeek}
              showDetails
              onClick={() => setShowWeekSelector(true)}
            />
          </section>
        )}

        {/* Progressive Overload Recommendations */}
        {hasApiKey && sessions.length >= 2 && recommendations.length > 0 && (
          <RecommendationsCard
            recommendations={recommendations}
            loadingRecommendations={loadingRecommendations}
            weightUnit={preferences.weightUnit}
          />
        )}

        {/* Active Workout Banner */}
        {activeSession && (
          <ActiveWorkoutBanner
            sessionName={activeSession.name}
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
          onSelectWeek={selectWeek}
        />
      </div>
    </div>
  );
};
