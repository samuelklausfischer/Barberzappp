import React from 'react';

export type AdminTrialStatus = 'active' | 'expired' | 'none';
export type AdminSubscriptionStatus = 'active' | 'past_due' | 'inactive';
export type AdminCampaignStatus = 'pending' | 'sent' | 'failed' | 'replied' | 'interested';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  trialStatus: AdminTrialStatus;
  trialEndsAt?: string | null;
  subscriptionStatus: AdminSubscriptionStatus;
  subscriptionStartedAt?: string | null;
  whatsappConnected: boolean;
}

export interface AdminCampaign {
  id: string;
  barberShopName: string;
  city: string;
  status: AdminCampaignStatus;
  dispatchedAt?: string | null;
}

export interface AdminMetrics {
  totalUsers: number;
  activeTrials: number;
  subscribers: number;
  connectedWhatsApp: number;
  pendingCampaigns: number;
  interestedLeads: number;
}

export interface AdminDashboardProps {
  users?: AdminUser[];
  campaigns?: AdminCampaign[];
  metrics?: AdminMetrics;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onSelectUser?: (user: AdminUser) => void;
  onCreateCampaign?: () => void;
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'medium',
});

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
};

const trialLabels: Record<AdminTrialStatus, string> = {
  active: 'Trial ativo',
  expired: 'Trial encerrado',
  none: 'Sem trial',
};

const subscriptionLabels: Record<AdminSubscriptionStatus, string> = {
  active: 'Assinante',
  past_due: 'Pagamento pendente',
  inactive: 'Sem assinatura',
};

const campaignLabels: Record<AdminCampaignStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  failed: 'Falhou',
  replied: 'Respondeu',
  interested: 'Com interesse',
};

const campaignStyles: Record<AdminCampaignStatus, string> = {
  pending: 'bg-[#FFF8E7] text-[#966C11] ring-[#F2D58A]',
  sent: 'bg-[#EFF8FF] text-[#175CD3] ring-[#B2DDFF]',
  failed: 'bg-[#FEF3F2] text-[#B42318] ring-[#FECDCA]',
  replied: 'bg-[#F4F3FF] text-[#5925DC] ring-[#D9D6FE]',
  interested: 'bg-[#ECFDF3] text-[#15803D] ring-[#BBF7D0]',
};

const trialStyles: Record<AdminTrialStatus, string> = {
  active: 'bg-[#ECFDF3] text-[#15803D] ring-[#BBF7D0]',
  expired: 'bg-[#FEF3F2] text-[#B42318] ring-[#FECDCA]',
  none: 'bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]',
};

const subscriptionStyles: Record<AdminSubscriptionStatus, string> = {
  active: 'bg-[#FFF8E7] text-[#8A6A11] ring-[#F2D58A]',
  past_due: 'bg-[#FEF3F2] text-[#B42318] ring-[#FECDCA]',
  inactive: 'bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]',
};

const statCards: Array<{
  key: keyof AdminMetrics;
  label: string;
  icon: string;
  iconClass: string;
}> = [
  { key: 'totalUsers', label: 'Usuários cadastrados', icon: 'group', iconClass: 'bg-[#FFF8E7] text-[#9A7417]' },
  { key: 'activeTrials', label: 'Trials ativos', icon: 'hourglass_top', iconClass: 'bg-[#EFF8FF] text-[#175CD3]' },
  { key: 'subscribers', label: 'Assinantes', icon: 'workspace_premium', iconClass: 'bg-[#ECFDF3] text-[#15803D]' },
  { key: 'connectedWhatsApp', label: 'WhatsApp conectado', icon: 'chat', iconClass: 'bg-[#F4F3FF] text-[#5925DC]' },
];

const statusPill = (label: string, className: string) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset ${className}`}>
    {label}
  </span>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users = [],
  campaigns = [],
  metrics,
  loading = false,
  error = null,
  onRetry,
  onSelectUser,
  onCreateCampaign,
  className = '',
}) => {
  const derivedMetrics: AdminMetrics = metrics ?? {
    totalUsers: users.length,
    activeTrials: users.filter((user) => user.trialStatus === 'active').length,
    subscribers: users.filter((user) => user.subscriptionStatus === 'active').length,
    connectedWhatsApp: users.filter((user) => user.whatsappConnected).length,
    pendingCampaigns: campaigns.filter((campaign) => campaign.status === 'pending').length,
    interestedLeads: campaigns.filter((campaign) => campaign.status === 'interested').length,
  };

  if (loading) {
    return (
      <main className={`space-y-6 text-[#1A1A1F] ${className}`} aria-busy="true" aria-live="polite">
        <div className="h-32 animate-pulse rounded-3xl border border-[#E8E5DD] bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => <div key={card.key} className="h-28 animate-pulse rounded-2xl border border-[#E8E5DD] bg-white" />)}
        </div>
        <div className="h-96 animate-pulse rounded-2xl border border-[#E8E5DD] bg-white" />
        <p className="text-center text-sm text-[#6B7280]">Carregando central de controle…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={`flex min-h-[24rem] items-center justify-center px-4 text-[#1A1A1F] ${className}`}>
        <section className="w-full max-w-lg rounded-3xl border border-[#FECDCA] bg-white p-8 text-center shadow-[0_12px_40px_rgba(26,26,31,0.06)]" role="alert">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF3F2] text-[#B42318]">
            <span className="material-symbols-outlined" aria-hidden="true">error</span>
          </div>
          <h1 className="mt-4 text-xl font-extrabold">Não foi possível carregar o painel</h1>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">{error}</p>
          {onRetry && <button type="button" onClick={onRetry} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-5 text-sm font-bold text-[#1A1A1F] transition hover:bg-[#B89222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2">Tentar novamente</button>}
        </section>
      </main>
    );
  }

  return (
    <main className={`space-y-6 text-[#1A1A1F] ${className}`}>
      <header className="relative overflow-hidden rounded-3xl border border-[#E8D9AE] bg-[linear-gradient(120deg,#FFF8E7_0%,#FFFFFF_60%,#F8F6F0_100%)] px-5 py-6 shadow-[0_16px_44px_rgba(137,100,23,0.08)] sm:px-8 sm:py-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9A7417]">BarberZap · controle interno</p>
            <h1 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">Central de operações</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">Acompanhe a base, apoie cada barbearia e organize os próximos contatos em um único lugar.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8D9AE] bg-white/80 px-3 py-2 text-xs font-bold text-[#8A6A11]" aria-label="Área restrita ao administrador">
            <span className="material-symbols-outlined text-base" aria-hidden="true">shield_lock</span>
            Área restrita
          </div>
        </div>
      </header>

      <section aria-labelledby="admin-metrics-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 id="admin-metrics-title" className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B7280]">Visão geral</h2>
          <span className="text-xs text-[#9CA3AF]">Dados prontos para integração</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <article key={card.key} className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-[#6B7280]">{card.label}</p>
                  <p className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">{derivedMetrics[card.key]}</p>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}><span className="material-symbols-outlined" aria-hidden="true">{card.icon}</span></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8E5DD] bg-white shadow-[0_8px_24px_rgba(26,26,31,0.04)]" aria-labelledby="admin-users-title">
        <div className="flex flex-col gap-3 border-b border-[#F0EEE8] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 id="admin-users-title" className="text-lg font-extrabold">Usuários da plataforma</h2><p className="mt-1 text-sm text-[#6B7280]">Acompanhe ciclo de acesso, assinatura e suporte.</p></div>
          <span className="w-fit rounded-full bg-[#F8F6F0] px-3 py-1.5 text-xs font-bold text-[#6B7280]">{derivedMetrics.totalUsers} registros</span>
        </div>
        {users.length === 0 ? (
          <div className="px-6 py-14 text-center"><span className="material-symbols-outlined text-4xl text-[#C8C4B9]" aria-hidden="true">group_off</span><p className="mt-3 font-bold">Nenhum usuário cadastrado</p><p className="mt-1 text-sm text-[#6B7280]">Quando a base estiver disponível, os registros aparecerão aqui.</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <caption className="sr-only">Lista de usuários cadastrados no BarberZap</caption>
              <thead><tr className="border-b border-[#F0EEE8] text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF]"><th scope="col" className="px-6 py-4 font-extrabold">Usuário</th><th scope="col" className="px-4 py-4 font-extrabold">Criado em</th><th scope="col" className="px-4 py-4 font-extrabold">Trial</th><th scope="col" className="px-4 py-4 font-extrabold">Assinatura</th><th scope="col" className="px-4 py-4 font-extrabold">WhatsApp</th><th scope="col" className="px-6 py-4 text-right font-extrabold">Ação</th></tr></thead>
              <tbody className="divide-y divide-[#F5F3EE]">
                {users.map((user) => (
                  <tr key={user.id} className="transition hover:bg-[#FFFCF5]">
                    <td className="px-6 py-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF8E7] text-xs font-extrabold text-[#9A7417]" aria-hidden="true">{user.name.trim().slice(0, 1).toUpperCase() || '?'}</span><div className="min-w-0"><p className="truncate font-bold">{user.name}</p><p className="max-w-[240px] truncate text-xs text-[#6B7280]">{user.email}</p></div></div></td>
                    <td className="whitespace-nowrap px-4 py-4 text-[#6B7280]">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-4"><div className="space-y-1">{statusPill(trialLabels[user.trialStatus], trialStyles[user.trialStatus])}<p className="text-[11px] text-[#9CA3AF]">{user.trialStatus === 'active' ? `até ${formatDate(user.trialEndsAt)}` : user.trialStatus === 'expired' ? `encerrou em ${formatDate(user.trialEndsAt)}` : 'não iniciado'}</p></div></td>
                    <td className="px-4 py-4"><div className="space-y-1">{statusPill(subscriptionLabels[user.subscriptionStatus], subscriptionStyles[user.subscriptionStatus])}<p className="text-[11px] text-[#9CA3AF]">{user.subscriptionStatus === 'active' ? `desde ${formatDate(user.subscriptionStartedAt)}` : '—'}</p></div></td>
                    <td className="px-4 py-4">{user.whatsappConnected ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D]"><span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden="true" />Conectado</span> : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9CA3AF]"><span className="h-2 w-2 rounded-full bg-[#D1D5DB]" aria-hidden="true" />Desconectado</span>}</td>
                    <td className="px-6 py-4 text-right">{onSelectUser ? <button type="button" onClick={() => onSelectUser(user)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#E8D9AE] px-3 text-xs font-bold text-[#8A6A11] transition hover:bg-[#FFF8E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2"><span className="material-symbols-outlined text-base" aria-hidden="true">manage_accounts</span>Ver detalhes</button> : <span className="text-xs text-[#9CA3AF]">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]" aria-labelledby="admin-campaigns-title">
        <div className="rounded-2xl border border-[#E8E5DD] bg-white shadow-[0_8px_24px_rgba(26,26,31,0.04)]">
          <div className="flex flex-col gap-3 border-b border-[#F0EEE8] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 id="admin-campaigns-title" className="text-lg font-extrabold">Campanhas e contatos</h2><p className="mt-1 text-sm text-[#6B7280]">Acompanhe o resultado de cada abordagem.</p></div>{onCreateCampaign && <button type="button" onClick={onCreateCampaign} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-xs font-extrabold text-[#1A1A1F] transition hover:bg-[#B89222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2"><span className="material-symbols-outlined text-base" aria-hidden="true">add</span>Nova campanha</button>}</div>
          {campaigns.length === 0 ? <div className="px-6 py-14 text-center"><span className="material-symbols-outlined text-4xl text-[#C8C4B9]" aria-hidden="true">campaign</span><p className="mt-3 font-bold">Nenhum disparo registrado</p><p className="mt-1 text-sm text-[#6B7280]">Os resultados de campanhas aparecerão aqui.</p></div> : <div className="divide-y divide-[#F5F3EE]">{campaigns.map((campaign) => <article key={campaign.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate font-bold">{campaign.barberShopName}</p>{statusPill(campaignLabels[campaign.status], campaignStyles[campaign.status])}</div><p className="mt-1 text-xs text-[#6B7280]">{campaign.city} · {campaign.dispatchedAt ? formatDate(campaign.dispatchedAt) : 'Ainda não disparado'}</p></div><span className="text-xs text-[#9CA3AF]">#{campaign.id}</span></article>)}</div>}
        </div>

        <aside className="rounded-2xl border border-[#E8D9AE] bg-[#FFFCF5] p-5 shadow-[0_8px_24px_rgba(137,100,23,0.06)] sm:p-6" aria-labelledby="admin-dispatch-title">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0C2] text-[#9A7417]"><span className="material-symbols-outlined" aria-hidden="true">lock</span></div>
          <h2 id="admin-dispatch-title" className="mt-4 text-lg font-extrabold">Disparos externos protegidos</h2>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">A busca de novas barbearias e o envio de mensagens serão habilitados somente após configurar provedor, consentimento e regras de segurança.</p>
          <div className="mt-5 space-y-3 text-xs font-bold text-[#6B7280]"><div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-[#9A7417]" aria-hidden="true">location_city</span>Buscar por cidade</div><div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-[#9A7417]" aria-hidden="true">send</span>Registrar cada envio</div><div className="flex items-center gap-2"><span className="material-symbols-outlined text-base text-[#9A7417]" aria-hidden="true">forum</span>Classificar resposta e interesse</div></div>
          <div className="mt-6 flex items-center justify-between border-t border-[#F2E7C5] pt-4 text-xs"><span className="font-bold text-[#6B7280]">Pendentes</span><span className="font-extrabold text-[#8A6A11]">{derivedMetrics.pendingCampaigns}</span></div>
          <div className="mt-2 flex items-center justify-between text-xs"><span className="font-bold text-[#6B7280]">Com interesse</span><span className="font-extrabold text-[#15803D]">{derivedMetrics.interestedLeads}</span></div>
        </aside>
      </section>
    </main>
  );
};

export default AdminDashboard;
