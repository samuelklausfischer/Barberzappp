import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import AccountMenu from '@/components/layout/AccountMenu';
import NotificationMenu from '@/components/layout/NotificationMenu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import SubscriptionPaused from '@/components/auth/SubscriptionPaused';
import { LoadingSkeleton } from '@/components/ui/Skeleton';
import { APP_PATHS } from '@/config/routes';
import { resolveAgendaTimeZone } from '@/config/timeZone';
import { useSidebarStore } from '@/stores/sidebarStore';

const AppLayout: React.FC = () => {
  const { user, profile, tenant, membership, loading, signOut, accessState } = useAuth();
  const navigate = useNavigate();
  const isSidebarCollapsed = useSidebarStore((state) => state.isCollapsed);
  const toggleSidebar = useSidebarStore((state) => state.toggle);
  const [activeMenu, setActiveMenu] = useState<'notifications' | 'account' | null>(null);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [toggleSidebar]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F7F8FA] px-5">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  if (!user || !membership || !tenant) return <Navigate to={APP_PATHS.LOGIN} replace />;
  if (accessState === 'paused') return <SubscriptionPaused />;

  const handleLogout = async () => {
    await signOut();
    navigate(APP_PATHS.LOGIN, { replace: true });
  };

  const displayName = profile?.full_name || profile?.barbershop_name || 'Usuário';
  const timeZone = resolveAgendaTimeZone(tenant.timezone);

  return (
    <div className="bz-app-bg flex min-h-screen overflow-hidden">
      <Sidebar role={membership.role} onLogout={handleLogout} />
      <MobileBottomNav role={membership.role} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <header className="sticky top-0 z-20 border-b border-[#E5E7EB]/90 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-5 lg:px-7">
          <div className="flex min-h-11 items-center justify-between gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white text-[#5E6673] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D4AF37] md:flex"
              aria-expanded={!isSidebarCollapsed}
              aria-controls="saas-sidebar-navigation"
              aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
              title={`${isSidebarCollapsed ? 'Expandir' : 'Recolher'} barra lateral (Ctrl/Cmd+B)`}
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">menu</span>
            </button>
            <div className="ml-auto flex items-center gap-2.5">
              <NotificationMenu
                isOpen={activeMenu === 'notifications'}
                onOpenChange={(isOpen) => setActiveMenu(isOpen ? 'notifications' : null)}
                tenantId={membership.tenant_id}
                userId={user.id}
                timeZone={timeZone}
              />
              <AccountMenu
                isOpen={activeMenu === 'account'}
                onOpenChange={(isOpen) => setActiveMenu(isOpen ? 'account' : null)}
                name={displayName}
                email={user.email}
                companyName={tenant.company_name}
                role={membership.role}
                accessState={accessState}
                trialEndsAt={tenant.trial_ends_at}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </header>

        <div className="bz-page-shell px-4 py-5 pb-24 sm:px-5 lg:px-7 md:pb-5">
          <Outlet context={{ tenant, membership, profile }} />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
