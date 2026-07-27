import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboard, { AdminCampaign, AdminMetrics, AdminUser } from '@/components/admin/AdminDashboard';
import { supabase } from '@/infrastructure/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

type JsonRecord = Record<string, unknown>;
type AdminPageId = 'users' | 'campaigns' | 'finder';

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

const mapCampaign = (item: JsonRecord): AdminCampaign => {
  const status = str(item.status, 'pending');
  return {
    id: str(item.id),
    barberShopName: str(item.barber_shop_name, 'Barbearia sem nome'),
    city: str(item.city, 'Cidade não informada'),
    status: ['pending', 'sent', 'failed', 'replied', 'interested'].includes(status)
      ? status as AdminCampaign['status']
      : 'pending',
    dispatchedAt: nullable(item.dispatched_at),
  };
};

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

interface SupportDraft {
  fullName: string;
  barbershopName: string;
  phone: string;
  businessAddress: string;
  businessHours: string;
  aiAssistantName: string;
  greeting: string;
  instructions: string;
}

const emptyDraft: SupportDraft = {
  fullName: '',
  barbershopName: '',
  phone: '',
  businessAddress: '',
  businessHours: '',
  aiAssistantName: '',
  greeting: '',
  instructions: '',
};

const navItems: Array<{ id: AdminPageId; label: string; icon: string; description: string }> = [
  { id: 'users', label: 'Usuários', icon: 'group', description: 'Contas e suporte' },
  { id: 'campaigns', label: 'Barbearias disparadas', icon: 'send', description: 'Status dos contatos' },
  { id: 'finder', label: 'Buscador de barbearias', icon: 'location_city', description: 'Novos leads por cidade' },
];

const campaignStatusLabel: Record<AdminCampaign['status'], string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  failed: 'Falhou',
  replied: 'Respondeu',
  interested: 'Com interesse',
};

const campaignStatusClass: Record<AdminCampaign['status'], string> = {
  pending: 'bg-[#FFF8E7] text-[#966C11]',
  sent: 'bg-[#EFF8FF] text-[#175CD3]',
  failed: 'bg-[#FEF3F2] text-[#B42318]',
  replied: 'bg-[#F4F3FF] text-[#5925DC]',
  interested: 'bg-[#ECFDF3] text-[#15803D]',
};

const CampaignsPage: React.FC<{ campaigns: AdminCampaign[] }> = ({ campaigns }) => (
  <section className="space-y-6">
    <header className="rounded-3xl border border-[#E8D9AE] bg-[linear-gradient(120deg,#FFF8E7,#FFFFFF)] px-6 py-7 shadow-[0_16px_44px_rgba(137,100,23,0.08)]">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9A7417]">Prospecção organizada</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Barbearias disparadas</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">Veja o histórico de contatos e em que ponto cada barbearia está no relacionamento.</p>
    </header>
    <div className="overflow-hidden rounded-2xl border border-[#E8E5DD] bg-white shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
      <div className="border-b border-[#F0EEE8] px-6 py-5"><h2 className="text-lg font-extrabold">Histórico de disparos</h2><p className="mt-1 text-sm text-[#6B7280]">{campaigns.length} registros encontrados</p></div>
      {campaigns.length === 0 ? <div className="px-6 py-16 text-center text-sm text-[#6B7280]">Nenhuma barbearia disparada ainda.</div> : <div className="divide-y divide-[#F5F3EE]">{campaigns.map((campaign) => <div key={campaign.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{campaign.barberShopName}</p><p className="mt-1 text-xs text-[#6B7280]">{campaign.city} · {campaign.dispatchedAt ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(campaign.dispatchedAt)) : 'Ainda não disparado'}</p></div><span className={`w-fit rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${campaignStatusClass[campaign.status]}`}>{campaignStatusLabel[campaign.status]}</span></div>)}</div>}
    </div>
  </section>
);

const FinderPage: React.FC<{ campaigns: AdminCampaign[] }> = ({ campaigns }) => {
  const [city, setCity] = useState('');
  const [searched, setSearched] = useState(false);
  const results = searched && city.trim() ? campaigns.filter((campaign) => campaign.city.toLowerCase().includes(city.trim().toLowerCase())) : [];

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-[#E8D9AE] bg-[linear-gradient(120deg,#FFF8E7,#FFFFFF)] px-6 py-7 shadow-[0_16px_44px_rgba(137,100,23,0.08)]">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9A7417]">Prospecção local</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Buscador de barbearias</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">Defina uma cidade para preparar uma nova frente de prospecção. A busca externa ficará protegida até o provedor ser configurado.</p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]">
        <form onSubmit={(event) => { event.preventDefault(); setSearched(true); }} className="rounded-2xl border border-[#E8E5DD] bg-white p-6 shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
          <label htmlFor="admin-city" className="text-sm font-extrabold text-[#2A231B]">Cidade de interesse</label>
          <p className="mt-1 text-xs text-[#6B7280]">Ex.: São Paulo, Campinas ou Curitiba.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row"><input id="admin-city" value={city} onChange={(event) => { setCity(event.target.value); setSearched(false); }} placeholder="Digite o nome da cidade" className="min-h-12 flex-1 rounded-xl border border-[#E8E5DD] px-4 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" /><button type="submit" className="min-h-12 rounded-xl bg-[#D4AF37] px-5 text-sm font-extrabold text-[#1A1A1F] hover:bg-[#B89222]">Buscar</button></div>
          {searched && <div className="mt-5 rounded-xl bg-[#F8F6F0] p-4 text-sm text-[#6B7280]">{results.length ? `${results.length} contato(s) já registrado(s) nesta cidade.` : 'Nenhum contato local registrado. A busca externa será liberada após configurar provedor e regras de consentimento.'}</div>}
        </form>
        <aside className="rounded-2xl border border-[#E8D9AE] bg-[#FFFCF5] p-6"><span className="material-symbols-outlined text-3xl text-[#9A7417]" aria-hidden="true">lock</span><h2 className="mt-4 text-lg font-extrabold">Busca protegida</h2><p className="mt-2 text-sm leading-6 text-[#6B7280]">Nenhuma mensagem é enviada nesta tela. Cada futuro contato deverá ter origem, consentimento e status auditável.</p></aside>
      </div>
    </section>
  );
};

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [activePage, setActivePage] = useState<AdminPageId>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [campaigns, setCampaigns] = useState<AdminCampaign[]>([]);
  const [metrics, setMetrics] = useState<AdminMetrics>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [details, setDetails] = useState<JsonRecord | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<SupportDraft>(emptyDraft);

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
    setEditing(false);
    setSaveError(null);
    setDetailsLoading(true);
    const { data, error: detailsError } = await supabase.rpc('admin_get_user_details', { p_user_id: user.id });
    if (detailsError) setSaveError('Não foi possível carregar os detalhes desta conta.');
    const payload = (data ?? null) as JsonRecord | null;
    setDetails(payload);
    const profile = payload?.profile as JsonRecord | undefined;
    const configuration = payload?.configuration as JsonRecord | undefined;
    const tenant = payload?.tenant as JsonRecord | undefined;
    setDraft({
      fullName: str(profile?.full_name, user.name),
      barbershopName: str(profile?.barbershop_name, str(tenant?.company_name)),
      phone: str(profile?.phone),
      businessAddress: str(profile?.business_address),
      businessHours: str(profile?.business_hours),
      aiAssistantName: str(configuration?.ai_name, str(profile?.ai_assistant_name)),
      greeting: str(configuration?.greeting, str(configuration?.saudacao)),
      instructions: str(configuration?.instructions),
    });
    setDetailsLoading(false);
  }, []);

  const updateDraft = (key: keyof SupportDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  const saveSupportChanges = useCallback(async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    const { error: updateError } = await supabase.rpc('admin_update_user_support', {
      p_user_id: selected.id,
      p_full_name: draft.fullName,
      p_barbershop_name: draft.barbershopName,
      p_phone: draft.phone,
      p_business_address: draft.businessAddress,
      p_business_hours: draft.businessHours,
      p_ai_assistant_name: draft.aiAssistantName,
      p_greeting: draft.greeting,
      p_instructions: draft.instructions,
    });
    setSaving(false);
    if (updateError) {
      setSaveError(updateError.message === 'ADMIN_REQUIRED' ? 'A sessão não tem permissão de administrador.' : 'Não foi possível salvar as alterações.');
      return;
    }
    setConfirmOpen(false);
    setEditing(false);
    await load();
    await openDetails(selected);
  }, [draft, load, openDetails, selected]);

  const tenant = details?.tenant as JsonRecord | undefined;
  const profile = details?.profile as JsonRecord | undefined;
  const config = details?.configuration as JsonRecord | undefined;

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#1A1A1F]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1700px]">
        <aside className="sticky top-0 z-20 flex h-screen w-[270px] shrink-0 flex-col border-r border-[#E8E5DD] bg-[#171719] p-5 text-white max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:top-auto max-md:h-auto max-md:w-full max-md:flex-row max-md:items-center max-md:justify-around max-md:border-t max-md:border-r-0 max-md:p-2">
          <div className="mb-8 max-md:hidden"><p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]">BarberZap</p><h1 className="mt-2 text-xl font-extrabold">Central admin</h1><p className="mt-1 text-xs text-white/50">Controle interno protegido</p></div>
          <nav className="flex flex-1 flex-col gap-2 max-md:flex-row max-md:gap-1" aria-label="Navegação administrativa">{navItems.map((item) => <button key={item.id} type="button" onClick={() => setActivePage(item.id)} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-left transition max-md:flex-1 max-md:justify-center max-md:px-2 ${activePage === item.id ? 'bg-[#D4AF37] text-[#171719]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`} aria-current={activePage === item.id ? 'page' : undefined}><span className="material-symbols-outlined text-[21px]" aria-hidden="true">{item.icon}</span><span className="min-w-0 max-md:hidden"><span className="block text-sm font-extrabold">{item.label}</span><span className={`mt-0.5 block text-[10px] ${activePage === item.id ? 'text-[#171719]/65' : 'text-white/40'}`}>{item.description}</span></span><span className="sr-only md:hidden">{item.label}</span></button>)}</nav>
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/50 max-md:hidden"><span className="material-symbols-outlined text-base text-[#D4AF37]" aria-hidden="true">shield_lock</span><p className="mt-2 leading-5">Alterações exigem confirmação e ficam registradas.</p></div>
          <button type="button" onClick={async () => {
            if (!window.confirm('Deseja realmente sair da conta admin?')) return;
            setLoggingOut(true);
            try {
              await signOut();
              navigate('/login', { replace: true });
            } finally {
              setLoggingOut(false);
            }
          }} disabled={loggingOut} className="mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-white/10 px-3 py-3 text-left text-white/70 transition hover:border-[#D4AF37]/50 hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-60 max-md:mt-0 max-md:ml-1 max-md:w-12 max-md:justify-center max-md:border-0 max-md:px-2" aria-label="Sair da conta admin">
            <span className="material-symbols-outlined text-[21px]" aria-hidden="true">logout</span>
            <span className="text-sm font-extrabold max-md:hidden">{loggingOut ? 'Saindo...' : 'Sair da conta'}</span>
            <span className="sr-only md:hidden">Sair da conta</span>
          </button>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 pb-24 sm:px-6 lg:px-8 lg:py-8">
          {activePage === 'users' && <AdminDashboard users={users} campaigns={[]} metrics={metrics} loading={loading} error={error} onRetry={() => void load()} onSelectUser={(user) => void openDetails(user)} activeSection="users" hideNavigation />}
          {activePage === 'campaigns' && <CampaignsPage campaigns={campaigns} />}
          {activePage === 'finder' && <FinderPage campaigns={campaigns} />}
        </main>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#141414]/55 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <section className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-[#E8E5DD] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7" role="dialog" aria-modal="true" aria-labelledby="admin-details-title">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9A7417]">Suporte à conta</p><h2 id="admin-details-title" className="mt-2 text-2xl font-extrabold">{selected.name}</h2><p className="mt-1 text-sm text-[#6B7280]">{selected.email}</p></div><button type="button" onClick={() => setSelected(null)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E8E5DD] text-[#6B7280]" aria-label="Fechar detalhes"><span className="material-symbols-outlined" aria-hidden="true">close</span></button></div>
            {detailsLoading ? <div className="mt-8 h-40 animate-pulse rounded-2xl bg-[#F8F6F0]" /> : <div className="mt-7 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E8D9AE] bg-[#FFF8E7] px-4 py-3"><div><p className="text-sm font-extrabold">Configurações da conta</p><p className="mt-1 text-xs text-[#786B50]">Edite somente dados operacionais de suporte.</p></div>{!editing && <button type="button" onClick={() => setEditing(true)} className="min-h-10 rounded-xl bg-[#D4AF37] px-4 text-xs font-extrabold text-[#1A1A1F]">Editar configurações</button>}</div>
              {saveError && <p className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]" role="alert">{saveError}</p>}
              {editing ? <div className="grid gap-4 sm:grid-cols-2">{([
                ['fullName', 'Nome do responsável'], ['barbershopName', 'Nome da barbearia'], ['phone', 'Telefone'], ['businessAddress', 'Endereço'], ['businessHours', 'Horário de funcionamento'], ['aiAssistantName', 'Nome do assistente'], ['greeting', 'Saudação'], ['instructions', 'Instruções da IA'],
              ] as Array<[keyof SupportDraft, string]>).map(([key, label]) => <label key={key} className={key === 'instructions' ? 'sm:col-span-2' : ''}><span className="text-xs font-extrabold text-[#6B7280]">{label}</span>{key === 'instructions' ? <textarea value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} rows={4} className="mt-1 w-full rounded-xl border border-[#E8E5DD] px-3 py-2 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" /> : <input value={draft[key]} onChange={(event) => updateDraft(key, event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-[#E8E5DD] px-3 text-sm outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" />}</label>)}
                <div className="flex flex-wrap justify-end gap-3 sm:col-span-2"><button type="button" onClick={() => { setEditing(false); setSaveError(null); }} className="min-h-11 rounded-xl border border-[#E8E5DD] px-4 text-sm font-bold text-[#6B7280]">Cancelar</button><button type="button" onClick={() => setConfirmOpen(true)} className="min-h-11 rounded-xl bg-[#1A1A1F] px-4 text-sm font-extrabold text-white">Salvar alterações</button></div>
              </div> : <div className="grid gap-4 sm:grid-cols-2"><article className="rounded-2xl border border-[#E8E5DD] bg-[#FFFCF5] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9CA3AF]">Conta</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Criada em</dt><dd className="font-bold">{str((details?.user as JsonRecord | undefined)?.created_at, '—')}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Telefone</dt><dd className="font-bold">{str(profile?.phone, '—')}</dd></div></dl></article><article className="rounded-2xl border border-[#E8E5DD] bg-[#FFFCF5] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9CA3AF]">Operação</p><dl className="mt-3 space-y-2 text-sm"><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Barbearia</dt><dd className="max-w-[12rem] truncate font-bold">{str(tenant?.company_name, 'Sem tenant')}</dd></div><div className="flex justify-between gap-3"><dt className="text-[#6B7280]">Assinatura</dt><dd className="font-bold">{str(tenant?.subscription_status, '—')}</dd></div></dl></article><article className="sm:col-span-2 rounded-2xl border border-[#E8D9AE] bg-[#FFF8E7] p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#9A7417]">Resumo salvo</p><div className="mt-3 grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-[#8A6A11]">Assistente</p><p className="mt-1 font-bold">{str(config?.ai_name, str(config?.ai_assistant_name, 'Não definido'))}</p></div><div><p className="text-[#8A6A11]">Serviços</p><p className="mt-1 font-bold">{Array.isArray(details?.services) ? details?.services.length : 0}</p></div><div><p className="text-[#8A6A11]">Profissionais</p><p className="mt-1 font-bold">{Array.isArray(details?.barbers) ? details?.barbers.length : 0}</p></div></div></article></div>}
            </div>}
          </section>
        </div>
      )}

      {confirmOpen && selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#141414]/65 p-5 backdrop-blur-sm"><section className="w-full max-w-md rounded-3xl border border-[#E8D9AE] bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="confirm-support-title" aria-describedby="confirm-support-description"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0C2] text-[#8A6A11]"><span className="material-symbols-outlined" aria-hidden="true">warning</span></div><h2 id="confirm-support-title" className="mt-4 text-xl font-extrabold">Confirmar alteração?</h2><p id="confirm-support-description" className="mt-2 text-sm leading-6 text-[#6B7280]">Você está prestes a alterar configurações de <strong>{selected.name}</strong>. Confirme somente se essa orientação foi realmente validada.</p><div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={() => setConfirmOpen(false)} className="min-h-11 rounded-xl border border-[#E8E5DD] px-4 text-sm font-bold text-[#6B7280]">Cancelar</button><button type="button" disabled={saving} onClick={() => void saveSupportChanges()} className="min-h-11 rounded-xl bg-[#1A1A1F] px-4 text-sm font-extrabold text-white disabled:opacity-60">{saving ? 'Salvando…' : 'Confirmar e salvar'}</button></div></section></div>}
    </div>
  );
};

export default AdminPage;
