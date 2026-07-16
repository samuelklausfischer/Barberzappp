import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, supabaseConfigError } from '@/infrastructure/supabase/client';

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
  trial_started_at: string | null;
  trial_ends_at: string | null;
}

interface Tenant {
  id: string;
  company_name: string | null;
  owner_phone: string | null;
  email: string | null;
  subscription_status: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
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

interface TrialSignUpInput {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  phone?: string;
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
  signUpTrial: (input: TrialSignUpInput) => Promise<{ user: User; session: any; profile: Profile; membership: TenantMembership; tenant: Tenant }>;
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

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setMembership(null);
    setTenant(null);
  }, []);

  const loadSessionData = useCallback(async (currentSession: any) => {
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
          email,
          subscription_status,
          trial_started_at,
          trial_ends_at
        )
      `)
      .eq('user_id', currentSession.user.id)
      .eq('status', 'active')
      .single();

    return {
      profileData,
      membershipData,
      tenantData: membershipData?.tenants ?? null,
    };
  }, []);

  const applySessionData = useCallback((currentSession: any, profileData: Profile | null, membershipData: TenantMembership | null, tenantData: Tenant | null) => {
    setUser(currentSession.user);
    setSession(currentSession);
    setProfile(profileData);
    setMembership(membershipData);
    setTenant(tenantData);
  }, []);

  const checkSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (supabaseConfigError) {
        clearAuthState();
        setError(supabaseConfigError);
        setLoading(false);
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        clearAuthState();
        setLoading(false);
        return;
      }

      const { profileData, membershipData, tenantData } = await loadSessionData(currentSession);
      applySessionData(currentSession, profileData, membershipData, tenantData);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao verificar sessao:', err);
      setError(err instanceof Error ? err.message : 'Erro ao verificar sessao');
      clearAuthState();
      setLoading(false);
    }
  }, [applySessionData, clearAuthState, loadSessionData]);

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

      if (supabaseConfigError) {
        throw new Error(supabaseConfigError);
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      const { profileData, membershipData, tenantData } = await loadSessionData(data.session);

      if (!membershipData || !tenantData) {
        throw new Error('Usuario nao possui membership ativa em nenhum tenant');
      }

      applySessionData(data.session, profileData, membershipData, tenantData);
      setLoading(false);

      return { user: data.user, session: data.session, profile: profileData, membership: membershipData, tenant: tenantData };
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      setError(errorMessage);
      clearAuthState();
      setLoading(false);
      throw err;
    }
  }, [applySessionData, clearAuthState, loadSessionData]);

  const signUpTrial = useCallback(async (input: TrialSignUpInput) => {
    try {
      setLoading(true);
      setError(null);

      if (supabaseConfigError) {
        throw new Error(supabaseConfigError);
      }

      const email = input.email.trim();
      const fullName = input.fullName.trim();
      const companyName = input.companyName.trim();
      const phone = input.phone?.trim() || undefined;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: input.password,
        options: {
          data: {
            full_name: fullName,
            barbershop_name: companyName,
            trial_requested: true,
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      if (!data.session) {
        throw new Error('Conta criada. Confirme seu e-mail antes de concluir o teste gratis.');
      }

      const { error: workspaceError } = await supabase.rpc('create_trial_workspace', {
        p_company_name: companyName,
        p_full_name: fullName,
        p_phone: phone ?? null,
      });

      if (workspaceError) {
        throw new Error(workspaceError.message);
      }

      const { profileData, membershipData, tenantData } = await loadSessionData(data.session);

      if (!membershipData || !tenantData) {
        throw new Error('Conta trial criada, mas o workspace inicial nao foi carregado.');
      }

      applySessionData(data.session, profileData, membershipData, tenantData);
      setLoading(false);

      return { user: data.user, session: data.session, profile: profileData, membership: membershipData, tenant: tenantData };
    } catch (err) {
      console.error('Erro ao criar trial:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar teste gratis';
      setError(errorMessage);
      clearAuthState();
      setLoading(false);
      throw err;
    }
  }, [applySessionData, clearAuthState, loadSessionData]);

  const signOut = useCallback(async () => {
    try {
      setLoading(true);

      if (!supabaseConfigError) {
        await supabase.auth.signOut();
      }

      clearAuthState();
      setLoading(false);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer logout';
      setError(errorMessage);
      throw err;
    }
  }, [clearAuthState]);

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
    signUpTrial,
    signOut,
    refreshSession,
  }), [user, session, profile, membership, tenant, loading, error, signIn, signUpTrial, signOut, refreshSession]);

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
