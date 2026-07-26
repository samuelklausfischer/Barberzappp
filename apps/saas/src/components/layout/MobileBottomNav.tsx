import React, { useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { AppRole, getMobilePrimaryItemsForRole } from '@/config/routes';
import MobileMoreSheet from './MobileMoreSheet';

interface MobileBottomNavProps {
  role: AppRole;
  onLogout: () => void | Promise<void>;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ role, onLogout }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const primaryItems = getMobilePrimaryItemsForRole(role);

  const closeMore = () => {
    setIsMoreOpen(false);
    window.requestAnimationFrame(() => moreButtonRef.current?.focus());
  };

  return (
    <>
      <nav className="bz-mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-[#E5E7EB] bg-white/95 px-2 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden" aria-label="Navegação mobile">
        <div className="mx-auto flex h-full max-w-lg items-center justify-around gap-1">
          {primaryItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => [
                'flex min-h-11 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]',
                isActive ? 'bg-[#D4AF37]/10 text-[#8B6B12]' : 'text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1A1A1F]',
              ].join(' ')}
            >
              <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            ref={moreButtonRef}
            type="button"
            onClick={() => setIsMoreOpen(true)}
            className={`flex min-h-11 min-w-[4.5rem] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${isMoreOpen ? 'bg-[#D4AF37]/10 text-[#8B6B12]' : 'text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1A1A1F]'}`}
            aria-expanded={isMoreOpen}
            aria-controls="mobile-more-sheet"
            aria-label="Abrir mais opções"
          >
            <span className="material-symbols-outlined text-[21px]" aria-hidden="true">more_horiz</span>
            <span>Mais</span>
          </button>
        </div>
      </nav>

      <div id="mobile-more-sheet">
        <MobileMoreSheet role={role} isOpen={isMoreOpen} onClose={closeMore} onLogout={onLogout} />
      </div>
    </>
  );
};

export default MobileBottomNav;
