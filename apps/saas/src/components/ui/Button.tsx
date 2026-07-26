import React, { useMemo } from 'react';

/**
 * Button Component
 * 
 * Primary interactive element for user actions throughout BarberZap Admin Panel.
 * Supports multiple variants, sizes, shapes, icons, and loading state.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link' | 'success';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
export type ButtonShape = 'square' | 'rounded' | 'circle' | 'pill';
export type ButtonAnimation = 'scale' | 'ripple' | 'slide' | 'none';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button visual variant
   * @default 'primary'
   */
  variant?: ButtonVariant;
  
  /**
   * Button size
   * @default 'md'
   */
  size?: ButtonSize;
  
  /**
   * Button shape/corner radius style
   * @default 'rounded'
   */
  shape?: ButtonShape;
  
  /**
   * Icon to display on the left side of button text
   * Can be a Material Symbols icon name or a React node
   */
  leftIcon?: string | React.ReactNode;
  
  /**
   * Icon to display on the right side of button text
   * Can be a Material Symbols icon name or a React node
   */
  rightIcon?: string | React.ReactNode;
  
  /**
   * Button displays only the icon (no text)
   * Requires tooltip for accessibility
   */
  iconOnly?: boolean;
  
  /**
   * Button in loading state - shows spinner and disables clicks
   */
  loading?: boolean;
  
  /**
   * Button is permanently disabled
   */
  disabled?: boolean;
  
  /**
   * Button is in active/pressed state
   */
  active?: boolean;
  
  /**
   * Button takes full width of container
   */
  fullWidth?: boolean;
  
  /**
   * Animation style on interaction
   * @default 'scale'
   */
  animation?: ButtonAnimation;
  
  /**
   * Tooltip text for icon-only buttons or additional context
   */
  tooltip?: string;
  
  /**
   * Additional Tailwind CSS classes
   */
  className?: string;
  
  /**
   * Button content (text or custom node)
   */
  children?: React.ReactNode;
}

// Size configuration
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs gap-1',
  sm: 'h-10 px-4 text-sm gap-2',
  md: 'h-12 px-6 text-sm gap-2',
  lg: 'h-14 px-8 text-base gap-3',
  xl: 'h-16 px-10 text-lg gap-3',
  icon: 'h-10 w-10',
};

// Icon-only sizes (square dimensions)
const iconSizeClasses: Record<ButtonSize, string> = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  icon: 'w-9 h-9',
  md: 'w-12 h-12',
  lg: 'w-14 h-14',
  xl: 'w-16 h-16',
};

// Variant configuration
const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#D4AF37] hover:bg-[#B99220] active:bg-[#9C7717] text-[#1A1A1F] font-bold shadow-sm shadow-[#D4AF37]/25',
  secondary: 'border border-[#D1D5DB] bg-white hover:bg-[#F7F8FA] hover:border-[#9CA3AF] text-[#1A1A1F] font-semibold',
  danger: 'bg-[#B42318] hover:bg-[#912018] active:bg-[#7A271A] text-white font-bold shadow-sm shadow-red-900/15',
  ghost: 'bg-transparent hover:bg-[#F3F4F6] active:bg-[#E5E7EB] text-[#4B5563] hover:text-[#1A1A1F]',
  link: 'bg-transparent text-[#8A6A11] hover:text-[#6B530D] hover:underline px-0 py-0 shadow-none',
  success: 'bg-[#15803D] hover:bg-[#166534] active:bg-[#14532D] text-white font-bold shadow-sm shadow-green-900/15',
};

// Shape configuration
const shapeClasses: Record<ButtonShape, string> = {
  square: 'rounded-lg',
  rounded: 'rounded-xl',
  circle: 'rounded-full',
  pill: 'rounded-full',
};

// Icon renderer component (memoized for performance)
const IconRenderer = React.memo(({ 
  icon, 
  className = '' 
}: { 
  icon: string | React.ReactNode;
  className?: string;
}) => {
  if (typeof icon === 'string') {
    return (
      <span className={`material-symbols-outlined ${className}`}>
        {icon}
      </span>
    );
  }
  return <span className={className}>{icon}</span>;
});

IconRenderer.displayName = 'IconRenderer';

/**
 * Button Component
 * 
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Save</Button>
 * <Button variant="secondary" leftIcon="cancel">Cancel</Button>
 * <Button variant="danger" rightIcon="delete">Delete</Button>
 * <Button variant="ghost" iconOnly tooltip="Edit">
 *   <span className="material-symbols-outlined">edit</span>
 * </Button>
 * <Button loading>Processing...</Button>
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  leftIcon,
  rightIcon,
  iconOnly = false,
  loading = false,
  disabled = false,
  active = false,
  fullWidth = false,
  animation = 'scale',
  tooltip,
  className,
  children,
  type = 'button',
  ...buttonProps
}) => {
  // Memoize classes to prevent recalculations
  const computedClasses = useMemo(() => {
    const isDisabled = disabled || loading;
    const isLink = variant === 'link';
    const isGhost = variant === 'ghost';
    
    // Base classes for link variant
    if (isLink) {
      return `
        inline-flex items-center font-semibold
        transition-colors
        focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${active ? 'underline' : ''}
        ${className || ''}
      `.replace(/\s+/g, ' ').trim();
    }

    // Size classes
    const sizeClass = iconOnly && !isLink ? iconSizeClasses[size] : sizeClasses[size];
    
    // Animation classes
    let animationClass = '';
    if (!isDisabled && animation !== 'none' && !isLink) {
      animationClass = 'active:scale-95';
    }

    // Build full class string
    return `
      inline-flex items-center justify-center
      ${sizeClass}
      ${variantClasses[variant]}
      ${isGhost || isDisabled ? '' : shapeClasses[shape]}
      ${fullWidth ? 'w-full' : ''}
      ${active ? 'opacity-90 ring-2 ring-[#D4AF37]/50' : ''}
      ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none grayscale' : ''}
      transition-all duration-200
      focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white
      ${animationClass}
      ${className || ''}
    `.replace(/\s+/g, ' ').trim();
  }, [variant, size, shape, iconOnly, loading, disabled, active, fullWidth, animation, tooltip, className]);

  // ARIA label for icon-only buttons
  const ariaLabel = useMemo(() => {
    if (tooltip) return tooltip;
    if (iconOnly && typeof children === 'string') return children;
    return undefined;
  }, [tooltip, iconOnly, children]);

  // Render button content
  const renderContent = () => {
    if (loading) {
      return (
        <span className="material-symbols-outlined animate-spin text-lg">
          refresh
        </span>
      );
    }

    return (
      <>
        {leftIcon && <IconRenderer icon={leftIcon} />}
        {children && <span className={variant === 'link' ? '' : ''}>{children}</span>}
        {rightIcon && <IconRenderer icon={rightIcon} />}
      </>
    );
  };

  return (
    <button
      type={type}
      className={computedClasses}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...buttonProps}
    >
      {renderContent()}
    </button>
  );
};

// Export default for convenience
export default Button;

// Export type for convenience
export type { ButtonProps };
