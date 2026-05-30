import React, { useState } from 'react';
import { X, MapPin, Phone, Mail, Calendar, DollarSign, Edit2, Archive, Star } from 'lucide-react';
import { 
  formatDate, 
  formatCurrency, 
  formatRelativeTime, 
  STATUS_COLORS, 
  STATUS_LABELS 
} from '../../logic/clientLogic';
import { ClientHistoryTable } from './ClientHistoryTable';

/**
 * ClientDetailModal Component
 * 
 * Full client profile with information, history, and metrics.
 * 
 * @param {Object} props
 * @param {Object} props.client - Client data
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onArchive - Archive handler
 * @param {Function} props.onFavorite - Favorite handler
 * @param {Array} props.history - Client appointment history
 * @param {boolean} props.isFavorite - Favorite state
 */
export const ClientDetailModal = ({ 
  client, 
  isOpen, 
  onClose, 
  onEdit,
  onArchive,
  onFavorite,
  history = [],
  isFavorite = false
}) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!isOpen || !client) return null;

  const tabs = [
    { id: 'info', label: 'Perfil', icon: null },
    { id: 'history', label: 'Histórico', icon: Calendar },
    { id: 'notes', label: 'Notas', icon: null }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-detail-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-4">
            <div 
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                client.status === 'active' ? 'bg-emerald-500' :
                client.status === 'inactive' ? 'bg-amber-500' :
                client.status === 'pending' ? 'bg-blue-500' : 'bg-gray-500'
              }`}
            >
              {client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <h2 id="client-detail-title" className="text-xl font-bold text-white flex items-center gap-2">
                {client.name}
                {isFavorite && (
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                )}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[client.status]}`}>
                  {STATUS_LABELS[client.status]}
                </span>
                <span className="text-sm text-gray-400">
                  Cliente há {formatRelativeTime(client.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onFavorite?.(client)}
              className={`p-2 rounded-lg transition-all ${
                isFavorite 
                  ? 'text-amber-400 bg-amber-500/15' 
                  : 'text-gray-400 hover:text-amber-400 hover:bg-amber-500/10'
              }`}
              title="Favoritar"
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => onEdit?.(client)}
              className="p-2 text-gray-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
              title="Editar"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onArchive?.(client)}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
              title="Arquivar"
            >
              <Archive className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-140px)]">
          {/* Tabs */}
          <div className="flex border-b border-slate-700/50 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-amber-400 border-amber-400'
                    : 'text-gray-400 border-transparent hover:text-white hover:border-slate-600'
                }`}
              >
                {tab.icon && <tab.icon className="w-4 h-4" />}
                {tab.label}
                {tab.id === 'history' && (
                  <span className="ml-1 px-2 py-0.5 bg-slate-700 rounded-full text-xs">
                    {history.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Contact Info */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Informações de Contato
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {client.email && (
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-gray-400">E-mail</p>
                            <p className="text-sm text-white truncate">{client.email}</p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400">Telefone</p>
                          <p className="text-sm text-white">{client.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {client.address && (client.address.street || client.address.city) && (
                    <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Endereço
                      </h3>
                      <div className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          {client.address.street && (
                            <p className="text-white">
                              {client.address.street}
                              {client.address.number && `, ${client.address.number}`}
                            </p>
                          )}
                          {(client.address.neighborhood || client.address.cep) && (
                            <p className="text-sm text-gray-400 mt-0.5">
                              {client.address.neighborhood && `${client.address.neighborhood}`}
                              {client.address.neighborhood && client.address.cep && ' • '}
                              {client.address.cep}
                            </p>
                          )}
                          {(client.address.city || client.address.state) && (
                            <p className="text-sm text-gray-400">
                              {client.address.city}{client.address.city && client.address.state && ' - '}{client.address.state}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {client.notes && (
                    <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Notas
                      </h3>
                      <p className="text-gray-300 leading-relaxed">{client.notes}</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Métricas
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{client.totalAppointments}</p>
                          <p className="text-xs text-gray-400">Total de Visitas</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{formatCurrency(client.totalSpent)}</p>
                          <p className="text-xs text-gray-400">Total Gasto</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-white">{formatCurrency(client.averageVisitValue)}</p>
                          <p className="text-xs text-gray-400">Ticket Médio</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {client.birthdate && (
                    <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Data de Nascimento
                      </h3>
                      <p className="text-white font-medium">{formatDate(client.birthdate)}</p>
                    </div>
                  )}

                  {client.lastVisit && (
                    <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-700/50">
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Última Visita
                      </h3>
                      <p className="text-white font-medium">{formatDate(client.lastVisit)}</p>
                      <p className="text-sm text-gray-400 mt-1">{formatRelativeTime(client.lastVisit)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <ClientHistoryTable
                history={history}
                loading={false}
              />
            )}

            {activeTab === 'notes' && (
              <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                <h3 className="text-lg font-semibold text-white mb-4">Notas e Observações</h3>
                {client.notes ? (
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{client.notes}</p>
                ) : (
                  <p className="text-gray-500 italic">Nenhuma nota registrada para este cliente.</p>
                )}
                <button
                  onClick={() => onEdit?.(client)}
                  className="mt-4 px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-medium hover:bg-amber-400 transition-all"
                >
                  Adicionar Nota
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700/50 bg-slate-900/30">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
            >
              Fechar
            </button>
            <button
              onClick={() => onEdit?.(client)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all"
            >
              Editar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
