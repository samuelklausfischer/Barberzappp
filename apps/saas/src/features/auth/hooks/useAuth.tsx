import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/infrastructure/supabase/client';

interface User {
  id: string;
  email: string;
  created_at: string;
}

interface Profile {
  id: string;
  barbershop_name: string | null;
  full_name: string | null;
  phone: string | null;
  updated_at: string | null;
  ai_assistant_name: string | null;
  business_address: string | null;
  business_hours: string | null;
  subscription_status: string | null;
}

interface Tenant {
  id: string;
  company_name: string | null;
  owner_phone: string | null;
  email: string | null;
}

interface TenantMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'employee';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
  tenants: Tenant;
}

interface AuthState {
  user: User | null;
  session: any;
  profile: Profile | null;
  membership: TenantMembership | null;
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<{ user: User; session: any; profile: Profile; membership: TenantMembership; tenant: Tenant }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;

const AuthContext = React.createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<TenantMembership | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        setUser(null);
        setSession(null);
        setProfile(null);
        setMembership(null);
        setTenant(null);
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();

      const { data: membershipData } = await supabase
        .from('tenant_memberships')
        .select(`
          id,
          tenant_id,
          role,
          status,
          created_at,
          updated_at,
          tenants (
            id,
            company_name,
            owner_phone,
            email
          )
        `)
        .eq('user_id', currentSession.user.id)
        .eq('status', 'active')
        .single();

      if (!membershipData) {
        setUser(currentSession.user);
        setSession(currentSession);
        setProfile(profileData);
        setMembership(null);
        setTenant(null);
        setLoading(false);
        return;
      }

      const tenantData = membershipData.tenants;

      setUser(currentSession.user);
      setSession(currentSession);
      setProfile(profileData);
      setMembership(membershipData);
      setTenant(tenantData);

      setLoading(false);
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
      setError(err instanceof Error ? err.message : 'Erro ao verificar sessão');
      setUser(null);
      setSession(null);
      setProfile(null);
      setMembership(null);
      setTenant(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
    const { data } = supabase.auth.onAuthStateChange(() => {
      checkSession();
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, [checkSession]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      const { data: membershipData } = await supabase
        .from('tenant_memberships')
        .select(`
          id,
          tenant_id,
          role,
          status,
          created_at,
          updated_at,
          tenants (
            id,
            company_name,
            owner_phone,
            email
          )
        `)
        .eq('user_id', data.user.id)
        .eq('status', 'active')
        .single();

      if (!membershipData) {
        throw new Error('Usuário não possui membership ativa em nenhum tenant');
      }

      const tenantData = membershipData.tenants;

      setUser(data.user);
      setSession(data.session);
      setProfile(profileData);
      setMembership(membershipData);
      setTenant(tenantData);

      setLoading(false);

      return { user: data.user, session: data.session, profile: profileData, membership: membershipData, tenant: tenantData };
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      setUser(null);
      setSession(null);
      setProfile(null);
      setMembership(null);
      setTenant(null);
      setLoading(false);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      setMembership(null);
      setTenant(null);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer logout';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    await checkSession();
  }, [checkSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    session,
    profile,
    membership,
    tenant,
    loading,
    error,
    signIn,
    signOut,
    refreshSession,
  }), [user, session, profile, membership, tenant, loading, error, signIn, signOut, refreshSession]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
