import React, { useState } from 'react';

/**
 * Tabs Component
 * 
 * Tab navigation component.
 * 
 * @param {Object} props
 * @param {Array} props.tabs - Array of tab objects { id, label, icon, disabled, badge }
 * @param {string} props.activeTab - Currently active tab ID
 * @param {Function} props.onChange - Tab change handler
 * @param {'default'|'pills'|'underline'} props.variant - Tab variant
 * @param {'sm'|'base'|'lg'} props.size - Tab size
 * @param {boolean} props.fullWidth - Full width tabs
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.tabClassName - Individual tab CSS classes
 */
export const Tabs = ({
  tabs = [],
  activeTab,
  onChange,
  variant = 'default',
  size = 'base',
  fullWidth = false,
  className = '',
  tabClassName = '',
}) => {
  // Handle tabs as controlled or uncontrolled
  const [internalActiveTab, setInternalActiveTab] = useState(
    activeTab || tabs[0]?.id
  );

  const currentActiveTab = activeTab || internalActiveTab;
  const handleTabChange = (tabId) => {
    if (!activeTab) {
      setInternalActiveTab(tabId);
    }
    onChange?.(tabId);
  };

  // Variant configurations
  const variantConfig = {
    default: {
      container: 'border-b border-slate-700',
      tab: `
        pb-4 px-4 border-b-2 -mb-px transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-inset
      `,
      active: 'border-amber-500 text-amber-500',
      inactive: 'border-transparent text-gray-400 hover:text-white hover:border-slate-600',
    },
    pills: {
      container: 'inline-flex rounded-lg bg-slate-800/50 p-1 border border-slate-700/50',
      tab: `
        px-4 py-2 rounded-md transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-amber-500/50
      `,
      active: 'bg-slate-700 text-white shadow',
      inactive: 'text-gray-400 hover:text-white hover:bg-slate-700/30',
    },
    underline: {
      container: 'border-b border-slate-700',
      tab: `
        pb-4 px-4 border-b-2 -mb-px transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-inset
      `,
      active: 'border-amber-500 text-white',
      inactive: 'border-transparent text-gray-400 hover:text-white',
    },
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      text: 'text-xs',
      padding: variant === 'pills' ? 'px-3 py-1.5' : 'px-3 py-3',
    },
    base: {
      text: 'text-sm',
      padding: variant === 'pills' ? 'px-4 py-2' : 'px-4 py-4',
    },
    lg: {
      text: 'text-base',
      padding: variant === 'pills' ? 'px-6 py-2.5' : 'px-6 py-5',
    },
  };

  const config = variantConfig[variant];
  const sizes = sizeConfig[size];

  return (
    <nav
      className={`${config.container} ${className}`}
      role="tablist"
      aria-label="Tabs"
    >
      <div className={`flex ${fullWidth ? 'w-full' : ''} ${variant === 'pills' ? '' : 'gap-1'}`}>
        {tabs.map((tab) => {
          const isActive = currentActiveTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => !tab.disabled && handleTabChange(tab.id)}
              disabled={tab.disabled}
              className={`
                inline-flex items-center gap-2 font-medium whitespace-nowrap
                ${config.tab} ${sizes.text}
                ${isActive ? config.active : config.inactive}
                ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${fullWidth ? 'flex-1 justify-center' : ''}
                ${tabClassName}
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
            >
              {tab.icon && (
                <span className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="ml-1">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * TabPanel - Content panel for each tab
 */
export const TabPanel = ({
  children,
  activeTab,
  tabId,
  className = '',
}) => {
  if (activeTab !== tabId) return null;

  return (
    <div
      id={`panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      className={`py-4 ${className}`}
    >
      {children}
    </div>
  );
};

/**
 * VerticalTabs - Tabs on the side
 */
export const VerticalTabs = ({
  tabs = [],
  activeTab,
  onChange,
  className = '',
  tabClassName = '',
  children,
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(
    activeTab || tabs[0]?.id
  );

  const currentActiveTab = activeTab || internalActiveTab;

  return (
    <div className={`flex gap-6 ${className}`}>
      <nav
        className="flex-shrink-0 w-48"
        role="tablist"
        aria-label="Vertical tabs"
      >
        <div className="flex flex-col gap-1">
          {tabs.map((tab) => {
            const isActive = currentActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChange?.(tab.id)}
                disabled={tab.disabled}
                className={`
                  inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200 text-left
                  ${isActive
                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                  }
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${tabClassName}
                `}
                role="tab"
                aria-selected={isActive}
              >
                {tab.icon && <span className="w-5 h-5">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge && <span className="ml-auto">{tab.badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>
      <div className="flex-1">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === TabPanel) {
            return React.cloneElement(child, {
              activeTab: currentActiveTab,
            });
          }
          return null;
        })}
      </div>
    </div>
  );
};

export default Tabs;
