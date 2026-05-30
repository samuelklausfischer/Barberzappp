import React, { useState, useEffect } from 'react';
import { Appointment, AppView } from '@/domain/types';
import { AnimatedCard } from '@/components/ui/AnimatedCard';
import { PageTransition } from '@/components/ui/PageTransition';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ButtonAnimated } from '@/components/ui/ButtonAnimated';

interface DashboardEnhancedProps {
  appointments: Appointment[];
  onNavigate: (view: AppView) => void;
}

/**
 * DashboardEnhanced Component
 * 
 * Enhanced dashboard with animations, loading skeletons,
 * hover effects, and stagger animations.
 */
export const DashboardEnhanced: React.FC<DashboardEnhancedProps> = ({
  appointments,
  onNavigate,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading for demo purposes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Stats skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton variant="rounded" width="100%" height="180px" />
          <LoadingSkeleton variant="rounded" width="100%" height="180px" />
          <LoadingSkeleton variant="rounded" width="100%" height="180px" />
        </div>

        {/* Quick actions skeletons */}
        <LoadingSkeleton variant="text" width="200px" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="rounded" width="100%" height="140px" />
          ))}
        </div>

        {/* Appointments list skeleton */}
        <LoadingSkeleton variant="text" width="200px" />
        <LoadingSkeleton variant="rounded" width="100%" height="250px" />
      </div>
    );
  }

  return (
    <PageTransition stagger delay={100}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* WhatsApp Status Card */}
        <AnimatedCard 
          variant="gradient" 
          glow
          className="lg:col-span-2 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-start gap-5">
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
          <ButtonAnimated 
            variant="danger" 
            size="md"
            onClick={() => onNavigate('whatsapp')}
          >
            Reconectar WhatsApp
          </ButtonAnimated>
        </AnimatedCard>

        {/* Today's Stats Card */}
        <AnimatedCard variant="gold" glow className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
                Cortes Hoje
              </p>
              <h4 className="text-4xl font-bold">8</h4>
            </div>
            <div className="p-2 bg-[#f4c025]/10 text-[#f4c025] rounded-lg">
              <span className="material-symbols-outlined">content_cut</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
                Faturamento Est.
              </p>
              <h4 className="text-2xl font-bold text-[#f4c025]">R$ 240,00</h4>
            </div>
            <div className="p-2 bg-green-500/10 text-green-500 rounded-lg">
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Quick Actions */}
      <section>
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#f4c025]">bolt</span>
          Ações Rápidas
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedCard className="flex flex-col items-center justify-center gap-4 p-8 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-[#f4c025]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-[#f4c025]">
                add_circle
              </span>
            </div>
            <span className="font-bold text-sm">Novo Agendamento</span>
          </AnimatedCard>

          <AnimatedCard onClick={() => onNavigate('services')} className="flex flex-col items-center justify-center gap-4 p-8 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">cut</span>
            </div>
            <span className="font-bold text-sm">Serviços</span>
          </AnimatedCard>

          <AnimatedCard onClick={() => onNavigate('agenda')} className="flex flex-col items-center justify-center gap-4 p-8 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">calendar_today</span>
            </div>
            <span className="font-bold text-sm">Ver Agenda</span>
          </AnimatedCard>

          <AnimatedCard className="flex flex-col items-center justify-center gap-4 p-8 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">share</span>
            </div>
            <span className="font-bold text-sm">Link de Reserva</span>
          </AnimatedCard>
        </div>
      </section>

      {/* Appointments List */}
      <section>
        <PageTransition stagger delay={300}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Próximos Agendamentos</h3>
            <ButtonAnimated 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('agenda')}
            >
              Ver todos
            </ButtonAnimated>
          </div>

          <AnimatedCard variant="default" className="overflow-hidden p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase font-bold tracking-widest bg-white/[0.02]">
                  <th className="px-8 py-4">Cliente</th>
                  <th className="px-8 py-4">Serviço</th>
                  <th className="px-8 py-4 text-right">Horário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {appointments.slice(0, 3).map((apt, index) => (
                  <tr 
                    key={apt.id} 
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img 
                          src={apt.clientAvatar} 
                          className="w-10 h-10 rounded-full border border-white/10 group-hover:border-[#f4c025]/50 transition-colors" 
                          alt="" 
                        />
                        <span className="font-bold group-hover:text-[#f4c025] transition-colors">
                          {apt.clientName}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-zinc-400 text-sm">{apt.service}</td>
                    <td className="px-8 py-5 text-right">
                      <span className={`
                        px-3 py-1 rounded-lg text-xs font-bold 
                        ${
                          apt.status === 'confirmed' 
                            ? 'bg-green-500/10 text-green-500' 
                            : apt.status === 'pending' 
                              ? 'bg-yellow-500/10 text-yellow-500' 
                              : 'bg-red-500/10 text-red-500'
                        }
                      `}>
                        {apt.time}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AnimatedCard>
        </PageTransition>
      </section>

      {/* Additional Stats Section */}
      <section>
        <PageTransition stagger delay={500}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard variant="default">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                  <span className="material-symbols-outlined">week</span>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase">Esta Semana</p>
                  <h4 className="text-2xl font-bold">42</h4>
                </div>
              </div>
              <div className="text-zinc-400 text-sm">+12% vs semana anterior</div>
            </AnimatedCard>

            <AnimatedCard variant="default">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
                  <span className="material-symbols-outlined">trending_up</span>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase">Este Mês</p>
                  <h4 className="text-2xl font-bold">R$ 6.240</h4>
                </div>
              </div>
              <div className="text-zinc-400 text-sm">+8% vs mês anterior</div>
            </AnimatedCard>

            <AnimatedCard variant="default">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                  <span className="material-symbols-outlined">group</span>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase">Clientes Ativos</p>
                  <h4 className="text-2xl font-bold">156</h4>
                </div>
              </div>
              <div className="text-zinc-400 text-sm">+5 novos este mês</div>
            </AnimatedCard>
          </div>
        </PageTransition>
      </section>
    </PageTransition>
  );
};

export default DashboardEnhanced;
