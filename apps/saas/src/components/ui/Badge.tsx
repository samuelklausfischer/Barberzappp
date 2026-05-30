import React, { useMemo } from 'react';

/**
 * Badge Component
 * 
 * Small status indicator for displaying labels, tags, or status information.
 * Supports multiple color variants for different semantic meanings.
 */

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /**
   * Badge color variant
   * @default 'default'
   */
  variant?: BadgeVariant;
  
  /**
   * Badge size
   * @default 'md'
   */
  size?: BadgeSize;
  
  /**
   * Badge shape
   * @default 'pill'
   */
  shape?: 'square' | 'rounded' | 'pill';
  
  /**
   * Remove uppercase transformation
   * @default false
   */
  lowercase?: boolean;
  
  /**
   * Additional Tailwind CSS classes
   */
  className?: string;
  
  /**
   * Badge content (text or custom node)
   */
  children: React.ReactNode;
}

// Variant configuration
const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-white border border-white/5',
  success: 'bg-green-500/10 text-green-500 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
  gold: 'bg-[#f4c025]/10 text-[#f4c025] border border-[#f4c025]/20',
};

// Size configuration
const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]', // Extra small for dense lists
  md: 'px-3 py-1 text-[10px]',   // Default (matches codebase patterns)
  lg: 'px-4 py-1.5 text-xs',    // Larger for emphasis
};

// Shape configuration
const shapeClasses: Record<'square' | 'rounded' | 'pill', string> = {
  square: 'rounded',
  rounded: 'rounded-lg',
  pill: 'rounded-full',
};

/**
 * Badge Component
 * 
 * Styled status indicator with semantic color variants.
 * 
 * @example
 * ```tsx
 * <Badge variant="success">Confirmado</Badge>
 * <Badge variant="warning">Pendente</Badge>
 * <Badge variant="danger">Cancelado</Badge>
 * <Badge variant="gold">Popular</Badge>
 * <Badge variant="info">Novo</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  shape = 'pill',
  lowercase = false,
  className,
  children,
}) => {
  // Memoize classes to prevent recalculations
  const computedClasses = useMemo(() => {
    return `
      inline-flex items-center justify-center
      ${sizeClasses[size]}
      ${shapeClasses[shape]}
      ${variantClasses[variant]}
      font-bold
      ${lowercase ? '' : 'uppercase tracking-widest'}
      ${className || ''}
    `.replace(/\s+/g, ' ').trim();
  }, [variant, size, shape, lowercase, className]);

  return (
    <span className={computedClasses}>
      {children}
    </span>
  );
};

// Export default for convenience
export default Badge;

// Export type for convenience
export type { BadgeProps };
