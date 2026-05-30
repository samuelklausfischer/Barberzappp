
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const DATA_VOL = [
  { name: 'Seg', value: 18 },
  { name: 'Ter', value: 14 },
  { name: 'Qua', value: 24 },
  { name: 'Qui', value: 22 },
  { name: 'Sex', value: 36 },
  { name: 'Sáb', value: 40 },
];

const DATA_SERVICES = [
  { name: 'Corte', value: 55 },
  { name: 'Barba', value: 30 },
  { name: 'Sobrancelha', value: 15 },
];

const COLORS = ['#f4c025', '#ffffff', '#854d0e'];

const Finance: React.FC = () => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">Desempenho da Loja</h1>
          <p className="text-zinc-500">Visão geral das finanças e métricas operacionais</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-1 flex">
            <button className="px-4 py-2 text-xs font-bold text-zinc-500">Hoje</button>
            <button className="px-4 py-2 text-xs font-bold bg-white/5 text-white rounded-lg">Mês</button>
          </div>
          <button className="bg-[#f4c025] hover:bg-[#d9a419] text-black font-bold h-10 px-6 rounded-xl flex items-center gap-2 transition-all">
            <span className="material-symbols-outlined text-lg">download</span>
            Exportar
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-white/10 p-8 relative overflow-hidden group">
          <div className="absolute -right-10 -bottom-10 opacity-5">
            <span className="material-symbols-outlined text-[160px] text-[#f4c025]">payments</span>
          </div>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#f4c025]/10 text-[#f4c025] rounded-xl">
                <span className="material-symbols-outlined filled">attach_money</span>
              </div>
              <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Faturamento Total</p>
            </div>
            <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-full border border-green-500/20 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              +12.5%
            </span>
          </div>
          <h2 className="text-5xl font-bold tracking-tighter">R$ 4.520,00</h2>
          <p className="text-zinc-500 text-sm mt-2">Comparado a R$ 4.018,00 mês anterior</p>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-white/10 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-xl text-zinc-400">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Ticket Médio</p>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-3xl font-bold">R$ 45,00</h2>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-3">
              <div className="bg-[#f4c025] h-full rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-white/10 p-8 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-xl text-zinc-400">
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest">Agendamentos</p>
          </div>
          <div className="mt-8">
            <h2 className="text-3xl font-bold">142</h2>
            <p className="text-zinc-500 text-sm mt-1">15 novos clientes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-zinc-900 border border-white/10 p-8 flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl font-bold">Volume de Cortes</h3>
              <p className="text-zinc-500 text-sm">Performance diária (Seg - Sáb)</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA_VOL}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 12 }} dy={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#f4c025' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {DATA_VOL.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 ? '#f4c025' : 'rgba(244, 192, 37, 0.4)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-zinc-900 border border-white/10 p-8 flex flex-col">
          <h3 className="text-xl font-bold mb-1">Serviços</h3>
          <p className="text-zinc-500 text-sm mb-10">Distribuição de receita</p>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DATA_SERVICES}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {DATA_SERVICES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black">100%</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Receita</span>
              </div>
            </div>
            <div className="w-full space-y-3 mt-8">
              {DATA_SERVICES.map((item, index) => (
                <div key={item.name} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="text-zinc-400">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Finance;
