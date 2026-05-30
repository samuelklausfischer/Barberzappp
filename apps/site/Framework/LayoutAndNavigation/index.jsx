/**
 * BarberZap Admin Panel - Layout & Navigation Components
 * 
 * This module exports all layout and navigation components
 * for the admin panel application.
 * 
 * @example
 * import { AdminShell, MainContent } from './LayoutAndNavigation';
 */

// Main Shell
export { AdminShell, AdminShellWithContent, useAdminShell } from './AdminShell';
export { default as AdminShell } from './AdminShell';

// Navigation Components
export { Sidebar, useSidebarState } from './Sidebar';
export { TopBar, UserAvatar } from './TopBar';
export { MobileBottomNav, MobileNavMoreSheet, NavItem } from './MobileBottomNav';

// Content Layout Components
export { 
  MainContent, 
  PageSection, 
  PageCard, 
  PageGrid, 
  PageTransition, 
  LoadingState, 
  EmptyState 
} from './MainContent';
export { default as MainContent } from './MainContent';

// Configuration
export { ADMIN_ROUTES, BOTTOM_NAV_ROUTES, getRouteByPath, getBreadcrumbs } from './ROUTES_CONFIG';

/**
 * ========== QUICK START ==========
 * 
 * 1. Wrap your admin routes with AdminShell:
 * 
 *    <Route path="/admin" element={<AdminShell />}>
 *      <Route index element={<Dashboard />} />
 *      <Route path="agenda" element={<Agenda />} />
 *      {/* ... more routes */}
 *    </Route>
 * 
 * 2. In each page component, use MainContent:
 * 
 *    export function Dashboard() {
 *      return (
 *        <MainContent title="Dashboard" subtitle="Overview">
 *          {/* Your content * /}
 *        </MainContent>
 *      );
 *    }
 * 
 * 3. Use helper components for layout:
 * 
 *    <PageGrid cols={4}>
 *      <PageCard>Your metric here</PageCard>
 *      <PageCard>Another metric</PageCard>
 *    </PageGrid>
 * 
 * 
 * ========== COMPONENT HIERARCHY ==========
 * 
 * AdminShell (root)
 * ├── TopBar (fixed header)
 * ├── Sidebar (fixed navigation)
 * │   ├── Mobile (drawer)
 * │   ├── Tablet (collapsible)
 * │   └── Desktop (fixed)
 * └── MainContent
 *     ├── PageHeader
 *     ├── Breadcrumbs
 *     ├── PageGrid
 *     │   └── PageCard[]
 *     └── PageSection
 * 
 * MobileBottomNav (fixed bottom nav, mobile only)
 * MobileNavMoreSheet (slide-up sheet)
 * 
 * 
 * ========== DESIGN TOKENS REFERENCE ==========
 * 
 * The layout components use these Design System tokens:
 * 
 * Backgrounds:
 * - --bg-primary: #0F172A (slate-900)
 * - --bg-secondary: #1E293B (slate-800)
 * - --bg-glass: rgba(30, 41, 59, 0.5)
 * 
 * Primary Color:
 * - --color-primary: #F59E0B (amber-500)
 * - --color-primary-gradient: linear-gradient(135deg, #F59E0B 0%, #D97706 100%)
 * 
 * Typography:
 * - --text-primary: #F8FAFC (slate-50)
 * - --text-secondary: #CBD5E1 (slate-300)
 * - --text-muted: #94A3B8 (slate-400)
 * 
 * Borders:
 * - --border-primary: #334155 (slate-700)
 * - --border-secondary: #475569 (slate-600)
 * 
 * Glass Morphism:
 * - backdrop-blur-xl
 * - bg-slate-800/50
 * - border-slate-700/50
 * 
 * 
 * ========== RESPONSIVE BEHAVIOR SUMMARY ==========
 * 
 * | Component    | Mobile (<640px)    | Tablet (640-1023px) | Desktop (≥1024px) |
 * |--------------|-------------------|---------------------|-------------------|
 * | Sidebar      | Drawer (hidden)   | Collapsible         | Fixed expanded    |
 * | TopBar       | Compact           | Standard            | Standard          |
 * | BottomNav    | Visible           | Hidden              | Hidden            |
 * | MainContent  | Full width        | Adjusted margin     | Margin-left 260px |
 * 
 * 
 * ========== KEYBOARD SHORTCUTS ==========
 * 
 * Ctrl/Cmd + B: Toggle sidebar
 * Ctrl/Cmd + K: Open global search
 * Escape: Close modals/drawers
 * 
 * 
 * ========== ROUTE CONFIGURATION ==========
 * 
 * All routes are defined in ROUTES_CONFIG.md:
 * 
 * 1. Dashboard      /admin/dashboard
 * 2. Agenda        /admin/agenda
 * 3. Horários      /admin/horarios
 * 4. Clientes      /admin/clientes
 * 5. Serviços      /admin/servicos
 * 6. Funcionários  /admin/funcionarios
 * 7. Financeiro    /admin/financeiro
 * 8. WhatsApp      /admin/whatsapp
 * 9. IA Config     /admin/ai-config
 * 10. Aparência    /admin/aparencia
 * 11. Configurações /admin/configuracoes
 * 
 * 
 * ========== ICON LIBRARY ==========
 * 
 * Components use Lucide React icons. Common icons:
 * 
 * import {
 *   LayoutDashboard,
 *   Calendar,
 *   Clock,
 *   Users,
 *   Scissors,
 *   UserCog,
 *   DollarSign,
 *   MessageCircle,
 *   BrainCircuit,
 *   Palette,
 *   Settings,
 *   Search,
 *   Bell,
 *   Menu,
 *   X,
 *   ChevronLeft,
 *   ChevronRight,
 *   LogOut
 * } from 'lucide-react';
 * 
 * 
 * ========== ANIMATION LIBRARY ==========
 * 
 * Components use Framer Motion for animations:
 * 
 * import { motion, AnimatePresence } from 'framer-motion';
 * 
 * Common patterns:
 * - Fade in: initial={{ opacity: 0 }} animate={{ opacity: 1 }}
 * - Slide: initial={{ y: 20 }} animate={{ y: 0 }}
 * - Scale: initial={{ scale: 0.95 }} animate={{ scale: 1 }}
 * 
 * 
 * ========== PERFORMANCE NOTES ==========
 * 
 * 1. All components are optimized to minimize re-renders
 * 2. Sidebar state uses custom hook to avoid prop drilling
 * 3. Animations use minimal transforms (not top/left)
 * 4. Glass morphism uses backdrop-blur-xl sparingly
 * 5. Route transitions are fast (200ms)
 * 
 * 
 * ========== ACCESSIBILITY ==========
 * 
 * - All navigation links are keyboard accessible
 * - ARIA labels on interactive elements
 * - Breadcrumbs for navigation context
 * - Focus management in modals/drawers
 * - Minimum tap target: 44x44px
 * 
 * 
 * ========== TESTING CHECKLIST ==========
 * 
 * Before using this layout:
 * 
 * [ ] Sidebar collapses/expands correctly on tablet
 * [ ] Mobile drawer opens/closes on hamburger click
 * [ ] Bottom nav is hidden on desktop
 * [ ] All routes navigate correctly
 * [ ] Active states highlight in navigation
 * [ ] User menu dropdown opens/closes
 * [ ] Keyboard shortcuts work
 * [ ] Page transitions are smooth
 * [ ] Mobile bottom nav has safe area padding
 * [ ] Content doesn't overlap with fixed elements
 * 
 * 
 * ========== CUSTOMIZATION ==========
 * 
 * To customize the layout:
 * 
 * 1. Modify sidebar items in Sidebar.jsx (navItems array)
 * 2. Add routes in ROUTES_CONFIG.md
 * 3. Adjust responsive breakpoints in ResponsiveStrategy.md
 * 4. Change colors in DESIGN_TOKENS.md
 * 5. Modify TopBar actions in TopBar.jsx
 * 
 * 
 * ========== DEPENDENCIES ==========
 * 
 * Required packages:
 * 
 * "dependencies": {
 *   "react": "^18.x",
 *   "react-router-dom": "^6.x",
 *   "lucide-react": "^0.x",
 *   "framer-motion": "^10.x"
 * }
 * 
 * 
 * ========== NEXT STEPS FOR IMPLEMENTATION ==========
 * 
 * After integrating this layout:
 * 
 * 1. Create individual page components (Dashboard.jsx, Agenda.jsx, etc.)
 * 2. Set up React Router configuration
 * 3. Implement authentication middleware
 * 4. Add global search functionality
 * 5. Connect to actual backend API
 * 6. Add notification system
 * 
 * 
 * ========== SUPPORT ==========
 * 
 * For issues or questions, refer to:
 * - RESPONSIVE_STRATEGY.md for responsive patterns
 * - COMPONENT_GUIDELINES.md for component standards
 * - DESIGN_TOKENS.md for color/style references
 * 
 */
