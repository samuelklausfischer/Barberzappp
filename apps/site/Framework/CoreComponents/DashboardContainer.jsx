import React, { useState } from 'react';
import { Menu, X, Calendar, Users, DollarSign, MessageSquare, Bot, Home, BarChart3, Scissors, LogOut } from 'lucide-react';

/**
 * DashboardContainer - Wrapper component for admin pages
 * 
 * Provides layout with sidebar and main content area for Framework pages.
 * Self-contained - no external dependencies other than lucide-react.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Page content
 * @param {string} props.title - Page title (optional, shown in header)
 * @param {string} props.subtitle - Page subtitle (optional)
 * @param {boolean} props.showSidebar - Whether to show sidebar (default: true)
 */
export const DashboardContainer = ({ children, title, subtitle, showSidebar = true }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Agenda', path: '/dashboard/agenda' },
    { icon: Users, label: 'Clientes', path: '/dashboard/clientes' },
    { icon: Scissors, label: 'Serviços', path: '/dashboard/servicos' },
    { icon: BarChart3, label: 'Barbeiros', path: '/dashboard/barbeiros' },
    { icon: DollarSign, label: 'Financeiro', path: '/dashboard/financeiro' },
    { icon: MessageSquare, label: 'WhatsApp', path: '/dashboard/whatsapp' },
    { icon: Bot, label: 'IA', path: '/dashboard/ia' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      {showSidebar && (
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-800 border-r border-slate-700 transition-all duration-300 hidden md:block`}>
          {/* Logo */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scissors className="w-5 h-5 text-slate-900" />
              </div>
              {sidebarOpen && <span className="font-bold text-white">BarberZap</span>}
            </div>
          </div>

          {/* Menu */}
          <nav className="p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700 transition-colors text-gray-300 hover:text-white"
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700 bg-slate-800">
            <a
              href="/login"
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>Sair</span>}
            </a>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="bg-slate-800 border-b border-slate-700 p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                {title && <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>}
                {subtitle && <p className="text-gray-400 mt-1 text-sm md:text-base">{subtitle}</p>}
              </div>
              {showSidebar && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                  title={sidebarOpen ? 'Recolher sidebar' : 'Expandir sidebar'}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Menu Button */}
      {showSidebar && (
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden fixed bottom-4 right-4 z-50 p-3 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-400 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default DashboardContainer;
