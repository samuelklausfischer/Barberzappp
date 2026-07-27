export type AppRole = 'owner' | 'employee';
export type NavigationSection = 'operation' | 'management';

export interface NavigationRoute {
  id: string;
  path: string;
  label: string;
  icon: string;
  roles: readonly AppRole[];
  section: NavigationSection;
  order: number;
  mobilePrimary?: boolean;
}

export interface NavigationGroup {
  id: NavigationSection;
  label: string;
  items: readonly NavigationRoute[];
}

const ALL_ROLES: readonly AppRole[] = ['owner', 'employee'];
const OWNER_ONLY: readonly AppRole[] = ['owner'];

export const APP_ROUTES = {
  dashboard: { id: 'dashboard', path: '/', label: 'Home', icon: 'home', roles: ALL_ROLES, section: 'operation', order: 1, mobilePrimary: true },
  agenda: { id: 'agenda', path: '/agenda', label: 'Agenda', icon: 'calendar_month', roles: ALL_ROLES, section: 'operation', order: 2, mobilePrimary: true },
  clients: { id: 'clients', path: '/clients', label: 'Clientes', icon: 'groups', roles: ALL_ROLES, section: 'operation', order: 3 },
  services: { id: 'services', path: '/services', label: 'Serviços', icon: 'content_cut', roles: ALL_ROLES, section: 'operation', order: 4 },
  whatsapp: { id: 'whatsapp', path: '/whatsapp', label: 'WhatsApp', icon: 'chat', roles: ALL_ROLES, section: 'operation', order: 5, mobilePrimary: true },
  finance: { id: 'finance', path: '/finance', label: 'Financeiro', icon: 'show_chart', roles: OWNER_ONLY, section: 'management', order: 1 },
  aiconfig: { id: 'aiconfig', path: '/aiconfig', label: 'Config. IA', icon: 'psychology', roles: OWNER_ONLY, section: 'management', order: 2 },
  settings: { id: 'settings', path: '/settings', label: 'Ajustes', icon: 'settings', roles: OWNER_ONLY, section: 'management', order: 3 },
} as const satisfies Record<string, NavigationRoute>;

export type AppRouteId = keyof typeof APP_ROUTES;

export const APP_PATHS = {
  DASHBOARD: APP_ROUTES.dashboard.path,
  AGENDA: APP_ROUTES.agenda.path,
  SERVICES: APP_ROUTES.services.path,
  CLIENTS: APP_ROUTES.clients.path,
  FINANCE: APP_ROUTES.finance.path,
  WHATSAPP: APP_ROUTES.whatsapp.path,
  AICONFIG: APP_ROUTES.aiconfig.path,
  SETTINGS: APP_ROUTES.settings.path,
  LOGIN: '/login',
  REGISTRATION: '/cadastro',
  ADMIN: '/admin',
} as const;

export const NAVIGATION_ITEMS: readonly NavigationRoute[] = Object.values(APP_ROUTES).sort((a, b) => {
  if (a.section !== b.section) return a.section === 'operation' ? -1 : 1;
  return a.order - b.order;
});

const NAVIGATION_GROUPS: readonly Pick<NavigationGroup, 'id' | 'label'>[] = [
  { id: 'operation', label: 'Operação' },
  { id: 'management', label: 'Gestão' },
];

export const getNavigationItemsForRole = (role: AppRole): NavigationRoute[] =>
  NAVIGATION_ITEMS.filter((item) => item.roles.includes(role));

export const getNavigationGroupsForRole = (role: AppRole): NavigationGroup[] =>
  NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: getNavigationItemsForRole(role).filter((item) => item.section === group.id),
  })).filter((group) => group.items.length > 0);

export const getMobilePrimaryItemsForRole = (role: AppRole): NavigationRoute[] =>
  getNavigationItemsForRole(role).filter((item) => item.mobilePrimary);

export const getMoreNavigationItemsForRole = (role: AppRole): NavigationRoute[] =>
  getNavigationItemsForRole(role).filter((item) => !item.mobilePrimary);
