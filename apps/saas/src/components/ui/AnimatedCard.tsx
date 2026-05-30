import React, { useState, useEffect } from 'react';

/**
 * AnimatedCard Component
 * 
 * Card with hover lift animation, glow effects, and fade-in on mount.
 * Supports multiple visual variants for different use cases.
 */

export type CardVariant = 'default' | 'gold' | 'gradient';

export interface AnimatedCardProps {
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: CardVariant;
  
  /**
   * Card content
   */
  children: React.ReactNode;
  
  /**
   * Additional Tailwind CSS classes
   */
  className?: string;
  
  /**
   * Enable/disable hover effects
   * @default true
   */
  hoverable?: boolean;
  
  /**
   * Enable/disable glow effect
   * @default true
   */
  glow?: boolean;
  
  /**
   * Custom click handler
   */
  onClick?: () => void;
  
  /**
   * Fade-in animation delay (ms)
   * @default 0
   */
  delay?: number;
  
  /**
   * Reduce motion for accessibility
   */
  reducedMotion?: boolean;
}

// Variant-specific styles
const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-zinc-900/80
    border border-white/10
    hover:border-white/20
  `,
  gold: `
    bg-gradient-to-br from-[#f4c025]/10 to-transparent
    border border-[#f4c025]/20
    hover:border-[#f4c025]/40
  `,
  gradient: `
    bg-gradient-to-br from-zinc-900/90 to-zinc-950/90
    border border-white/10
    hover:border-white/20
  `,
};

// Glow effect styles
const glowStyles: Record<CardVariant, string> = {
  default: 'hover:shadow-xl hover:shadow-black/50',
  gold: 'hover:shadow-2xl hover:shadow-[#f4c025]/20',
  gradient: 'hover:shadow-xl hover:shadow-black/50',
};

/**
 * AnimatedCard Component
 * 
 * @example
 * ```tsx
 * <AnimatedCard variant="gold">
 *   <Card content here />
 * </AnimatedCard>
 * 
 * <AnimatedCard variant="default" onClick={handleClick}>
 *   <Interactive content />
 * </AnimatedCard>
 * ```
 */
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  variant = 'default',
  children,
  className = '',
  hoverable = true,
  glow = true,
  onClick,
  delay = 0,
  reducedMotion = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Fade-in animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const handleMouseEnter = () => {
    if (hoverable) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverable) setIsHovered(false);
  };

  const baseClasses = `
    relative overflow-hidden
    rounded-2xl
    p-6
    transition-all duration-300 ease-out
    ${variantStyles[variant]}
    ${glow ? glowStyles[variant] : ''}
    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    ${reducedMotion ? 'transition-none' : 'transition-all'}
  `;

  const hoverClasses = hoverable ? `
    ${!reducedMotion ? 'hover:-translate-y-1' : ''}
    ${onClick ? 'cursor-pointer' : 'cursor-default'}
  ` : '';

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${className}`.trim().replace(/\s+/g, ' ')}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transitionDelay: `${delay}ms`,
      }}
    >
      {/* Subtle shine effect on hover */}
      {hoverable && !reducedMotion && (
        <div
          className={`
            absolute inset-0
            bg-gradient-to-r 
            from-transparent 
            via-white/5 
            to-transparent
            skew-x-12
            translate-x-[-150%]
            transition-transform duration-700 ease-out
            ${isHovered ? 'translate-x-[150%]' : ''}
          `}
          style={{
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>

      {/* Border glow effect for gold variant */}
      {variant === 'gold' && hoverable && !reducedMotion && (
        <div
          className={`
            absolute inset-0
            rounded-2xl
            pointer-events-none
            opacity-0
            transition-opacity duration-300
            ${isHovered ? 'opacity-100' : ''}
          `}
          style={{
            boxShadow: 'inset 0 0 20px rgba(244, 192, 37, 0.1)',
          }}
        />
      )}
    </div>
  );
};

export default AnimatedCard;
