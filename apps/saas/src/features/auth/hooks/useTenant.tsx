import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface TenantContext {
  tenantId: string | null;
  role: 'owner' | 'employee' | null;
  loading: boolean;
}

const TenantContext = React.createContext<TenantContext>({
  tenantId: null,
  role: null,
  loading: true,
});

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { membership, loading } = useAuth();

  const value: TenantContext = {
    tenantId: membership?.tenant_id || null,
    role: membership?.role || null,
    loading,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = React.useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return context;
};
