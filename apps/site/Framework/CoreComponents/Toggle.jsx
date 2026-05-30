import React, { forwardRef } from 'react';

/**
 * Toggle Component
 * 
 * On/off switch component.
 * 
 * @param {Object} props
 * @param {boolean} props.checked - Toggle state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Toggle label
 * @param {string} props.description - Additional description text
 * @param {'default'|'success'|'danger'|'warning'} props.variant - Toggle variant
 * @param {'base'|'sm'|'lg'} props.size - Toggle size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.showLabel - Show label text
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.containerClassName - Container CSS classes
 */
export const Toggle = forwardRef(({
  checked = false,
  onChange,
  label,
  description,
  variant = 'default',
  size = 'base',
  disabled = false,
  loading = false,
  showLabel = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  // Variant configurations
  const variantConfig = {
    default: {
      bgActive: 'bg-amber-500',
      bgInactive: 'bg-slate-700',
      ringFocus: 'focus:ring-amber-500/50',
    },
    success: {
      bgActive: 'bg-emerald-500',
      bgInactive: 'bg-slate-700',
      ringFocus: 'focus:ring-emerald-500/50',
    },
    danger: {
      bgActive: 'bg-red-500',
      bgInactive: 'bg-slate-700',
      ringFocus: 'focus:ring-red-500/50',
    },
    warning: {
      bgActive: 'bg-amber-500',
      bgInactive: 'bg-slate-700',
      ringFocus: 'focus:ring-amber-500/50',
    },
  };

  const config = variantConfig[variant];

  // Size configurations
  const sizeConfig = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-3 h-3 translate-x-4',
      thumbUnchecked: 'translate-x-0.5',
      thumbChecked: 'translate-x-4',
      text: 'text-sm',
    },
    base: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      thumbUnchecked: 'translate-x-0.5',
      thumbChecked: 'translate-x-5',
      text: 'text-sm',
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      thumbUnchecked: 'translate-x-0.5',
      thumbChecked: 'translate-x-7',
      text: 'text-base',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${containerClassName}`}>
      <span className="relative">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && !loading && onChange?.(e.target.checked)}
          disabled={disabled || loading}
          className="sr-only peer"
          {...props}
        />
        <div
          className={`
            ${sizes.track} rounded-full transition-all duration-200
            ${checked ? config.bgActive : config.bgInactive}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            peer-focus:outline-none peer-focus:ring-2 ${config.ringFocus}
            ${loading ? 'animate-pulse' : ''}
          `}
        >
          <div
            className={`absolute top-0.5 ${checked ? sizes.thumbChecked : sizes.thumbUnchecked} 
              ${sizes.thumb} bg-white rounded-full shadow-sm transition-all duration-200
              ${loading ? 'animate-pulse' : ''}`}
          />
        </div>
      </span>
      {showLabel && (label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={`font-medium text-white ${sizes.text} ${disabled ? 'opacity-50' : ''}`}>
              {label}
            </span>
          )}
          {description && (
            <span className={`text-gray-400 ${sizes.text} ${disabled ? 'opacity-50' : ''}`}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

Toggle.displayName = 'Toggle';

/**
 * ToggleGroup - Group of related toggles
 */
export const ToggleGroup = ({
  label,
  children,
  className = '',
  vertical = false,
}) => {
  return (
    <div className={className}>
      {label && (
        <p className="text-sm font-medium text-gray-400 mb-3">{label}</p>
      )}
      <div className={`flex ${vertical ? 'flex-col gap-4' : 'items-center gap-6'}`}>
        {children}
      </div>
    </div>
  );
};

/**
 * ToggleSwitch - Alternative naming
 */
export const ToggleSwitch = Toggle;

/**
 * Switch - Alternative naming
 */
export const Switch = Toggle;

export default Toggle;
