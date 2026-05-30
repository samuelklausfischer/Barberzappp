import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Button Component
 * 
 * Button with multiple variants and states.
 * 
 * @param {Object} props
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} props.variant - Button variant
 * @param {'sm'|'base'|'lg'} props.size - Button size
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disabled state
 * @param {React.ReactNode} props.children - Button content
 * @param {React.ReactNode} props.leftIcon - Icon on left side
 * @param {React.ReactNode} props.rightIcon - Icon on right side
 * @param {'submit'|'button'|'reset'} props.type - Button type
 * @param {Function} props.onClick - Click handler
 * @param {boolean} props.fullWidth - Full width button
 * @param {string} props.className - Additional CSS classes
 */
export const Button = forwardRef(({
  variant = 'primary',
  size = 'base',
  loading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  type = 'button',
  onClick,
  fullWidth = false,
  className = '',
  ...props
}, ref) => {
  // Variant configurations
  const variantConfig = {
    primary: `
      bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold
      shadow-lg hover:shadow-glow-gold
      disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
    `,
    secondary: `
      bg-slate-700/50 hover:bg-slate-700 text-white border border-slate-600
      hover:border-slate-500 font-medium shadow-md
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    outline: `
      bg-transparent border border-slate-600 hover:border-slate-500 text-gray-400
      hover:text-white font-medium
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    ghost: `
      bg-transparent hover:bg-slate-800/50 text-gray-400 hover:text-white
      font-medium
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    danger: `
      bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30
      hover:border-red-500/50 hover:shadow-glow-red font-medium
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    dangerFilled: `
      bg-red-500 hover:bg-red-600 text-white font-semibold
      shadow-lg hover:shadow-glow-red
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'px-3 py-2',
      text: 'text-sm',
      icon: 'w-4 h-4',
      iconGap: 'gap-1.5',
    },
    base: {
      padding: 'px-6 py-3',
      text: 'text-sm',
      icon: 'w-5 h-5',
      iconGap: 'gap-2',
    },
    lg: {
      padding: 'px-8 py-4',
      text: 'text-base',
      icon: 'w-5 h-5',
      iconGap: 'gap-2',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg transition-all duration-150
        ${variants?.secondary} 
        ${sizes.padding} ${sizes.text}
        ${fullWidth ? 'w-full' : ''}
        ${loading ? 'cursor-wait' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${variantConfig[variant]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className={`${sizes.icon} animate-spin mr-2`} strokeWidth={2} />
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <span className={`flex-shrink-0 ${sizes.icon} sizes?.iconGap}`}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className={`flex-shrink-0 ${sizes.icon} sizes?.iconGap}`}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
});

Button.displayName = 'Button';

/**
 * IconButton - Icon-only button
 */
export const IconButton = forwardRef(({
  icon,
  variant = 'ghost',
  size = 'base',
  loading = false,
  disabled = false,
  tooltip,
  onClick,
  className = '',
  ...props
}, ref) => {
  const sizeConfig = {
    sm: 'w-8 h-8 p-2',
    base: 'w-10 h-10 p-2',
    lg: 'w-12 h-12 p-3',
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center rounded-lg 
        transition-all duration-150
        ${sizeConfig[size]}
        ${variant === 'primary'
          ? 'bg-amber-500 hover:bg-amber-600 text-slate-900'
          : 'bg-transparent hover:bg-slate-700/50 text-gray-400 hover:text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
        ${className}
      `}
      title={tooltip}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-full h-full animate-spin" strokeWidth={2} />
      ) : (
        icon
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

/**
 * ButtonGroup - Grouped buttons
 */
export const ButtonGroup = ({
  children,
  orientation = 'horizontal',
  size = 'base',
  className = '',
}) => {
  return (
    <div
      className={`
        inline-flex bg-slate-800/50 p-1 border border-slate-700/50 rounded-lg
        ${orientation === 'vertical' ? 'flex-col' : ''}
        ${className}
      `}
      role="group"
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            variant: child.props.variant || 'ghost',
            size,
            className: `
              ${orientation === 'vertical' ? 'justify-start' : ''}
              ${child.props.className || ''}
            `,
          });
        }
        return child;
      })}
    </div>
  );
};

/**
 * PrimaryButton - Shortcut for primary variant
 */
export const PrimaryButton = (props) => <Button variant="primary" {...props} />;

/**
 * SecondaryButton - Shortcut for secondary variant
 */
export const SecondaryButton = (props) => <Button variant="secondary" {...props} />;

/**
 * OutlineButton - Shortcut for outline variant
 */
export const OutlineButton = (props) => <Button variant="outline" {...props} />;

/**
 * GhostButton - Shortcut for ghost variant
 */
export const GhostButton = (props) => <Button variant="ghost" {...props} />;

/**
 * DangerButton - Shortcut for danger variant
 */
export const DangerButton = (props) => <Button variant="danger" {...props} />;

/**
 * DangerButtonFilled - Shortcut for filled danger variant
 */
export const DangerButtonFilled = (props) => <Button variant="dangerFilled" {...props} />;

export default Button;
