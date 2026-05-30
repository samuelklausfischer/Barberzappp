import React, { forwardRef } from 'react';

/**
 * Input Component
 * 
 * Text inputs with various states (default, error, success).
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.placeholder - Placeholder text
 * @param {'text'|'email'|'tel'|'password'|'number'|'url'} props.type - Input type
 * @param {'default'|'error'|'success'} props.state - Input state
 * @param {string} props.errorMessage - Error message to display
 * @param {string} props.helperText - Helper/description text
 * @param {boolean} props.required - Show required asterisk
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Show loading state
 * @param {React.ReactNode} props.leftIcon - Icon displayed on left
 * @param {React.ReactNode} props.rightIcon - Icon displayed on right
 * @param {Function} props.onRightIconClick - Right icon click handler
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.containerClassName - Container CSS classes
 */
export const Input = forwardRef(({
  label,
  placeholder,
  type = 'text',
  state = 'default',
  errorMessage,
  helperText,
  required = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  onRightIconClick,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  // State configurations
  const stateConfig = {
    default: {
      border: 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/50',
      text: 'text-white placeholder-gray-500',
      label: 'text-gray-400',
      message: 'text-gray-400',
    },
    error: {
      border: 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
      text: 'text-white placeholder-gray-500',
      label: 'text-red-400',
      message: 'text-red-400',
    },
    success: {
      border: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/50',
      text: 'text-white placeholder-gray-500',
      label: 'text-emerald-400',
      message: 'text-emerald-400',
    },
  };

  const config = stateConfig[state];

  return (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${config.label} ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500" aria-label="required">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">{leftIcon}</span>
          </div>
        )}
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          disabled={disabled || loading}
          className={`w-full bg-slate-800/50 border rounded-lg px-4 py-3 
            transition-all duration-200 focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${config.border} ${config.text} 
            ${leftIcon ? 'pl-10' : ''} 
            ${rightIcon ? 'pr-10' : ''} 
            ${className}`}
          aria-invalid={state === 'error'}
          aria-describedby={errorMessage ? `${props.id || 'input'}-error` : helperText ? `${props.id || 'input'}-helper` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={onRightIconClick}
              className="text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              tabIndex={-1}
              aria-label={typeof rightIcon === 'string' ? rightIcon : 'Right icon action'}
            >
              {rightIcon}
            </button>
          </div>
        )}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <svg className="animate-spin h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>
      {errorMessage && (
        <p id={`${props.id || 'input'}-error`} className={`mt-1.5 text-xs ${config.message}`} role="alert">
          {errorMessage}
        </p>
      )}
      {helperText && !errorMessage && (
        <p id={`${props.id || 'input'}-helper`} className={`mt-1.5 text-xs ${config.message}`}>
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * Textarea Component
 */
export const Textarea = forwardRef(({
  label,
  placeholder,
  rows = 4,
  state = 'default',
  errorMessage,
  helperText,
  required = false,
  disabled = false,
  maxLength,
  showCharacterCount = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const stateConfig = {
    default: {
      border: 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/50',
      label: 'text-gray-400',
      message: 'text-gray-400',
    },
    error: {
      border: 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
      label: 'text-red-400',
      message: 'text-red-400',
    },
    success: {
      border: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/50',
      label: 'text-emerald-400',
      message: 'text-emerald-400',
    },
  };

  const config = stateConfig[state];

  return (
    <div className={`relative ${containerClassName}`}>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${config.label} ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full bg-slate-800/50 border rounded-lg px-4 py-3 
          text-white placeholder-gray-500 resize-none
          transition-all duration-200 focus:outline-none focus:ring-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${config.border}
          ${className}`}
        aria-invalid={state === 'error'}
        aria-describedby={errorMessage ? `${props.id || 'textarea'}-error` : helperText ? `${props.id || 'textarea'}-helper` : undefined}
        {...props}
      />
      <div className="flex justify-between items-start mt-1.5">
        {errorMessage && (
          <p id={`${props.id || 'textarea'}-error`} className={`text-xs ${config.message}`} role="alert">
            {errorMessage}
          </p>
        )}
        {helperText && !errorMessage && (
          <p id={`${props.id || 'textarea'}-helper`} className={`text-xs ${config.message}`}>
            {helperText}
          </p>
        )}
        {showCharacterCount && maxLength && (
          <span className={`text-xs ${config.message} ml-auto`}>
            {props.value?.length || 0}/{maxLength}
          </span>
        )}
      </div>
    </div>
  );
});

Textarea.displayName = 'Textarea';

/**
 * InputGroup - Group of related inputs
 */
export const InputGroup = ({ label, children, className = '', columns = 1 }) => {
  const gridCols = columns > 1 ? `grid grid-cols-1 md:grid-cols-${columns} gap-4` : 'space-y-4';

  return (
    <div className={className}>
      {label && (
        <p className="text-sm font-medium text-gray-400 mb-3">{label}</p>
      )}
      <div className={gridCols}>
        {children}
      </div>
    </div>
  );
};

/**
 * SearchInput - Pre-styled search input
 */
export const SearchInput = forwardRef(({
  placeholder = 'Search...',
  onClear,
  value,
  ...props
}, ref) => {
  const { Search, X } = require('lucide-react');

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-500" strokeWidth={2} />
      </div>
      <Input
        ref={ref}
        placeholder={placeholder}
        leftIcon={null}
        rightIcon={
          value && (
            <button
              type="button"
              onClick={onClear}
              className="hover:bg-slate-700/50 p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          )
        }
        onRightIconClick={onClear}
        className="!pl-10"
        value={value}
        {...props}
      />
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

export default Input;
