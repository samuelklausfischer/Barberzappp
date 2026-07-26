import React from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import SubscriptionPaused from '@/components/auth/SubscriptionPaused';
import { LoadingSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Premium';
import { APP_PATHS } from '@/config/routes';

const AppLayout: React.FC = () => {
  const { user, profile, tenant, membership, loading, signOut, accessState } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="bz-app-bg flex min-h-screen overflow-hidden">
      <Sidebar role={membership.role} onLogout={handleLogout} />
      <MobileBottomNav role={membership.role} onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <header className="sticky top-0 z-20 border-b border-[#E5E7EB]/90 bg-white/90 px-4 py-3 backdrop-blur-xl sm:px-5 lg:px-7">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="bz-kicker mb-2">Operação do dia</p>
              <h2 className="text-lg font-semibold text-[#1A1A1F] sm:text-xl">
                Olá, {profile?.full_name || profile?.barbershop_name || 'Usuário'}
              </h2>
              <p className="mt-1 text-xs text-[#6B7280]">Vamos fazer acontecer com clareza e presença premium.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
              <div className="hidden min-w-[200px] items-center gap-2.5 rounded-full border border-[#E5E7EB] bg-[#FBFCFD] px-3.5 py-2 text-[11px] text-[#6B7280] md:flex">
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">search</span>
                <span>Buscar clientes, serviços ou transações...</span>
              </div>
              <StatusBadge label={tenant.company_name || 'Loja ativa'} tone="emerald" />
              <button
                type="button"
                disabled
                title="Em breve"
                aria-label="Notificações (em breve)"
                className="relative flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-[#E5E7EB] bg-white text-[#6B7280] opacity-60"
              >
                <span className="material-symbols-outlined" aria-hidden="true">notifications</span>
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#D4AF37]" />
              </button>
              <div className="flex items-center gap-2.5 rounded-full border border-[#E5E7EB] bg-white px-2.5 py-1.5 pr-2.5">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-[#1A1A1F]">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B7280]">
                    {membership.role === 'owner' ? 'Proprietário' : 'Equipe'}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/12">
                  <span className="material-symbols-outlined text-[20px] text-[#B38D1C]" aria-hidden="true">person</span>
                </div>
              </div>
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
