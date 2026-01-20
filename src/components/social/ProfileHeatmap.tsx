import { FC, useMemo } from 'react';
import { HeatmapSession } from '../../services/supabase/userStats';
import { WorkoutHeatmap } from '../history/WorkoutHeatmap';
import { WorkoutSession } from '../../types';

interface ProfileHeatmapProps {
  sessions: HeatmapSession[];
  memberSince?: string | null;
}

export const ProfileHeatmap: FC<ProfileHeatmapProps> = ({ sessions, memberSince }) => {
  // Convert HeatmapSession to a minimal format compatible with WorkoutHeatmap
  // The heatmap only uses startedAt and exercises[].type
  const workoutSessions = useMemo(() => {
    return sessions.map((session) => ({
      id: '',
      templateId: '',
      name: '',
      startedAt: session.startedAt,
      exercises: session.exercises.map((ex) => ({
        id: '',
        exerciseId: '',
        type: ex.type,
        sets: [],
        completedSets: [],
      })),
    })) as unknown as WorkoutSession[];
  }, [sessions]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Workout Activity</h3>
      <WorkoutHeatmap
        sessions={workoutSessions}
        memberSince={memberSince || undefined}
      />
    </div>
  );
};
