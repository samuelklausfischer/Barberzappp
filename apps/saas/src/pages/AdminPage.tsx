import React, { useCallback, useEffect, useState } from 'react';
import AdminDashboard, { AdminCampaign, AdminMetrics, AdminUser } from '@/components/admin/AdminDashboard';
import { supabase } from '@/infrastructure/supabase/client';

type JsonRecord = Record<string, unknown>;

const str = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const nullable = (value: unknown) => typeof value === 'string' && value ? value : null;

const mapUser = (item: JsonRecord): AdminUser => ({
  id: str(item.id),
  name: str(item.name, 'Usuário'),
  email: str(item.email, 'Sem e-mail'),
  createdAt: str(item.created_at),
  trialStatus: item.trial_status === 'active' || item.trial_status === 'expired' ? item.trial_status : 'none',
  trialEndsAt: nullable(item.trial_ends_at),
  subscriptionStatus: item.subscription_status === 'active' || item.subscription_status === 'past_due' ? item.subscription_status : 'inactive',
  subscriptionStartedAt: nullable(item.subscription_started_at),
  whatsappConnected: item.whatsapp_connected === true,
});

const mapCampaign = (item: JsonRecord): AdminCampaign => ({
  id: str(item.id),
  barberShopName: str(item.barber_shop_name, 'Barbearia sem nome'),
  city: str(item.city, 'Cidade não informada'),
  status: ['pending', 'sent', 'failed', 'replied', 'interested'].includes(str(item.status))
    ? (str(item.status) as AdminCampaign['status'])
    : 'pending',
  dispatchedAt: nullable(item.dispatched_at),
});

const mapMetrics = (value: unknown): AdminMetrics | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const metrics = value as JsonRecord;
  return {
    totalUsers: Number(metrics.total_users) || 0,
    activeTrials: Number(metrics.active_trials) || 0,
    subscribers: Number(metrics.subscribers) || 0,
    connectedWhatsApp: Number(metrics.connected_whatsapp) || 0,
    pendingCampaigns: Number(metrics.pending_campaigns) || 0,
    interestedLeads: Number(metrics.interested_leads) || 0,
  };
};

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [details, setDetails] = useState<JsonRecord | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('admin_get_overview', { p_search: null });
    if (rpcError) {
      setError(rpcError.message === 'ADMIN_REQUIRED' ? 'Esta sessão não tem permissão de administrador.' : 'Não foi possível carregar os dados administrativos.');
      setLoading(false);
      return;
    }
    const payload = (data ?? {}) as JsonRecord;
    setUsers(Array.isArray(payload.users) ? payload.users.map((item) => mapUser(item as JsonRecord)) : []);
    setCampaigns(Array.isArray(payload.campaigns) ? payload.campaigns.map((item) => mapCampaign(item as JsonRecord)) : []);
    setMetrics(mapMetrics(payload.metrics));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openDetails = useCallback(async (user: AdminUser) => {
    setSelected(user);
    setDetails(null);
    setDetailsLoading(true);
    const { data } = await supabase.rpc('admin_get_user_details', { p_user_id: user.id });
    setDetails((data ?? null) as JsonRecord | null);
    setDetailsLoading(false);
  }, []);

  const tenant = details?.tenant as JsonRecord | undefined;
  const config = details?.configuration as JsonRecord | undefined;
  const profile = details?.profile as JsonRecord | undefined;

  return (
    <>
      <AdminDashboard users={users} campaigns={campaigns} metrics={metrics} loading={loading} error={error} onRetry={() => void load()} onSelectUser={(user) => void openDetails(user)} />
      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#141414]/45 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <section className="max-h-[88dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-[#E8E5DD] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="admin-details-title">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9A7417]">Suporte à conta</p><h2 id="admin-details-title" className="mt-2 text-2xl font-extrabold">{selected.name}</h2><p className="mt-1 text-sm text-[#6B7280]">{selected.email}</p></div>
              <button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E5DD] text-[#6B7280]" aria-label="Fechar detalhes"><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
            </div>
            {detailsLoading ? <div className="mt-8 h-40 animate-pulse rounded-2xl bg-[#F8F6F0]" /> : (
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <article className="rounded-2xl border border-[#E8E5DD] bg-[#FFFCF5] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9CA3AF]">Conta</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Criada em</dt><dd className="font-bold">{str((details?.user as JsonRecord | undefined)?.created_at, '—')}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Telefone</dt><dd className="font-bold">{str(profile?.phone, '—')}</dd></div></dl></article>
                <article className="rounded-2xl border border-[#E8E5DD] bg-[#FFFCF5] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9CA3AF]">Operação</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Barbearia</dt><dd className="max-w-[12rem] truncate font-bold">{str(tenant?.company_name, 'Sem tenant')}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Assinatura</dt><dd className="font-bold">{str(tenant?.subscription_status, '—')}</dd></div></dl></article>
                <article className="sm:col-span-2 rounded-2xl border border-[#E8D9AE] bg-[#FFF8E7] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9A7417]">Configurações salvas</p><div className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-[#8A6A11]">Assistente</p><p className="mt-1 font-bold">{str(config?.ai_name, str(config?.ai_assistant_name, 'Não definido'))}</p></div><div><p className="text-[#8A6A11]">Serviços</p><p className="mt-1 font-bold">{Array.isArray(details?.services) ? details?.services.length : 0}</p></div><div><p className="text-[#8A6A11]">Profissionais</p><p className="mt-1 font-bold">{Array.isArray(details?.barbers) ? details?.barbers.length : 0}</p></div></div><p className="mt-4 text-xs leading-5 text-[#786B50]">A edição assistida será liberada em uma etapa protegida, com registro de auditoria e confirmação antes de salvar.</p></article>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
};

export default AdminPage;
