import React from 'react';
import { Plus, RefreshCw, FolderOpen, Search, SearchX, ArrowLeft } from 'lucide-react';

/**
 * EmptyState Component
 * 
 * No data placeholder with optional actions.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Custom icon instead of default
 * @param {string} props.title - Empty state title
 * @param {string} props.description - Description text
 * @param {'no-data'|'no-results'|'no-connection'|'error'|'custom'} props.type - Predefined type
 * @param {string} props.actionText - Primary action button text
 * @param {Function} props.onAction - Primary action handler
 * @param {string} props.secondaryActionText - Secondary action button text
 * @param {Function} props.onSecondaryAction - Secondary action handler
 * @param {boolean} props.compact - Compact variant
 * @param {'sm'|'base'|'lg'} props.size - Empty state size
 * @param {React.ReactNode} props.children - Custom content
 * @param {string} props.className - Additional CSS classes
 */
export const EmptyState = ({
  icon,
  title,
  description,
  type = 'no-data',
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  compact = false,
  size = 'base',
  children,
  className = '',
}) => {
  // Type configurations
  const typeConfig = {
    'no-data': {
      icon: FolderOpen,
      title: 'No data yet',
      description: 'Get started by creating your first item.',
      actionText: 'Create New',
    },
    'no-results': {
      icon: SearchX,
      title: 'No results found',
      description: 'Try adjusting your search or filter criteria.',
      actionText: 'Clear Filters',
    },
    'no-connection': {
      icon: RefreshCw,
      title: 'Connection lost',
      description: 'Unable to load data. Please check your connection.',
      actionText: 'Retry',
    },
    'error': {
      icon: SearchX,
      title: 'Something went wrong',
      description: 'An error occurred while loading the data.',
      actionText: 'Try Again',
    },
    'custom': {
      icon: null,
      title: null,
      description: null,
      actionText: null,
    },
  };

  const config = typeConfig[type];

  // Use provided props or type defaults
  const Icon = icon || (config.icon && <config.icon className="w-8 h-8" strokeWidth={1.5} />);
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayActionText = actionText || config.actionText;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: compact ? 'p-6' : 'p-8',
      icon: 'w-12 h-12 text-3xl',
      title: 'text-base font-semibold',
      description: 'text-xs',
      button: 'text-sm px-3 py-2',
    },
    base: {
      container: compact ? 'p-8' : 'p-12',
      icon: 'w-20 h-20 text-4xl',
      title: 'text-lg font-semibold',
      description: 'text-sm',
      button: 'text-sm px-6 py-3',
    },
    lg: {
      container: compact ? 'p-10' : 'p-16',
      icon: 'w-24 h-24 text-5xl',
      title: 'text-xl font-semibold',
      description: 'text-base',
      button: 'text-base px-8 py-4',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <div
      className={`bg-slate-800/30 border border-slate-700/30 rounded-xl ${sizes.container} text-center ${className}`}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {Icon !== null && (
        <div
          className={`mx-auto mb-6 rounded-full bg-slate-700/30 flex items-center justify-center ${sizes.icon}`}
        >
          {typeof Icon === 'function' ? <Icon /> : Icon}
        </div>
      )}

      {/* Title */}
      {displayTitle && (
        <h3 className={`${sizes.title} text-white mb-2`}>
          {displayTitle}
        </h3>
      )}

      {/* Description */}
      {displayDescription && (
        <p className={`${sizes.description} text-gray-400 mb-6 max-w-sm mx-auto`}>
          {displayDescription}
        </p>
      )}

      {/* Actions */}
      {(onAction || onSecondaryAction) && (
        <div className="flex items-center justify-center gap-3">
          {onSecondaryAction && secondaryActionText && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className={`${sizes.button} text-gray-400 hover:text-white font-medium rounded-lg transition-all`}
            >
              {secondaryActionText}
            </button>
          )}
          {onAction && displayActionText && (
            <button
              type="button"
              onClick={onAction}
              className={`${sizes.button} bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-all flex items-center gap-2 shadow-lg hover:shadow-glow-gold`}
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              {displayActionText}
            </button>
          )}
        </div>
      )}

      {/* Custom content */}
      {children}
    </div>
  );
};

/**
 * NoDataEmpty - Shortcut for no-data type
 */
export const NoDataEmpty = (props) => <EmptyState type="no-data" {...props} />;

/**
 * NoResultsEmpty - Shortcut for no-results type
 */
export const NoResultsEmpty = (props) => <EmptyState type="no-results" {...props} />;

/**
 * NoConnectionEmpty - Shortcut for no-connection type
 */
export const NoConnectionEmpty = (props) => <EmptyState type="no-connection" {...props} />;

/**
 * ErrorEmpty - Shortcut for error type
 */
export const ErrorEmpty = (props) => <EmptyState type="error" {...props} />;

/**
 * CompactEmpty - Compact variant
 */
export const CompactEmpty = (props) => <EmptyState compact {...props} />;

/**
 * EmptyList - For empty lists/tables
 */
export const EmptyList = ({ message, onClear }) => (
  <div className="py-12 text-center" role="status">
    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
      <Search className="w-6 h-6 text-gray-500" strokeWidth={1.5} />
    </div>
    <p className="text-gray-400">{message || 'No items found'}</p>
    {onClear && (
      <button
        type="button"
        onClick={onClear}
        className="mt-4 text-sm text-amber-500 hover:text-amber-400"
      >
        Clear filters
      </button>
    )}
  </div>
);

/**
 * EmptyPage - Full-page empty state
 */
export const EmptyPage = ({ title, description, actionText, onAction, className = '' }) => (
  <div className={`min-h-[400px] flex items-center justify-center ${className}`}>
    <EmptyState
      title={title}
      description={description}
      actionText={actionText}
      onAction={onAction}
      size="lg"
    />
  </div>
);

/**
 * IllustratedEmpty - With illustration support
 */
export const IllustratedEmpty = ({
  illustration,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => (
  <div className={`bg-slate-800/30 border border-slate-700/30 rounded-xl p-12 text-center ${className}`}>
    {illustration && (
      <div className="mb-6">
        {illustration}
      </div>
    )}
    {title && (
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    )}
    {description && (
      <p className="text-sm text-gray-400 mb-6">{description}</p>
    )}
    {onAction && actionText && (
      <button
        type="button"
        onClick={onAction}
        className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-all"
      >
        {actionText}
      </button>
    )}
  </div>
);

export default EmptyState;
