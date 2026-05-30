import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar, useSidebarState } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileBottomNav, MobileNavMoreSheet } from './MobileBottomNav';

/**
 * AdminShell Component
 * 
 * Main app shell for the BarberZap Admin Panel.
 * Wraps all admin pages with consistent layout:
 * - Responsive sidebar navigation
 * - Fixed top bar with search and user menu
 * - Mobile bottom navigation
 * - Scrollable content area
 * 
 * @example
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/admin/*" element={<AdminShell />} />
 *     </Routes>
 *   );
 * }
 */
export function AdminShell({ children }) {
  const location = useLocation();
  const {
    isMobileOpen,
    setMobileOpen,
    isCollapsed,
    setCollapsed,
    isTabletMode
  } = useSidebarState();

  const [isMoreSheetOpen, setMoreSheetOpen] = React.useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  // Handle logout
  const handleLogout = () => {
    console.log('Logging out...');
    // Implement actual logout logic
    // localStorage.removeItem('auth_token');
    // navigate('/login');
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle sidebar on Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (isTabletMode) {
          setCollapsed(!isCollapsed);
        } else {
          setMobileOpen(!isMobileOpen);
        }
      }

      // Open search on Ctrl/Cmd + K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        console.log('Open search');
        // Implement search modal
      }

      // Close mobile sidebar on Escape
      if (e.key === 'Escape' && isMobileOpen) {
        setMobileOpen(false);
      }

      // Close more sheet on Escape
      if (e.key === 'Escape' && isMoreSheetOpen) {
        setMoreSheetOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isMobileOpen,
    setMobileOpen,
    isMoreSheetOpen,
    isCollapsed,
    setCollapsed,
    isTabletMode
  ]);

  // Determine if we should show the main content with sidebar offset
  const hasSidebarOffset = !isTabletMode || (isTabletMode && !isCollapsed);

  return (
    <div className="min-h-screen bg-slate-900 overflow-x-hidden">
      
      {/* ==================== TOP BAR ==================== */}
      <TopBar
        onMenuClick={() => setMobileOpen(!isMobileOpen)}
        isMobileMenuOpen={isMobileOpen}
      />

      {/* ==================== SIDEBARS ==================== */}
      {/* Mobile Sidebar (Drawer) */}
      <Sidebar
        isMobileOpen={isMobileOpen}
        isTabletMode={false}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      {/* Tablet & Desktop Sidebar */}
      <Sidebar
        isMobileOpen={false}
        isTabletMode={true}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setCollapsed(!isCollapsed)}
        onLogout={handleLogout}
      />

      {/* ==================== MAIN CONTENT ==================== */}
      <main
        className={`
          transition-all duration-300 ease-in-out
          ${hasSidebarOffset ? 'lg:ml-[260px]' : ''}
          ${isTabletMode && !isCollapsed ? 'md:ml-[260px]' : ''}
          ${isTabletMode && isCollapsed ? 'md:ml-16' : ''}
        `}
      >
        {/* Scroll Wrapper */}
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950">
          
          {/* Page Content */}
          <div className="pt-16">
            <Outlet />
            {children}
          </div>

        </div>
      </main>

      {/* ==================== MOBILE BOTTOM NAV ==================== */}
      <MobileBottomNav onMenuClick={() => setMoreSheetOpen(true)} />

      {/* ==================== MOBILE MORE SHEET ==================== */}
      <MobileNavMoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setMoreSheetOpen(false)}
      />

      {/* ==================== MODALS & OVERLAYS ==================== */}
      {/* Global search modal would go here */}
      {/* Notification panel would go here */}

    </div>
  );
}

/**
 * AdminShellWithContent Component
 * 
 * Convenience wrapper that includes both the shell and inline content
 * Useful when you want to render content directly without using routes
 */
export function AdminShellWithContent({ children, title, subtitle }) {
  return (
    <AdminShell>
      {children}
    </AdminShell>
  );
}

/**
 * useAdminShell Hook
 * 
 * Provides access to shell state and controls
 */
export function useAdminShell() {
  // This would be implemented as a Context in the full version
  return {
    toggleSidebar: () => console.log('Toggle sidebar'),
    openSearch: () => console.log('Open search'),
    openNotifications: () => console.log('Open notifications')
  };
}

export default AdminShell;

/**
 * ========== LAYOUT GUIDE ==========
 * 
 * The AdminShell follows a strict layout structure:
 * 
 * ┌─────────────────────────────────────────────────┐
 * │  TOP BAR (fixed, z-40, h-16)                    │
 * ├──────────┬──────────────────────────────────────┤
 * │          │                                      │
 * │          │   PAGE CONTENT                       │
 * │  SIDEBAR │   ┌───────────────────────┐         │
 * │ (fixed)  │   │ Page Header           │         │
 * │ z-30     │   ├───────────────────────┤         │
 * │          │   │ Dynamic Content       │         │
 * │  - Admin │   │ (Routed Components)   │         │
 * │  - Agenda│   │                       │         │
 * │  - Horá..│   │                       │         │
 * │  - Clie..│   │                       │         │
 * │  - Servi.│   └───────────────────────┘         │
 * │  - Funci.│                                      │
 * │  - Finan.│                                      │
 * │  - What..│                                      │
 * │  - IA Co.│                                      │
 * │  - Apare.│                                      │
 * │  - Conf..│                                      │
 * │          │                                      │
 * │          │                                      │
 * ├──────────┴──────────────────────────────────────┤
 * │  MOBILE BOTTOM NAV (fixed, z-50, h-16)         │
 * │  [Dashboard] [Agenda] [WhatsApp] [Mais]        │
 * └─────────────────────────────────────────────────┘
 * 
 * =========== RESPONSIVE BEHAVIOR ===========
 * 
 * MOBILE (<640px):
 * - Sidebar: Hidden, shows as drawer when hamburger clicked
 * - BottomNav: Always visible with 4 main items
 * - Content: Full width, no left margin
 * 
 * TABLET (640px - 1023px):
 * - Sidebar: Collapsible (default collapsed), 240px when expanded, 64px when collapsed
 * - BottomNav: Hidden
 * - Content: Adjusted margin based on sidebar state
 * 
 * DESKTOP (≥1024px):
 * - Sidebar: Fixed, expanded by default, 260px width
 * - BottomNav: Hidden
 * - Content: Margin-left of 260px
 * 
 * =========== KEYBOARD SHORTCUTS ===========
 * 
 * Ctrl/Cmd + B: Toggle sidebar
 * Ctrl/Cmd + K: Open global search
 * Escape: Close modals, drawers, and overlays
 * 
 * =========== USAGE EXAMPLE ===========
 * 
 * Basic route setup:
 * ```
 * import { Routes, Route } from 'react-router-dom';
 * import { AdminShell } from './components/Layout/AdminShell';
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/admin" element={<AdminShell />}>
 *         <Route index element={<DashboardPage />} />
 *         <Route path="agenda" element={<AgendaPage />} />
 *         <Route path="clientes" element={<ClientesPage />} />
 *         {/* ... more routes */
 *       </Route>
 *     </Routes>
 *   );
 * }
 * ```
 * 
 * Page component example:
 * ```
 * import { MainContent } from './Layout/MainContent';
 * 
 * export function AgendaPage() {
 *   return (
 *     <MainContent
 *       title="Agenda"
 *       subtitle="Gerencie seus agendamentos"
 *       actions={
 *         <button className="primary-button">
 *           Novo Agendamento
 *         </button>
 *       }
 *     >
 *       {/* Your page content goes here * /}
 *     </MainContent>
 *   );
 * }
 * ```
 */
