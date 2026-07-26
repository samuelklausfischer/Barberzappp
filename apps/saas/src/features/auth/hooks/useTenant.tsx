import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { resolveAgendaTimeZone } from '@/config/timeZone';

interface TenantContextValue {
  tenantId: string | null;
  role: 'owner' | 'employee' | null;
  timeZone: string;
  loading: boolean;
}

const TenantContext = React.createContext<TenantContextValue>({
  tenantId: null,
  role: null,
  timeZone: resolveAgendaTimeZone(null),
  loading: true,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { membership, tenant, loading } = useAuth();

  const value: TenantContextValue = {
    tenantId: membership?.tenant_id || null,
    role: membership?.role || null,
    timeZone: resolveAgendaTimeZone(tenant?.timezone),
    loading,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenant = () => {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
