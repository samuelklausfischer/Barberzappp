import React, { useState, useEffect } from 'react';
import { DashboardContainer } from '../components/dashboard/DashboardContainer';
import { PreviewChat } from '../components/dashboard/PreviewChat';
import * as iaConfig from '../logic/iaConfig';

// COMPONENTES TEMA
const PageHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="mb-8">
    <div className="flex items-center gap-3 mb-2">
      {Icon && <Icon className="w-6 h-6 text-amber-400" />}
      <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
    </div>
    {subtitle && <p className="text-gray-400">{subtitle}</p>}
  </div>
);

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
    <div className="flex items-center gap-3 mb-3">
      {Icon && <Icon className={`w-5 h-5 ${color}`} />}
      <span className="text-sm text-gray-400">{title}</span>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
  </div>
);

// PÁGINAS
// Framework Imports - Using lazy loading to prevent crashes
export const Agenda = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <PageHeader title="Agenda" subtitle="Gerenciamento de agendamentos" />
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <p className="text-gray-400">🚧 Em desenvolvimento - Agenda com Calendar será integrada.</p>
      </div>
    </div>
  </DashboardContainer>
);

export const Financeiro = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <PageHeader title="Financeiro" subtitle="Gestão financeira" />
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <p className="text-gray-400">🚧 Em desenvolvimento - Dashboard Financeiro será integrado.</p>
      </div>
    </div>
  </DashboardContainer>
);

export const Horarios = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <PageHeader title="Horários de Funcionamento" subtitle="Configure os horários da barbearia" />
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 space-y-4">
        {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((dia, i) => (
          <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-900/50 rounded-lg gap-4">
            <span className="font-medium">{dia}</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Abre:</span>
                <input type="time" defaultValue="09:00" className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Fecha:</span>
                <input type="time" defaultValue="18:00" className="bg-slate-700 px-3 py-2 rounded border border-slate-600 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </DashboardContainer>
);

// CLIENTES PAGE - FULL CRM
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
} from '../logic/clientLogic';
import { 
  ClientCard, 
  ClientCardCompact,
  ClientDetailModal, 
  ClientHistoryTable 
} from '../components/crm';
import { ClientForm } from '../components/crm/ClientForm';


/**
 * Clientes - Full CRM Page
 * Complete client management with list, detail, forms, and history
 */
export const Clientes = () => {
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

  const handleToggleFavorite = (client) => {
    // Could implement favorites in a real app
    alert('Funcionalidade de favoritos em desenvolvimento');
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

  const handleBulkWhatsApp = () => {
    if (selectedClients.length === 0) {
      alert('Selecione pelo menos um cliente');
      return;
    }
    alert(`Enviar mensagem para ${selectedClients.length} clientes (em desenvolvimento)`);
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
    <DashboardContainer>
      <div className="p-6 md:p-8">
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
                    onClick={handleBulkWhatsApp}
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

        {/* Client List */}
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
              {!searchQuery && statusFilter === 'all' && (
                <button
                  onClick={handleAddClient}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Cadastrar Cliente
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getFilteredClients().map(client => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onClick={() => handleClientClick(client)}
                  onEdit={handleEditClient}
                  onDelete={handleDeleteClient}
                  onMessage={handleWhatsAppMessage}
                  selected={selectedClients.includes(client.id)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {getFilteredClients().map(client => (
                <ClientCardCompact
                  key={client.id}
                  client={client}
                  onClick={() => handleClientClick(client)}
                  selected={selectedClients.includes(client.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Client Detail Modal */}
      {showDetailModal && selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEditClient}
          onArchive={handleArchiveClient}
          onFavorite={handleToggleFavorite}
          history={clientHistory}
          isFavorite={false}
        />
      )}

      {/* Client Form Modal */}
      <ClientForm
        client={selectedClient}
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveClient}
        loading={false}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Excluir Cliente?</h3>
                <p className="text-sm text-gray-400">
                  Esta ação não pode ser desfeita
                </p>
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-300">
                Você está excluindo <span className="text-white font-semibold">{selectedClient.name}</span>.
                Todo o histórico de agendamentos deste cliente também será perdido.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-lg font-semibold transition-all"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardContainer>
  );
};

export const Servicos = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <PageHeader title="Serviços" subtitle="Catálogo de serviços (15 cadastrados)" />
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {['Corte Masculino', 'Barba', 'Corte + Barba', 'Hidratação', 'Pigmentação Sobrancelha', 'Corte Criança'].map((servico, i) => (
            <div key={i} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-amber-500 transition">
              <h3 className="font-medium mb-2">{servico}</h3>
              <p className="text-sm text-gray-400">Complete com preços e descrições...</p>
            </div>
          ))}
        </div>
        <button className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:opacity-90">
          + Novo Serviço
        </button>
      </div>
    </div>
  </DashboardContainer>
);

export const Funcionarios = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <PageHeader title="Funcionários" subtitle="Equipe da barbearia (12 membros)" />
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <span className="text-gray-400">Complete com cards de funcionários...</span>
      </div>
    </div>
  </DashboardContainer>
);

// Financeiro imported from Framework above

// WhatsApp Page - Placeholder (was completed by previous agent, import temporarily disabled due to Framework path issues)
// export { WhatsAppPage as WhatsApp } from '../../../Framework/Pages';

export const WhatsApp = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <h2 className="text-2xl font-bold text-white mb-4">Integração WhatsApp</h2>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <p className="text-gray-400">Configuração de WhatsApp foi implementada pelo Agente 5. Import temporariamente desativado.</p>
      </div>
    </div>
  </DashboardContainer>
);

// IA Config - Complete inline implementation
export const IAConfig = () => {
  const [config, setConfig] = useState(iaConfig.DEFAULT_IA_CONFIG);
  const [activeTab, setActiveTab] = useState('identity');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    setConfig(iaConfig.getIAConfig());
  }, []);

  const handleSave = () => {
    const validation = iaConfig.validateIAConfig(config);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }
    
    setValidationErrors([]);
    iaConfig.saveIAConfig(config);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    const reset = iaConfig.resetIAConfig();
    setConfig(reset);
    setShowResetConfirm(false);
    setValidationErrors([]);
  };

  const handleFieldChange = (section, field, value) => {
    setConfig(prev => {
      if (section) {
        return { ...prev, [section]: { ...prev[section], [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleSpecialistToggle = (agentKey) => {
    const updated = iaConfig.toggleSpecialistAgent(agentKey, config);
    setConfig(updated);
  };

  const tabs = [
    { id: 'identity', label: 'Identidade', icon: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
    { id: 'tone', label: 'Voz & Tom', icon: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg> },
    { id: 'model', label: 'Modelo', icon: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" /></svg> },
    { id: 'specialists', label: 'Especialistas', icon: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg> },
    { id: 'knowledge', label: 'Conhecimento', icon: () => <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> },
  ];

  return (
    <DashboardContainer>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" /></svg>
              Configuração da IA
            </h1>
            <p className="text-gray-400 mt-1">Personalize sua secretária virtual {config.secretaryName}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2.5 border border-slate-600 text-gray-400 hover:text-white rounded-lg font-medium transition-all hover:border-slate-500">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" /><path d="M3 3v9h9" /></svg>
              Resetar
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-lg font-semibold transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
              Salvar
            </button>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl p-4 flex items-start gap-4">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
            <div>
              <p className="font-semibold text-white">Erros de Validação</p>
              <ul className="mt-1 list-disc list-inside text-sm text-gray-300">{validationErrors.map((error, i) => <li key={i}>{error}</li>)}</ul>
            </div>
          </div>
        )}

        {showSuccess && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-4">
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            <div>
              <p className="font-semibold text-white">Configuração Salva!</p>
              <p className="text-sm text-gray-300">As alterações foram aplicadas com sucesso.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-2">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-amber-500 text-slate-900' : 'text-gray-400 hover:text-white hover:bg-slate-700/50'}`}>
                    <tab.icon /><span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              {activeTab === 'identity' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nome da Secretária</label>
                    <input value={config.secretaryName} onChange={(e) => handleFieldChange(null, 'secretaryName', e.target.value)} placeholder="Ex: Ana, Maria..." className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Mensagem de Boas-vindas</label>
                    <textarea value={config.welcomeMessage} onChange={(e) => handleFieldChange(null, 'welcomeMessage', e.target.value)} rows={3} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none" placeholder="Ex: Olá! Bem-vindo à nossa barbearia." />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Horário de Funcionamento</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs text-gray-500 mb-1">Abertura</label><input type="time" value={config.businessHours.open} onChange={(e) => handleFieldChange('businessHours', 'open', e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Fechamento</label><input type="time" value={config.businessHours.close} onChange={(e) => handleFieldChange('businessHours', 'close', e.target.value)} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Localização</h3>
                    <div className="space-y-3">
                      <div><label className="block text-xs text-gray-500 mb-1">Endereço</label><input value={config.businessLocation.address} onChange={(e) => handleFieldChange('businessLocation', 'address', e.target.value)} placeholder="Rua, número..." className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs text-gray-500 mb-1">Cidade</label><input value={config.businessLocation.city} onChange={(e) => handleFieldChange('businessLocation', 'city', e.target.value)} placeholder="Ex: São Paulo" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                        <div><label className="block text-xs text-gray-500 mb-1">Estado</label><input value={config.businessLocation.state} onChange={(e) => handleFieldChange('businessLocation', 'state', e.target.value)} placeholder="Ex: SP" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                      </div>
                      <div><label className="block text-xs text-gray-500 mb-1">Telefone</label><input value={config.businessLocation.phone} onChange={(e) => handleFieldChange('businessLocation', 'phone', e.target.value)} placeholder="(11) 99999-9999" className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white" /></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tone' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Tom de Voz</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {iaConfig.TONE_OPTIONS.map((tone) => (
                        <button key={tone.value} onClick={() => handleFieldChange(null, 'tone', tone.value)} className={`p-4 rounded-xl border-2 transition-all text-center ${config.tone === tone.value ? 'border-amber-500 bg-amber-500/15 text-amber-400' : 'border-slate-700 bg-slate-700/30 text-gray-400 hover:border-slate-600 hover:text-white'}`}>
                          <p className="font-medium">{tone.label}</p>
                          <p className="text-xs mt-1">{tone.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Texto de Fallback</label>
                    <textarea value={config.fallbackText} onChange={(e) => handleFieldChange(null, 'fallbackText', e.target.value)} rows={2} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white resize-none text-sm" placeholder="O que dizer quando não entender a mensagem..." />
                  </div>
                </div>
              )}

              {activeTab === 'model' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">Modelo de IA</label>
                    <div className="space-y-2">
                      {iaConfig.MODEL_OPTIONS.map((model) => (
                        <button key={model.value} onClick={() => handleFieldChange(null, 'model', model.value)} className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${config.model === model.value ? 'border-amber-500 bg-amber-500/15' : 'border-slate-700 bg-slate-700/30 hover:border-slate-600'}`}>
                          <div>
                            <p className={`font-medium ${config.model === model.value ? 'text-amber-400' : 'text-white'}`}>{model.label}</p>
                            <p className="text-xs text-gray-400 mt-1">{model.description}</p>
                          </div>
                          {config.model === model.value && <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20 6 9 17 4 12" /></svg>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Criatividade: {config.temperature}</label>
                    <input type="range" min="0" max="1" step="0.1" value={config.temperature} onChange={(e) => handleFieldChange(null, 'temperature', parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                    <p className="text-xs text-gray-500 mt-1">0 = Mais preciso, 1 = Mais criativo</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Máximo de Tokens</label>
                    <input type="number" value={config.maxTokens} onChange={(e) => handleFieldChange(null, 'maxTokens', parseInt(e.target.value))} min={100} max={4000} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Prompt do Sistema (Avançado)</label>
                    <textarea value={config.systemPrompt} onChange={(e) => handleFieldChange(null, 'systemPrompt', e.target.value)} rows={10} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white resize-none font-mono text-xs" placeholder="Instruções avançadas para a IA..." />
                  </div>
                </div>
              )}

              {activeTab === 'specialists' && (
                <div className="space-y-4">
                  {Object.entries(config.specialistAgents).map(([key, agent]) => (
                    <div key={key} className="bg-slate-700/30 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{agent.icon}</span>
                          <div><h4 className="font-medium text-white">{agent.label}</h4><p className="text-sm text-gray-400 mt-1">{agent.description}</p></div>
                        </div>
                        <label className="relative inline-flex items-center justify-center p-1 rounded-full cursor-pointer">
                          <input type="checkbox" checked={agent.enabled} onChange={() => handleSpecialistToggle(key)} className="sr-only" />
                          <div className={`w-11 h-6 rounded-full transition-all ${agent.enabled ? 'bg-amber-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-0.5 transition-all ${agent.enabled ? 'translate-x-5' : 'translate-x-0.5'} w-5 h-5 bg-white rounded-full`} />
                          </div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">FAQ Personalizado</label>
                  <textarea value={config.knowledgeBase.faqCustom || ''} onChange={(e) => handleFieldChange('knowledgeBase', 'faqCustom', e.target.value)} rows={8} className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white resize-none text-sm" placeholder="Pergunta: Resposta..." />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>
                Estatísticas
              </h3>
              <div className="space-y-3">
                <div className="p-4 bg-slate-700/30 rounded-xl"><p className="text-gray-400 text-sm">Mensagens</p><p className="text-3xl font-bold text-white">{config.analytics?.messagesHandled || 1250}</p></div>
                <div className="p-4 bg-slate-700/30 rounded-xl"><p className="text-gray-400 text-sm">Taxa de Sucesso</p><p className="text-3xl font-bold text-white">{config.analytics?.successRate || 94.5}%</p></div>
                <div className="p-4 bg-slate-700/30 rounded-xl"><p className="text-gray-400 text-sm">Transferências</p><p className="text-3xl font-bold text-white">{config.analytics?.escalatesToHuman || 69}</p></div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="21" y1="15" x2="3" y2="15" /><line x1="21" y1="8" x2="3" y2="8" /></svg>
                Preview ao Vivo
              </h3>
              <PreviewChat config={config} showSystemPrompt={true} />
            </div>
          </div>
        </div>

        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74-2.74L3 12" /><path d="M3 3v9h9" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Resetar Configuração?</h3>
                  <p className="text-sm text-gray-400">Isso restaurará todas as configurações aos valores padrão</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setShowResetConfirm(false)} className="px-6 py-2.5 border border-slate-600 text-gray-400 hover:text-white rounded-lg font-medium">Cancelar</button>
                <button onClick={confirmReset} className="px-6 py-2.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg font-semibold">Sim, Resetar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
};

export const Aparencia = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <PageHeader title="Aparência" subtitle="Personalize o visual da barbearia" />
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 space-y-6">
        <div>
          <p className="font-medium mb-2">Nome da Barbearia</p>
          <input type="text" defaultValue="BarberZap Demo" className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white" />
        </div>
        <div>
          <p className="font-medium mb-2">Cor Primária</p>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-500 cursor-pointer border-2 border-white" />
            <div className="w-10 h-10 rounded-full bg-blue-500 cursor-pointer" />
            <div className="w-10 h-10 rounded-full bg-green-500 cursor-pointer" />
            <div className="w-10 h-10 rounded-full bg-purple-500 cursor-pointer" />
          </div>
        </div>
        <span className="text-gray-400">Complete com logo e redes sociais...</span>
      </div>
    </div>
  </DashboardContainer>
);

export const Settings = () => (
  <DashboardContainer>
    <div className="p-6 md:p-8">
      <PageHeader title="Configurações" subtitle="Plano Premium e notificações" />
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg mb-6">
          <div>
            <p className="font-medium">Plano Atual</p>
            <p className="text-sm text-gray-400">Premium Mensal</p>
          </div>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm">R$ 49,90/mês</span>
        </div>
        <span className="text-gray-400">Complete com notificações e configurações...</span>
      </div>
    </div>
  </DashboardContainer>
);
