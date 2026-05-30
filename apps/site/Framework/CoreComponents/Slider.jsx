import React, { forwardRef } from 'react';

/**
 * Slider Component
 * 
 * Range slider for numeric input values.
 * 
 * @param {Object} props
 * @param {number} props.value - Current slider value
 * @param {Function} props.onChange - Change handler
 * @param {number} props.min - Minimum value
 * @param {number} props.max - Maximum value
 * @param {number} props.step - Step increment
 * @param {string} props.label - Slider label
 * @param {string} props.helperText - Helper/description text
 * @param {string[]} props.marks - Array of mark labels
 * @param {boolean} props.showValue - Display current value
 * @param {'default'|'compact'} props.variant - Display variant
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.containerClassName - Container CSS classes
 */
export const Slider = forwardRef(({
  value = 0,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  helperText,
  marks = [],
  showValue = true,
  variant = 'default',
  disabled = false,
  className = '',
  containerClassName = '',
  ...props
}, ref) => {
  const handleInputChange = (e) => {
    const newValue = parseFloat(e.target.value);
    onChange?.(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={containerClassName}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-400">
            {label}
          </label>
          {showValue && (
            <span className="text-sm font-semibold text-amber-400">
              {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        {/* Track background */}
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          {/* Filled track */}
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Input */}
        <input
          ref={ref}
          type="range"
          value={value}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          {...props}
        />
        {/* Custom thumb */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-amber-500 pointer-events-none transition-transform duration-150 hover:scale-110 ${disabled ? 'opacity-50' : ''}`}
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
      {/* Marks */}
      {marks.length > 0 && (
        <div className="flex justify-between mt-2">
          {marks.map((mark, index) => {
            const markPercentage = (index / (marks.length - 1)) * 100;
            return (
              <span 
                key={index} 
                className="text-xs text-gray-500"
                style={{ marginLeft: index === 0 ? '-4px' : index === marks.length - 1 ? '4px' : '0' }}
              >
                {mark}
              </span>
            );
          })}
        </div>
      )}
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
});

Slider.displayName = 'Slider';

/**
 * RangeSlider - Double-ended range slider
 */
export const RangeSlider = ({
  values = [0, 100],
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  ...props
}) => {
  const [localMin, localMax] = values;

  return (
    <div {...props}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-400">
            {label}
          </label>
          <span className="text-sm font-semibold text-amber-400">
            {localMin} - {localMax}
          </span>
        </div>
      )}
      <div className="relative h-2">
        <div className="absolute inset-0 bg-slate-700 rounded-full" />
        <div 
          className="absolute h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
          style={{ 
            left: `((localMin - min) / (max - min)) * 100`,
            width: `((localMax - localMin) / (max - min)) * 100`
          }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-3">Range slider coming soon...</p>
    </div>
  );
};

export default Slider;
