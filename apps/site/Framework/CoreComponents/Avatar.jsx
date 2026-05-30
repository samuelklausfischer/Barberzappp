import React from 'react';

/**
 * Avatar Component
 * 
 * User avatar with initials fallback.
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for image
 * @param {string} props.name - User name for initials fallback
 * @param {string} props.initials - Custom initials override
 * @param {'xs'|'sm'|'base'|'lg'|'xl'|'2xl'} props.size - Avatar size
 * @param {boolean} props.showStatus - Show online status indicator
 * @param {'online'|'offline'|'busy'|'away'} props.status - Status type
 * @param {boolean} props.rounded - Square with rounded corners
 * @param {boolean} props.clickable - Add cursor pointer and hover effect
 * @param {Function} props.onClick - Click handler
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.bgColor - Custom background color for initials
 */
export const Avatar = ({
  src,
  alt,
  name,
  initials,
  size = 'base',
  showStatus = false,
  status = 'online',
  rounded = false,
  clickable = false,
  onClick,
  className = '',
  bgColor = null,
}) => {
  // Size configurations
  const sizeConfig = {
    xs: { size: '24px', fontSize: 'text-[8px]', ringSize: 'ring-offset-1 ring-1' },
    sm: { size: '32px', fontSize: 'text-[10px]', ringSize: 'ring-offset-1.5 ring-1' },
    base: { size: '40px', fontSize: 'text-sm', ringSize: 'ring-offset-2 ring-2' },
    lg: { size: '48px', fontSize: 'text-base', ringSize: 'ring-offset-2 ring-2' },
    xl: { size: '64px', fontSize: 'text-lg', ringSize: 'ring-offset-2 ring-2' },
    '2xl': { size: '96px', fontSize: 'text-2xl', ringSize: 'ring-offset-3 ring-3' },
  };

  const config = sizeConfig[size];

  // Status colors
  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-500',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  };

  // Generate initials from name
  const generateInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayInitials = initials || generateInitials(name);

  // Get initials colors based on name (consistent colors for same name)
  const getInitialsColor = (name) => {
    if (bgColor) return bgColor;
    const colors = [
      'from-amber-400 to-amber-600',
      'from-blue-400 to-blue-600',
      'from-emerald-400 to-emerald-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-red-400 to-red-600',
      'from-indigo-400 to-indigo-600',
      'from-cyan-400 to-cyan-600',
    ];
    const index = name ? name.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${clickable ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => onClick && e.key === 'Enter' && onClick(e)}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className={`${rounded ? 'rounded-lg' : 'rounded-full'} ${config.size} object-cover ${clickable ? 'ring-2 ring-amber-500/50 hover:ring-amber-500' : ''} ${className}`}
          loading="lazy"
        />
      ) : (
        <div
          className={`${rounded ? 'rounded-lg' : 'rounded-full'} ${config.size} bg-gradient-to-br ${getInitialsColor(name)} flex items-center justify-center font-bold text-slate-900 ${config.fontSize} ${clickable ? 'ring-2 ring-amber-500/50 hover:ring-amber-500' : ''} ${className}`}
          aria-label={name || 'Avatar'}
        >
          {displayInitials}
        </div>
      )}
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 w-3 h-3 ${
            size === 'xs' ? 'w-2 h-2' : 'w-3 h-3'
          } ${rounded ? 'rounded-md' : 'rounded-full'} ${statusColors[status]} ${config.ringSize} ring-slate-900`}
          aria-label={`${status} status`}
        />
      )}
    </div>
  );
};

/**
 * AvatarGroup - Stacked avatars
 */
export const AvatarGroup = ({
  avatars = [],
  max = 4,
  size = 'base',
  className = '',
  showRemaining = true,
  onClickAvatar,
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remaining = Math.max(0, avatars.length - max);

  return (
    <div className={`flex -space-x-3 ${className}`} role="group" aria-label={`${avatars.length} users`}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={avatar.id || index}
          className="relative"
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <Avatar
            {...avatar}
            size={size}
            clickable={!!onClickAvatar}
            onClick={() => onClickAvatar?.(avatar, index)}
            className="ring-2 ring-slate-900 hover:z-10 hover:scale-110 transition-transform"
          />
        </div>
      ))}
      {showRemaining && remaining > 0 && (
        <Avatar
          name={`+${remaining}`}
          initials={`+${remaining}`}
          size={size}
          className="ring-2 ring-slate-900 bg-slate-700 text-white"
        />
      )}
    </div>
  );
};

/**
 * AvatarWithInfo - Avatar with name and subtitle
 */
export const AvatarWithInfo = ({
  src,
  name,
  subtitle,
  initials,
  size = 'lg',
  status,
  orientation = 'horizontal',
  className = '',
  onClick,
}) => {
  return (
    <div
      className={`flex items-center gap-3 ${orientation === 'vertical' ? 'flex-col text-center' : ''} ${onClick ? 'cursor-pointer hover:bg-slate-700/30 p-2 rounded-lg -mx-2' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <Avatar
        src={src}
        name={name}
        initials={initials}
        size={size}
        showStatus={!!status}
        status={status || 'online'}
      />
      <div className={orientation === 'vertical' ? '' : 'flex-1 min-w-0'}>
        {name && (
          <p className="font-medium text-white truncate">{name}</p>
        )}
        {subtitle && (
          <p className="text-sm text-gray-400 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

/**
 * AvatarSkeleton - Loading state
 */
export const AvatarSkeleton = ({ size = 'base', className = '' }) => {
  const sizeConfig = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    base: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  };

  return (
    <div
      className={`${sizeConfig[size]} rounded-full bg-slate-700/50 animate-pulse ${className}`}
      aria-label="Loading avatar"
    />
  );
};

export default Avatar;
