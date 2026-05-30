import React, { useState } from 'react';
import { 
  Home, Calendar, Clock, Users, Scissors, User, 
  DollarSign, MessageSquare, Bot, Palette, Settings,
  Menu, X, LogOut
} from 'lucide-react';

export const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Agenda', path: '/dashboard/agenda' },
    { icon: Clock, label: 'Horários', path: '/dashboard/horarios' },
    { icon: Users, label: 'Clientes', path: '/dashboard/clientes' },
    { icon: Scissors, label: 'Serviços', path: '/dashboard/servicos' },
    { icon: User, label: 'Funcionários', path: '/dashboard/funcionarios' },
    { icon: DollarSign, label: 'Financeiro', path: '/dashboard/financeiro' },
    { icon: MessageSquare, label: 'WhatsApp', path: '/dashboard/whatsapp' },
    { icon: Bot, label: 'IA Config', path: '/dashboard/ia' },
    { icon: Palette, label: 'Aparência', path: '/dashboard/aparencia' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuClick = (path) => {
    window.location.href = path;
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className={`p-4 border-b border-slate-700 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="flex items-center gap-2">
            <Scissors className="w-8 h-8 text-amber-500" />
            {!isCollapsed && <span className="text-xl font-bold">BarberZap</span>}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-slate-700 text-gray-300 hover:text-white ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={() => window.location.href = '/login'}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-red-500/20 text-gray-300 hover:text-red-400 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed bottom-4 right-4 z-50 p-4 bg-amber-500 text-white rounded-full shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* MobileMenu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-800 shadow-xl">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="p-4 pt-16 space-y-4">
              <div className="flex items-center gap-2 mb-6">
                <Scissors className="w-8 h-8 text-amber-500" />
                <span className="text-xl font-bold">BarberZap</span>
              </div>

              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => handleMenuClick(item.path)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-slate-700 text-gray-300 hover:text-white"
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              <button
                onClick={() => { window.location.href = '/login'; setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-red-500/20 text-gray-300 hover:text-red-400 mt-8"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
