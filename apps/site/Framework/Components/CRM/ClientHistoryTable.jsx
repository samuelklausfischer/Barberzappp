import React from 'react';
import { Calendar, DollarSign, User, Clock, CheckCircle, XCircle, Clock as Pending } from 'lucide-react';
import { formatCurrency, formatDate } from '../../logic/clientLogic';

/**
 * ClientHistoryTable Component
 * 
 * Displays client appointment history in a table format.
 * 
 * @param {Object} props
 * @param {Array} props.history - Array of appointments
 * @param {boolean} props.loading - Loading state
 * @param {string} props.emptyMessage - Message when no history
 */
export const ClientHistoryTable = ({ 
  history = [], 
  loading = false,
  emptyMessage = 'Nenhum agendamento encontrado'
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
        return <Pending className="w-4 h-4 text-amber-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      case 'pending':
        return 'Pendente';
      case 'no-show':
        return 'Não compareceu';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'cancelled':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'no-show':
        return 'bg-gray-500/15 text-gray-400 border-gray-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  // Calculate totals
  const totalAppointments = history.length;
  const totalSpent = history
    .filter(apt => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.price, 0);
  const completedAppointments = history.filter(apt => apt.status === 'completed').length;

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-slate-700/50" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-slate-700/50 rounded" />
                <div className="h-3 w-1/4 bg-slate-700/50 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
          <Calendar className="w-8 h-8 text-gray-500" />
        </div>
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <Calendar className="w-4 h-4" />
            <span>Total Agendamentos</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalAppointments}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <CheckCircle className="w-4 h-4" />
            <span>Concluídos</span>
          </div>
          <p className="text-2xl font-bold text-white">{completedAppointments}</p>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Total Gasto</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Serviço
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Profissional
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Preço
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {history.map((appointment, index) => (
              <tr 
                key={appointment.id || index} 
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-white text-sm">{formatDate(appointment.date)}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-white font-medium">{appointment.service}</span>
                  {appointment.notes && (
                    <p className="text-xs text-gray-500 mt-0.5">{appointment.notes}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-white">
                      {appointment.barber?.[0] || '?'}
                    </div>
                    <span className="text-sm text-gray-300">{appointment.barber}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-white font-semibold">{formatCurrency(appointment.price)}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    {getStatusLabel(appointment.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * ClientHistoryTableCompact - Compact version for inline display
 */
export const ClientHistoryTableCompact = ({ 
  history = [], 
  limit = 5 
}) => {
  const limitedHistory = history.slice(0, limit);

  if (limitedHistory.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        Sem histórico recente
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {limitedHistory.map((appointment, index) => (
        <div 
          key={appointment.id || index} 
          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{appointment.service}</p>
              <p className="text-xs text-gray-400">{formatDate(appointment.date)}</p>
            </div>
          </div>
          <span className="text-sm font-medium text-white">
            {formatCurrency(appointment.price)}
          </span>
        </div>
      ))}
      {history.length > limit && (
        <button className="w-full py-2 text-sm text-amber-400 hover:text-amber-300 transition-colors">
          Ver todos os {history.length} agendamentos
        </button>
      )}
    </div>
  );
};

export default ClientHistoryTable;
