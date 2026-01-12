import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Card, Avatar } from '../ui';

interface ProfileCardProps {
  avatarUrl: string | null;
  displayName: string;
  firstName?: string | null;
  completedWorkoutsCount: number;
  onAvatarClick: () => void;
}

export const ProfileCard: FC<ProfileCardProps> = ({
  avatarUrl,
  displayName,
  firstName,
  completedWorkoutsCount,
  onAvatarClick,
}) => {
  return (
    <Card className="mb-6" padding="lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar - clickable to edit */}
          <button onClick={onAvatarClick} className="relative group">
            <Avatar src={avatarUrl} name={firstName} size="xl" />
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </button>
          {/* Name and stats */}
          <div>
            <h2 className="text-xl font-bold text-foreground">{displayName}</h2>
            <p className="text-sm text-muted-foreground">
              {completedWorkoutsCount} workouts completed
            </p>
          </div>
        </div>
        {/* Friends button */}
        <Link
          to="/friends"
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <span className="text-sm font-medium">Friends</span>
        </Link>
      </div>
    </Card>
  );
};
