import React, { forwardRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DatePicker Component
 * 
 * Date picker with month navigation and day selection.
 * 
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {Date|string} props.value - Selected date
 * @param {Function} props.onChange - Change handler
 * @param {boolean} props.required - Show required asterisk
 * @param {boolean} props.disabled - Disabled state
 * @param {Date} props.minDate - Minimum selectable date
 * @param {Date} props.maxDate - Maximum selectable date
 * @param {boolean} props.showWeekNumbers - Show week numbers
 * @param {string} props.dateFormat - Display format
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
export const DatePicker = forwardRef(({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  minDate,
  maxDate,
  showWeekNumbers = false,
  dateFormat = 'MMM dd, yyyy',
  placeholder = 'Select date',
  className = '',
  inputClassName = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = React.useRef(null);

  // Parse value to Date
  const parseDate = (val) => {
    if (!val) return null;
    if (val instanceof Date) return val;
    return new Date(val);
  };

  const selectedDate = parseDate(value);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Days of month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Navigate months
  const navigateMonth = (direction) => {
    setCurrentMonth(new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + direction,
      1
    ));
  };

  // Select date
  const selectDate = (date) => {
    if (disabled) return;
    if (minDate && date < minDate) return;
    if (maxDate && date > maxDate) return;
    onChange?.(date);
    setIsOpen(false);
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!selectedDate || !date) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is disabled
  const isDisabled = (date) => {
    if (!date) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div ref={calendarRef} className="relative">
      {label && (
        <label className={`block text-sm font-medium text-gray-400 mb-1.5 ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={ref}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
            text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" strokeWidth={2} />
              <span className={selectedDate ? 'text-white' : 'text-gray-500'}>
                {selectedDate ? formatDate(selectedDate) : placeholder}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* Calendar */}
      {isOpen && (
        <div className="absolute z-50 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" strokeWidth={2} />
            </button>
            <span className="text-sm font-semibold text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          {/* Week days */}
          <div className="px-2 py-2 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="px-2 pb-2 grid grid-cols-7 gap-1">
            {days.map((date, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectDate(date)}
                disabled={isDisabled(date) || !date}
                className={`h-9 w-9 rounded-lg text-sm font-medium transition-all
                  ${isDisabled(date) || !date
                    ? 'text-gray-600 cursor-default'
                    : 'text-gray-300 hover:bg-slate-700/50 cursor-pointer'
                  }
                  ${isSelected(date) ? 'bg-amber-500 text-slate-900 hover:bg-amber-600' : ''}
                  ${isToday(date) && !isSelected(date) ? 'border border-amber-500/50' : ''}
                  ${isDisabled(date) || !date ? '' : 'focus:outline-none focus:ring-2 focus:ring-amber-500/50'}
                `}
                aria-label={date ? date.toLocaleDateString() : 'Empty'}
                aria-selected={isSelected(date)}
                aria-disabled={isDisabled(date) || !date}
              >
                {date ? date.getDate() : ''}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-700/50 flex justify-between items-center">
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              disabled={isDisabled(new Date())}
              className="text-sm text-amber-500 hover:text-amber-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-sm text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

DatePicker.displayName = 'DatePicker';

/**
 * DateRangePicker - Select date range
 */
export const DateRangePicker = ({
  label,
  value = { start: null, end: null },
  onChange,
  required = false,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className={`block text-sm font-medium text-gray-400 mb-1.5 ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        <DatePicker
          value={value.start}
          onChange={(date) => onChange?.({ ...value, start: date })}
          disabled={disabled}
          placeholder="Start date"
        />
        <DatePicker
          value={value.end}
          onChange={(date) => onChange?.({ ...value, end: date })}
          disabled={disabled || !value.start}
          minDate={value.start}
          placeholder="End date"
        />
      </div>
    </div>
  );
};

/**
 * Native DatePicker - Uses native date input for mobile
 */
export const NativeDatePicker = forwardRef(({
  label,
  value,
  onChange,
  required = false,
  disabled = false,
  min,
  max,
  className = '',
  ...props
}, ref) => {
  const formatDateForInput = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
    }
    return date;
  };

  return (
    <div>
      {label && (
        <label className={`block text-sm font-medium text-gray-400 mb-1.5 ${disabled ? 'opacity-50' : ''}`}>
          {label}
          {required && <span className="ml-1 text-amber-500">*</span>}
        </label>
      )}
      <input
        ref={ref}
        type="date"
        value={formatDateForInput(value)}
        onChange={(e) => onChange?.(e.target.value ? new Date(e.target.value) : null)}
        disabled={disabled}
        min={min}
        max={max}
        className={`w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 
          text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500
          disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
          [color-scheme:dark] ${className}`}
        {...props}
      />
    </div>
  );
});

NativeDatePicker.displayName = 'NativeDatePicker';

export default DatePicker;
