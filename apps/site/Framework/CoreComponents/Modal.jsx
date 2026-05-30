import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal Component
 * 
 * Dialog modal with backdrop and accessibility support.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal open state
 * @param {Function} props.onClose - Close handler
 * @param {React.ReactNode} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {React.ReactNode} props.footer - Modal footer content
 * @param {'sm'|'md'|'lg'|'xl'|'2xl'|'full'} props.size - Modal size
 * @param {boolean} props.closeOnBackdrop - Close on backdrop click
 * @param {boolean} props.closeOnEscape - Close on escape key
 * @param {boolean} props.showCloseButton - Show close button in header
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.contentClassName - Content CSS classes
 */
export const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  contentClassName = '',
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    full: 'max-w-7xl',
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      setTimeout(() => {
        modalRef.current?.focus();
      }, 50);
      document.body.style.overflow = 'hidden';
    } else {
      previousFocusRef.current?.focus();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-fade-in" aria-hidden="true" />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`
          relative bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full
          ${sizeConfig[size]}
          animate-scale-in ${className}
        `}
      >
        {/* Header */}
        {title && (
          <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
            <h2 id="modal-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={`px-6 py-5 ${title ? '' : 'pt-5'} ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ModalHeader - Modal header component
 */
export const ModalHeader = ({ children, onClose }) => (
  <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
    <h2 id="modal-title" className="text-lg font-semibold text-white">
      {children}
    </h2>
    {onClose && (
      <button
        type="button"
        onClick={onClose}
        className="p-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" strokeWidth={2} />
      </button>
    )}
  </div>
);

/**
 * ModalBody - Modal body component
 */
export const ModalBody = ({ children, className = '' }) => (
  <div className={`px-6 py-5 ${className}`}>
    {children}
  </div>
);

/**
 * ModalFooter - Modal footer component
 */
export const ModalFooter = ({ children, className = '' }) => (
  <div className={`px-6 py-4 border-t border-slate-700/50 flex justify-end gap-3 ${className}`}>
    {children}
  </div>
);

/**
 * ConfirmDialog - Confirmation modal variant
 */
export const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  icon,
}) => {
  const handleConfirm = () => {
    onConfirm?.();
  };

  const variantConfig = {
    danger: {
      confirmClass: 'bg-red-500 hover:bg-red-600 text-white',
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-400',
      defaultIcon: null,
    },
    warning: {
      confirmClass: 'bg-amber-500 hover:bg-amber-600 text-slate-900',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      defaultIcon: null,
    },
    info: {
      confirmClass: 'bg-blue-500 hover:bg-blue-600 text-white',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      defaultIcon: null,
    },
    success: {
      confirmClass: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      defaultIcon: null,
    },
  };

  const config = variantConfig[variant];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      showCloseButton={false}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center">
          {variant === 'danger' && (
            <div className={`${config.iconBg} rounded-full flex items-center justify-center`}>
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          {variant === 'warning' && (
            <div className={`${config.iconBg} rounded-full flex items-center justify-center`}>
              <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-white mb-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-400 mb-6">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-gray-400 hover:text-white font-medium rounded-lg transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={`px-6 py-2.5 font-semibold rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
              ${config.confirmClass}`}
          >
            {loading ? 'Confirming...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * DeleteConfirm - Pre-configured delete confirmation
 */
export const DeleteConfirm = (props) => (
  <ConfirmDialog
    variant="danger"
    title="Delete this item?"
    description="This action cannot be undone. All data associated with this item will be permanently deleted."
    confirmText="Delete"
    {...props}
  />
);

/**
 * AlertDialog - Pre-configured alert dialog
 */
export const AlertDialog = ({ isOpen, onClose, onConfirm, title, description }) => (
  <ConfirmDialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={title}
    description={description}
    variant="info"
    confirmText="OK"
    cancelText={null}
  />
);

export default Modal;
