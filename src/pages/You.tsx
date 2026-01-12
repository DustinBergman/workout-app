import { FC } from 'react';
import { FloatingOrbsBackground } from '../components/home';
import {
  ProfileCard,
  StatsHeader,
  EmptyStatsState,
  StrengthProgressCard,
  WeightTrackingCard,
  MuscleGroupChart,
  StatsGrid,
  VolumeCard,
} from '../components/you';
import { useYouPage } from '../hooks/useYouPage';

export const You: FC = () => {
  const {
    timePeriod,
    setTimePeriod,
    avatarUrl,
    preferences,
    weightEntries,
    stats,
    pieChartData,
    hasEnoughData,
    completedWorkoutsCount,
    displayName,
    openWeightModal,
    openAvatarEditModal,
  } = useYouPage();

  return (
    <div className="relative min-h-screen">
      <FloatingOrbsBackground />

      <div className="relative z-10 p-4 pb-20">
        <ProfileCard
          avatarUrl={avatarUrl}
          displayName={displayName}
          firstName={preferences.firstName}
          completedWorkoutsCount={completedWorkoutsCount}
          onAvatarClick={openAvatarEditModal}
        />

        <StatsHeader timePeriod={timePeriod} onTimePeriodChange={setTimePeriod} />

        {!hasEnoughData && <EmptyStatsState />}

        {hasEnoughData && (
          <div className="space-y-4">
            <StrengthProgressCard
              averageStrengthIncrease={stats.averageStrengthIncrease}
              totalSessions={stats.totalSessions}
            />

            <WeightTrackingCard
              weightEntries={weightEntries}
              weightUnit={preferences.weightUnit}
              onLogWeight={openWeightModal}
            />

            <MuscleGroupChart pieChartData={pieChartData} />

            <StatsGrid
              averageSessionDuration={stats.averageSessionDuration}
              averageSessionsPerWeek={stats.averageSessionsPerWeek}
              averageWeightChangePerWeek={stats.averageWeightChangePerWeek}
            />

            <VolumeCard
              averageVolumePerSession={stats.averageVolumePerSession}
              weightUnit={preferences.weightUnit}
            />

            <p className="text-center text-sm text-muted-foreground">
              Based on {stats.totalSessions} workout{stats.totalSessions !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
