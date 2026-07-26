import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppRole, getNavigationGroupsForRole } from '@/config/routes';
import { useSidebarStore } from '@/stores/sidebarStore';
import BarberZapLogo from '@/components/ui/BarberZapLogo';

interface SidebarProps {
  role: AppRole;
  onLogout: () => void | Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const groups = getNavigationGroupsForRole(role);

  return (
    <aside
      className={`bz-sidebar-shell ${isCollapsed ? 'is-collapsed' : ''} hidden shrink-0 flex-col border-r border-[#E5E7EB] bg-white md:flex`}
      aria-label="Barra lateral principal"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className={`border-b border-[#E5E7EB] py-5 ${isCollapsed ? 'px-3' : 'px-5'}`}>
          <BarberZapLogo
            compact
            label={isCollapsed ? undefined : 'BarberZap'}
            tone="light"
            className={isCollapsed ? 'justify-center [&>div:last-child]:hidden' : 'min-w-0 gap-2'}
          />
        </div>

        <nav id="saas-sidebar-navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-5" aria-label="Navegação principal">
          {groups.map((group, groupIndex) => (
            <section key={group.id} className={groupIndex > 0 ? 'mt-6 border-t border-[#E5E7EB] pt-5' : ''} aria-labelledby={`sidebar-group-${group.id}`}>
              <p
                id={`sidebar-group-${group.id}`}
                className={`mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF] ${isCollapsed ? 'sr-only' : ''}`}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/'}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={isCollapsed ? item.label : undefined}
                    className={({ isActive }) => [
                      'flex min-h-11 w-full items-center rounded-xl border-l-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] focus-visible:outline-offset-1',
                      isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5 py-2.5',
                      isActive
                        ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#8B6B12]'
                        : 'border-transparent text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1A1A1F]',
                    ].join(' ')}
                  >
                    <span className="material-symbols-outlined text-[21px]" aria-hidden="true">{item.icon}</span>
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>
      </div>

      <div className={`border-t border-[#E5E7EB] py-4 ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <button
          type="button"
          onClick={() => void onLogout()}
          className={`flex min-h-11 w-full items-center rounded-xl text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#FEF2F2] hover:text-[#B42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3.5 py-2.5'}`}
          title={isCollapsed ? 'Sair' : undefined}
          aria-label={isCollapsed ? 'Sair' : undefined}
        >
          <span className="material-symbols-outlined text-[21px]" aria-hidden="true">logout</span>
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
