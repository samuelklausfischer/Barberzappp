import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, ChevronDown, User, Scissors, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * TopBar Component
 * 
 * Responsive header with:
 * - Branding (logo + text)
 * - Global search
 * - Notifications badge
 * - User menu dropdown
 */
export function TopBar({ onMenuClick, isMobileMenuOpen = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const userMenuRef = useRef(null);
  const searchRef = useRef(null);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      // Implement search functionality
      setSearchQuery('');
    }
  };

  // Handle logout
  const handleLogout = () => {
    setUserMenuOpen(false);
    // Implement logout logic
    console.log('Logging out...');
  };

  // User menu items
  const userMenuItems = [
    { label: 'Meu Perfil', action: () => navigate('/admin/configuracoes'), icon: User },
    { label: 'Configurações', action: () => navigate('/admin/configuracoes'), icon: User },
    { divider: true },
    { label: 'Sair', action: handleLogout, icon: null, danger: true }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 
                     bg-slate-900/95 backdrop-blur-xl 
                     border-b border-slate-800
                     transition-all duration-200">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        
        {/* Left Side: Menu Toggle + Branding */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuClick}
            className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center 
                       text-slate-400 hover:text-white hover:bg-slate-800
                       transition-colors duration-200"
            aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Branding */}
          <div className="flex items-center gap-3">
            {/* Desktop: Full Logo */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 
                             to-amber-600 flex items-center justify-center 
                             shadow-lg shadow-amber-500/30">
                <Scissors className="w-4.5 h-4.5 text-slate-900" strokeWidth={2.5} />
              </div>
              <div className="hidden md:block">
                <h1 className="text-white font-bold text-lg tracking-tight">BarberZap</h1>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Admin Panel</p>
              </div>
            </div>

            {/* Mobile: Logo Icon Only */}
            <div className="flex sm:hidden w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 
                           to-amber-600 flex items-center justify-center 
                           shadow-lg shadow-amber-500/30">
              <Scissors className="w-4.5 h-4.5 text-slate-900" strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Center: Search (Desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} ref={searchRef} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 
                              w-4.5 h-4.5 text-slate-500 
                              transition-colors duration-200
                              group-focus-within:text-amber-400" />
            <input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`
                w-full h-10 pr-4 pl-10
                rounded-xl
                bg-slate-800/50 border border-slate-700/50
                text-slate-100 placeholder:text-slate-500
                text-sm
                transition-all duration-200
                focus:outline-none 
                ${isSearchFocused 
                  ? 'border-amber-500/50 ring-2 ring-amber-500/20 shadow-lg shadow-amber-500/10' 
                  : 'hover:border-slate-600'
                }
              `}
            />
            {/* Search hint text (appears when focused and empty) */}
            <AnimatePresence>
              {isSearchFocused && !searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-2 p-3 
                             rounded-xl bg-slate-800/95 backdrop-blur-xl 
                             border border-slate-700/50 shadow-xl"
                >
                  <p className="text-xs text-slate-400">
                    Press <kbd className="px-1.5 py-0.5 rounded bg-slate-700 
                                            text-slate-300 font-mono">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-700 
                                            text-slate-300 font-mono">K</kbd> to search anywhere
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          
          {/* Mobile Search Toggle */}
          <button
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center 
                       text-slate-400 hover:text-white hover:bg-slate-800
                       transition-colors duration-200"
            aria-label="Search"
            onClick={() => console.log('Open mobile search')}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-xl flex items-center justify-center 
                             text-slate-400 hover:text-white hover:bg-slate-800
                             transition-colors duration-200"
                  aria-label="Notifications"
                  onClick={() => console.log('Open notifications')}>
            <Bell className="w-5 h-5" />
            {/* Notification Badge */}
            <span className="absolute top-2 right-2 w-2 h-2 bg-amber-500 
                           rounded-full shadow-lg shadow-amber-500/50" />
          </button>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 px-2 py-1.5 rounded-xl 
                         hover:bg-slate-800 transition-colors duration-200"
              aria-label="User menu"
              aria-expanded={isUserMenuOpen}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 
                             to-slate-800 flex items-center justify-center
                             border border-slate-600/50 shadow-inner">
                <User className="w-4.5 h-4.5 text-slate-400" strokeWidth={2} />
              </div>

              {/* User Info (hidden on mobile) */}
              <div className="hidden lg:block text-left">
                <p className="text-white text-sm font-medium leading-tight">João Silva</p>
                <p className="text-slate-500 text-xs leading-tight">Barbearia Elite</p>
              </div>

              {/* Chevron */}
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''} hidden lg:block`} />
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-56
                             rounded-xl bg-slate-800/95 backdrop-blur-xl
                             border border-slate-700/50 shadow-2xl
                             overflow-hidden z-50"
                >
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-slate-700/50">
                    <p className="text-white font-medium">João Silva</p>
                    <p className="text-slate-500 text-sm">joao@barberiaelite.com</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {userMenuItems.map((item, index) => (
                      item.divider ? (
                        <div key={`divider-${index}`} className="my-1 border-t border-slate-700/50" />
                      ) : (
                        <button
                          key={index}
                          onClick={() => {
                            item.action();
                            setUserMenuOpen(false);
                          }}
                          className={`
                            w-full flex items-center gap-3 px-4 py-2.5
                            text-sm font-medium transition-colors duration-150
                            ${item.danger 
                              ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300' 
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                            }
                          `}
                        >
                          {item.icon && <item.icon className="w-4 h-4" />}
                          {item.label}
                        </button>
                      )
                    ))}
                  </div>

                  {/* Plan Badge */}
                  <div className="px-4 py-2 bg-gradient-to-r from-amber-500/10 
                                  to-amber-600/10 border-t border-amber-500/20">
                    <span className="text-xs text-amber-400 font-medium">
                      Plano PRO
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search Modal (shown when search icon clicked on mobile) */}
      <AnimatePresence>
        {/* Search modal implementation would go here */}
      </AnimatePresence>
    </header>
  );
}

/**
 * UserAvatar Component
 * 
 * Reusable user avatar for various contexts
 */
export function UserAvatar({ 
  size = 'md', 
  name = 'João Silva',
  showName = false,
  onClick 
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 ${onClick ? 'hover:bg-slate-800 rounded-xl px-2 py-1.5 transition-colors' : ''}`}
    >
      <div className={`${sizeClasses[size]} rounded-xl bg-gradient-to-br from-slate-700 
                      to-slate-800 flex items-center justify-center
                      border border-slate-600/50 shadow-inner`}>
        <User className={iconSizes[size]} text="text-slate-400" strokeWidth={2} />
      </div>
      {showName && (
        <span className="hidden lg:block text-white font-medium text-sm">
          {name}
        </span>
      )}
    </button>
  );
}

export default TopBar;
