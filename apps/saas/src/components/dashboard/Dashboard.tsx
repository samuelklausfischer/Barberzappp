import React from 'react';
import { Link } from 'react-router-dom';
import { APP_PATHS } from '@/config/routes';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';

const Dashboard: React.FC = () => {
  const { appointments, loading, error } = useAppointments();
  const estimatedRevenue = appointments.reduce(
    (total, appointment) => total + appointment.price,
    0
  );
  const formattedRevenue = estimatedRevenue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <div className="space-y-8 text-[#1A1A1F] animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_24px_rgba(26,26,31,0.04)] group">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-[160px] text-amber-500">warning</span>
          </div>
          <div className="flex items-start gap-5 relative z-10">
            <div className="p-4 bg-amber-100 text-amber-700 rounded-2xl">
              <span className="material-symbols-outlined text-4xl">cloud_off</span>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">WhatsApp Desconectado</h3>
              <p className="text-[#6B7280] text-sm max-w-sm">
                O robô não está enviando mensagens de confirmação automática. Reative a conexão
                agora.
              </p>
            </div>
          </div>
          <Link
            to={APP_PATHS.WHATSAPP}
            className="px-6 py-4 bg-[#D4AF37] hover:bg-[#b89222] text-[#1A1A1F] font-bold rounded-xl shadow-lg shadow-[#D4AF37]/20 transition-all active:scale-95 whitespace-nowrap z-10"
          >
            Reconectar WhatsApp
          </Link>
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 flex flex-col justify-between shadow-[0_8px_24px_rgba(26,26,31,0.04)] group">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mb-1">
                Agendamentos
              </p>
              <h4 className="text-4xl font-bold">{loading ? '...' : appointments.length}</h4>
            </div>
            <div className="p-2 bg-[#D4AF37]/10 text-[#9A7417] rounded-lg">
              <span className="material-symbols-outlined">content_cut</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[#6B7280] text-xs font-bold uppercase tracking-widest mb-1">
                Faturamento Est.
              </p>
              <h4 className="text-2xl font-bold text-[#9A7417]">
                {loading ? '...' : formattedRevenue}
              </h4>
            </div>
            <div className="p-2 bg-green-50 text-green-700 rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#9A7417]">bolt</span>
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to={APP_PATHS.AGENDA}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-[#E5E7EB] bg-white hover:bg-[#FBFCFD] transition-all shadow-[0_8px_24px_rgba(26,26,31,0.04)] group"
          >
            <div className="w-16 h-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-[#9A7417]">
                calendar_month
              </span>
            </div>
            <span className="font-bold text-sm">Abrir agenda</span>
          </Link>
          <Link
            to={APP_PATHS.SERVICES}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-[#E5E7EB] bg-white hover:bg-[#FBFCFD] transition-all shadow-[0_8px_24px_rgba(26,26,31,0.04)] group"
          >
            <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-[#4B5563]">cut</span>
            </div>
            <span className="font-bold text-sm">Serviços</span>
          </Link>
          <Link
            to={APP_PATHS.AGENDA}
            className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border border-[#E5E7EB] bg-white hover:bg-[#FBFCFD] transition-all shadow-[0_8px_24px_rgba(26,26,31,0.04)] group"
          >
            <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-[#4B5563]">calendar_today</span>
            </div>
            <span className="font-bold text-sm">Ver Agenda</span>
          </Link>
          <button
            disabled
            title="Em breve"
            className="flex cursor-not-allowed flex-col items-center justify-center gap-4 rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-8 opacity-60"
          >
            <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-[#4B5563]">share</span>
            </div>
            <span className="font-bold text-sm">Link de Reserva · Em breve</span>
          </button>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Próximos Agendamentos</h3>
          <Link to={APP_PATHS.AGENDA} className="text-[#9A7417] text-sm font-bold hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-b border-[#E5E7EB] text-[#6B7280] text-[10px] uppercase font-bold tracking-widest">
                <th className="px-8 py-4">Cliente</th>
                <th className="px-8 py-4">Serviço</th>
                <th className="px-8 py-4 text-right">Horário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F1F3]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-sm text-[#6B7280]">
                    Carregando agenda...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-sm text-red-700">
                    Não foi possível carregar a agenda.
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-sm text-[#6B7280]">
                    Nenhum agendamento cadastrado.
                  </td>
                </tr>
              ) : (
                appointments.slice(0, 3).map((apt) => (
                  <tr key={apt.id} className="hover:bg-[#FBFCFD] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        {apt.clientAvatar ? (
                          <img
                            src={apt.clientAvatar}
                            className="w-10 h-10 rounded-full border border-[#E5E7EB]"
                            alt=""
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#F3F4F6]">
                            <span className="material-symbols-outlined text-[#6B7280]">person</span>
                          </div>
                        )}
                        <span className="font-bold">{apt.clientName}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[#6B7280] text-sm">{apt.service}</td>
                    <td className="px-8 py-5 text-right">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          apt.status === 'confirmed'
                            ? 'bg-green-50 text-green-700'
                            : apt.status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {apt.time}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
