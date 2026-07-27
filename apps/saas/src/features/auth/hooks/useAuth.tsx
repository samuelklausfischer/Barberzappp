import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/infrastructure/supabase/client';

interface User {
  id: string;
  email: string;
  created_at: string;
  app_metadata?: Record<string, unknown>;
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
  subscription_status: string | null;
  is_active: boolean | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  timezone: string | null;
  prompt_tone: string | null;
  prompt_business_rules: string | null;
  business_hours: unknown | null;
  booking_interval_minutes: number | null;
  whatsapp_status: string | null;
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

type AccessState = 'active' | 'trialing' | 'paused';

interface AuthState {
  user: User | null;
  session: any;
  profile: Profile | null;
  membership: TenantMembership | null;
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  accessState: AccessState;
  trialEndsAt: string | null;
  isAdmin: boolean;
}

interface AuthActions {
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    user: User;
    session: any;
    profile: Profile | null;
    membership: TenantMembership | null;
    tenant: Tenant | null;
  }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

type AuthContextValue = AuthState & AuthActions;
const AuthContext = React.createContext<AuthContextValue | null>(null);

const isAdminUser = (candidate: User | null | undefined): boolean =>
  candidate?.app_metadata?.role === 'admin';

const accessFor = (tenant: Tenant | null): AccessState => {
  if (!tenant || !tenant.is_active) return 'paused';
  const status = tenant.subscription_status?.toLowerCase();
  if (['active', 'paid'].includes(status || '')) return 'active';
  const end = tenant.trial_ends_at ? new Date(tenant.trial_ends_at).getTime() : Number.NaN;
  return ['trial', 'trialing'].includes(status || '') && Number.isFinite(end) && end > Date.now()
    ? 'trialing'
    : 'paused';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<TenantMembership | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clear = useCallback(() => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setMembership(null);
    setTenant(null);
  }, []);

  const loadContext = useCallback(async (currentSession: any) => {
    const { error: refreshError } = await supabase.rpc('refresh_my_trial_state');
    if (refreshError)
      throw new Error('Não foi possível atualizar o estado da assinatura. Tente entrar novamente.');

    const [profileResult, membershipResult] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentSession.user.id).single(),
      supabase
        .from('tenant_memberships')
        .select(
          'id, tenant_id, role, status, created_at, updated_at, tenants ( id, company_name, owner_phone, email, subscription_status, is_active, trial_started_at, trial_ends_at, timezone, prompt_tone, prompt_business_rules, business_hours, booking_interval_minutes, whatsapp_status )'
        )
        .eq('user_id', currentSession.user.id)
        .eq('status', 'active')
        .single(),
    ]);

    if (profileResult.error) throw new Error('Não foi possível carregar o perfil desta conta.');
    if (membershipResult.error || !membershipResult.data)
      throw new Error('Esta conta não possui um acesso ativo à barbearia.');

    const loadedTenant = membershipResult.data.tenants as unknown as Tenant;
    if (!loadedTenant) throw new Error('Não foi possível carregar os dados da barbearia.');

    return {
      profile: profileResult.data as Profile,
      membership: membershipResult.data as unknown as TenantMembership,
      tenant: loadedTenant,
    };
  }, []);

  const setAdminContext = useCallback((currentSession: any) => {
    setUser(currentSession.user as User);
    setSession(currentSession);
    setProfile(null);
    setMembership(null);
    setTenant(null);
  }, []);

  const checkSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!currentSession) {
        clear();
        return;
      }

      if (isAdminUser(currentSession.user as User)) {
        setAdminContext(currentSession);
        return;
      }

      const context = await loadContext(currentSession);
      setUser(currentSession.user as User);
      setSession(currentSession);
      setProfile(context.profile);
      setMembership(context.membership);
      setTenant(context.tenant);
    } catch (cause) {
      clear();
      setError(cause instanceof Error ? cause.message : 'Erro ao verificar sessão.');
    } finally {
      setLoading(false);
    }
  }, [clear, loadContext, setAdminContext]);

  useEffect(() => {
    void checkSession();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')
        void checkSession();
    });
    return () => data.subscription.unsubscribe();
  }, [checkSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError || !data.session || !data.user)
          throw new Error(signInError?.message || 'Não foi possível iniciar a sessão.');

        if (isAdminUser(data.user as User)) {
          setAdminContext(data.session);
          return {
            user: data.user as User,
            session: data.session,
            profile: null,
            membership: null,
            tenant: null,
          };
        }

        const context = await loadContext(data.session);
        setUser(data.user as User);
        setSession(data.session);
        setProfile(context.profile);
        setMembership(context.membership);
        setTenant(context.tenant);
        return { user: data.user as User, session: data.session, ...context };
      } catch (cause) {
        clear();
        const message = cause instanceof Error ? cause.message : 'Erro ao fazer login.';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [clear, loadContext, setAdminContext]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      clear();
    } finally {
      setLoading(false);
    }
  }, [clear]);

  const isAdmin = isAdminUser(user);
  const accessState = isAdmin ? 'active' : accessFor(tenant);
  const trialEndsAt = tenant?.trial_ends_at ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      profile,
      membership,
      tenant,
      loading,
      error,
      accessState,
      trialEndsAt,
      isAdmin,
      signIn,
      signOut,
      refreshSession: checkSession,
    }),
    [
      user,
      session,
      profile,
      membership,
      tenant,
      loading,
      error,
      accessState,
      trialEndsAt,
      isAdmin,
      signIn,
      signOut,
      checkSession,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
