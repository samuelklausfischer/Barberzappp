import React from 'react';
import { useServices } from '@/features/services/hooks/useServices';

const ServicesList: React.FC = () => {
  const { services, loading, error } = useServices();
  return (
    <div className="space-y-8 text-[#1A1A1F] animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Meus Serviços</h1>
          <p className="text-zinc-500">Gerencie o catálogo de serviços oferecidos na barbearia</p>
        </div>
        <button
          disabled
          title="Em breve"
          className="h-12 px-8 cursor-not-allowed opacity-50 bg-[#D4AF37] hover:bg-[#b89222] text-[#1A1A1F] font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span>
          Novo Serviço
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full rounded-3xl border border-[#E5E7EB] bg-white p-12 text-center text-[#6B7280] shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
            Carregando serviços...
          </div>
        ) : error ? (
          <div className="col-span-full rounded-3xl border border-red-200 bg-red-50 p-12 text-center text-red-700">
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
          services.map((svc) => (
            <div
              key={svc.id}
              className="bg-white border border-[#E5E7EB] rounded-3xl p-8 group hover:border-[#D4AF37]/50 transition-all flex flex-col relative overflow-hidden shadow-[0_8px_24px_rgba(26,26,31,0.04)]"
            >
              {svc.popular && (
                <span className="absolute top-4 right-4 bg-[#D4AF37]/10 text-[#9A7417] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#D4AF37]/20">
                  Popular
                </span>
              )}
              <div className="w-14 h-14 bg-[#F3F4F6] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-2xl text-[#4B5563]">{svc.icon}</span>
              </div>
              <h3 className="text-xl font-bold mb-1">{svc.name}</h3>
              <p className="text-[#6B7280] text-sm mb-10">{svc.description}</p>

              <div className="mt-auto pt-6 border-t border-[#E5E7EB] flex justify-between items-end">
                <div>
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">
                    Preço
                  </p>
                  <p className="text-xl font-bold">
                    {svc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">
                    Duração
                  </p>
                  <div className="flex items-center gap-1 text-[#6B7280]">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span className="text-sm font-bold">{svc.duration} min</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <button
          disabled
          title="Em breve"
          className="cursor-not-allowed border-2 border-dashed opacity-50 border-[#D1D5DB] rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-[#FBFCFD] hover:border-[#D4AF37]/30 transition-all min-h-[260px] group"
        >
          <div className="w-14 h-14 bg-[#F3F4F6] rounded-full flex items-center justify-center group-hover:bg-[#D4AF37] group-hover:text-[#1A1A1F] transition-all">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <span className="font-bold text-[#6B7280]">Adicionar Serviço</span>
        </button>
      </div>
    </div>
  );
};

export default ServicesList;
