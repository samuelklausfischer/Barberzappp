import React from 'react';
import { Building2, Calendar, DollarSign, Edit2, Trash2, MessageCircle, MoreVertical } from 'lucide-react';
import { 
  getInitials, 
  formatCurrency, 
  formatRelativeTime, 
  STATUS_COLORS, 
  STATUS_LABELS 
} from '../../logic/clientLogic';

/**
 * ClientCard Component
 * 
 * Displays client information in a compact card format.
 * 
 * @param {Object} props
 * @param {Object} props.client - Client data
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onDelete - Delete handler
 * @param {Function} props.onMessage - WhatsApp message handler
 * @param {boolean} props.selected - Selected state
 * @param {Function} props.onClick - Click handler
 */
export const ClientCard = ({ 
  client, 
  onEdit, 
  onDelete, 
  onMessage,
  selected = false,
  onClick
}) => {
  const getAvatarColor = () => {
    if (client.status === 'active') return 'bg-emerald-500';
    if (client.status === 'inactive') return 'bg-amber-500';
    if (client.status === 'pending') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const handleAction = (e, action) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={onClick}
      className={`bg-slate-800/50 border rounded-xl p-4 hover:bg-slate-700/50 transition-all cursor-pointer ${
        selected ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-700/50 hover:border-slate-600'
      }`}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
          {getInitials(client.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-base truncate">{client.name}</h3>
              <p className="text-sm text-gray-400 truncate">{client.email || client.phone}</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[client.status]}`}>
              {STATUS_LABELS[client.status]}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{client.totalAppointments} visitas</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{formatCurrency(client.totalSpent)}</span>
            </div>
            {client.lastVisit && (
              <span className="text-gray-500">
                {formatRelativeTime(client.lastVisit)}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1">
          <button
            onClick={(e) => handleAction(e, () => onEdit?.(client))}
            className="p-1.5 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
            title="Editar"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
        <div className="flex items-center gap-1">
          {onMessage && (
            <button
              onClick={(e) => handleAction(e, () => onMessage?.(client))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
          )}
        </div>
        <button
          onClick={(e) => handleAction(e, () => onDelete?.(client))}
          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          title="Excluir"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * ClientCardCompact - More compact version for lists
 */
export const ClientCardCompact = ({ 
  client, 
  onClick,
  selected = false 
}) => {
  const getAvatarColor = () => {
    if (client.status === 'active') return 'bg-emerald-500';
    if (client.status === 'inactive') return 'bg-amber-500';
    if (client.status === 'pending') return 'bg-blue-500';
    return 'bg-gray-500';
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/30 transition-all cursor-pointer ${
        selected ? 'bg-amber-500/5' : ''
      }`}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
        {getInitials(client.name)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-white text-sm truncate">{client.name}</p>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${STATUS_COLORS[client.status]}`}>
            {STATUS_LABELS[client.status]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
          <span className="truncate">{client.phone}</span>
          <span>•</span>
          <span>{client.totalAppointments} visitas</span>
        </div>
      </div>

      <span className="text-sm font-medium text-white">
        {formatCurrency(client.totalSpent)}
      </span>
    </div>
  );
};

export default ClientCard;
