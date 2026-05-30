import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/**
 * Alert Component
 * 
 * Success/error/info alerts with dismiss functionality.
 * 
 * @param {Object} props
 * @param {'success'|'warning'|'error'|'info'} props.variant - Alert variant
 * @param {React.ReactNode} props.title - Alert title
 * @param {React.ReactNode} props.children - Alert content/message
 * @param {boolean} props.dismissible - Show dismiss button
 * @param {Function} props.onDismiss - Dismiss handler
 * @param {'sm'|'base'|'lg'} props.size - Alert size
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {React.ReactNode} props.action - Action button/element
 * @param {boolean} props.outline - Outline style
 * @param {string} props.className - Additional CSS classes
 */
export const Alert = ({
  variant = 'info',
  title,
  children,
  dismissible = false,
  onDismiss,
  size = 'base',
  icon,
  action,
  outline = false,
  className = '',
}) => {
  // Variant configurations
  const variantConfig = {
    success: {
      bg: outline ? 'bg-emerald-500/5' : 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500',
      iconColor: 'text-white',
      icon: CheckCircle,
    },
    warning: {
      bg: outline ? 'bg-amber-500/5' : 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-500',
      iconBg: 'bg-amber-500',
      iconColor: 'text-white',
      icon: AlertTriangle,
    },
    error: {
      bg: outline ? 'bg-red-500/5' : 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      iconBg: 'bg-red-500',
      iconColor: 'text-white',
      icon: XCircle,
    },
    info: {
      bg: outline ? 'bg-blue-500/5' : 'bg-blue-500/10',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500',
      iconColor: 'text-white',
      icon: Info,
    },
  };

  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'p-3',
      iconSize: 'w-4 h-4',
      titleFontSize: 'text-sm',
      textFontSize: 'text-xs',
    },
    base: {
      padding: 'p-4',
      iconSize: 'w-5 h-5',
      titleFontSize: 'text-sm font-medium',
      textFontSize: 'text-xs',
    },
    lg: {
      padding: 'p-5',
      iconSize: 'w-6 h-6',
      titleFontSize: 'text-base font-medium',
      textFontSize: 'text-sm',
    },
  };

  const sizes = sizeConfig[size];

  return (
    <div
      className={`${config.bg} ${config.border} border rounded-xl ${sizes.padding} flex items-start gap-3 ${className}`}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${size === 'sm' ? '' : ''}`}>
        {icon ? (
          <span className={`${config.text} ${sizes.iconSize}`}>
            {icon}
          </span>
        ) : (
          <div className={`${config.iconBg} rounded-full flex items-center justify-center ${sizes.iconSize}`}>
            <Icon className={`${size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3'} ${config.iconColor}`} strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`${config.text} ${sizes.titleFontSize} mb-1`}>
            {title}
          </p>
        )}
        {children && (
          <p className={`${sizes.textFontSize} ${title ? 'text-gray-400' : config.text} ${action ? 'mb-2' : ''}`}>
            {children}
          </p>
        )}
        {action}
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700/50"
          aria-label="Dismiss alert"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
};

/**
 * SuccessAlert - Shortcut for success variant
 */
export const SuccessAlert = (props) => <Alert variant="success" {...props} />;

/**
 * WarningAlert - Shortcut for warning variant
 */
export const WarningAlert = (props) => <Alert variant="warning" {...props} />;

/**
 * ErrorAlert - Shortcut for error variant
 */
export const ErrorAlert = (props) => <Alert variant="error" {...props} />;

/**
 * InfoAlert - Shortcut for info variant
 */
export const InfoAlert = (props) => <Alert variant="info" {...props} />;

/**
 * InlineAlert - Full-width inline alert
 */
export const InlineAlert = ({ children, ...props }) => (
  <div className="w-full">
    <Alert {...props}>{children}</Alert>
  </div>
);

/**
 * AlertGroup - Multiple alerts stacked
 */
export const AlertGroup = ({ alerts, onDismiss }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-3" role="alert" aria-live="polite">
      {alerts.map((alert, index) => (
        <Alert
          key={index}
          variant={alert.variant}
          title={alert.title}
          dismissible={alert.dismissible}
          onDismiss={() => onDismiss?.(index)}
          icon={alert.icon}
          action={alert.action}
        >
          {alert.message}
        </Alert>
      ))}
    </div>
  );
};

export default Alert;
