
import React from 'react';
import { AppView } from '@/domain/types';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileMenu from '@/components/layout/MobileMenu';
import Dashboard from '@/components/dashboard/Dashboard';
import Finance from '@/components/finance/Finance';
import AIConfig from '@/components/aiconfig/AIConfig';
import WhatsAppConnect from '@/components/whatsapp/WhatsAppConnect';
import ServicesList from '@/components/services/ServicesList';
import Agenda from '@/components/agenda/Agenda';
import Login from '@/components/auth/Login';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { useServices } from '@/features/services/hooks/useServices';
import { useMobileMenuStore } from '@/stores/mobileMenuStore';

const App: React.FC = () => {
  const { isAuthenticated, login, logout } = useAuth();
  const [view, setView] = React.useState<AppView>('dashboard');
  const { appointments } = useAppointments();
  const { services } = useServices();
  const { isOpen, close } = useMobileMenuStore();

  if (!isAuthenticated) {
    return <Login onLogin={() => { login(); setView('dashboard'); }} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Background with gradient and pattern overlay */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, #09090b 0%, #18181b 50%, #000000 100%)`,
        }}
      >
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Sidebar Desktop - Oculta em mobile */}
      <Sidebar currentView={view} onViewChange={setView} onLogout={logout} />

      {/* Mobile Menu - Só aparece em mobile */}
      <MobileMenu currentView={view} onViewChange={setView} onLogout={logout} />

      <main className="flex-1 overflow-y-auto scrollbar-hide relative">
        <Header
          shopName="Barbearia do Zé"
          userName="Zé da Silva"
          userRole="Proprietário"
          hasNotifications={true}
        />

        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
          {view === 'dashboard' && <Dashboard appointments={appointments} onNavigate={setView} />}
          {view === 'agenda' && <Agenda appointments={appointments} />}
          {view === 'finance' && <Finance />}
          {view === 'whatsapp' && <WhatsAppConnect />}
          {view === 'services' && <ServicesList services={services} />}
          {view === 'aiconfig' && <AIConfig />}
          {view === 'settings' && <div className="p-20 text-center text-zinc-500">Configurações Gerais em breve...</div>}
        </div>
      </main>
    </div>
  );
};

export default App;
