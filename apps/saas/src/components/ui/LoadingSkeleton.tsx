import React from 'react';

/**
 * LoadingSkeleton Component
 * 
 * Provides shimmer loading states for various UI elements.
 * Supports dark/light mode and customizable dimensions.
 */

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

export interface LoadingSkeletonProps {
  /**
   * Skeleton shape variant
   * @default 'text'
   */
  variant?: SkeletonVariant;
  
  /**
   * Width of the skeleton
   * Can be a percentage (e.g., '100%', '50%') or specific unit (e.g., '200px', '4rem')
   * @default '100%'
   */
  width?: string;
  
  /**
   * Height of the skeleton
   * Can be a percentage, specific unit, or predefined size
   * @default 'auto' (inherits from variant)
   */
  height?: string;
  
  /**
   * Number of text lines (only for text variant)
   * @default 1
   */
  lines?: number;
  
  /**
   * Animation duration in seconds
   * @default 1.5
   */
  animationDuration?: number;
  
  /**
   * Reduce motion for accessibility
   */
  reducedMotion?: boolean;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Dark mode (overrides system preference)
   */
  darkMode?: boolean;
}

// Predefined height presets
const heightPresets: Record<SkeletonVariant, string> = {
  text: '1rem',
  circular: '40px',
  rectangular: '200px',
  rounded: '100px',
};

/**
 * Animated shimmer effect using keyframes
 */
const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;

const shimmerGradient = (isDark: boolean) =>
  `linear-gradient(
    90deg,
    ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 0%,
    ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 50%,
    ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} 100%
  )`;

/**
 * LoadingSkeleton Component
 * 
 * @example
 * ```tsx
 * {/* Text skeleton *\/}
 * <LoadingSkeleton variant="text" width="80%" />
 * <LoadingSkeleton variant="text" lines={3} />
 * 
 * {/* Circular skeleton for avatars *\/}
 * <LoadingSkeleton variant="circular" width="40px" height="40px" />
 * 
 * {/* Rectangular skeleton for images *\/}
 * <LoadingSkeleton variant="rectangular" width="100%" height="200px" />
 * 
 * {/* Rounded skeleton for cards *\/}
 * <LoadingSkeleton variant="rounded" width="100%" height="120px" />
 * 
 * {/* Reduced motion *\/}
 * <LoadingSkeleton reducedMotion />
 * ```
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width = '100%',
  height,
  lines = 1,
  animationDuration = 1.5,
  reducedMotion = false,
  className = '',
  darkMode,
}) => {
  // Detect dark mode from document
  const isDarkMode = darkMode !== undefined 
    ? darkMode 
    : typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

  // Determine actual height
  const actualHeight = height || heightPresets[variant];

  // Generate skeleton elements
  const renderSkeleton = (index: number = 0) => {
    const baseStyles = {
      width: variant === 'text' && lines > 1 && index < lines - 1 
        ? '90%' 
        : width,
      height: actualHeight,
      background: shimmerGradient(isDarkMode),
      backgroundSize: '200% 100%',
      animation: reducedMotion ? 'none' : `shimmer ${animationDuration}s infinite linear`,
    };

    // Variant-specific styles
    const variantStyles: Record<SkeletonVariant, React.CSSProperties> = {
      text: {
        ...baseStyles,
        borderRadius: '4px',
      },
      circular: {
        ...baseStyles,
        borderRadius: '50%',
        width: width || actualHeight,
      },
      rectangular: {
        ...baseStyles,
        borderRadius: '8px',
      },
      rounded: {
        ...baseStyles,
        borderRadius: '12px',
      },
    };

    return (
      <div
        key={index}
        style={variantStyles[variant]}
        className={className}
        role="status"
        aria-label="Loading..."
      >
        <style>{shimmerAnimation}</style>
      </div>
    );
  };

  // Render multiple lines for text variant
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => renderSkeleton(index))}
      </div>
    );
  }

  return renderSkeleton(0);
};

// Preset skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`p-6 space-y-4 ${className}`}>
    <div className="flex items-center gap-4">
      <LoadingSkeleton variant="circular" width="48px" height="48px" />
      <div className="flex-1 space-y-2">
        <LoadingSkeleton variant="text" width="60%" />
        <LoadingSkeleton variant="text" width="40%" />
      </div>
    </div>
    <LoadingSkeleton variant="text" lines={2} />
  </div>
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className 
}) => (
  <LoadingSkeleton 
    variant="circular" 
    width={`${size}px`} 
    height={`${size}px`}
    className={className}
  />
);

export const SkeletonText: React.FC<{ 
  width?: string; 
  lines?: number; 
  className?: string 
}> = ({ width = '100%', lines = 1, className }) => (
  <LoadingSkeleton 
    variant="text" 
    width={width} 
    lines={lines}
    className={className}
  />
);

export const SkeletonButton: React.FC<{ 
  width?: string; 
  height?: string; 
  className?: string 
}> = ({ width = '120px', height = '40px', className }) => (
  <LoadingSkeleton 
    variant="rounded" 
    width={width} 
    height={height}
    className={className}
  />
);

export default LoadingSkeleton;
