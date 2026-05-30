import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  MessageCircle,
  MoreHorizontal,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BOTTOM_NAV_ROUTES } from './ROUTES_CONFIG';

/**
 * MobileBottomNav Component
 * 
 * Fixed bottom navigation for mobile devices:
 * - 4 main routes: Dashboard, Agenda, WhatsApp, More
 * - Glass morphism backdrop
 * - Active indicator with glow
 * - Hidden on tablet and desktop
 */
export function MobileBottomNav({ onMenuClick }) {
  const location = useLocation();

  // Define the 4 main bottom nav items
  const bottomNavItems = [
    ...BOTTOM_NAV_ROUTES.slice(0, 3), // Dashboard, Agenda, WhatsApp
    {
      id: 'more-menu',
      path: '#',
      label: 'Mais',
      icon: MoreHorizontal,
      action: onMenuClick,
      isActive: false // Always false since it triggers menu
    }
  ];

  // Check if route is active
  const isActive = (path) => {
    if (!path || path === '#') return false;
    if (path === '/admin/dashboard') {
      return location.pathname === path || location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 z-50 lg:hidden
                    bg-slate-900/90 backdrop-blur-xl
                    border-t border-slate-800/80">
      <div className="flex items-center justify-around h-full px-2">
        {bottomNavItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon || Home;

          return (
            <React.Fragment key={item.id}>
              {item.id === 'more-menu' ? (
                // More Menu Button
                <button
                  onClick={item.action}
                  className={`
                    relative flex flex-col items-center justify-center
                    gap-1 px-4 py-2 rounded-xl
                    transition-all duration-200
                    group
                  `}
                  aria-label="Mais opções"
                >
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    transition-all duration-200
                    ${'bg-slate-800/50 text-slate-400 group-active:text-white group-active:bg-slate-700/50'}
                  `}>
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-medium text-slate-500">
                    {item.label}
                  </span>
                </button>
              ) : (
                // Regular Nav Item
                <NavLink
                  to={item.path}
                  end={item.path === '/admin/dashboard'}
                  className={`
                    relative flex flex-col items-center justify-center
                    gap-1 px-4 py-2 rounded-xl
                    transition-all duration-200
                    ${active 
                      ? 'text-amber-400' 
                      : 'text-slate-500 hover:text-slate-300'
                    }
                  `}
                >
                  {/* Active Glow Effect */}
                  {active && (
                    <motion.div
                      layoutId="navGlow"
                      className="absolute inset-y-1 left-1 right-1
                                bg-gradient-to-t from-amber-500/20 to-transparent
                                rounded-xl"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Icon Container */}
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className={`
                      relative w-10 h-10 rounded-xl flex items-center justify-center
                      transition-all duration-200
                      ${active 
                        ? 'bg-amber-500/20' 
                        : 'bg-transparent'
                      }
                    `}
                  >
                    <Icon 
                      className="w-5 h-5 relative z-10" 
                      strokeWidth={active ? 2.5 : 2}
                    />
                    
                    {/* Active Dot */}
                    {active && (
                      <motion.div
                        layoutId="activeDot"
                        className="absolute -top-0.5 right-0.5 w-2 h-2 
                                  bg-gradient-to-br from-amber-500 to-amber-600 
                                  rounded-full shadow-lg shadow-amber-500/50"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.div>

                  {/* Label */}
                  <span className={`
                    text-[10px] font-medium relative z-10
                    ${active 
                      ? 'text-amber-400 font-semibold' 
                      : 'text-slate-500'
                    }
                  `}>
                    {item.label}
                  </span>
                </NavLink>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Bottom Safe Area for iPhone Home Indicator */}
      <div className="h-safe-area-bottom bg-slate-900/90" />
    </nav>
  );
}

/**
 * MobileNavMoreSheet Component
 * 
 * Slide-up sheet with additional navigation options
 * Shown when "Mais" button is tapped
 */
export function MobileNavMoreSheet({ isOpen, onClose, items = [] }) {
  const additionalRoutes = items.length > 0 
    ? items 
    : [
        { path: '/admin/horarios', label: 'Horários', icon: 'Clock' },
        { path: '/admin/clientes', label: 'Clientes', icon: 'Users' },
        { path: '/admin/servicos', label: 'Serviços', icon: 'Scissors' },
        { path: '/admin/funcionarios', label: 'Funcionários', icon: 'UserCog' },
        { path: '/admin/financeiro', label: 'Financeiro', icon: 'DollarSign' },
        { path: '/admin/ai-config', label: 'IA Config', icon: 'BrainCircuit' },
        { path: '/admin/aparencia', label: 'Aparência', icon: 'Palette' },
        { path: '/admin/configuracoes', label: 'Configurações', icon: 'Settings' }
      ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-lg lg:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[70]
                       lg:hidden"
          >
            <div className="bg-slate-900 rounded-t-3xl 
                          border-t border-slate-800
                          max-h-[70vh] overflow-hidden">
              
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-4">
                <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pb-4">
                <h3 className="text-lg font-semibold text-white">
                  Menu
                </h3>
              </div>

              {/* Navigation Items */}
              <nav className="overflow-y-auto max-h-[60vh] pb-24">
                <div className="space-y-1 px-4">
                  {additionalRoutes.map((item, index) => (
                    <NavLink
                      key={index}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) => `
                        flex items-center gap-4 px-4 py-3.5 rounded-xl
                        transition-all duration-200
                        ${isActive 
                          ? 'bg-amber-500/20 text-amber-400' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                        }
                      `}
                    >
                      {/* Icon placeholder - in real implementation, import actual icons */}
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center
                                    bg-slate-800/50">
                        <span className="text-sm font-semibold text-slate-500">
                          {item.label.charAt(0)}
                        </span>
                      </div>
                      
                      <span className="font-medium">
                        {item.label}
                      </span>
                    </NavLink>
                  ))}
                </div>
              </nav>

              {/* Close Button at Bottom */}
              <div className="sticky bottom-0 bg-gradient-to-t from-slate-900 via-slate-900 
                            to-transparent pt-6 pb-8 px-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl
                             bg-slate-800/50 border border-slate-700
                             text-white font-medium
                             hover:bg-slate-700/50 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * NavItem Component
 * 
 * Individual navigation item with icon, label, and optional badge
 */
export function NavItem({ 
  icon: Icon,
  label,
  href,
  isActive = false,
  badge = null,
  onClick 
}) {
  const Component = href ? NavLink : 'button';
  const linkProps = href ? { to: href } : {};

  return (
    <Component
      {...linkProps}
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        gap-1 px-4 py-1.5 rounded-xl
        transition-all duration-200 min-w-[64px]
        ${isActive 
          ? 'text-amber-400' 
          : 'text-slate-500 hover:text-slate-300'
        }
      `}
    >
      {/* Icon Container */}
      <div className="relative">
        <div className={`
          transition-all duration-200
        `}>
          {Icon ? (
            <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
          ) : (
            <span className="text-lg">📍</span>
          )}
        </div>
        {/* Badge */}
        {badge && (
          <span className="absolute -top-1 -right-1 
                        min-w-[16px] h-4 px-1
                        bg-amber-500 text-slate-900 
                        text-[10px] font-bold 
                        rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      {/* Label */}
      <span className={`
        text-[10px] font-medium truncate max-w-[60px]
        ${isActive ? 'font-semibold' : ''}
      `}>
        {label}
      </span>

      {/* Active Dot (desktop sidebar style) */}
      {isActive && (
        <motion.div
          layoutId="navDot"
          className="mt-auto w-1 h-1 
                    bg-amber-500 rounded-full"
          initial={false}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Component>
  );
}

export default MobileBottomNav;
