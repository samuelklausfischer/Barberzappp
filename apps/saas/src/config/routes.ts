
export type AppView = 'login' | 'dashboard' | 'agenda' | 'finance' | 'whatsapp' | 'settings' | 'services' | 'aiconfig';

export const ROUTES = {
  LOGIN: 'login',
  DASHBOARD: 'dashboard',
  AGENDA: 'agenda',
  FINANCE: 'finance',
  WHATSAPP: 'whatsapp',
  SETTINGS: 'settings',
  SERVICES: 'services',
  AICONFIG: 'aiconfig',
} as const;
