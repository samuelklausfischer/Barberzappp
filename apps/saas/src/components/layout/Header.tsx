import React from 'react';
import { useMobileMenuStore } from '@/stores/mobileMenuStore';

interface HeaderProps {
  shopName?: string;
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  hasNotifications?: boolean;
  theme?: 'light' | 'dark';
  onThemeToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  shopName = 'Barbearia do Zé',
  userName = 'Zé da Silva',
  userRole = 'Proprietário',
  avatarUrl = 'https://picsum.photos/id/64/100/100',
  hasNotifications = true,
  theme = 'dark',
  onThemeToggle,
}) => {
  const { open } = useMobileMenuStore();

  return (
    <header className="sticky top-0 z-20 bg-[#09090b]/80 backdrop-blur-md px-6 py-4 md:px-8 md:py-6 flex items-center justify-between border-b border-white/5">
      <div className="flex items-center gap-4">
        {/* Botão Hamburger - Visível apenas em mobile */}
        <button
          onClick={open}
          className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Abrir menu"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>

        <div>
          <h2 className="text-lg md:text-xl font-bold">{shopName}</h2>
          <p className="text-zinc-500 text-xs">Vamos fazer acontecer hoje.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 md:gap-6">
        {/* Theme Toggle */}
        {onThemeToggle && (
          <button
            onClick={onThemeToggle}
            className="hidden md:block p-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Alternar tema"
          >
            <span className="material-symbols-outlined">
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          className="relative p-2 text-zinc-400 hover:text-white transition-colors"
          aria-label="Notificações"
        >
          <span className="material-symbols-outlined">notifications</span>
          {hasNotifications && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#09090b]"></span>
          )}
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-white/10">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold">{userName}</p>
            <p className="text-zinc-500 text-xs">{userRole}</p>
          </div>
          <img
            src={avatarUrl}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-white/10 object-cover"
            alt={`Avatar de ${userName}`}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
