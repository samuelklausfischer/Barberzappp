/**
 * Exemplo de uso do Mobile Menu Responsivo
 *
 * Este arquivo demonstra como integrar o menu mobile
 * em um componente React de exemplo.
 */

import React from 'react';
import { AppView } from '@/domain/types';
import { useMobileMenuStore } from '@/stores/mobileMenuStore';

/**
 * Exemplo 1: Uso Básico
 */
const ExampleBasic: React.FC = () => {
  const { isOpen, open, close, toggle } = useMobileMenuStore();

  return (
    <div>
      <button onClick={open}>Abrir Menu</button>
      <button onClick={close}>Fechar Menu</button>
      <button onClick={toggle}>Alternar Menu</button>
      <p>Menu está {isOpen ? 'aberto' : 'fechado'}</p>
    </div>
  );
};

/**
 * Exemplo 2: Drawer Personalizado
 */
import Drawer from '@/components/layout/Drawer';
import Backdrop from '@/components/layout/Backdrop';

const ExampleCustomDrawer: React.FC = () => {
  const { isOpen, close } = useMobileMenuStore();

  return (
    <>
      <Drawer isOpen={isOpen} onClose={close} position="right" width="20rem">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Drawer Personalizado</h2>
          <p>Este é um drawer customizado à direita.</p>
        </div>
      </Drawer>
      <Backdrop isOpen={isOpen} onClose={close} />
    </>
  );
};

/**
 * Exemplo 3: Header Completo
 */
import Header from '@/components/layout/Header';

const ExampleHeader: React.FC = () => {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <Header
      shopName="Minha Barbearia"
      userName="João Silva"
      userRole="Gerente"
      avatarUrl="https://picsum.photos/id/64/100/100"
      hasNotifications={true}
      theme={theme}
      onThemeToggle={handleThemeToggle}
    />
  );
};

/**
 * Exemplo 4: MobileMenu Completo
 */
import MobileMenu from '@/components/layout/MobileMenu';

const ExampleMobileMenu: React.FC = () => {
  const [view, setView] = React.useState<AppView>('dashboard');

  const handleViewChange = (newView: AppView) => {
    setView(newView);
  };

  const handleLogout = () => {
    console.log('Logout realizado');
  };

  return (
    <MobileMenu
      currentView={view}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
    />
  );
};

/**
 * Exemplo 5: Integração Completa (App-like)
 */
const ExampleFullIntegration: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(true);
  const [view, setView] = React.useState<AppView>('dashboard');

  const handleLogin = () => {
    setIsAuthenticated(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <button
          onClick={handleLogin}
          className="px-6 py-3 bg-[#f4c025] text-black font-bold rounded-xl"
        >
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b]">
      {/* Sidebar Desktop - Oculto em mobile */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-950 border-r border-white/5">
        {/* Conteúdo da Sidebar */}
      </aside>

      {/* Mobile Menu - Só aparece em mobile */}
      <MobileMenu
        currentView={view}
        onViewChange={setView}
        onLogout={handleLogout}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <Header
          shopName="Barbearia do Zé"
          userName="Zé da Silva"
          userRole="Proprietário"
          hasNotifications={true}
        />

        <div className="p-8">
          <h1 className="text-2xl font-bold mb-6">Página: {view}</h1>
          {/* Conteúdo da página aqui */}
        </div>
      </main>
    </div>
  );
};

export {
  ExampleBasic,
  ExampleCustomDrawer,
  ExampleHeader,
  ExampleMobileMenu,
  ExampleFullIntegration,
};
