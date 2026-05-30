import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X, Loader2 } from 'lucide-react';

/**
 * Toast Component
 * 
 * Toast notification with auto-dismiss.
 * 
 * @param {Object} props
 * @param {'success'|'warning'|'error'|'info'|'loading'} props.variant - Toast variant
 * @param {React.ReactNode} props.title - Toast title
 * @param {React.ReactNode} props.message - Toast message
 * @param {boolean} props.show - Show/hide toast
 * @param {boolean} props.closable - Show close button
 * @param {Function} props.onClose - Close handler
 * @param {number} props.duration - Auto-dismiss duration (ms), 0 for no auto-dismiss
 * @param {'bottom-right'|'bottom-left'|'top-right'|'top-left'|'top-center'|'bottom-center'} props.position - Toast position
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {React.ReactNode} props.action - Action button
 * @param {string} props.className - Additional CSS classes
 */
export const Toast = ({
  variant = 'info',
  title,
  message,
  show = false,
  closable = true,
  onClose,
  duration = 4000,
  position = 'bottom-right',
  icon,
  action,
  className = '',
}) => {
  const [visible, setVisible] = useState(show);
  const [timer, setTimer] = useState(null);

  // Handle show/hide with animation
  useEffect(() => {
    setVisible(show);
  }, [show]);

  // Auto-dismiss on mount
  useEffect(() => {
    if (variant !== 'loading' && duration > 0 && visible) {
      const t = setTimeout(() => {
        handleClose();
      }, duration);
      setTimer(t);
      return () => clearTimeout(t);
    }
  }, [visible, duration, variant]);

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  if (!visible) return null;

  // Variant configurations
  const variantConfig = {
    success: {
      bg: 'bg-slate-800',
      border: 'border-slate-700',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      icon: CheckCircle,
    },
    warning: {
      bg: 'bg-slate-800',
      border: 'border-slate-700',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      icon: AlertCircle,
    },
    error: {
      bg: 'bg-slate-800',
      border: 'border-slate-700',
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-400',
      icon: XCircle,
    },
    info: {
      bg: 'bg-slate-800',
      border: 'border-slate-700',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      icon: Info,
    },
    loading: {
      bg: 'bg-slate-800',
      border: 'border-slate-700',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      icon: Loader2,
    },
  };

  const config = variantConfig[variant];
  const Icon = icon || config.icon;

  // Position classes
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
    'top-center': 'fixed top-6 left-1/2 -translate-x-1/2',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <div
      className={`${positionClasses[position]} z-[700] animate-slide-up ${className}`}
      role="alert"
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
    >
      <div
        className={`${config.bg} ${config.border} border rounded-xl shadow-lg max-w-md w-full`}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Icon */}
          <div className={`flex-shrink-0 ${config.iconBg} rounded-lg p-2`}>
            {variant === 'loading' ? (
              <Icon className={`w-5 h-5 ${config.iconColor} animate-spin`} strokeWidth={2} />
            ) : (
              <Icon className={`w-5 h-5 ${config.iconColor}`} strokeWidth={2} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <p className="text-sm font-semibold text-white">
                {title}
              </p>
            )}
            {message && (
              <p className={`text-sm ${title ? 'text-gray-400 mt-1' : 'text-white'}`}>
                {message}
              </p>
            )}
            {action}
          </div>

          {/* Close button */}
          {closable && variant !== 'loading' && (
            <button
              type="button"
              onClick={handleClose}
              className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700/50"
              aria-label="Close toast"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Progress bar for auto-dismiss */}
        {duration > 0 && variant !== 'loading' && (
          <div className="h-1 bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-current opacity-30 animate-shimmer"
              style={{
                animationDuration: `${duration}ms`,
                animationTimingFunction: 'linear',
                animationDirection: 'normal',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ToastContainer - Container for multiple toasts
 */
export const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[700] flex flex-col gap-3">
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id || index}
          {...toast}
          onClose={() => onClose?.(toast.id || index)}
        />
      ))}
    </div>
  );
};

/**
 * ToastProvider - Context provider for toast management
 */
export const ToastContext = React.createContext(null);

const toastQueue = [];
let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (options) => {
    const id = ++toastId;
    const toast = { id, ...options, show: true };
    
    setToasts((prev) => [...prev, toast]);

    if (options.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, options.duration || 4000);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const success = (message, options) =>
    showToast({ variant: 'success', message, ...options });
  const error = (message, options) =>
    showToast({ variant: 'error', message, ...options });
  const warning = (message, options) =>
    showToast({ variant: 'warning', message, ...options });
  const info = (message, options) =>
    showToast({ variant: 'info', message, ...options });

  return (
    <ToastContext.Provider value={{ showToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * useToast - Hook to show toasts
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * toast - Utility function to show toasts outside components
 */
export const toast = {
  success: (message, options) => {
    console.log('Toast success:', message, options);
  },
  error: (message, options) => {
    console.log('Toast error:', message, options);
  },
  warning: (message, options) => {
    console.log('Toast warning:', message, options);
  },
  info: (message, options) => {
    console.log('Toast info:', message, options);
  },
};

export default Toast;
