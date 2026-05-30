import React from 'react';
import { DashboardContainer } from '../components/dashboard/DashboardContainer';
import { Calendar, Users, DollarSign, MessageSquare, Clock, Scissors } from 'lucide-react';

export const HomeDashboard = () => {
  const stats = [
    { label: 'Agendamentos Hoje', value: '12', icon: Calendar, color: 'from-blue-500 to-blue-600', valueColor: 'text-blue-400' },
    { label: 'Clientes Ativos', value: '156', icon: Users, color: 'from-green-500 to-green-600', valueColor: 'text-green-400' },
    { label: 'Faturamento Mês', value: 'R$ 12.450', icon: DollarSign, color: 'from-amber-500 to-orange-500', valueColor: 'text-amber-400' },
    { label: 'Mensagens IA', value: '342', icon: MessageSquare, color: 'from-purple-500 to-purple-600', valueColor: 'text-purple-400' },
  ];

  const appointments = [
    { id: 1, cliente: 'João Silva', servico: 'Corte + Barba', horario: '10:30', status: 'Confirmado' },
    { id: 2, cliente: 'Pedro Santos', servico: 'Corte', horario: '11:00', status: 'Pendente' },
    { id: 3, cliente: 'Marcos Costa', servico: 'Barba', horario: '11:30', status: 'Confirmado' },
    { id: 4, cliente: 'Carlos Lima', servico: 'Hidratação', horario: '12:00', status: 'Pendente' },
    { id: 5, cliente: 'Ricardo Souza', servico: 'Corte', horario: '12:30', status: 'Confirmado' },
  ];

  const recentActivity = [
    { action: 'Novo agendamento', cliente: 'João Silva', time: '5 min atrás' },
    { action: 'Pagamento confirmado', cliente: 'Marcos Costa', time: '12 min atrás' },
    { action: 'Cliente cadastrado', cliente: 'Carlos Lima', time: '23 min atrás' },
  ];

  return (
    <DashboardContainer>
      <div className="p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Dashboard</h2>
          <p className="text-gray-400">Bem-vindo ao BarberZap Admin</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="bg-gradient-to-r bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-2xl font-bold ${stat.valueColor}`}>{stat.value}</span>
                </div>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Agendamentos Recentes</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {appointments.map(appt => (
                <div key={appt.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">{appt.cliente}</p>
                      <p className="text-sm text-gray-400">{appt.servico}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-amber-400">{appt.horario}</p>
                    <p className="text-xs text-gray-400">{appt.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-400" />
                  <div>
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-gray-400">{activity.cliente} • {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Dica Rápida</span>
              </div>
              <p className="text-xs text-gray-400">
                Use o menu lateral para navegar entre todas as funcionalidades do sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
};
