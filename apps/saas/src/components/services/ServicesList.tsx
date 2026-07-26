import React, { useState } from 'react';
import { useServices } from '@/features/services/hooks/useServices';
import { ServiceFormModal } from './ServiceFormModal';

const ServicesList: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [createdNotice, setCreatedNotice] = useState(false);
  const {
    services,
    barbers,
    loading,
    barbersLoading,
    creating,
    error,
    barbersError,
    createError,
    fetchBarbers,
    clearCreateError,
    createService,
  } = useServices();
  const openModal = () => {
    clearCreateError();
    setModalOpen(true);
    void fetchBarbers();
  };
  return (
    <div className="space-y-8 text-[#1A1A1F] animate-in fade-in duration-500">
      <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-4xl font-black tracking-tight">Meus Serviços</h1>
          <p className="text-zinc-500">Gerencie o catálogo de serviços oferecidos na barbearia</p>
        </div>
        <button
          onClick={openModal}
          className="flex h-12 items-center gap-2 rounded-xl bg-[#D4AF37] px-8 font-bold text-[#1A1A1F] shadow-lg transition-all hover:bg-[#b89222] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
        >
          <span className="material-symbols-outlined">add</span>Novo Serviço
        </button>
      </header>
      {createdNotice ? (
        <p
          role="status"
          className="rounded-xl border border-[#D4AF37]/30 bg-[#FFFAE9] px-4 py-3 text-sm font-semibold text-[#7A5E12]"
        >
          Serviço criado e disponível no catálogo.
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-3xl border border-[#E5E7EB] bg-white p-12 text-center text-[#6B7280] shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
            Carregando serviços...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="col-span-full rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-700"
          >
            Não foi possível carregar os serviços.
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-[#D1D5DB] bg-white p-12 text-center shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
            <span className="material-symbols-outlined mb-3 text-4xl text-[#9CA3AF]">
              content_cut
            </span>
            <h2 className="text-lg font-bold">Catálogo vazio</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Nenhum serviço foi cadastrado para esta barbearia.
            </p>
          </div>
        ) : (
          services.map((service) => (
            <article
              key={service.id}
              className="relative flex flex-col overflow-hidden rounded-3xl border border-[#E5E7EB] bg-white p-8 shadow-[0_8px_24px_rgba(26,26,31,0.04)] transition-all hover:border-[#D4AF37]/50"
            >
              <div className="absolute right-4 top-4 flex gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${service.active && (service.status === null || service.status === 'active') ? 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#9A7417]' : 'border-[#D1D5DB] bg-[#F3F4F6] text-[#4B5563]'}`}
                >
                  {service.active && (service.status === null || service.status === 'active')
                    ? 'Ativo'
                    : 'Inativo'}
                </span>
              </div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F3F4F6]">
                <span className="material-symbols-outlined text-2xl text-[#4B5563]">
                  content_cut
                </span>
              </div>
              <h3 className="mb-1 text-xl font-bold">{service.name}</h3>
              <p className="mb-3 text-sm text-[#6B7280]">{service.description}</p>
              <p className="text-xs font-semibold text-[#6B7280]">
                {service.barberId
                  ? `Exclusivo: ${service.barberName ?? 'barbeiro selecionado'}`
                  : 'Disponível para todos os barbeiros ativos'}
              </p>
              <div className="mt-auto flex justify-between border-t border-[#E5E7EB] pt-6">
                <div>
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                    Preço
                  </p>
                  <p className="text-xl font-bold">
                    {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">
                    Duração
                  </p>
                  <p className="text-sm font-bold text-[#6B7280]">{service.duration} min</p>
                </div>
              </div>
            </article>
          ))
        )}
        <button
          onClick={openModal}
          className="group flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-[#D1D5DB] p-8 transition-all hover:border-[#D4AF37]/30 hover:bg-[#FBFCFD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F3F4F6] transition-all group-hover:bg-[#D4AF37]">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <span className="font-bold text-[#6B7280]">Adicionar Serviço</span>
        </button>
      </div>
      {isModalOpen ? (
        <ServiceFormModal
          isOpen
          barbers={barbers}
          barbersLoading={barbersLoading}
          barbersError={barbersError}
          creating={creating}
          error={createError}
          onClose={() => setModalOpen(false)}
          onCreated={() => setCreatedNotice(true)}
          onRetryBarbers={() => void fetchBarbers()}
          onSubmit={createService}
        />
      ) : null}
    </div>
  );
};
export default ServicesList;
