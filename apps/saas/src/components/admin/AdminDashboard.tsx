import React, { useMemo, useState } from 'react';

export type AdminTrialStatus = 'active' | 'expired' | 'none';
export type AdminSubscriptionStatus = 'active' | 'past_due' | 'inactive';
export type AdminCampaignStatus = 'pending' | 'sent' | 'failed' | 'replied' | 'interested';
export type AdminSection = 'overview' | 'users' | 'campaigns' | 'directory';

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
  activeSection?: AdminSection;
  onSectionChange?: (section: AdminSection) => void;
  hideNavigation?: boolean;
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });
const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
};

const trialLabels: Record<AdminTrialStatus, string> = { active: 'Trial ativo', expired: 'Trial encerrado', none: 'Sem trial' };
const subscriptionLabels: Record<AdminSubscriptionStatus, string> = { active: 'Assinante', past_due: 'Pagamento pendente', inactive: 'Sem assinatura' };
const campaignLabels: Record<AdminCampaignStatus, string> = { pending: 'Pendente', sent: 'Enviado', failed: 'Falhou', replied: 'Respondeu', interested: 'Com interesse' };
const campaignStyles: Record<AdminCampaignStatus, string> = {
  pending: 'bg-[#FFF8E7] text-[#966C11] ring-[#F2D58A]', sent: 'bg-[#EFF8FF] text-[#175CD3] ring-[#B2DDFF]',
  failed: 'bg-[#FEF3F2] text-[#B42318] ring-[#FECDCA]', replied: 'bg-[#F4F3FF] text-[#5925DC] ring-[#D9D6FE]', interested: 'bg-[#ECFDF3] text-[#15803D] ring-[#BBF7D0]',
};
const trialStyles: Record<AdminTrialStatus, string> = { active: 'bg-[#ECFDF3] text-[#15803D] ring-[#BBF7D0]', expired: 'bg-[#FEF3F2] text-[#B42318] ring-[#FECDCA]', none: 'bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]' };
const subscriptionStyles: Record<AdminSubscriptionStatus, string> = { active: 'bg-[#FFF8E7] text-[#8A6A11] ring-[#F2D58A]', past_due: 'bg-[#FEF3F2] text-[#B42318] ring-[#FECDCA]', inactive: 'bg-[#F3F4F6] text-[#4B5563] ring-[#E5E7EB]' };

const navItems: Array<{ key: AdminSection; label: string; description: string; icon: string }> = [
  { key: 'overview', label: 'Visão geral', description: 'Resumo da operação', icon: 'space_dashboard' },
  { key: 'users', label: 'Usuários', description: 'Contas e suporte', icon: 'group' },
  { key: 'campaigns', label: 'Barbearias disparadas', description: 'Envios e respostas', icon: 'campaign' },
  { key: 'directory', label: 'Buscador de barbearias', description: 'Novos contatos por cidade', icon: 'location_city' },
];

const statCards: Array<{ key: keyof AdminMetrics; label: string; icon: string; iconClass: string }> = [
  { key: 'totalUsers', label: 'Usuários cadastrados', icon: 'group', iconClass: 'bg-[#FFF8E7] text-[#9A7417]' },
  { key: 'activeTrials', label: 'Trials ativos', icon: 'hourglass_top', iconClass: 'bg-[#EFF8FF] text-[#175CD3]' },
  { key: 'subscribers', label: 'Assinantes', icon: 'workspace_premium', iconClass: 'bg-[#ECFDF3] text-[#15803D]' },
  { key: 'connectedWhatsApp', label: 'WhatsApp conectado', icon: 'chat', iconClass: 'bg-[#F4F3FF] text-[#5925DC]' },
];

const statusPill = (label: string, className: string) => <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ring-1 ring-inset ${className}`}>{label}</span>;

const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users = [], campaigns = [], metrics, loading = false, error = null, onRetry, onSelectUser, onCreateCampaign,
  activeSection: controlledSection, onSectionChange, hideNavigation = false, className = '',
}) => {
  const [localSection, setLocalSection] = useState<AdminSection>('overview');
  const activeSection = controlledSection ?? localSection;
  const selectSection = (section: AdminSection) => { setLocalSection(section); onSectionChange?.(section); };
  const derivedMetrics: AdminMetrics = metrics ?? {
    totalUsers: users.length, activeTrials: users.filter((user) => user.trialStatus === 'active').length,
    subscribers: users.filter((user) => user.subscriptionStatus === 'active').length,
    connectedWhatsApp: users.filter((user) => user.whatsappConnected).length,
    pendingCampaigns: campaigns.filter((campaign) => campaign.status === 'pending').length,
    interestedLeads: campaigns.filter((campaign) => campaign.status === 'interested').length,
  };

  const activeNav = useMemo(() => navItems.find((item) => item.key === activeSection) ?? navItems[0], [activeSection]);

  if (loading) return <main className={`space-y-6 text-[#1A1A1F] ${className}`} aria-busy="true" aria-live="polite"><div className="h-32 animate-pulse rounded-3xl border border-[#E8E5DD] bg-white" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map((card) => <div key={card.key} className="h-28 animate-pulse rounded-2xl border border-[#E8E5DD] bg-white" />)}</div><div className="h-96 animate-pulse rounded-2xl border border-[#E8E5DD] bg-white" /><p className="text-center text-sm text-[#6B7280]">Carregando central de controle…</p></main>;
  if (error) return <main className={`flex min-h-[24rem] items-center justify-center px-4 text-[#1A1A1F] ${className}`}><section className="w-full max-w-lg rounded-3xl border border-[#FECDCA] bg-white p-8 text-center shadow-[0_12px_40px_rgba(26,26,31,0.06)]" role="alert"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FEF3F2] text-[#B42318]"><span className="material-symbols-outlined" aria-hidden="true">error</span></div><h1 className="mt-4 text-xl font-extrabold">Não foi possível carregar o painel</h1><p className="mt-2 text-sm leading-6 text-[#6B7280]">{error}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#D4AF37] px-5 text-sm font-bold text-[#1A1A1F] transition hover:bg-[#B89222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2">Tentar novamente</button>}</section></main>;

  const renderMetrics = () => <section aria-labelledby="admin-metrics-title"><div className="mb-3 flex items-center justify-between gap-4"><h2 id="admin-metrics-title" className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#6B7280]">Visão geral</h2><span className="text-xs text-[#9CA3AF]">Dados prontos para integração</span></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCards.map((card) => <article key={card.key} className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,31,0.04)]"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-[#6B7280]">{card.label}</p><p className="mt-3 text-3xl font-extrabold tracking-[-0.04em]">{derivedMetrics[card.key]}</p></div><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}><span className="material-symbols-outlined" aria-hidden="true">{card.icon}</span></span></div></article>)}</div></section>;

  const renderUsers = () => <section className="rounded-2xl border border-[#E8E5DD] bg-white shadow-[0_8px_24px_rgba(26,26,31,0.04)]" aria-labelledby="admin-users-title"><div className="flex flex-col gap-3 border-b border-[#F0EEE8] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 id="admin-users-title" className="text-lg font-extrabold">Usuários da plataforma</h2><p className="mt-1 text-sm text-[#6B7280]">Abra uma conta para visualizar configurações e prestar suporte.</p></div><span className="w-fit rounded-full bg-[#F8F6F0] px-3 py-1.5 text-xs font-bold text-[#6B7280]">{derivedMetrics.totalUsers} registros</span></div>{users.length === 0 ? <div className="px-6 py-14 text-center"><span className="material-symbols-outlined text-4xl text-[#C8C4B9]" aria-hidden="true">group_off</span><p className="mt-3 font-bold">Nenhum usuário cadastrado</p><p className="mt-1 text-sm text-[#6B7280]">Quando a base estiver disponível, os registros aparecerão aqui.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><caption className="sr-only">Lista de usuários cadastrados no BarberZap</caption><thead><tr className="border-b border-[#F0EEE8] text-[10px] uppercase tracking-[0.12em] text-[#9CA3AF]"><th scope="col" className="px-6 py-4 font-extrabold">Usuário</th><th scope="col" className="px-4 py-4 font-extrabold">Criado em</th><th scope="col" className="px-4 py-4 font-extrabold">Trial</th><th scope="col" className="px-4 py-4 font-extrabold">Assinatura</th><th scope="col" className="px-4 py-4 font-extrabold">WhatsApp</th><th scope="col" className="px-6 py-4 text-right font-extrabold">Ação</th></tr></thead><tbody className="divide-y divide-[#F5F3EE]">{users.map((user) => <tr key={user.id} className="transition hover:bg-[#FFFCF5]"><td className="px-6 py-4"><div className="flex min-w-0 items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF8E7] text-xs font-extrabold text-[#9A7417]" aria-hidden="true">{user.name.trim().slice(0, 1).toUpperCase() || '?'}</span><div className="min-w-0"><p className="truncate font-bold">{user.name}</p><p className="max-w-[240px] truncate text-xs text-[#6B7280]">{user.email}</p></div></div></td><td className="whitespace-nowrap px-4 py-4 text-[#6B7280]">{formatDate(user.createdAt)}</td><td className="px-4 py-4"><div className="space-y-1">{statusPill(trialLabels[user.trialStatus], trialStyles[user.trialStatus])}<p className="text-[11px] text-[#9CA3AF]">{user.trialStatus === 'active' ? `até ${formatDate(user.trialEndsAt)}` : user.trialStatus === 'expired' ? `encerrou em ${formatDate(user.trialEndsAt)}` : 'não iniciado'}</p></div></td><td className="px-4 py-4"><div className="space-y-1">{statusPill(subscriptionLabels[user.subscriptionStatus], subscriptionStyles[user.subscriptionStatus])}<p className="text-[11px] text-[#9CA3AF]">{user.subscriptionStatus === 'active' ? `desde ${formatDate(user.subscriptionStartedAt)}` : '—'}</p></div></td><td className="px-4 py-4">{user.whatsappConnected ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#15803D]"><span className="h-2 w-2 rounded-full bg-[#22C55E]" aria-hidden="true" />Conectado</span> : <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#9CA3AF]"><span className="h-2 w-2 rounded-full bg-[#D1D5DB]" aria-hidden="true" />Desconectado</span>}</td><td className="px-6 py-4 text-right">{onSelectUser ? <button type="button" onClick={() => onSelectUser(user)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#E8D9AE] px-3 text-xs font-bold text-[#8A6A11] transition hover:bg-[#FFF8E7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2"><span className="material-symbols-outlined text-base" aria-hidden="true">manage_accounts</span>Ver configurações</button> : <span className="text-xs text-[#9CA3AF]">—</span>}</td></tr>)}</tbody></table></div>}</section>;

  const renderCampaigns = () => <section className="rounded-2xl border border-[#E8E5DD] bg-white shadow-[0_8px_24px_rgba(26,26,31,0.04)]" aria-labelledby="admin-campaigns-title"><div className="flex flex-col gap-3 border-b border-[#F0EEE8] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div><h2 id="admin-campaigns-title" className="text-lg font-extrabold">Barbearias disparadas</h2><p className="mt-1 text-sm text-[#6B7280]">Acompanhe envio, falha, resposta e interesse de cada contato.</p></div>{onCreateCampaign && <button type="button" onClick={onCreateCampaign} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 text-xs font-extrabold text-[#1A1A1F] transition hover:bg-[#B89222] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2"><span className="material-symbols-outlined text-base" aria-hidden="true">add</span>Nova campanha</button>}</div>{campaigns.length === 0 ? <div className="px-6 py-14 text-center"><span className="material-symbols-outlined text-4xl text-[#C8C4B9]" aria-hidden="true">campaign</span><p className="mt-3 font-bold">Nenhum disparo registrado</p><p className="mt-1 text-sm text-[#6B7280]">Os resultados de campanhas aparecerão aqui.</p></div> : <div className="divide-y divide-[#F5F3EE]">{campaigns.map((campaign) => <article key={campaign.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{campaign.barberShopName}</p>{statusPill(campaignLabels[campaign.status], campaignStyles[campaign.status])}</div><p className="mt-1 text-xs text-[#6B7280]">{campaign.city} · {campaign.dispatchedAt ? formatDate(campaign.dispatchedAt) : 'Ainda não disparado'}</p></div><span className="text-xs text-[#9CA3AF]">#{campaign.id}</span></article>)}</div>}</section>;

  const renderDirectory = () => <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]" aria-labelledby="admin-directory-title"><div className="rounded-2xl border border-[#E8D9AE] bg-[#FFFCF5] p-6 shadow-[0_8px_24px_rgba(137,100,23,0.06)] sm:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0C2] text-[#9A7417]"><span className="material-symbols-outlined" aria-hidden="true">location_city</span></div><h2 id="admin-directory-title" className="mt-5 text-xl font-extrabold">Buscar novas barbearias</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#6B7280]">Informe uma cidade para preparar uma nova lista de contatos. O envio só fica disponível depois de configurar provedor, consentimento e regras de segurança.</p><label className="mt-6 block text-xs font-extrabold uppercase tracking-[0.1em] text-[#6B7280]" htmlFor="admin-search-city">Cidade</label><div className="mt-2 flex flex-col gap-3 sm:flex-row"><input id="admin-search-city" type="text" placeholder="Ex.: São Paulo, SP" className="min-h-11 flex-1 rounded-xl border border-[#E8E5DD] bg-white px-4 text-sm text-[#1A1A1F] outline-none transition placeholder:text-[#A6A29A] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20" /><button type="button" disabled className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#E7E2D6] px-5 text-sm font-extrabold text-[#8D887E]" title="Integração de busca ainda não configurada"><span className="material-symbols-outlined text-base" aria-hidden="true">search</span>Buscar barbearias</button></div><p className="mt-3 text-xs text-[#8D887E]">A busca ficará habilitada quando o provedor de dados for definido.</p></div><aside className="rounded-2xl border border-[#E8E5DD] bg-white p-5 shadow-[0_8px_24px_rgba(26,26,31,0.04)]"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#9A7417]">Próxima etapa</p><h3 className="mt-3 font-extrabold">Operação responsável</h3><ul className="mt-4 space-y-3 text-xs leading-5 text-[#6B7280]"><li className="flex gap-2"><span className="material-symbols-outlined text-base text-[#9A7417]" aria-hidden="true">verified_user</span>Registrar origem e consentimento.</li><li className="flex gap-2"><span className="material-symbols-outlined text-base text-[#9A7417]" aria-hidden="true">send</span>Revisar a mensagem antes do envio.</li><li className="flex gap-2"><span className="material-symbols-outlined text-base text-[#9A7417]" aria-hidden="true">analytics</span>Acompanhar respostas e interesse.</li></ul></aside></section>;

  return <main className={`text-[#1A1A1F] ${className}`}><div className="flex flex-col gap-6 lg:flex-row lg:items-start">{!hideNavigation && <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-64" aria-label="Navegação administrativa"><div className="rounded-3xl border border-[#E8D9AE] bg-white p-3 shadow-[0_12px_34px_rgba(26,26,31,0.06)]"><div className="hidden items-center gap-3 px-3 pb-4 pt-2 lg:flex"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1A1A1F] text-[#D4AF37]"><span className="material-symbols-outlined" aria-hidden="true">shield_person</span></span><div><p className="text-sm font-extrabold">BarberZap</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9A7417]">Admin</p></div></div><nav className="flex gap-1 overflow-x-auto lg:block lg:space-y-1" role="tablist" aria-label="Seções do painel">{navItems.map((item) => <button key={item.key} type="button" role="tab" aria-selected={activeSection === item.key} onClick={() => selectSection(item.key)} className={`group flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2 lg:w-full ${activeSection === item.key ? 'bg-[#1A1A1F] text-white shadow-[0_6px_16px_rgba(26,26,31,0.14)]' : 'text-[#6B7280] hover:bg-[#FFFCF5] hover:text-[#1A1A1F]'}`}><span className={`material-symbols-outlined text-[20px] ${activeSection === item.key ? 'text-[#D4AF37]' : 'text-[#9A7417]'}`} aria-hidden="true">{item.icon}</span><span className="min-w-0"><span className="block whitespace-nowrap text-xs font-extrabold lg:whitespace-normal">{item.label}</span><span className={`hidden text-[10px] lg:block ${activeSection === item.key ? 'text-white/60' : 'text-[#9CA3AF]'}`}>{item.description}</span></span></button>)}</nav><div className="mt-4 hidden items-start gap-2 border-t border-[#F0EEE8] px-3 pt-4 text-[10px] leading-4 text-[#9CA3AF] lg:flex"><span className="material-symbols-outlined text-sm text-[#9A7417]" aria-hidden="true">lock</span><span>Área restrita. Alterações sensíveis exigem confirmação.</span></div></div></aside>}<div className="min-w-0 flex-1 space-y-6"><header className="relative overflow-hidden rounded-3xl border border-[#E8D9AE] bg-[linear-gradient(120deg,#FFF8E7_0%,#FFFFFF_60%,#F8F6F0_100%)] px-5 py-6 shadow-[0_16px_44px_rgba(137,100,23,0.08)] sm:px-8 sm:py-7"><div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" /><div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#9A7417]">BarberZap · controle interno</p><h1 className="text-2xl font-extrabold tracking-[-0.03em] sm:text-3xl">{activeNav.label}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">{activeNav.description}. Organize a operação com clareza e segurança.</p></div><div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#E8D9AE] bg-white/80 px-3 py-2 text-xs font-bold text-[#8A6A11]" aria-label="Área restrita ao administrador"><span className="material-symbols-outlined text-base" aria-hidden="true">shield_lock</span>Área restrita</div></div></header>{activeSection === 'overview' && <div className="space-y-6">{renderMetrics()}<div className="grid gap-4 lg:grid-cols-2"><button type="button" onClick={() => selectSection('users')} className="group rounded-2xl border border-[#E8E5DD] bg-white p-5 text-left shadow-[0_8px_24px_rgba(26,26,31,0.04)] transition hover:-translate-y-0.5 hover:border-[#E8D9AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2"><span className="material-symbols-outlined text-[#9A7417]" aria-hidden="true">manage_accounts</span><h2 className="mt-3 font-extrabold">Apoiar usuários</h2><p className="mt-1 text-sm text-[#6B7280]">Visualize configurações salvas e abra uma conta para suporte.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#8A6A11]">Ir para usuários <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span></span></button><button type="button" onClick={() => selectSection('campaigns')} className="group rounded-2xl border border-[#E8E5DD] bg-white p-5 text-left shadow-[0_8px_24px_rgba(26,26,31,0.04)] transition hover:-translate-y-0.5 hover:border-[#E8D9AE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7417] focus-visible:ring-offset-2"><span className="material-symbols-outlined text-[#9A7417]" aria-hidden="true">campaign</span><h2 className="mt-3 font-extrabold">Acompanhar disparos</h2><p className="mt-1 text-sm text-[#6B7280]">Confira contatos pendentes, respostas e oportunidades.</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-[#8A6A11]">Ver campanhas <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_forward</span></span></button></div></div>}{activeSection === 'users' && renderUsers()}{activeSection === 'campaigns' && renderCampaigns()}{activeSection === 'directory' && renderDirectory()}</div></div></main>;
};

export default AdminDashboard;
