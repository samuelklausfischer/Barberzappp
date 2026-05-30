
import React from 'react';
import { Service } from '@/domain/types';

interface ServicesListProps {
  services: Service[];
}

const ServicesList: React.FC<ServicesListProps> = ({ services }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Meus Serviços</h1>
          <p className="text-zinc-500">Gerencie o catálogo de serviços oferecidos na barbearia</p>
        </div>
        <button className="h-12 px-8 bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
          <span className="material-symbols-outlined">add</span>
          Novo Serviço
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(svc => (
          <div key={svc.id} className="bg-zinc-900 border border-white/10 rounded-3xl p-8 group hover:border-[#f4c025]/30 transition-all flex flex-col relative overflow-hidden">
            {svc.popular && (
              <span className="absolute top-4 right-4 bg-[#f4c025]/10 text-[#f4c025] text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#f4c025]/20">Popular</span>
            )}
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl text-zinc-400">{svc.icon}</span>
            </div>
            <h3 className="text-xl font-bold mb-1">{svc.name}</h3>
            <p className="text-zinc-500 text-sm mb-10">{svc.description}</p>
            
            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between items-end">
              <div>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Preço</p>
                <p className="text-xl font-bold">R$ {svc.price},00</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mb-1">Duração</p>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span className="text-sm font-bold">{svc.duration} min</span>
                </div>
              </div>
            </div>

            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#f4c025] hover:text-black transition-all">
                <span className="material-symbols-outlined">edit</span>
              </button>
              <button className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 transition-all">
                <span className="material-symbols-outlined">delete</span>
              </button>
            </div>
          </div>
        ))}

        <button className="border-2 border-dashed border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/5 hover:border-[#f4c025]/20 transition-all min-h-[260px] group">
          <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-[#f4c025] group-hover:text-black transition-all">
            <span className="material-symbols-outlined text-2xl">add</span>
          </div>
          <span className="font-bold text-zinc-500">Adicionar Serviço</span>
        </button>
      </div>
    </div>
  );
};

export default ServicesList;
