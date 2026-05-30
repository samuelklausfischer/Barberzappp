import React, { forwardRef } from 'react';

/**
 * Checkbox Component
 * 
 * Custom styled checkbox input.
 * 
 * @param {Object} props
 * @param {boolean} props.checked - Checkbox state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Checkbox label
 * @param {string} props.description - Additional description text
 * @param {'default'|'error'} props.state - Checkbox state
 * @param {'sm'|'base'|'lg'} props.size - Checkbox size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.indeterminate - Indeterminate state
 * @param {boolean} props.required - Show required asterisk
 * @param {boolean} props.showLabel - Show label text
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.containerClassName - Container CSS classes
 */
export const Checkbox = forwardRef(({
  checked = false,
  onChange,
  label,
  description,
  state = 'default',
  size = 'base',
  disabled = false,
  indeterminate = false,
  required = false,
  showLabel = true,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  // State configurations
  const stateConfig = {
    default: {
      border: 'border-slate-600 focus:ring-amber-500/50',
      text: 'text-white',
      description: 'text-gray-400',
    },
    error: {
      border: 'border-red-500 focus:ring-red-500/50',
      text: 'text-white',
      description: 'text-red-400',
    },
  };

  const config = stateConfig[state];

  // Size configurations
  const sizeConfig = {
    sm: {
      box: 'w-4 h-4',
      icon: 'w-3 h-3',
      label: 'text-sm',
    },
    base: {
      box: 'w-4 h-4',
      icon: 'w-3.5 h-3.5',
      label: 'text-sm',
    },
    lg: {
      box: 'w-5 h-5',
      icon: 'w-4 h-4',
      label: 'text-base',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <label className={`flex items-start gap-3 cursor-pointer ${containerClassName}`}>
      <div className="relative flex items-start pt-0.5">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          required={required}
          className={`
            ${sizes.box} rounded border ${config.border} bg-slate-800/50 text-amber-500
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-slate-900
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${indeterminate ? 'indeterminate' : ''}
            ${className}
          `}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
          {...props}
        />
        {/* Custom checkmark */}
        {(checked || indeterminate) && (
          <svg
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              ${sizes.box} pointer-events-none text-amber-500 ${disabled ? 'opacity-50' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {indeterminate ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 12h14" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            )}
          </svg>
        )}
      </div>
      {showLabel && (label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className={`${sizes.label} font-medium ${config.text} ${disabled ? 'opacity-50' : ''}`}>
              {label}
              {required && <span className="ml-1 text-amber-500">*</span>}
            </span>
          )}
          {description && (
            <span className={`text-xs ${config.description} ${disabled ? 'opacity-50' : ''} mt-0.5`}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';

/**
 * CheckboxGroup - Group of related checkboxes
 */
export const CheckboxGroup = ({
  label,
  options = [],
  value = [],
  onChange,
  state = 'default',
  disabled = false,
  columns = 1,
  className = '',
  ...props
}) => {
  const handleChange = (optionValue, checked) => {
    const newValue = checked
      ? [...value, optionValue]
      : value.filter((v) => v !== optionValue);
    onChange?.(newValue);
  };

  return (
    <div className={className}>
      {label && (
        <p className="text-sm font-medium text-gray-400 mb-3">{label}</p>
      )}
      <div className={`grid gap-3 ${columns > 1 ? `grid-cols-${columns}` : ''}`}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            label={option.label}
            description={option.description}
            checked={value.includes(option.value)}
            onChange={(checked) => handleChange(option.value, checked)}
            disabled={disabled || option.disabled}
            state={state}
            {...props}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * CheckboxCard - Card-style checkbox
 */
export const CheckboxCard = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  icon,
  className = '',
}) => {
  return (
    <label
      className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer
        ${checked
          ? 'bg-amber-500/10 border-amber-500/50'
          : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/30 hover:border-slate-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      <div className="flex-shrink-0 pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.checked)}
          disabled={disabled}
          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500/50"
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span className={`font-medium text-white ${checked ? 'text-amber-500' : ''}`}>{label}</span>
        </div>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>
      {checked && (
        <div className="absolute top-4 right-4 text-amber-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </label>
  );
};

/**
 * Radio Component
 * 
 * Custom styled radio input.
 * 
 * @param {Object} props
 * @param {boolean} props.checked - Radio state
 * @param {Function} props.onChange - Change handler
 * @param {string} props.label - Radio label
 * @param {string} props.description - Additional description text
 * @param {'default'|'error'} props.state - Radio state
 * @param {'sm'|'base'|'lg'} props.size - Radio size
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.required - Show required asterisk
 * @param {string} props.value - Radio value
 * @param {string} props.name - Radio group name
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.containerClassName - Container CSS classes
 */
export const Radio = forwardRef(({
  checked = false,
  onChange,
  label,
  description,
  state = 'default',
  size = 'base',
  disabled = false,
  required = false,
  value,
  name,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const stateConfig = {
    default: {
      border: 'border-slate-600 focus:ring-amber-500/50',
      text: 'text-white',
      description: 'text-gray-400',
    },
    error: {
      border: 'border-red-500 focus:ring-red-500/50',
      text: 'text-white',
      description: 'text-red-400',
    },
  };

  const config = stateConfig[state];

  const sizeConfig = {
    sm: { box: 'w-4 h-4', dot: 'w-2 h-2', label: 'text-sm' },
    base: { box: 'w-4 h-4', dot: 'w-2 h-2', label: 'text-sm' },
    lg: { box: 'w-5 h-5', dot: 'w-2.5 h-2.5', label: 'text-base' },
  };

  const sizes = sizeConfig[size];

  return (
    <label className={`flex items-start gap-3 cursor-pointer ${containerClassName}`}>
      <div className="relative flex items-start pt-0.5">
        <input
          ref={ref}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => !disabled && onChange?.(e.target.value, e.target.checked)}
          disabled={disabled}
          required={required}
          className={`
            ${sizes.box} rounded-full border ${config.border} bg-slate-800/50
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-slate-900
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
          }}
          {...props}
        />
        {/* Custom radio dot */}
        {checked && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              ${sizes.dot} rounded-full bg-amber-500 ${disabled ? 'opacity-50' : ''}`}
          />
        )}
      </div>
      {label && (
        <div className="flex flex-col">
          <span className={`${sizes.label} font-medium ${config.text} ${disabled ? 'opacity-50' : ''}`}>
            {label}
            {required && <span className="ml-1 text-amber-500">*</span>}
          </span>
          {description && (
            <span className={`text-xs ${config.description} ${disabled ? 'opacity-50' : ''} mt-0.5`}>
              {description}
            </span>
          )}
        </div>
      )}
    </label>
  );
});

Radio.displayName = 'Radio';

/**
 * RadioGroup - Group of related radios
 */
export const RadioGroup = ({
  label,
  options = [],
  value,
  onChange,
  name = 'radio-group',
  state = 'default',
  disabled = false,
  orientation = 'vertical',
  className = '',
  ...props
}) => {
  return (
    <div className={className}>
      {label && (
        <p className="text-sm font-medium text-gray-400 mb-3">{label}</p>
      )}
      <div className={`flex ${orientation === 'vertical' ? 'flex-col gap-3' : 'flex-row gap-6'}`}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={(val) => onChange?.(val)}
            disabled={disabled || option.disabled}
            state={state}
            {...props}
          />
        ))}
      </div>
    </div>
  );
};

export default Checkbox;
