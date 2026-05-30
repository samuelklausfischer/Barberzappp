import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Users,
  Scissors,
  UserCog,
  DollarSign,
  MessageCircle,
  BrainCircuit,
  Palette,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Sidebar Component
 * 
 * Responsive sidebar navigation with:
 * - Desktop: Fixed left panel with all menu items
 * - Tablet: Collapsible sidebar (expanded/collapsed)
 * - Mobile: Full-screen overlay drawer
 */
export function Sidebar({
  isMobileOpen = false,
  isCollapsed = false,
  isTabletMode = false,
  onMobileClose,
  onToggleCollapse,
  onLogout
}) {
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);

  // Check if route is active
  const isActive = (path) => {
    if (path === '/admin/dashboard') {
      return location.pathname === path || location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  // Navigation items configuration
  const navItems = [
    {
      id: 'dashboard',
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'agenda',
      path: '/admin/agenda',
      label: 'Agenda',
      icon: Calendar
    },
    {
      id: 'horarios',
      path: '/admin/horarios',
      label: 'Horários',
      icon: Clock
    },
    {
      id: 'clientes',
      path: '/admin/clientes',
      label: 'Clientes',
      icon: Users
    },
    {
      id: 'servicos',
      path: '/admin/servicos',
      label: 'Serviços',
      icon: Scissors
    },
    {
      id: 'funcionarios',
      path: '/admin/funcionarios',
      label: 'Funcionários',
      icon: UserCog
    },
    {
      id: 'financeiro',
      path: '/admin/financeiro',
      label: 'Financeiro',
      icon: DollarSign
    },
    {
      id: 'whatsapp',
      path: '/admin/whatsapp',
   label: 'WhatsApp',
      icon: MessageCircle
    },
    {
      id: 'ai-config',
      path: '/admin/ai-config',
      label: 'IA Config',
      icon: BrainCircuit
    },
    {
      id: 'aparencia',
      path: '/admin/aparencia',
      label: 'Aparência',
      icon: Palette
    },
    {
      id: 'configuracoes',
      path: '/admin/configuracoes',
      label: 'Configurações',
      icon: Settings
    }
  ];

  // Render navigation item
  const renderNavItem = (item) => {
    const active = isActive(item.path);
    const Icon = item.icon;

    return (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={() => {
          if (isMobileOpen && onMobileClose) {
            onMobileClose();
          }
        }}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
        className={`
          group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl
          transition-all duration-200 font-medium
          ${active 
            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-400 shadow-lg shadow-amber-500/10' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }
          ${isCollapsed && isTabletMode ? 'justify-center px-0' : ''}
        `}
      >
        {/* Active indicator line */}
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 
                      bg-gradient-to-b from-amber-500 to-amber-600 
                      rounded-r-full"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}

        {/* Icon */}
        <span className={`
          relative z-10 flex-shrink-0
          ${active ? 'text-amber-400' : ''}
          ${hoveredItem === item.id && !active ? 'text-amber-400' : ''}
        `}>
          <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
        </span>

        {/* Label (hidden when collapsed in tablet mode) */}
        {(!isCollapsed || !isTabletMode) && (
          <span className="relative z-10 truncate">
            {item.label}
          </span>
        )}

        {/* Hover glow effect */}
        {hoveredItem === item.id && !active && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent 
                      rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </NavLink>
    );
  };

  // Mobile sidebar (drawer)
  if (!isTabletMode) {
    return (
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-lg lg:hidden"
            />

            {/* Mobile Sidebar Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-[60] w-[280px] 
                         bg-slate-900 border-r border-slate-800
                         flex flex-col lg:hidden"
            >
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 
                                 to-amber-600 flex items-center justify-center shadow-lg 
                                 shadow-amber-500/30">
                    <Scissors className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h1 className="text-white font-bold text-lg">BarberZap</h1>
                    <p className="text-slate-500 text-xs">Admin Panel</p>
                  </div>
                </div>
                <button
                  onClick={onMobileClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center 
                             text-slate-400 hover:text-white hover:bg-slate-800
                             transition-colors duration-200"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-3">
                {navItems.map(renderNavItem)}
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-slate-800">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 
                             rounded-xl text-red-400 hover:text-red-300 
                             hover:bg-red-500/10 transition-all duration-200
                             font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  // Tablet & Desktop Sidebar
  return (
    <aside
      className={`
        fixed left-0 top-16 bottom-0 z-30
        bg-slate-900 border-r border-slate-800
        hidden md:flex flex-col
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-[260px]'}
      `}
    >
      {/* Collapse/Expand Toggle */}
      <button
        onClick={onToggleCollapse}
        className={`
          absolute -right-3 top-6 z-40
          w-6 h-6 rounded-full
          bg-slate-700 border-2 border-slate-900
          flex items-center justify-center
          text-slate-400 hover:text-amber-400
          transition-all duration-200
          hover:shadow-lg hover:shadow-amber-500/20
        `}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Logo Section (desktop only, when expanded) */}
      {!isCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="lg:flex items-center gap-3 p-4 border-b border-slate-800"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 
                         to-amber-600 flex items-center justify-center shadow-lg 
                         shadow-amber-500/30">
            <Scissors className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-white font-bold">BarberZap</h1>
            <p className="text-slate-500 text-xs">Admin Panel</p>
          </div>
        </motion.div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-1">
        {navItems.map((item) => (
          <div key={item.id} className="px-3">
            {renderNavItem(item)}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className={`
            w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}
            px-4 py-3 rounded-xl
            text-red-400 hover:text-red-300 
            hover:bg-red-500/10 transition-all duration-200
            font-medium
          `}
          title={isCollapsed ? 'Sair' : ''}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </aside>
  );
}

// Helper hook to determine responsive state
export function useSidebarState() {
  const [isMobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isTabletMode, setIsTabletMode] = useState(false);

  // Handle resize
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Tablet mode: between sm and lg
      setIsTabletMode(width >= 640 && width < 1024);
      
      // Auto-collapse on tablet, auto-expand on desktop
      if (width >= 640 && width < 1024 && !isCollapsed) {
        setCollapsed(true);
      } else if (width >= 1024 && isCollapsed) {
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  return {
    isMobileOpen,
    setMobileOpen,
    isCollapsed,
    setCollapsed,
    isTabletMode
  };
}
