import { FC, useEffect, useState } from 'react';
import { Trophy, Medal, Award } from 'lucide-react';
import { Card } from '../ui';
import { getWeeklyLeaderboard, LeaderboardEntry } from '../../services/supabase/friends';
import { cn } from '@/lib/utils';

const CACHE_KEY = 'weekly_leaderboard_cache';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

interface CachedLeaderboard {
  data: LeaderboardEntry[];
  timestamp: number;
}

const getCachedLeaderboard = (): LeaderboardEntry[] | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp }: CachedLeaderboard = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
};

const setCachedLeaderboard = (data: LeaderboardEntry[]) => {
  try {
    const cache: CachedLeaderboard = { data, timestamp: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors
  }
};

export const FriendsLeaderboard: FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      // Check cache first
      const cached = getCachedLeaderboard();
      if (cached) {
        setLeaderboard(cached);
        setIsLoading(false);
        return;
      }

      // Fetch fresh data
      const { leaderboard: data } = await getWeeklyLeaderboard();
      setLeaderboard(data);
      setCachedLeaderboard(data);
      setIsLoading(false);
    };
    loadLeaderboard();
  }, []);

  // Don't show if no friends
  if (!isLoading && leaderboard.length <= 1) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="mb-6">
        <Card padding="sm">
          <div className="animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-4 h-4 bg-fg-3/20 rounded" />
              <div className="h-4 w-32 bg-fg-3/20 rounded" />
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-fg-3/20 rounded" />
              <div className="h-8 bg-fg-3/20 rounded" />
            </div>
          </div>
        </Card>
      </section>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 2:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-600" />;
      default:
        return <span className="w-4 h-4 text-xs text-fg-3 flex items-center justify-center">{rank}</span>;
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.user.isCurrentUser) return 'You';
    if (entry.user.first_name) return entry.user.first_name;
    if (entry.user.username) return `@${entry.user.username}`;
    return 'Friend';
  };

  // Show top 3 or all if less
  const displayEntries = leaderboard.slice(0, 3);

  return (
    <section className="mb-6">
      <Card padding="sm">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h2 className="text-sm font-semibold text-fg-1">Weekly Leaderboard</h2>
        </div>

        <div className="space-y-1.5">
          {displayEntries.map((entry, index) => (
            <div
              key={entry.user.id}
              className={cn(
                'flex items-center gap-3 px-2 py-1.5 rounded-lg',
                entry.user.isCurrentUser && 'bg-interactive/10'
              )}
            >
              <div className="flex-shrink-0">
                {getRankIcon(index + 1)}
              </div>

              {entry.user.avatar_url ? (
                <img
                  src={entry.user.avatar_url}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-bg-subtle flex items-center justify-center text-xs text-fg-3">
                  {(entry.user.first_name?.[0] || entry.user.username?.[0] || '?').toUpperCase()}
                </div>
              )}

              <span className={cn(
                'flex-1 text-sm truncate',
                entry.user.isCurrentUser ? 'font-medium text-fg-1' : 'text-fg-2'
              )}>
                {getDisplayName(entry)}
              </span>

              <span className={cn(
                'text-sm font-medium',
                entry.workoutCount > 0 ? 'text-fg-1' : 'text-fg-3'
              )}>
                {entry.workoutCount} {entry.workoutCount === 1 ? 'workout' : 'workouts'}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
};
