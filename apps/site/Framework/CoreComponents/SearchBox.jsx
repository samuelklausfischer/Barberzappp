import React, { forwardRef, useState, useEffect } from 'react';
import { Search, X, Clock, Filter } from 'lucide-react';

/**
 * SearchBox Component
 * 
 * Global search input with history and filters.
 * 
 * @param {Object} props
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Search value
 * @param {Function} props.onChange - Change handler
 * @param {Function} props.onSearch - Search submit handler
 * @param {boolean} props.showHistory - Show search history
 * @param {Array} props.history - Search history items
 * @param {boolean} props.showFilters - Show filter button
 * @param {React.ReactNode} props.filters - Filter components
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} autoFocus - Auto focus on mount
 * @param {'sm'|'base'|'lg'} props.size - Input size
 * @param {string} props.className - Additional CSS classes
 */
export const SearchBox = forwardRef(({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  showHistory = true,
  history = [],
  showFilters = false,
  filters,
  loading = false,
  disabled = false,
  autoFocus = false,
  size = 'base',
  className = '',
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(inputValue);
    setShowHistoryDropdown(false);
  };

  const handleHistoryClick = (historyItem) => {
    setInputValue(historyItem);
    onChange?.(historyItem);
    onSearch?.(historyItem);
    setShowHistoryDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearch?.(inputValue);
      setShowHistoryDropdown(false);
    }
    if (e.key === 'Escape') {
      setShowHistoryDropdown(false);
    }
  };

  const sizeConfig = {
    sm: 'py-2 px-3 text-sm',
    base: 'py-3 px-4 text-sm',
    lg: 'py-4 px-5 text-base',
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
          <Search
            className={`w-5 h-5 text-gray-500 ${loading ? 'animate-pulse' : ''}`}
            strokeWidth={2}
          />
        </div>

        {/* Input */}
        <input
          ref={ref}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange?.(e.target.value);
            setShowHistoryDropdown(showHistory && e.target.value.length === 0 && history.length > 0);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (showHistory && inputValue.length === 0 && history.length > 0) {
              setShowHistoryDropdown(true);
            }
          }}
          onBlur={() => {
            setTimeout(() => setShowHistoryDropdown(false), 200);
            setIsFocused(false);
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-24 ${sizeConfig[size]}
            text-white placeholder-gray-500 focus:outline-none focus:ring-2
            focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${isFocused ? 'border-amber-500' : ''}`}
          {...props}
        />

        {/* Right Actions */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {inputValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
          {showFilters && (
            <button
              type="button"
              className="p-1.5 text-gray-500 hover:text-white hover:bg-slate-700/50 rounded transition-colors"
              aria-label="Toggle filters"
            >
              <Filter className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
      </form>

      {/* History Dropdown */}
      {showHistoryDropdown && history.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50 animate-slide-up">
          <div className="px-4 py-2 border-b border-slate-700/50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recent Searches
            </p>
          </div>
          <ul className="py-1 max-h-60 overflow-y-auto">
            {history.slice(0, 5).map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => handleHistoryClick(item)}
                  className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-700/50 transition-colors"
                >
                  <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" strokeWidth={2} />
                  <span className="text-sm text-gray-300 truncate">{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters Panel */}
      {filters && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-4">{filters}</div>
        </div>
      )}
    </div>
  );
});

SearchBox.displayName = 'SearchBox';

/**
 * CompactSearch - Minimal search input
 */
export const CompactSearch = forwardRef(({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
  loading = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" strokeWidth={2} />
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch?.(value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm
          text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
          disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    </form>
  );
});

CompactSearch.displayName = 'CompactSearch';

/**
 * SearchWithButton - Search input with search button
 */
export const SearchWithButton = forwardRef(({
  placeholder = 'Search...',
  value = '',
  onChange,
  onSearch,
 Loading = false,
  disabled = false,
  buttonText = 'Search',
  className = '',
  ...props
}, ref) => {
  return (
    <form onSubmit={(e) => e.preventDefault()} className={`flex gap-2 ${className}`}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" strokeWidth={2} />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch?.(value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-sm
            text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
            disabled:opacity-50 disabled:cursor-not-allowed`}
          {...props}
        />
      </div>
      <button
        type="button"
        onClick={() => onSearch?.(value)}
        disabled={disabled || Loading}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {Loading ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Searching...
          </>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
});

SearchWithButton.displayName = 'SearchWithButton';

export default SearchBox;
