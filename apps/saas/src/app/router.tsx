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
import TrialRegistration from '@/components/auth/TrialRegistration';
import { RoleGuard } from '@/components/auth/RoleGuard';
import PublicOnlyRoute from '@/components/auth/PublicOnlyRoute';
import GeneralSettings from '@/components/settings/GeneralSettings';
import TeamSettings from '@/components/settings/TeamSettings';
import { APP_PATHS } from '@/config/routes';

export const router = createBrowserRouter([
  {
    path: APP_PATHS.LOGIN,
    element: (
      <PublicOnlyRoute>
        <Login />
      </PublicOnlyRoute>
    ),
  },
  {
    path: APP_PATHS.REGISTRATION,
    element: (
      <PublicOnlyRoute>
        <TrialRegistration />
      </PublicOnlyRoute>
    ),
  },
  {
    path: APP_PATHS.DASHBOARD,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: APP_PATHS.AGENDA,
        element: <Agenda />,
      },
      {
        path: APP_PATHS.FINANCE,
        element: (
          <RoleGuard allowedRoles={['owner']}>
            <Finance />
          </RoleGuard>
        ),
      },
      {
        path: APP_PATHS.AICONFIG,
        element: (
          <RoleGuard allowedRoles={['owner']}>
            <AIConfig />
          </RoleGuard>
        ),
      },
      {
        path: APP_PATHS.SETTINGS,
        element: (
          <RoleGuard allowedRoles={['owner']}>
            <GeneralSettings />
          </RoleGuard>
        ),
      },
      {
        path: `${APP_PATHS.SETTINGS}/team`,
        element: (
          <RoleGuard allowedRoles={['owner']}>
            <TeamSettings />
          </RoleGuard>
        ),
      },
      {
        path: APP_PATHS.WHATSAPP,
        element: <WhatsAppConnect />,
      },
      {
        path: APP_PATHS.SERVICES,
        element: <ServicesList />,
      },
      {
        path: APP_PATHS.CLIENTS,
        element: <ClientsList />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to={APP_PATHS.DASHBOARD} replace />,
  },
]);
