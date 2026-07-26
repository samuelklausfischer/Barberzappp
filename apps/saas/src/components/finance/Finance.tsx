import React from 'react';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Finance: React.FC = () => {
  const { appointments, loading, error } = useAppointments();
  const estimatedRevenue = appointments.reduce(
    (total, appointment) => total + appointment.price,
    0
  );
  const averageTicket = appointments.length > 0 ? estimatedRevenue / appointments.length : 0;

  return (
    <div className="space-y-6 text-[#1A1A1F] animate-in slide-in-from-bottom duration-500 sm:space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-black tracking-tight sm:text-4xl">Desempenho da Loja</h1>
          <p className="text-[#6B7280]">
            O financeiro começa zerado e será preenchido apenas por operações reais.
          </p>
        </div>
        <button
          disabled
          title="Em breve"
          className="min-h-11 w-full cursor-not-allowed rounded-xl bg-[#D4AF37] px-6 py-3 font-bold text-[#1A1A1F] opacity-50 sm:w-auto"
        >
          Exportar - Em breve
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Não foi possível carregar os agendamentos usados no resumo.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,31,0.04)] sm:p-8">
          <p className="text-[#6B7280] font-bold text-sm uppercase tracking-widest">
            Faturamento estimado
          </p>
          <h2 className="mt-5 break-words text-4xl font-bold tracking-tighter sm:mt-6 sm:text-5xl">
            {loading ? '...' : formatCurrency(estimatedRevenue)}
          </h2>
          <p className="text-[#6B7280] text-sm mt-2">
            Calculado somente com agendamentos desta barbearia.
          </p>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,31,0.04)] sm:p-8">
          <p className="text-[#6B7280] font-bold text-sm uppercase tracking-widest">
            Ticket médio estimado
          </p>
          <h2 className="mt-6 break-words text-3xl font-bold sm:mt-8">
            {loading ? '...' : formatCurrency(averageTicket)}
          </h2>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,31,0.04)] sm:p-8">
          <p className="text-[#6B7280] font-bold text-sm uppercase tracking-widest">Agendamentos</p>
          <h2 className="mt-6 text-3xl font-bold sm:mt-8">{loading ? '...' : appointments.length}</h2>
          <p className="text-[#6B7280] text-sm mt-1">Nenhum registro e criado automaticamente.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-6 text-center shadow-[0_8px_24px_rgba(26,26,31,0.04)] sm:p-12">
          <span className="material-symbols-outlined text-5xl text-[#9CA3AF]">bar_chart</span>
          <h3 className="mt-4 text-xl font-bold">Sem histórico financeiro</h3>
          <p className="mt-2 text-sm text-[#6B7280]">
            Gráficos aparecerão quando o módulo financeiro real for implementado.
          </p>
        </div>

        <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-white p-6 text-center shadow-[0_8px_24px_rgba(26,26,31,0.04)] sm:p-12">
          <span className="material-symbols-outlined text-5xl text-[#9CA3AF]">donut_small</span>
          <h3 className="mt-4 text-xl font-bold">Sem distribuição de receita</h3>
          <p className="mt-2 text-sm text-[#6B7280]">
            Nenhuma categoria ou porcentagem demonstrativa é exibida.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Finance;
