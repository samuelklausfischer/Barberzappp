/**
 * Exemplo de como integrar o componente NotificationPreferences
 * em um aplicativo React existente
 */

import React, { useState } from 'react';
import NotificationPreferences, { NotificationPreferencesProps } from './components/NotificationPreferences';

// Exemplo 1: Exemplo básico com dados hardcoded
const BasicExample: React.FC = () => {
  const shopId = 'shop-uuid-aqui';
  const clientId = 'client-uuid-aqui';

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Configurações</h1>
      <NotificationPreferences 
        shopId={shopId}
        clientId={clientId}
      />
    </div>
  );
};

// Exemplo 2: Integrado com sistema de rotas (react-router)
import { useParams } from 'react-router-dom';

import { useAuth } from './hooks/useAuth'; // Assumindo que existe

const ClientSettingsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { user } = useAuth();
  
  if (!user?.shopId || !clientId) {
    return <div>Shop ou client não encontrado</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              Preferências de Notificação
            </h1>
            <p className="text-blue-100 mt-1">
              Configure como receber suas atualizações
            </p>
          </div>
          
          <NotificationPreferences 
            shopId={user.shopId}
            clientId={clientId}
          />
        </div>
      </div>
    </div>
  );
};

// Exemplo 3: Com tabs de configuração
const SettingsTabs: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'billing'>('notifications');

  if (!user?.shopId || !user?.clientId) {
    return <div>Usuário não autenticado</div>;
  }

  const tabs = [
    { id: 'profile' as const, label: 'Perfil', icon: '👤' },
    { id: 'notifications' as const, label: 'Notificações', icon: '🔔' },
    { id: 'security' as const, label: 'Segurança', icon: '🔐' },
    { id: 'billing' as const, label: 'Pagamento', icon: '💳' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Tabs Header */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs Content */}
          <div className="p-6">
            {activeTab === 'notifications' && (
              <NotificationPreferences 
                shopId={user.shopId}
                clientId={user.clientId}
              />
            )}
            
            {activeTab === 'profile' && (
              <div>
                <h3>Perfil</h3>
                {/* Conteúdo de perfil */}
              </div>
            )}
            
            {/* Outras tabs... */}
          </div>
        </div>
      </div>
    </div>
  );
};

// Exemplo 4: Com modal/dialog
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog';

const NotificationSettingsModal: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user?.shopId || !user?.clientId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <span>🔔</span>
          <span>Configurar Notificações</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Preferências de Notificação</DialogTitle>
        </DialogHeader>
        
        <NotificationPreferences 
          shopId={user.shopId}
          clientId={user.clientId}
        />
      </DialogContent>
    </Dialog>
  );
};

// Exemplo 5: Com loading states e errors
const NotificationSettingsWithStates: React.FC = () => {
  const { user, loading: authLoading, error: authError } = useAuth();
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (authError || !user) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              Erro ao carregar informações do usuário. Por favor, faça login novamente.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!user.shopId || !user.clientId) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-2xl">📝</span>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Complete seu cadastro para configurar notificações.
            </p>
            <button className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">
              Completar Cadastro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <NotificationPreferences 
          shopId={user.shopId}
          clientId={user.clientId}
        />
      </div>
    </div>
  );
};

// Exemplo 6: Integrado com dashboard existente
import { useDashboardContext } from './contexts/DashboardContext';

const DashboardWithNotifications: React.FC = () => {
  const { currentShop, currentClient } = useDashboardContext();

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <h1>Dashboard</h1>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="dashboard-nav">
              <a href="#" className="active">Agendamentos</a>
              <a href="#">Perfil</a>
              <a href="#">Histórico</a>
              <a href="#">Configurações</a>
            </nav>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Próximo Agendamento</span>
                <span className="stat-value">Amanhã, 14:00</span>
              </div>
              {/* Mais stat cards... */}
            </div>

            {/* Notification Preferences Section */}
            <section className="section-card">
              <div className="section-header">
                <h2 className="section-title">Preferências de Notificação</h2>
                <p className="section-description">
                  Configure como e quando receber notificações
                </p>
              </div>
              
              {currentShop && currentClient && (
                <NotificationPreferences 
                  shopId={currentShop.id}
                  clientId={currentClient.id}
                />
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2024 BarberZap</p>
      </footer>
    </div>
  );
};

// Exemplo 7: Para administradores verem preferências de um cliente
import { useAdminAuth } from './hooks/useAdminAuth';

const AdminClientNotificationView: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { adminShop } = useAdminAuth();

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Gerenciar Cliente</h1>
        <a href="/admin" className="back-link">← Voltar</a>
      </div>

      <div className="admin-content">
        <div className="client-header">
          <h2>Preferências de Notificação do Cliente</h2>
          <p className="text-gray-500">
            Visualize e gerencie as configurações de notificação
          </p>
        </div>

        {adminShop && (
          <NotificationPreferences 
            shopId={adminShop.id}
            clientId={clientId}
          />
        )}
      </div>
    </div>
  );
};

// Exportar exemplos para uso
export {
  BasicExample,
  ClientSettingsPage,
  SettingsTabs,
  NotificationSettingsModal,
  NotificationSettingsWithStates,
  DashboardWithNotifications,
  AdminClientNotificationView,
};

// Exportar como default o exemplo mais comum
export default ClientSettingsPage;
