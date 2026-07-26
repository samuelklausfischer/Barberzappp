import React, { useEffect, useId, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  eyebrow?: string;
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  eyebrow = 'Edição guiada',
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    const focusInitialElement = () => closeButtonRef.current?.focus();
    const animationFrame = window.requestAnimationFrame(focusInitialElement);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []
      ) as HTMLElement[];
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default bg-[#1A1A1F]/35 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`relative flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl shadow-[#1A1A1F]/15 sm:max-h-[calc(100vh-3rem)] sm:rounded-3xl ${sizeClasses[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[#E5E7EB] px-5 py-4 sm:px-6">
          <div>
            {eyebrow ? (
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B7280]">
                {eyebrow}
              </p>
            ) : null}
            <h2
              id={titleId}
              className="text-xl font-semibold leading-tight text-[#1A1A1F] sm:text-2xl"
            >
              {title}
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6 sm:py-6">{children}</div>
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;
  const variantClasses = {
    danger: 'bg-[#B42318] hover:bg-[#912018] text-white',
    warning: 'bg-[#D4AF37] hover:bg-[#B99220] text-[#1A1A1F]',
    info: 'bg-[#175CD3] hover:bg-[#1849A9] text-white',
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="mb-6 text-sm leading-7 text-[#4B5563]">{message}</p>
      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="min-h-11 rounded-full border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-semibold text-[#4B5563] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`min-h-11 rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 ${variantClasses[variant]}`}
        >
          {loading ? 'Processando...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
