import React, { useRef, useState, useEffect } from 'react';
import { MoreVertical, ChevronDown, Check } from 'lucide-react';

/**
 * Dropdown Component
 * 
 * Menu dropdown with customizable items and positioning.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.trigger - Trigger element/button
 * @param {Array} props.items - Array of dropdown items { label, icon, onClick, disabled, danger, divider }
 * @param {'bottom-left'|'bottom-right'|'top-left'|'top-right'} props.position - Dropdown position
 * @param {boolean} props.closeOnClick - Close when item is clicked
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Trigger CSS classes
 * @param {string} props.menuClassName - Menu CSS classes
 * @param {boolean} props.alignRight - Right align dropdown (deprecated, use position)
 */
export const Dropdown = ({
  trigger,
  items = [],
  position = 'bottom-left',
  closeOnClick = true,
  disabled = false,
  className = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Position classes
  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (item, index) => {
    if (item.disabled) return;
    item.onClick?.(item, index);
    if (closeOnClick) {
      setIsOpen(false);
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger || (
          <button
            type="button"
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <MoreVertical className="w-5 h-5" strokeWidth={2} />
          </button>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute z-50 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl
            overflow-hidden animate-slide-up ${positionClasses[position]} ${menuClassName}
          `}
          role="menu"
          aria-label="Dropdown menu"
        >
          <div className="py-1">
            {items.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="h-px bg-slate-700/50 my-1"
                    role="separator"
                  />
                );
              }

              if (item.header) {
                return (
                  <div
                    key={`header-${index}`}
                    className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {item.label}
                  </div>
                );
              }

              const Icon = item.icon;

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleItemClick(item, index)}
                  disabled={item.disabled}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                    ${item.danger
                      ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                      : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
                    }
                    ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    ${item.active ? 'bg-amber-500/10 text-amber-500' : ''}
                  `}
                  role="menuitem"
                >
                  {Icon && (
                    <span className="flex-shrink-0">
                      <Icon className="w-4 h-4" strokeWidth={2} />
                    </span>
                  )}
                  <span className="flex-1">{item.label}</span>
                  {item.checked && (
                    <Check className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={3} />
                  )}
                  {item.badge && <span>{item.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * DropdownMenu - Alternative simpler interface
 */
export const DropdownMenu = ({
  trigger,
  children,
  position = 'bottom-right',
  className = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const positionClasses = {
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`
            absolute z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl
            overflow-hidden animate-slide-up ${positionClasses[position]} ${menuClassName}
          `}
          role="menu"
        >
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onClick: () => {
                  child.props.onClick?.();
                  setIsOpen(false);
                },
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

/**
 * DropdownItem - Individual dropdown menu item
 */
export const DropdownItem = ({
  icon,
  label,
  onClick,
  disabled = false,
  danger = false,
  active = false,
  checked = false,
  badge,
  className = '',
}) => {
  const Icon = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
        ${danger
          ? 'text-red-400 hover:bg-red-500/10'
          : active
          ? 'bg-amber-500/10 text-amber-500'
          : 'text-gray-300 hover:bg-slate-700/50 hover:text-white'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      role="menuitem"
    >
      {Icon && (
        <span className="flex-shrink-0">
          <Icon className="w-4 h-4" strokeWidth={2} />
        </span>
      )}
      <span className="flex-1">{label}</span>
      {checked && (
        <Check className="w-4 h-4 text-amber-500 flex-shrink-0" strokeWidth={3} />
      )}
      {badge && <span>{badge}</span>}
    </button>
  );
};

/**
 * DropdownDivider - Separator in dropdown
 */
export const DropdownDivider = () => (
  <div className="h-px bg-slate-700/50 my-1" role="separator" />
);

/**
 * DropdownHeader - Section header
 */
export const DropdownHeader = ({ children }) => (
  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
    {children}
  </div>
);

/**
 * SelectDropdown - Dropdown that acts like a select
 */
export const SelectDropdown = ({
  trigger,
  options = [],
  value,
  onChange,
  className = '',
  ...props
}) => {
  const items = options.map((option) => ({
    ...option,
    active: option.value === value,
    onClick: () => onChange?.(option.value),
  }));

  return (
    <Dropdown
      trigger={trigger}
      items={items}
      className={className}
      {...props}
    />
  );
};

/**
 * SplitButton - Button with dropdown attached
 */
export const SplitButton = ({
  mainButton,
  dropdownItems = [],
  position = 'bottom-right',
  className = '',
}) => {
  return (
    <div className={`inline-flex rounded-lg overflow-hidden ${className}`}>
      {mainButton}
      <Dropdown
        trigger={
          <button
            type="button"
            className="px-3 py-3 bg-amber-600 hover:bg-amber-700 text-slate-900 border-l border-amber-700 transition-colors"
          >
            <ChevronDown className="w-4 h-4" strokeWidth={2} />
          </button>
        }
        items={dropdownItems}
        position={position}
        triggerClassName="!p-0"
      />
    </div>
  );
};

export default Dropdown;
