import { FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SyncIndicator, Button } from '../ui';
import { NotificationBell } from '../notifications';

export const Header: FC = () => {
  const location = useLocation();

  return (
    <div className="flex items-center justify-between px-4 h-14">
      <div className="flex items-center gap-3">
        <Link to="/" className="group flex items-center gap-2">
          {/* Weight plate - top down view, minimal */}
          <div className="relative w-7 h-7">
            <svg viewBox="0 0 28 28" className="w-full h-full">
              {/* Outer ring */}
              <circle
                cx="14"
                cy="14"
                r="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                className="text-fg-1"
              />
              {/* Inner cutout */}
              <circle
                cx="14"
                cy="14"
                r="4"
                fill="currentColor"
                className="text-fg-1"
              />
              {/* Accent arc - like a grip indent */}
              <path
                d="M 14 2 A 12 12 0 0 1 26 14"
                fill="none"
                stroke="url(#plate-accent)"
                strokeWidth="3"
                strokeLinecap="round"
                className="group-hover:opacity-100 opacity-80 transition-opacity"
              />
              <defs>
                <linearGradient id="plate-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Text */}
          <span className="text-xl font-bold text-fg-1 tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            overload
          </span>
        </Link>
        <SyncIndicator />
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell />
        <Link to="/settings">
          <Button
            variant="ghost"
            className={`text-fg-1 p-2 ${location.pathname === '/settings' ? 'bg-bg-subtle' : ''}`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Button>
        </Link>
      </div>
    </div>
  );
};
