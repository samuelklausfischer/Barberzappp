import React from 'react';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';

const Agenda: React.FC = () => {
  const { appointments, loading, error } = useAppointments();
  const confirmedCount = appointments.filter(
    (appointment) => appointment.status === 'confirmed'
  ).length;
  const pendingCount = appointments.filter(
    (appointment) => appointment.status === 'pending'
  ).length;
  const estimatedRevenue = appointments.reduce(
    (total, appointment) => total + appointment.price,
    0
  );
  const todayLabel = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  }).format(new Date());
  return (
    <div className="space-y-8 pb-20 text-[#1A1A1F] animate-in slide-in-from-left duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 capitalize">{todayLabel}</h1>
          <p className="text-[#6B7280]">Gestão detalhada da sua agenda diária.</p>
        </div>
        <div className="flex items-center bg-white border border-[#E5E7EB] p-1 rounded-xl shadow-[0_4px_16px_rgba(26,26,31,0.04)]">
          <button className="p-2 text-[#6B7280] hover:text-[#1A1A1F] transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-2 px-6 border-x border-[#E5E7EB]">
            <span className="material-symbols-outlined text-[#9A7417]">calendar_today</span>
            <span className="text-sm font-bold">Hoje</span>
          </div>
          <button className="p-2 text-[#6B7280] hover:text-[#1A1A1F] transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            l: 'Agendados',
            v: loading ? '...' : appointments.length.toString(),
            i: 'calendar_month',
            c: 'text-[#9A7417]',
          },
          {
            l: 'Confirmados',
            v: loading ? '...' : confirmedCount.toString(),
            i: 'check_circle',
            c: 'text-green-500',
          },
          {
            l: 'Pendentes',
            v: loading ? '...' : pendingCount.toString(),
            i: 'schedule',
            c: 'text-[#9A7417]',
          },
          {
            l: 'Faturamento',
            v: loading
              ? '...'
              : estimatedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            i: 'payments',
            c: 'text-blue-400',
          },
        ].map((stat) => (
          <div
            key={stat.l}
            className="bg-white border border-[#E5E7EB] rounded-2xl p-6 space-y-2 shadow-[0_8px_24px_rgba(26,26,31,0.04)]"
          >
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm ${stat.c}`}>{stat.i}</span>
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">
                {stat.l}
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.v}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-10 text-center text-[#6B7280] shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
            Carregando agenda...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
            Não foi possível carregar a agenda.
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
            <span className="material-symbols-outlined mb-3 text-4xl text-[#9CA3AF]">
              event_busy
            </span>
            <h2 className="text-lg font-bold">Agenda vazia</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Nenhum agendamento foi cadastrado para esta barbearia.
            </p>
          </div>
        ) : (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className={`group relative bg-white border border-[#E5E7EB] rounded-2xl p-4 flex flex-col items-stretch gap-4 hover:border-[#D4AF37]/50 transition-all shadow-[0_8px_24px_rgba(26,26,31,0.04)] sm:flex-row sm:items-center ${apt.status === 'canceled' ? 'opacity-50' : ''}`}
            >
              <div className="w-full shrink-0 flex flex-row items-center justify-between border-b border-[#E5E7EB] pb-3 sm:w-24 sm:flex-col sm:border-b-0 sm:border-r sm:pb-0 sm:mr-6 sm:pr-6">
                <span
                  className={`text-2xl font-black ${apt.status === 'canceled' ? 'line-through text-[#9CA3AF]' : ''}`}
                >
                  {apt.time}
                </span>
                <span className="text-[10px] font-bold text-[#6B7280] uppercase">
                  {apt.duration}
                </span>
              </div>

              <div className="flex-1 flex items-center gap-5 min-w-0">
                {apt.clientAvatar ? (
                  <img
                    src={apt.clientAvatar}
                    className={`w-14 h-14 rounded-full border-2 ${apt.status === 'confirmed' ? 'border-[#D4AF37]/60' : 'border-[#E5E7EB]'}`}
                    alt=""
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#E5E7EB] bg-[#F3F4F6]">
                    <span className="material-symbols-outlined text-zinc-500">person</span>
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-lg">{apt.clientName}</h4>
                  <div className="flex flex-wrap items-center gap-2 text-[#6B7280] text-xs">
                    <span className={apt.status === 'canceled' ? 'line-through' : ''}>
                      {apt.service}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#D1D5DB]"></span>
                    <span className="font-bold text-[#1A1A1F]">
                      {apt.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  apt.status === 'confirmed'
                    ? 'bg-green-50 text-green-700'
                    : apt.status === 'pending'
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-red-50 text-red-700'
                }`}
              >
                {apt.status === 'confirmed'
                  ? 'Confirmado'
                  : apt.status === 'pending'
                    ? 'Pendente'
                    : 'Cancelado'}
              </span>
            </div>
          ))
        )}
      </div>

      <button
        disabled
        title="Em breve"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#D4AF37] text-[#1A1A1F] rounded-full shadow-xl disabled:cursor-not-allowed disabled:opacity-50 shadow-[#D4AF37]/20 flex items-center justify-center hover:scale-105 transition-all z-30 sm:bottom-10 sm:right-10 sm:w-16 sm:h-16"
      >
        <span className="material-symbols-outlined text-4xl">add</span>
      </button>
    </div>
  );
};

export default Agenda;
