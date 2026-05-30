import React, { forwardRef } from 'react';

/**
 * Card Component
 * 
 * Reusable container card with various styles and variants.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {'default'|'elevated'|'outlined'|'filled'} props.variant - Card variant
 * @param {'sm'|'base'|'lg'} props.size - Card size/padding
 * @param {boolean} props.hoverable - Enable hover effect
 * @param {boolean} props.interactive - Make card clickable
 * @param {Function} props.onClick - Click handler
 * @param {React.ReactNode} props.header - Card header content
 * @param {React.ReactNode} props.footer - Card footer content
 * @param {string} props.title - Card title (alternative to header)
 * @param {'amber'|'emerald'|'blue'|'purple'|'red'} props.accent - Accent color
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.contentClassName - Content area CSS classes
 */
export const Card = forwardRef(({
  children,
  variant = 'default',
  size = 'base',
  hoverable = false,
  interactive = false,
  onClick,
  header,
  footer,
  title,
  accent,
  className = '',
  contentClassName = '',
  ...props
}, ref) => {
  // Variant configurations
  const variantStyles = {
    default: 'bg-slate-800/50 backdrop-blur-md border border-slate-700/50',
    elevated: 'bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 shadow-xl',
    outlined: 'bg-transparent border border-slate-700',
    filled: 'bg-slate-800 border border-slate-700/50',
  };

  // Size configurations
  const sizeStyles = {
    sm: 'p-4',
    base: 'p-6',
    lg: 'p-8',
  };

  // Accent colors for header
  const accentColors = {
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400',
  };

  const CardComponent = interactive ? 'button' : 'div';

  return (
    <CardComponent
      ref={ref}
      onClick={onClick}
      className={`
        rounded-2xl transition-all duration-300
        ${variantStyles[variant]}
        ${hoverable ? 'hover:border-slate-600 hover:-translate-y-1 hover:shadow-lg' : ''}
        ${interactive ? 'cursor-pointer active:scale-[0.98] hover:border-amber-500/50' : ''}
        ${interactive ? 'w-full text-left' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Header */}
      {(header || title) && (
        <div className={size === 'sm' ? 'sm:p-4' : 'p-6 pb-4'}>
          {typeof header === 'function' ? (
            header()
          ) : header ? (
            header
          ) : title && (
            <div className="flex items-center gap-3">
              {accent && (
                <div className={`w-1 h-6 ${accentColors[accent].replace('text-', 'bg-')} rounded-full`} />
              )}
              <h3 className={`font-semibold text-white ${accent ? accentColors[accent] : ''}`}>
                {title}
              </h3>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={`${header || title ? 'pt-2' : ''} ${footer ? 'pb-4' : ''} ${sizeStyles[size]} ${contentClassName}`}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className={`px-6 pb-6 ${header || title ? 'pt-0' : ''} border-t border-slate-700/50`}>
          {typeof footer === 'function' ? footer() : footer}
        </div>
      )}
    </CardComponent>
  );
});

Card.displayName = 'Card';

/**
 * CardGrid - Grid of cards
 */
export const CardGrid = ({
  children,
  cols = 3,
  gap = 4,
  className = '',
}) => {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${colsMap[cols]} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

/**
 * ActionCard - Card with primary action
 */
export const ActionCard = ({
  title,
  description,
  icon: Icon,
  action,
  onClick,
  variant = 'default',
  className = '',
}) => {
  return (
    <Card
      variant={variant}
      hoverable
      interactive
      onClick={onClick}
      className={className}
    >
      {Icon && (
        <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-amber-500" strokeWidth={2} />
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      {action && (
        <span className="text-amber-400 text-sm font-medium flex items-center gap-1">
          {action}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      )}
    </Card>
  );
};

/**
 * MetricCard - Card showing a single metric
 */
export const MetricCard = ({
  title,
  value,
  change,
  changeType = 'up',
  icon: Icon,
  className = '',
}) => {
  const changeColor = changeType === 'up' ? 'text-emerald-400' : 'text-red-400';

  return (
    <Card className={className}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {change && (
            <p className={`text-sm ${changeColor} mt-1 flex items-center gap-1`}>
              {changeType === 'up' ? '↑' : '↓'} {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-slate-700/50 flex items-center justify-center">
            <Icon className="w-6 h-6 text-gray-400" strokeWidth={2} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;
