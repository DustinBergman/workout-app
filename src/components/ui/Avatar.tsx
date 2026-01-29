import { FC, useState } from 'react';
import { cn } from '../../lib/utils';

export interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-2xl',
};

export const Avatar: FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);

  // Get initials from name
  const getInitials = (fullName: string | null | undefined): string => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const showImage = src && !imageError;

  const baseClasses = cn(
    'rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden',
    sizeClasses[size],
    onClick && 'cursor-pointer hover:ring-2 hover:ring-interactive/50 transition-all',
    className
  );

  if (showImage) {
    return (
      <div className={baseClasses} onClick={onClick}>
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to initials with gradient background
  return (
    <div
      className={cn(
        baseClasses,
        'bg-gradient-to-br from-interactive to-purple-600 text-fg-inverted font-bold'
      )}
      onClick={onClick}
    >
      {getInitials(name)}
    </div>
  );
};
