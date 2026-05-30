import React, { useState } from 'react';

/**
 * ButtonAnimated Component
 * 
 * Animated button with tap/scale effects, ripple effect, loading spinner,
 * and success/error states. Supports smooth transitions and multiple variants.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonAnimatedProps {
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
   * Display loading state with spinner
   * @default false
   */
  loading?: boolean;
  
  /**
   * Display success state with checkmark
   */
  success?: boolean;
  
  /**
   * Display error state
   */
  error?: boolean;
  
  /**
   * Button is disabled
   */
  disabled?: boolean;
  
  /**
   * Button takes full width
   */
  fullWidth?: boolean;
  
  /**
   * Enable ripple effect on click
   * @default true
   */
  ripple?: boolean;
  
  /**
   * Transition duration in ms
   * @default 200
   */
  transitionDuration?: number;
  
  /**
   * Icon to display
   */
  icon?: string;
  
  /**
   * Custom className
   */
  className?: string;
  
  /**
   * Button content
   */
  children?: React.ReactNode;
  
  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// Size configurations
const sizeConfig: Record<ButtonSize, { height: string; padding: string; fontSize: string }> = {
  xs: { height: 'h-8', padding: 'px-3', fontSize: 'text-xs' },
  sm: { height: 'h-10', padding: 'px-4', fontSize: 'text-sm' },
  md: { height: 'h-12', padding: 'px-6', fontSize: 'text-sm' },
  lg: { height: 'h-14', padding: 'px-8', fontSize: 'text-base' },
  xl: { height: 'h-16', padding: 'px-10', fontSize: 'text-lg' },
};

// Variant configurations
const variantConfig: Record<ButtonVariant, { base: string; hover: string; active: string; disabled: string }> = {
  primary: {
    base: 'bg-[#f4c025] text-black font-bold border border-transparent',
    hover: 'hover:bg-[#d9a419] hover:border-transparent hover:shadow-lg hover:shadow-[#f4c025]/20',
    active: 'active:bg-[#b89116] active:scale-95',
    disabled: 'disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-zinc-700',
  },
  secondary: {
    base: 'bg-transparent text-white font-bold border border-white/10',
    hover: 'hover:bg-white/5 hover:border-white/20 hover:shadow-lg',
    active: 'active:bg-white/10 active:scale-95',
    disabled: 'disabled:bg-transparent disabled:text-zinc-600 disabled:border-zinc-700',
  },
  danger: {
    base: 'bg-red-600 text-white font-bold border border-transparent',
    hover: 'hover:bg-red-500 hover:border-transparent hover:shadow-lg hover:shadow-red-950/40',
    active: 'active:bg-red-700 active:scale-95',
    disabled: 'disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-zinc-700',
  },
  success: {
    base: 'bg-green-600 text-white font-bold border border-transparent',
    hover: 'hover:bg-green-500 hover:border-transparent hover:shadow-lg hover:shadow-green-950/40',
    active: 'active:bg-green-700 active:scale-95',
    disabled: 'disabled:bg-zinc-800 disabled:text-zinc-600 disabled:border-zinc-700',
  },
  ghost: {
    base: 'bg-transparent text-zinc-400 font-semibold border border-transparent',
    hover: 'hover:bg-white/5 hover:text-white hover:border-white/10',
    active: 'active:bg-white/10 active:scale-95',
    disabled: 'disabled:bg-transparent disabled:text-zinc-700 disabled:border-transparent',
  },
};

/**
 * ButtonAnimated Component
 * 
 * @example
 * ```tsx
 * <ButtonAnimated onClick={handleClick}>Click me</ButtonAnimated>
 * 
 * <ButtonAnimated variant="secondary" loading>Loading...</ButtonAnimated>
 * 
 * <ButtonAnimated variant="success" success>Success!</ButtonAnimated>
 * 
 * <ButtonAnimated variant="danger" error>Error occurred</ButtonAnimated>
 * 
 * <ButtonAnimated size="lg" icon="add">Add Item</ButtonAnimated>
 * ```
 */
export const ButtonAnimated: React.FC<ButtonAnimatedProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  success = false,
  error = false,
  disabled = false,
  fullWidth = false,
  ripple = true,
  transitionDuration = 200,
  icon,
  className = '',
  children,
  onClick,
}) => {
  const [ripplePositions, setRipplePositions] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const isDisabled = disabled || loading;
  const { height, padding, fontSize } = sizeConfig[size];
  const variantStyle = variantConfig[variant];

  // Handle ripple effect
  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ripple || isDisabled) return;

    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { x, y, id: Date.now() };
    setRipplePositions(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipplePositions(prev => prev.filter(r => r.id !== newRipple.id));
    }, transitionDuration + 200);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled) return;
    onClick?.(e);
  };

  // Determine button state
  const buttonState = loading ? 'loading' : success ? 'success' : error ? 'error' : 'default';

  return (
    <button
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      disabled={isDisabled}
      className={`
        relative
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        ${height}
        ${padding}
        ${fontSize}
        ${fullWidth ? 'w-full' : ''}
        ${variantStyle.base}
        ${isDisabled ? variantStyle.disabled : variantStyle.hover + ' ' + variantStyle.active}
        transition-all
        duration-${transitionDuration}
        ease-out
        focus:outline-none
        focus:ring-2
        focus:ring-[#f4c025]/50
        focus:ring-offset-2
        focus:ring-offset-zinc-950
        overflow-hidden
        ${className}
      `}
      style={{
        transitionDuration: `${transitionDuration}ms`,
      }}
    >
      {/* Ripple effects */}
      {ripple && ripplePositions.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className="inline-block w-32 h-32 rounded-full bg-white/20 animate-ping"
            style={{
              animationDuration: `${transitionDuration + 100}ms`,
            }}
          />
        </span>
      ))}

      {/* Button content */}
      {loading && (
        <span className="material-symbols-outlined animate-spin text-lg">
          refresh
        </span>
      )}

      {!loading && success && (
        <svg
          className="w-5 h-5 animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}

      {!loading && !success && error && (
        <svg
          className="w-5 h-5 animate-shake"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      )}

      {!loading && !success && !error && icon && (
        <span className="material-symbols-outlined">
          {icon}
        </span>
      )}

      {children && <span>{children}</span>}
    </button>
  );
};

export default ButtonAnimated;
