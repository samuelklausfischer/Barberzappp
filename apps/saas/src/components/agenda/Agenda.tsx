
import React from 'react';
import { Appointment } from '@/domain/types';

interface AgendaProps {
  appointments: Appointment[];
}

const Agenda: React.FC<AgendaProps> = ({ appointments }) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-left duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Quinta-feira, 24 Out</h1>
          <p className="text-zinc-500">Gestão detalhada da sua agenda diária.</p>
        </div>
        <div className="flex items-center bg-zinc-900 border border-white/10 p-1 rounded-xl">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-2 px-6 border-x border-white/5">
            <span className="material-symbols-outlined text-[#f4c025]">calendar_today</span>
            <span className="text-sm font-bold">Hoje</span>
          </div>
          <button className="p-2 text-zinc-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { l: 'Agendados', v: '12', i: 'calendar_month', c: 'text-[#f4c025]' },
          { l: 'Confirmados', v: '8', i: 'check_circle', c: 'text-green-500' },
          { l: 'Pendentes', v: '3', i: 'schedule', c: 'text-[#f4c025]' },
          { l: 'Faturamento', v: 'R$ 540', i: 'payments', c: 'text-blue-400' },
        ].map(stat => (
          <div key={stat.l} className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-2">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-sm ${stat.c}`}>{stat.i}</span>
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{stat.l}</span>
            </div>
            <p className="text-2xl font-bold">{stat.v}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {appointments.map(apt => (
          <div key={apt.id} className={`group relative bg-zinc-900 border border-white/10 rounded-2xl p-4 flex items-center hover:border-[#f4c025]/30 transition-all ${apt.status === 'canceled' ? 'opacity-50' : ''}`}>
            <div className="w-24 shrink-0 flex flex-col items-center border-r border-white/5 mr-6">
              <span className={`text-2xl font-black ${apt.status === 'canceled' ? 'line-through text-zinc-600' : ''}`}>{apt.time}</span>
              <span className="text-[10px] font-bold text-zinc-600 uppercase">{apt.duration}</span>
            </div>
            
            <div className="flex-1 flex items-center gap-5">
              <img src={apt.clientAvatar} className={`w-14 h-14 rounded-full border-2 ${apt.status === 'confirmed' ? 'border-[#f4c025]/50' : 'border-white/10'}`} alt="" />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-lg">{apt.clientName}</h4>
                  <button className="text-green-500 hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined filled text-lg">chat</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs">
                  <span className={apt.status === 'canceled' ? 'line-through' : ''}>{apt.service}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span className="font-bold text-white">R$ {apt.price},00</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                apt.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                apt.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 animate-pulse' : 'bg-red-500/10 text-red-500'
              }`}>
                {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'pending' ? 'Pendente' : 'Cancelado'}
              </span>
              
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                <button className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-white/10">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
                <button className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center hover:bg-red-500">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="fixed bottom-10 right-10 w-16 h-16 bg-[#f4c025] text-black rounded-full shadow-2xl shadow-[#f4c025]/20 flex items-center justify-center hover:scale-110 transition-all z-30">
        <span className="material-symbols-outlined text-4xl">add</span>
      </button>
    </div>
  );
};

export default Agenda;
