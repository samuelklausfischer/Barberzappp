import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * Loading indicator with various styles and sizes.
 * 
 * @param {Object} props
 * @param {'sm'|'base'|'lg'|'xl'} props.size - Spinner size
 * @param {string} props.color - Spinner color
 * @param {boolean} props.fullScreen - Full screen overlay
 * @param {React.ReactNode} props.text - Loading text/message
 * @param {boolean} props.overlay - Show overlay background
 * @param {'default'|'dots'|'pulse'|'bar'} props.variant - Spinner variant
 * @param {string} props.className - Additional CSS classes
 */
export const LoadingSpinner = ({
  size = 'base',
  color = 'text-amber-500',
  fullScreen = false,
  text,
  overlay = true,
  variant = 'default',
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { width: 'w-4', height: 'h-4', strokeWidth: 2 },
    base: { width: 'w-6', height: 'h-6', strokeWidth: 2.5 },
    lg: { width: 'w-8', height: 'h-8', strokeWidth: 3 },
    xl: { width: 'w-12', height: 'h-12', strokeWidth: 3 },
  };

  const sizes = sizeConfig[size];

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return <DotsSpinner size={size} color={color} className={className} />;
      case 'pulse':
        return <PulseSpinner size={size} color={color} className={className} />;
      case 'bar':
        return <BarSpinner size={size} color={color} className={className} />;
      default:
        return (
          <svg
            className={`animate-spin ${sizes.width} ${sizes.height} ${color} ${className}`}
            fill="none"
            viewBox="0 0 24 24"
            role="status"
            aria-label="Loading"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth={sizes.strokeWidth}
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        );
    }
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {renderSpinner()}
      {text && (
        <p className="text-sm text-gray-400">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-[999] flex items-center justify-center ${
          overlay ? 'bg-slate-900/80 backdrop-blur-sm' : 'bg-transparent'
        }`}
        role="status"
        aria-label="Loading"
      >
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      {content}
    </div>
  );
};

/**
 * DotsSpinner - Three bouncing dots
 */
const DotsSpinner = ({ size, color, className = '' }) => {
  const sizeMap = {
    sm: 'w-1.5 h-1.5',
    base: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3 h-3',
  };

  return (
    <div className={`flex gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`${sizeMap[size]} ${color} rounded-full animate-bounce`}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
};

/**
 * PulseSpinner - Pulsing circle
 */
const PulseSpinner = ({ size, color, className = '' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    base: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div
      className={`${sizeMap[size]} ${color} rounded-full animate-pulse ${className}`}
      style={{
        animationDuration: '1.5s',
      }}
    />
  );
};

/**
 * BarSpinner - Animated progress bar
 */
const BarSpinner = ({ size, color, className = '' }) => {
  const heightMap = {
    sm: 'h-1',
    base: 'h-2',
    lg: 'h-2.5',
    xl: 'h-3',
  };

  return (
    <div
      className={`${heightMap[size]} w-24 bg-slate-700 rounded-full overflow-hidden ${className}`}
    >
      <div
        className={`h-full ${color} animate-shimmer`}
        style={{
          width: '40%',
          animationDuration: '1s',
        }}
      />
    </div>
  );
};

/**
 * InlineSpinner - Small inline spinner for buttons
 */
export const InlineSpinner = ({ className = '' }) => (
  <svg
    className={`animate-spin w-4 h-4 text-current ${className}`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

/**
 * SkeletonLoader - Content skeleton for loading state
 */
export const SkeletonLoader = ({
  className = '',
  lines = 3,
  width = '100%',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-700/50 rounded animate-pulse"
          style={{ width: width === '100%' ? `${100 - (i * 15)}%` : width }}
        />
      ))}
    </div>
  );
};

/**
 * PageLoader - Full page loading overlay
 */
export const PageLoader = ({ text = 'Loading...' }) => (
  <LoadingSpinner fullScreen overlay text={text} size="xl" />
);

/**
 * ButtonLoader - Loading state for buttons
 */
export const ButtonLoader = ({ text = 'Loading...' }) => (
  <span className="flex items-center gap-2">
    <InlineSpinner />
    {text}
  </span>
);

export default LoadingSpinner;
