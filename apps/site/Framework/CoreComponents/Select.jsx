import React, { forwardRef, useState } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

/**
 * Select Component
 * 
 * Dropdown select with search functionality.
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {Array} props.options - Array of options { value, label, disabled, icon }
 * @param {string} props.value - Current selected value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.searchable - Enable search/filter
 * @param {boolean} props.multiple - Enable multi-select
 * @param {boolean} props.required - Show required asterisk
 * @param {boolean} props.disabled - Disabled state
 * @param {'default'|'error'|'success'} props.state - Input state
 * @param {string} props.errorMessage - Error message
 * @param {string} props.helperText - Helper text
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.leftIcon - Left icon
 */
export const Select = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  searchable = false,
  multiple = false,
  required = false,
  disabled = false,
  state = 'default',
  errorMessage,
  helperText,
  className = '',
  leftIcon,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = React.useRef(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get selected option(s)
  const getSelectedOption = () => {
    if (multiple) {
      return options.filter((opt) => Array.isArray(value) && value.includes(opt.value));
    }
    return options.find((opt) => opt.value === value);
  };

  const selectedOption = getSelectedOption();

  // Handle option selection
  const handleSelect = (option) => {
    if (option.disabled) return;

    if (multiple) {
      const newValue = Array.isArray(value) ? [...value] : [];
      const index = newValue.indexOf(option.value);
      if (index === -1) {
        newValue.push(option.value);
      } else {
        newValue.splice(index, 1);
      }
      onChange?.(newValue);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
    }
    setSearchQuery('');
  };

  // Handle deselect (for multiple)
  const handleDeselect = (e, optionValue) => {
    e.stopPropagation();
    const newValue = value.filter((v) => v !== optionValue);
    onChange?.(newValue);
  };

  // State configurations
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
    <div ref={dropdownRef} className="relative">
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${config.label} ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500">{leftIcon}</span>
          </div>
        )}
        <button
          ref={ref}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full bg-slate-800/50 border rounded-lg px-4 py-3 
            text-left transition-all duration-200 focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${config.border} ${leftIcon ? 'pl-10' : ''} ${className}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          {...props}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {multiple ? (
                Array.isArray(value) && value.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {selectedOption.map((opt) => (
                      <span
                        key={opt.value}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-500/15 text-amber-500"
                      >
                        {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                        <span className="truncate max-w-[150px]">{opt.label}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeselect(e, opt.value)}
                          className="hover:text-amber-400"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">{placeholder}</span>
                )
              ) : selectedOption ? (
                <div className="flex items-center gap-2">
                  {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
                  <span className="truncate">{selectedOption.label}</span>
                </div>
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-slide-up">
          {/* Search */}
          {searchable && (
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" strokeWidth={2} />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
            aria-multiselectable={multiple}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = multiple
                  ? Array.isArray(value) && value.includes(option.value)
                  : value === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={option.disabled}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-700/50 cursor-pointer'}
                      ${isSelected ? 'bg-amber-500/10 text-amber-500' : 'text-gray-300'}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    {checkbox && (
                      <span className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-amber-500"
                          readOnly
                        />
                      </span>
                    )}
                    {multiple && (
                      <span className="flex-shrink-0">
                        {isSelected ? (
                          <Check className="w-4 h-4" strokeWidth={3} />
                        ) : (
                          <span className="w-4 h-4 border border-slate-600 rounded" />
                        )}
                      </span>
                    )}
                    {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                    <span className="truncate flex-1">{option.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="mt-1.5 text-xs text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
      {helperText && !errorMessage && (
        <p className="mt-1.5 text-xs text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';

/**
 * Native Select - Uses native HTML select for better mobile support
 */
export const NativeSelect = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  state = 'default',
  errorMessage,
  helperText,
  className = '',
  ...props
}, ref) => {
  const stateConfig = {
    default: {
      border: 'border-slate-700 focus:border-amber-500 focus:ring-amber-500/50',
      label: 'text-gray-400',
    },
    error: {
      border: 'border-red-500 focus:border-red-500 focus:ring-red-500/50',
      label: 'text-red-400',
    },
    success: {
      border: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/50',
      label: 'text-emerald-400',
    },
  };

  const config = stateConfig[state];

  return (
    <div>
      {label && (
        <label className={`block text-sm font-medium mb-1.5 ${config.label} ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          value={value || ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          className={`w-full bg-slate-800/50 border rounded-lg px-4 py-3 
            text-white appearance-none transition-all duration-200 focus:outline-none focus:ring-2
            disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
            ${config.border} ${className}`}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2} />
        </div>
      </div>
      {errorMessage && (
        <p className="mt-1.5 text-xs text-red-400" role="alert">
          {errorMessage}
        </p>
      )}
      {helperText && !errorMessage && (
        <p className="mt-1.5 text-xs text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

NativeSelect.displayName = 'NativeSelect';

export default Select;
