import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/app/App';
import Dashboard from '@/components/dashboard/Dashboard';
import Agenda from '@/components/agenda/Agenda';
import Finance from '@/components/finance/Finance';
import ServicesList from '@/components/services/ServicesList';
import AIConfig from '@/components/aiconfig/AIConfig';
import WhatsAppConnect from '@/components/whatsapp/WhatsAppConnect';
import ClientsList from '@/components/clients/ClientsList';
import Login from '@/components/auth/Login';
import { RoleGuard } from '@/components/auth/RoleGuard';
import GeneralSettings from '@/components/settings/GeneralSettings';

export type RoutePath = 
  | 'dashboard' 
  | 'agenda' 
  | 'finance' 
  | 'whatsapp' 
  | 'services' 
  | 'clients'
  | 'aiconfig' 
  | 'settings'
  | 'login';

export const routes: { path: string; name: RoutePath }[] = [
  { path: '/', name: 'dashboard' },
  { path: '/agenda', name: 'agenda' },
  { path: '/finance', name: 'finance' },
  { path: '/whatsapp', name: 'whatsapp' },
  { path: '/services', name: 'services' },
  { path: '/clients', name: 'clients' },
  { path: '/aiconfig', name: 'aiconfig' },
  { path: '/settings', name: 'settings' },
  { path: '/login', name: 'login' },
];

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: 'agenda',
        element: <Agenda />,
      },
      {
        path: 'finance',
        element: (
          <RoleGuard allowedRoles={['owner']}>
            <Finance />
          </RoleGuard>
        ),
      },
      {
        path: 'aiconfig',
        element: (
          <RoleGuard allowedRoles={['owner']}>
            <AIConfig />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard allowedRoles={['owner']}>
            <GeneralSettings />
          </RoleGuard>
        ),
      },
      {
        path: 'whatsapp',
        element: <WhatsAppConnect />,
      },
      {
        path: 'services',
        element: <ServicesList />,
      },
      {
        path: 'clients',
        element: <ClientsList />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
