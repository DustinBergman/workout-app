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
  CardioStatsCard,
  ExerciseProgressChart,
} from '../components/you';
import { useYouPage } from '../hooks/useYouPage';

export const You: FC = () => {
  const {
    timePeriod,
    setTimePeriod,
    avatarUrl,
    preferences,
    weightEntries,
    sessions,
    customExercises,
    workoutGoal,
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
            {/* Show cardio stats for cardio-primary users, strength for others */}
            {stats.isCardioPrimary ? (
              <CardioStatsCard cardioStats={stats.cardio} />
            ) : (
              <StrengthProgressCard
                averageStrengthIncrease={stats.averageStrengthIncrease}
                totalSessions={stats.totalSessions}
              />
            )}

            {/* Show cardio stats for hybrid users (has both cardio and strength) */}
            {!stats.isCardioPrimary && stats.cardio.sessionCount > 0 && (
              <CardioStatsCard cardioStats={stats.cardio} />
            )}

            <WeightTrackingCard
              weightEntries={weightEntries}
              weightUnit={preferences.weightUnit}
              workoutGoal={workoutGoal}
              onLogWeight={openWeightModal}
            />

            {/* Only show muscle group chart for non-cardio-primary users */}
            {!stats.isCardioPrimary && pieChartData.length > 0 && (
              <MuscleGroupChart pieChartData={pieChartData} />
            )}

            {/* Exercise progress chart - only for users with strength exercises done 2+ times */}
            {!stats.isCardioPrimary && (
              <ExerciseProgressChart
                sessions={sessions}
                customExercises={customExercises}
                weightUnit={preferences.weightUnit}
              />
            )}

            <StatsGrid
              averageSessionDuration={stats.averageSessionDuration}
              averageSessionsPerWeek={stats.averageSessionsPerWeek}
              averageWeightChangePerWeek={stats.averageWeightChangePerWeek}
            />

            {/* Only show volume for non-cardio-primary users */}
            {!stats.isCardioPrimary && (
              <VolumeCard
                averageVolumePerSession={stats.averageVolumePerSession}
                weightUnit={preferences.weightUnit}
              />
            )}

            <p className="text-center text-sm text-muted-foreground">
              Based on {stats.totalSessions} workout{stats.totalSessions !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
