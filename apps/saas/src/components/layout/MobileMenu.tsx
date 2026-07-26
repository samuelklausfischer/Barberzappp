import React from 'react';
import { NavLink } from 'react-router-dom';
import { AppRole, getNavigationItemsForRole } from '@/config/routes';
import Drawer from './Drawer';
import Backdrop from './Backdrop';
import { useMobileMenuStore } from '@/stores/mobileMenuStore';
import BarberZapLogo from '@/components/ui/BarberZapLogo';
interface MobileMenuProps { role: AppRole; onLogout: () => void | Promise<void>; }
const MobileMenu: React.FC<MobileMenuProps> = ({ role, onLogout }) => {
  const { isOpen, close } = useMobileMenuStore(); const menuItems = getNavigationItemsForRole(role);
  const handleLogout = () => { close(); void onLogout(); };
  return <div className="md:hidden"><Drawer isOpen={isOpen} onClose={close} position="left" width="min(21rem, calc(100vw - 2rem))"><div className="flex h-full flex-col bg-white"><div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-5"><BarberZapLogo compact label="BarberZap" tone="light" className="gap-2" /><button type="button" onClick={close} className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]" aria-label="Fechar menu"><span className="material-symbols-outlined text-2xl">close</span></button></div><div className="flex-1 overflow-y-auto px-4 py-5"><nav className="space-y-1" aria-label="Navegação móvel">{menuItems.map((item) => <NavLink key={item.id} to={item.path} end={item.path === '/'} onClick={close} className={({ isActive }) => `flex min-h-11 w-full items-center gap-3 rounded-xl border-l-2 px-3.5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] ${isActive ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#8B6B12]' : 'border-transparent text-[#6B7280] hover:bg-[#F7F8FA] hover:text-[#1A1A1F]'}`}><span className="material-symbols-outlined text-[21px]">{item.icon}</span><span>{item.label}</span></NavLink>)}</nav></div><div className="border-t border-[#E5E7EB] px-4 py-4"><button type="button" onClick={handleLogout} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-[#6B7280] transition-colors hover:bg-[#FEF2F2] hover:text-[#B42318] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37]"><span className="material-symbols-outlined text-[21px]">logout</span><span>Sair</span></button></div></div></Drawer><Backdrop isOpen={isOpen} onClose={close} /></div>;
};
export default MobileMenu;
