
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/features/auth/hooks/useAuth';
import Login from '@/components/auth/Login';
import { LoadingSkeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Premium';

const AppLayout: React.FC = () => {
  const { user, profile, tenant, membership, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#09090b]">
        <LoadingSkeleton count={3} type="card" />
      </div>
    );
  }

  if (!user || !membership || !tenant) {
    return <Login />;
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="bz-app-bg flex min-h-screen overflow-hidden">
      <Sidebar onLogout={handleLogout} />

      <main className="flex-1 overflow-y-auto scrollbar-hide pb-28 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-white/5 bg-[#0b0a09]/80 px-4 py-3 backdrop-blur-xl sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="bz-kicker mb-2">Operação do dia</p>
              <h2 className="text-lg font-semibold text-[#f6f1e8] sm:text-xl">
                Olá, {profile?.full_name || profile?.barbershop_name || 'Usuário'}
              </h2>
              <p className="mt-1 text-xs text-[#938674]">Vamos fazer acontecer com clareza e presença premium.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 lg:justify-end">
              <div className="hidden min-w-[200px] items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] px-3.5 py-2 text-[11px] text-[#8d8373] md:flex">
                <span className="material-symbols-outlined text-[20px]">search</span>
                <span>Buscar clientes, serviços ou transações...</span>
              </div>

              <StatusBadge label={tenant?.company_name || 'Loja ativa'} tone="emerald" />

              <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-[#d8cdbd] transition-colors hover:text-white">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-[#d7ab3f]" />
              </button>

              <div className="flex items-center gap-2.5 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1.5 pr-2.5">
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-white">{profile?.full_name || 'Usuário'}</p>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#938674]">
                    {membership?.role === 'owner' ? 'Owner' : 'Equipe'}
                  </p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7ab3f]/20 bg-[#d7ab3f]/10">
                  <span className="material-symbols-outlined text-[20px] text-[#f0d57e]">person</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="bz-page-shell px-4 py-5 sm:px-5 lg:px-6">
          <Outlet context={{ tenant, membership, profile }} />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
