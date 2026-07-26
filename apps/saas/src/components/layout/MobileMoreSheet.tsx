import React, { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { AppRole, getNavigationGroupsForRole } from '@/config/routes';

interface MobileMoreSheetProps {
  role: AppRole;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
}

const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ role, isOpen, onClose, onLogout }) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const groups = getNavigationGroupsForRole(role)
    .map((group) => ({ ...group, items: group.items.filter((item) => !item.mobilePrimary) }))
    .filter((group) => group.items.length > 0);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => sheetRef.current?.focus());
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} aria-label="Fechar mais opções" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-more-title"
        tabIndex={-1}
        className="bz-mobile-sheet fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-y-auto rounded-t-3xl border-t border-[#E5E7EB] bg-white px-5 pt-3 shadow-[0_-24px_60px_rgba(15,23,42,0.18)] outline-none"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#D1D5DB]" aria-hidden="true" />
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="bz-kicker mb-1">Navegação</p>
            <h2 id="mobile-more-title" className="bz-title-serif text-lg text-[#1A1A1F]">Mais opções</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
            aria-label="Fechar mais opções"
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>

        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`mobile-more-group-${group.id}`}>
              <p id={`mobile-more-group-${group.id}`} className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]">{group.label}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={onClose}
                    className={({ isActive }) => [
                      'flex min-h-11 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]',
                      isActive
                        ? 'border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#8B6B12]'
                        : 'border-[#E5E7EB] bg-[#FBFCFD] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-[#F7F8FA] hover:text-[#1A1A1F]',
                    ].join(' ')}
                  >
                    <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-6 border-t border-[#E5E7EB] pt-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              void onLogout();
            }}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#FEF2F2] hover:text-[#B42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"
          >
            <span className="material-symbols-outlined text-[21px]" aria-hidden="true">logout</span>
            <span>Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileMoreSheet;
