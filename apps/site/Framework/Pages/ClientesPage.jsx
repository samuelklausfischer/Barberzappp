/**
 * ClientesPage - Client Management Page
 * 
 * Full CRM feature for managing barbershop clients.
 * 
 * Location: /root/Barberzap SITE/Framework/Pages/ClientesPage.jsx
 * 
 * This component provides:
 * - Client list view with search, filters, and sorting
 * - Client detail modal with profile info, history, and metrics
 * - Add/Edit client form with validation
 * - Bulk actions (export CSV, send WhatsApp)
 * - Client statistics dashboard
 * 
 * @note This is a reference implementation. The actual working version
 * is in Barberzap-Dev/src/pages/DashboardPages.jsx (Clientes component)
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  MessageCircle, 
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { 
  clientService, 
  getInitials, 
  formatCurrency, 
  formatRelativeTime,
  STATUS_COLORS,
  STATUS_LABELS
} from '../Logic/clientLogic';

/**
 * Clientes - Complete CRM Page
 * 
 * @component
 * @description Full-featured client management with:
 * - Search and filtering by status
 * - Grid and list view modes
 * - Client detail modal with history
 * - Add/edit client forms
 * - Bulk actions (export, WhatsApp)
 * - Statistics dashboard
 */
export const ClientesPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClients, setSelectedClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientHistory, setClientHistory] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0
  });

  // View mode: 'grid' or 'list'
  const [viewMode, setViewMode] = useState('grid');

  // Load clients
  useEffect(() => {
    loadClients();
  }, [statusFilter]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientService.getClients({ 
        status: statusFilter,
        search: searchQuery 
      });
      setClients(data);
      
      // Load stats
      const statsData = await clientService.getStats();
      setStats({
        total: statsData.total,
        active: statsData.active,
        inactive: statsData.inactive,
        pending: statsData.pending
      });
    } catch (error) {
      console.error('Error loading clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadClients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleClientClick = async (client) => {
    setSelectedClient(client);
    try {
      const history = await clientService.getClientHistory(client.id);
      setClientHistory(history);
    } catch (error) {
      setClientHistory([]);
    }
    setShowDetailModal(true);
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setShowFormModal(true);
  };

  const handleEditClient = (client) => {
    setSelectedClient(client);
    setShowFormModal(true);
    setShowDetailModal(false);
  };

  const handleSaveClient = async (formData) => {
    try {
      if (selectedClient) {
        await clientService.updateClient(selectedClient.id, formData);
      } else {
        await clientService.createClient(formData);
      }
      setShowFormModal(false);
      loadClients();
    } catch (error) {
      alert(error.message || 'Erro ao salvar cliente');
    }
  };

  const handleDeleteClient = async (client) => {
    setSelectedClient(client);
    setShowDeleteConfirm(true);
    setShowDetailModal(false);
  };

  const confirmDelete = async () => {
    try {
      await clientService.deleteClient(selectedClient.id);
      setShowDeleteConfirm(false);
      loadClients();
    } catch (error) {
      alert(error.message || 'Erro ao excluir cliente');
    }
  };

  const handleArchiveClient = async (client) => {
    try {
      await clientService.archiveClient(client.id);
      setShowDetailModal(false);
      loadClients();
    } catch (error) {
      alert(error.message || 'Erro ao arquivar cliente');
    }
  };

  const handleWhatsAppMessage = async (client) => {
    try {
      const result = await clientService.sendWhatsAppMessage(
        client.id, 
        'Olá! Tudo bem?'
      );
      window.open(result.whatsappLink, '_blank');
    } catch (error) {
      alert(error.message || 'Erro ao enviar mensagem');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = await clientService.exportToCSV(selectedClients);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message || 'Erro ao exportar dados');
    }
  };

  const getFilteredClients = () => {
    let filtered = [...clients];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <Users className="w-8 h-8 text-amber-400" />
              Clientes
            </h1>
            <p className="text-gray-400 mt-1">Gerencie sua base de clientes</p>
          </div>
          <button
            onClick={handleAddClient}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all"
          >
            <Plus className="w-5 h-5" />
            Novo Cliente
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-500/15 text-blue-400', icon: Users },
            { label: 'Ativos', value: stats.active, color: 'bg-emerald-500/15 text-emerald-400', icon: CheckCircle },
            { label: 'Inativos', value: stats.inactive, color: 'bg-amber-500/15 text-amber-400', icon: XCircle },
            { label: 'Pendentes', value: stats.pending, color: 'bg-purple-500/15 text-purple-400', icon: AlertCircle }
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
                <span className={`text-2xl font-bold text-white`}>{stat.value}</span>
              </div>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer min-w-[150px]"
              >
                <option value="all">Todos Status</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
                <option value="pending">Pendentes</option>
                <option value="archived">Arquivados</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 border border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-amber-500 text-slate-900' : 'text-gray-400 hover:bg-slate-700'}`}
                title="Grade"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 transition-all ${viewMode === 'list' ? 'bg-amber-500 text-slate-900' : 'text-gray-400 hover:bg-slate-700'}`}
                title="Lista"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="4" width="18" height="4" rx="1" />
                  <rect x="3" y="10" width="18" height="4" rx="1" />
                  <rect x="3" y="16" width="18" height="4" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedClients.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <span className="text-sm text-gray-400">
                {selectedClients.length} cliente{selectedClients.length > 1 ? 's' : ''} selecionado{selectedClients.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert('Bulk WhatsApp (em desenvolvimento)')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg transition-all text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-lg transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client List - Simplified for Framework Reference */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-700/30 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : getFilteredClients().length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-700/30 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-400 mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Comece cadastrando seu primeiro cliente'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredClients().map(client => {
              const getAvatarColor = () => {
                if (client.status === 'active') return 'bg-emerald-500';
                if (client.status === 'inactive') return 'bg-amber-500';
                if (client.status === 'pending') return 'bg-blue-500';
                return 'bg-gray-500';
              };

              const initials = client.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

              return (
                <div
                  key={client.id}
                  onClick={() => handleClientClick(client)}
                  className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 hover:bg-slate-700/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-full ${getAvatarColor()} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                      {initials}
                    </div>
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
                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                        <span>{client.totalAppointments} visitas</span>
                        <span>{formatCurrency(client.totalSpent)}</span>
                        {client.lastVisit && (
                          <span>{formatRelativeTime(client.lastVisit)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientesPage;
