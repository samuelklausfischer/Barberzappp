import React, { useEffect, useId, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_PATHS, type AppRole } from '@/config/routes';

type AccountMenuProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  name: string;
  email: string | null | undefined;
  companyName: string | null | undefined;
  role: AppRole;
  accessState: 'active' | 'trialing' | 'paused';
  trialEndsAt: string | null | undefined;
  onLogout: () => void | Promise<void>;
};

const formatAccess = (accessState: AccountMenuProps['accessState'], trialEndsAt: string | null | undefined) => {
  if (accessState === 'active') return 'Assinatura ativa';
  if (accessState === 'trialing') {
    const date = trialEndsAt && !Number.isNaN(new Date(trialEndsAt).getTime())
      ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(trialEndsAt))
      : null;
    return date ? `Teste até ${date}` : 'Teste ativo';
  }
  return 'Assinatura pausada';
};

const AccountMenu: React.FC<AccountMenuProps> = ({
  isOpen,
  onOpenChange,
  name,
  email,
  companyName,
  role,
  accessState,
  trialEndsAt,
  onLogout,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const navigate = useNavigate();
  const accessLabel = formatAccess(accessState, trialEndsAt);

  useEffect(() => {
    if (!isOpen) return;
    const focusFirstMenuItem = () =>
      menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onOpenChange(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
    };
    const frame = window.requestAnimationFrame(focusFirstMenuItem);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange]);

  const goTo = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const menuItems: HTMLElement[] = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    if (menuItems.length === 0) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onOpenChange(false);
      window.requestAnimationFrame(() => triggerRef.current?.focus());
      return;
    }

    const currentIndex = menuItems.indexOf(document.activeElement as HTMLElement);
    const focusItem = (index: number) => menuItems[(index + menuItems.length) % menuItems.length]?.focus();

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(currentIndex < 0 ? 0 : currentIndex + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(currentIndex < 0 ? menuItems.length - 1 : currentIndex - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      menuItems[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      menuItems[menuItems.length - 1]?.focus();
    }
  };

  return (
    <div
      ref={menuRef}
      className="relative"
      onBlur={(event) => {
        const nextFocusedElement = event.relatedTarget as Node | null;
        if (!nextFocusedElement || !menuRef.current?.contains(nextFocusedElement)) onOpenChange(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-[#E5E7EB] bg-white py-1 pl-1.5 pr-2.5 text-left transition-colors hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
        aria-label="Abrir menu da conta"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/12 text-[#8B6B12]" aria-hidden="true">
          <span className="material-symbols-outlined text-[19px]">person</span>
        </span>
        <span className="hidden max-w-32 min-w-0 sm:block">
          <span className="block truncate text-xs font-semibold text-[#1A1A1F]">{name}</span>
          <span className="block text-[10px] uppercase tracking-[0.14em] text-[#6B7280]">{role === 'owner' ? 'Proprietário' : 'Equipe'}</span>
        </span>
        <span className="material-symbols-outlined text-[18px] text-[#6B7280]" aria-hidden="true">expand_more</span>
      </button>

      {isOpen && (
        <section
          id={panelId}
          role="menu"
          aria-label="Menu da conta"
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.16)]"
        >
          <div className="border-b border-[#E5E7EB] px-4 py-3.5">
            <p className="truncate text-sm font-bold text-[#1A1A1F]">{name}</p>
            {email && <p className="mt-0.5 truncate text-xs text-[#6B7280]">{email}</p>}
            {companyName && <p className="mt-2 truncate text-xs font-semibold text-[#5E6673]">{companyName}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#F1F3F5] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5E6673]">
                {role === 'owner' ? 'Proprietário' : 'Equipe'}
              </span>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${accessState === 'paused' ? 'bg-[#FEF2F2] text-[#B42318]' : 'bg-[#ECFDF3] text-[#067647]'}`}>
                {accessLabel}
              </span>
            </div>
          </div>
          {role === 'owner' && (
            <div className="border-b border-[#E5E7EB] p-2">
              <button type="button" role="menuitem" onClick={() => goTo(APP_PATHS.SETTINGS)} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#3D4551] hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">settings</span>
                Configurações
              </button>
              <button type="button" role="menuitem" onClick={() => goTo('/settings/team')} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#3D4551] hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">groups</span>
                Equipe
              </button>
            </div>
          )}
          <div className="p-2">
            <button type="button" role="menuitem" onClick={() => void onLogout()} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#B42318] hover:bg-[#FEF2F2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]">
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">logout</span>
              Sair
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default AccountMenu;
