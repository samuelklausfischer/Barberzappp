import React, { useEffect, useId, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_PATHS } from '@/config/routes';
import {
  formatNotificationDateTime,
  getUnreadNotificationLabel,
} from '@/features/notifications/notificationUtils';
import { useAppointmentNotifications } from '@/features/notifications/useAppointmentNotifications';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { useOverlayDialog } from '@/hooks/useOverlayDialog';

type NotificationMenuProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  tenantId: string;
  userId: string;
  timeZone: string;
};

const NotificationMenu: React.FC<NotificationMenuProps> = ({
  isOpen,
  onOpenChange,
  tenantId,
  userId,
  timeZone,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const navigate = useNavigate();
  const isMobileViewport = useIsMobileViewport();
  const {
    notifications,
    unreadCount,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    markOneAsRead,
    markAllAsRead,
  } = useAppointmentNotifications({ tenantId, userId });

  useOverlayDialog({
    isOpen: isOpen && isMobileViewport,
    onClose: () => onOpenChange(false),
    dialogRef: panelRef,
    returnFocusRef: triggerRef,
  });

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isMobileViewport || event.key !== 'Escape') return;
      event.preventDefault();
      onOpenChange(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileViewport, isOpen, onOpenChange]);

  const selectNotification = async (notificationId: string) => {
    await markOneAsRead(notificationId);
    onOpenChange(false);
    navigate(APP_PATHS.AGENDA);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#5E6673] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        aria-label={getUnreadNotificationLabel(unreadCount)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="material-symbols-outlined text-[21px]" aria-hidden="true">
          notifications
        </span>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-[#B42318] px-1 text-[9px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px] md:hidden"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar notificações"
          />
          <section
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-label="Notificações de agendamentos"
            aria-modal={isMobileViewport || undefined}
            tabIndex={-1}
            className="fixed inset-x-3 bottom-[calc(var(--bz-mobile-nav-height)+0.75rem)] z-50 flex max-h-[calc(100dvh-var(--bz-mobile-nav-height)-1.5rem)] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)] md:absolute md:inset-auto md:right-0 md:top-[calc(100%+0.6rem)] md:max-h-none md:w-[min(22rem,calc(100vw-2rem))]"
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E5E7EB] px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-[#1A1A1F]">Novos agendamentos</h2>
                <p className="mt-0.5 text-xs text-[#6B7280]">
                  {getUnreadNotificationLabel(unreadCount)}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="min-h-10 rounded-lg px-2 text-xs font-semibold text-[#8B6B12] transition-colors hover:bg-[#D4AF37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                >
                  Marcar todas como lidas
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain md:max-h-[min(28rem,calc(100dvh-9rem))]">
              {loading && notifications.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-[#6B7280]">
                  Carregando notificações…
                </p>
              )}
              {!loading && error && notifications.length === 0 && (
                <div className="px-4 py-7 text-center">
                  <p className="text-sm text-[#B42318]">{error}</p>
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="mt-3 min-h-10 rounded-lg px-3 text-sm font-semibold text-[#8B6B12] hover:bg-[#D4AF37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
              {!loading && error && notifications.length > 0 && (
                <p className="border-b border-[#FEE4E2] bg-[#FFFAEB] px-4 py-2 text-center text-xs text-[#B42318]">
                  {error}
                </p>
              )}
              {!loading && !error && notifications.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <span
                    className="material-symbols-outlined text-[30px] text-[#A0A7B3]"
                    aria-hidden="true"
                  >
                    notifications_none
                  </span>
                  <p className="mt-2 text-sm font-semibold text-[#1A1A1F]">Tudo em dia</p>
                  <p className="mt-1 text-xs text-[#6B7280]">
                    Os próximos agendamentos aparecerão aqui.
                  </p>
                </div>
              )}
              {!loading &&
                !error &&
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void selectNotification(notification.id)}
                    className={`flex w-full items-start gap-3 border-b border-[#EEF0F3] px-4 py-3.5 text-left transition-colors hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-[-2px] ${!notification.readAt ? 'bg-[#D4AF37]/[0.06]' : ''}`}
                  >
                    <span
                      className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.readAt ? 'bg-[#D8DDE5]' : 'bg-[#B38D1C]'}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-[#1A1A1F]">
                        {notification.clientName || 'Novo agendamento'}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#5E6673]">
                        {notification.serviceName || 'Serviço a confirmar'} ·{' '}
                        {formatNotificationDateTime(notification.scheduledAt, timeZone)}
                      </span>
                      {!notification.readAt && (
                        <span className="mt-1 block text-[11px] font-semibold text-[#8B6B12]">
                          Não lida
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              {!loading && !error && hasMore && (
                <div className="p-3 text-center">
                  <button
                    type="button"
                    onClick={() => void loadMore()}
                    disabled={loadingMore}
                    className="min-h-10 rounded-lg px-3 text-sm font-semibold text-[#8B6B12] transition-colors hover:bg-[#D4AF37]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] disabled:cursor-wait disabled:opacity-60"
                  >
                    {loadingMore ? 'Carregando notificações…' : 'Ver mais notificações'}
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default NotificationMenu;
