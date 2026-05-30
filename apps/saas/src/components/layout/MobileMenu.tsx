import React from 'react';
import { AppView } from '@/domain/types';
import Drawer from './Drawer';
import Backdrop from './Backdrop';
import { useMobileMenuStore } from '@/stores/mobileMenuStore';

interface MobileMenuProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  onLogout: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({
  currentView,
  onViewChange,
  onLogout,
}) => {
  const { isOpen, close } = useMobileMenuStore();

  const menuItems = [
    { id: 'dashboard', label: 'Home', icon: 'home' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar_month' },
    { id: 'services', label: 'Serviços', icon: 'content_cut' },
    { id: 'finance', label: 'Financeiro', icon: 'show_chart' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
    { id: 'aiconfig', label: 'Config. IA', icon: 'psychology' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  const handleViewChange = (view: AppView) => {
    onViewChange(view);
    close();
  };

  const handleLogout = () => {
    onLogout();
    close();
  };

  return (
    <div className="md:hidden">
      <Drawer isOpen={isOpen} onClose={close} position="left">
        <div className="h-full flex flex-col">
          {/* Header do Mobile Menu */}
          <div className="p-6 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#f4c025] text-2xl">
                  content_cut
                </span>
                <h1 className="text-lg font-bold tracking-tight">BarberZap</h1>
              </div>
              <button
                onClick={close}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
                aria-label="Fechar menu"
              >
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto px-4">
            <nav className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id as AppView)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-[#f4c025]/10 text-[#f4c025] border-l-4 border-[#f4c025]'
                      : 'text-zinc-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Footer com Logout */}
          <div className="p-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-semibold text-sm">Sair</span>
            </button>
          </div>
        </div>
      </Drawer>
      <Backdrop isOpen={isOpen} onClose={close} />
    </div>
  );
};

export default MobileMenu;
