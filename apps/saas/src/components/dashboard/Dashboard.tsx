
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Appointment, AppView } from '@/domain/types';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboardStats';

interface DashboardProps {
  appointments?: Appointment[];
  onNavigate?: (view: AppView) => void;
}

const routeByView: Partial<Record<AppView, string>> = {
  dashboard: '/',
  agenda: '/agenda',
  finance: '/finance',
  whatsapp: '/whatsapp',
  settings: '/settings',
  services: '/services',
  aiconfig: '/aiconfig',
};

const Dashboard: React.FC<DashboardProps> = ({ appointments = [], onNavigate }) => {
  const navigate = useNavigate();
  const { cutsToday, estimatedRevenue, nextAppointments, loading, error } = useDashboardStats();
  const displayedAppointments = nextAppointments.length > 0 ? nextAppointments : appointments.slice(0, 3);
  const revenueLabel = estimatedRevenue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleNavigate = (view: AppView) => {
    if (onNavigate) {
      onNavigate(view);
      return;
    }

    const route = routeByView[view];
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-950/20 to-zinc-900 p-8 flex flex-col md:flex-row items-center justify-between gap-6 group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[160px] text-red-500">warning</span>
          </div>
          <div className="flex items-start gap-5 relative z-10">
            <div className="p-4 bg-red-500/20 text-red-500 rounded-2xl">
              <span className="material-symbols-outlined text-4xl">cloud_off</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">WhatsApp Desconectado</h3>
              <p className="text-zinc-400 text-sm max-w-sm">
                O robô não está enviando mensagens de confirmação automática. Reative a conexão agora.
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleNavigate('whatsapp')}
            className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-lg shadow-red-950/40 transition-all active:scale-95 whitespace-nowrap z-10"
          >
            Reconectar WhatsApp
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900 p-8 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Cortes Hoje</p>
              <h4 className="text-4xl font-bold">{loading ? '...' : cutsToday}</h4>
            </div>
            <div className="p-2 bg-[#f4c025]/10 text-[#f4c025] rounded-lg">
              <span className="material-symbols-outlined">content_cut</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Faturamento Est.</p>
              <h4 className="text-2xl font-bold text-[#f4c025]">{loading ? '...' : revenueLabel}</h4>
            </div>
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          {error && (
            <p className="mt-4 text-xs text-red-400">
              Nao foi possivel carregar os dados do dashboard.
            </p>
          )}
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#f4c025]">bolt</span>
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 transition-all group">
            <div className="w-16 h-16 rounded-full bg-[#f4c025]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-[#f4c025]">add_circle</span>
            </div>
            <span className="font-bold text-sm">Novo Agendamento</span>
          </button>
          <button onClick={() => handleNavigate('services')} className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 transition-all group">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">cut</span>
            </div>
            <span className="font-bold text-sm">Serviços</span>
          </button>
          <button onClick={() => handleNavigate('agenda')} className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 transition-all group">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">calendar_today</span>
            </div>
            <span className="font-bold text-sm">Ver Agenda</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-white/5 bg-zinc-950 hover:bg-zinc-900 transition-all group">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">share</span>
            </div>
            <span className="font-bold text-sm">Link de Reserva</span>
          </button>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Próximos Agendamentos</h3>
          <button onClick={() => handleNavigate('agenda')} className="text-[#f4c025] text-sm font-bold hover:underline">Ver todos</button>
        </div>
        <div className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                <th className="px-8 py-4">Cliente</th>
                <th className="px-8 py-4">Serviço</th>
                <th className="px-8 py-4 text-right">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedAppointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <img src={apt.clientAvatar} className="w-10 h-10 rounded-full border border-white/10" alt="" />
                      <span className="font-bold">{apt.clientName}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-zinc-400 text-sm">{apt.service}</td>
                  <td className="px-8 py-5 text-right">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      apt.status === 'confirmed' ? 'bg-green-500/10 text-green-500' : 
                      apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {apt.time}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && displayedAppointments.length === 0 && (
                <tr>
                  <td className="px-8 py-8 text-sm text-zinc-500 text-center" colSpan={3}>
                    Nenhum agendamento encontrado para hoje nesta conta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
