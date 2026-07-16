import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppView } from '@/domain/types';

interface SidebarProps {
  currentView?: AppView;
  onViewChange?: (view: AppView) => void;
  onLogout: () => void;
}

type MenuView = AppView | 'clients';

const routeByView: Record<MenuView, string> = {
  dashboard: '/',
  agenda: '/agenda',
  services: '/services',
  clients: '/clients',
  finance: '/finance',
  whatsapp: '/whatsapp',
  aiconfig: '/aiconfig',
  settings: '/settings',
  login: '/login',
};

const menuItems: Array<{ id: MenuView; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Home', icon: 'home' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar_month' },
  { id: 'services', label: 'Servicos', icon: 'content_cut' },
  { id: 'clients', label: 'Clientes', icon: 'groups' },
  { id: 'finance', label: 'Financeiro', icon: 'show_chart' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
  { id: 'aiconfig', label: 'Config. IA', icon: 'psychology' },
  { id: 'settings', label: 'Ajustes', icon: 'settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (view: MenuView) => {
    if (onViewChange && view !== 'clients') {
      onViewChange(view);
      return;
    }

    navigate(routeByView[view]);
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col hidden md:flex">
      <div className="p-8 flex flex-col gap-2">
        <div className="flex items-center gap-3 mb-10">
          <span className="material-symbols-outlined text-[#f4c025] text-3xl">content_cut</span>
          <h1 className="text-xl font-bold tracking-tight">BarberZap</h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const itemPath = routeByView[item.id];
            const isActive = currentView ? currentView === item.id : location.pathname === itemPath;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#f4c025]/10 text-[#f4c025] border-l-4 border-[#f4c025]'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="font-semibold text-sm">Sair</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
