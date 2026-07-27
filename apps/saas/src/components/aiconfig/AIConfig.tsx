import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/infrastructure/supabase/client';

type Tone = 'formal' | 'amigavel' | 'descolado';
type BusinessHour = { day: number; label: string; isOpen: boolean; open: string; close: string };
type TenantConfig = { id: string; timezone: string | null; prompt_tone?: string | null; prompt_business_rules?: string | null; business_hours?: unknown; booking_interval_minutes?: number | null; whatsapp_status?: string | null };
const DAYS = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
const DEFAULT_HOURS: BusinessHour[] = DAYS.map((label, day) => ({ day, label, isOpen: day < 5, open: '09:00', close: '18:00' }));
const TONES = [
  { value: 'formal' as Tone, label: 'Formal', description: 'Objetivo, elegante e sem gírias.', sample: 'Claro. Vou verificar os horários disponíveis.', icon: 'business_center' },
  { value: 'amigavel' as Tone, label: 'Amigável', description: 'Acolhedor, profissional e próximo.', sample: 'Perfeito! Vou encontrar um horário confortável.', icon: 'waving_hand' },
  { value: 'descolado' as Tone, label: 'Descolado', description: 'Leve, moderno e com energia.', sample: 'Boa! Já vou olhar um horário que encaixa bem.', icon: 'bolt' },
];
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const normalizeHours = (value: unknown): BusinessHour[] => {
  if (!Array.isArray(value)) return DEFAULT_HOURS.map((item) => ({ ...item }));
  return DAYS.map((label, day) => {
    const row = value.find((candidate) => candidate && typeof candidate === 'object' && Number((candidate as Record<string, unknown>).day ?? (candidate as Record<string, unknown>).day_of_week) === day) as Record<string, unknown> | undefined;
    return { day, label, isOpen: row?.isOpen !== false && row?.is_active !== false, open: text(row?.open ?? row?.start_time) || '09:00', close: text(row?.close ?? row?.end_time) || '18:00' };
  });
};

const formatHoursForAI = (hours: BusinessHour[]): string =>
  hours.map((item) => `${item.label}: ${item.isOpen ? `${item.open}–${item.close}` : 'fechado'}`).join('; ');
const AIConfig: React.FC = () => {
  const { user, profile, tenant, refreshSession } = useAuth();
  const config = tenant as TenantConfig | null;
  const [tone, setTone] = useState<Tone>('amigavel');
  const [assistantName, setAssistantName] = useState('');
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [hours, setHours] = useState(DEFAULT_HOURS.map((item) => ({ ...item })));
  const [interval, setInterval] = useState(30);
  const [serviceCount, setServiceCount] = useState(0);
  const [completeServices, setCompleteServices] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!config || !profile) return;
    setAssistantName(profile.ai_assistant_name || ''); setAddress(profile.business_address || '');
    setTone(TONES.some((item) => item.value === config.prompt_tone) ? (config.prompt_tone as Tone) : 'amigavel');
    setInstructions(config.prompt_business_rules || ''); setHours(normalizeHours(config.business_hours));
    setInterval(Math.min(120, Math.max(5, Number(config.booking_interval_minutes) || 30)));
  }, [config, profile]);

  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [services, barbers, whatsapp] = await Promise.all([
        supabase.from('services').select('id,name,price,duration_minutes,active,status').eq('tenant_id', config.id),
        supabase.from('barbers').select('id,name,active,status').eq('tenant_id', config.id),
        supabase.from('whatsapp_connections').select('id,status').eq('tenant_id', config.id),
      ]);
      if (cancelled) return;
      const serviceRows = (services.data || []).filter((row) => row.active !== false && row.status !== 'inactive');
      setServiceCount(serviceRows.length);
      setCompleteServices(serviceRows.filter((row) => Boolean(row.name?.trim()) && row.price != null && row.duration_minutes != null).length);
      setStaffCount((barbers.data || []).filter((row) => row.active !== false && row.status !== 'inactive').length);
      const tenantStatus = String(config.whatsapp_status || '').toLowerCase();
      const connected = (whatsapp.data || []).some((row) => ['connected', 'online', 'open', 'active'].includes(String(row.status || '').toLowerCase()));
      setWhatsappConnected(connected || ['connected', 'online', 'open', 'active'].includes(tenantStatus));
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [config]);
  const checklist = useMemo(() => [
    { label: 'Endereço da barbearia', done: Boolean(address.trim()), hint: 'A IA usa para confirmar a localização.', href: '/settings', icon: 'location_on' },
    { label: 'Serviços com preço e duração', done: serviceCount > 0 && completeServices === serviceCount, hint: serviceCount === 0 ? 'Cadastre pelo menos um serviço.' : `${completeServices} de ${serviceCount} prontos.`, href: '/services', icon: 'content_cut' },
    { label: 'Profissionais cadastrados', done: staffCount > 0, hint: staffCount > 0 ? `${staffCount} profissional(is) ativo(s).` : 'A IA precisa saber quem atende.', href: '/settings/team', icon: 'groups' },
    { label: 'Horário de funcionamento', done: hours.some((item) => item.isOpen), hint: 'Define quando a IA pode oferecer horários.', href: '#horarios', icon: 'schedule' },
    { label: 'WhatsApp conectado', done: whatsappConnected, hint: whatsappConnected ? 'A automação pode receber mensagens.' : 'Conecte o número para ativar o atendimento.', href: '/whatsapp', icon: 'chat' },
  ], [address, completeServices, hours, serviceCount, staffCount, whatsappConnected]);
  const updateHour = (day: number, update: Partial<BusinessHour>) => setHours((current) => current.map((item) => (item.day === day ? { ...item, ...update } : item)));

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!config || !user || saving) return;
    if (hours.some((item) => item.isOpen && item.open >= item.close)) {
      setMessage({ kind: 'error', text: 'Confira os horários: o fechamento deve ser depois da abertura.' });
      return;
    }
    setSaving(true); setMessage(null);
    const hoursText = formatHoursForAI(hours);
    const agentLookup = await supabase
      .from('agente_config')
      .select('id,metadata')
      .eq('tenant_id', config.id)
      .maybeSingle();
    if (agentLookup.error || !agentLookup.data) {
      setMessage({ kind: 'error', text: agentLookup.error?.message || 'A configuração da IA ainda não foi criada para esta barbearia.' });
      setSaving(false);
      return;
    }
    const currentMetadata = agentLookup.data.metadata && typeof agentLookup.data.metadata === 'object'
      ? agentLookup.data.metadata as Record<string, unknown>
      : {};
    const [profileResult, tenantResult, agentResult] = await Promise.all([
      supabase.from('profiles').update({ ai_assistant_name: assistantName.trim() || null, business_address: address.trim() || null }).eq('id', user.id),
      supabase.from('tenants').update({ prompt_tone: tone, prompt_business_rules: instructions.trim() || null, business_hours: hours, booking_interval_minutes: interval }).eq('id', config.id),
      supabase.from('agente_config').update({
        nome_ia: assistantName.trim() || 'Assistente',
        ai_name: assistantName.trim() || 'Assistente',
        nome_barbearia: profile.barbershop_name || null,
        name: profile.barbershop_name || null,
        endereco: address.trim() || null,
        address: address.trim() || null,
        horarios: hoursText,
        horario_funcionamento: hoursText,
        hours: hoursText,
        instructions: instructions.trim() || null,
        metadata: { ...currentMetadata, prompt_tone: tone, business_rules: instructions.trim() || '', booking_interval_minutes: interval },
      }).eq('id', agentLookup.data.id),
    ]);
    if (profileResult.error || tenantResult.error || agentResult.error) {
      setMessage({ kind: 'error', text: profileResult.error?.message || tenantResult.error?.message || agentResult.error?.message || 'Não foi possível salvar a configuração.' });
      setSaving(false); return;
    }
    await refreshSession();
    setMessage({ kind: 'success', text: 'Configuração da IA atualizada com sucesso.' });
    setSaving(false);
  };
  const reset = () => {
    if (!config || !profile) return;
    setAssistantName(profile.ai_assistant_name || ''); setAddress(profile.business_address || '');
    setTone(TONES.some((item) => item.value === config.prompt_tone) ? (config.prompt_tone as Tone) : 'amigavel');
    setInstructions(config.prompt_business_rules || ''); setHours(normalizeHours(config.business_hours));
    setInterval(Math.min(120, Math.max(5, Number(config.booking_interval_minutes) || 30))); setMessage(null);
  };
  if (!config) return <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8 text-sm text-[#6B7280]">Carregando a configuração da barbearia…</div>;

  return (
    <form onSubmit={handleSave} className="space-y-7 pb-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.17em] text-[#9A7417]">Automação inteligente</p><h1 className="text-3xl font-bold tracking-[-0.04em] text-[#1A1A1F] sm:text-4xl">Configuração da IA</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">Defina como sua assistente conversa e quais regras ela deve respeitar para agendar com segurança.</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={reset} className="min-h-11 rounded-full border border-[#D8D4CA] bg-white px-5 py-3 text-sm font-bold text-[#4B5563] transition hover:bg-[#FBFAF7]">Descartar alterações</button><button type="submit" disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#1A1A1F] transition hover:bg-[#B99220] disabled:cursor-not-allowed disabled:opacity-60"><span className="material-symbols-outlined text-lg" aria-hidden="true">{saving ? 'progress_activity' : 'save'}</span>{saving ? 'Salvando…' : 'Salvar configuração'}</button></div>
      </header>
      {message && <div role="status" className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.kind === 'success' ? 'border-[#BBE8CA] bg-[#F0FFF4] text-[#166534]' : 'border-[#F3C5C5] bg-[#FFF5F5] text-[#B42318]'}`}>{message.text}</div>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-[#E8E5DD] bg-white p-5 shadow-[0_12px_30px_rgba(26,26,31,0.04)] sm:p-7">
            <div className="mb-6 flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8E7] text-[#9A7417]"><span className="material-symbols-outlined">smart_toy</span></div><div><h2 className="text-lg font-bold text-[#1A1A1F]">Identidade da assistente</h2><p className="mt-1 text-sm leading-6 text-[#6B7280]">Um nome claro ajuda o cliente a entender com quem está falando.</p></div></div>
            <div className="grid gap-5 sm:grid-cols-2"><label className="block"><span className="mb-2 block text-sm font-bold text-[#1A1A1F]">Nome da IA</span><input value={assistantName} onChange={(event) => setAssistantName(event.target.value.slice(0, 50))} maxLength={50} placeholder="Ex.: Bia do BarberZap" className="min-h-12 w-full rounded-xl border border-[#D8D4CA] px-4 text-sm text-[#1A1A1F] outline-none transition focus:border-[#C29B2E] focus:ring-4 focus:ring-[#D4AF37]/15" /><span className="mt-1.5 block text-xs text-[#9CA3AF]">Será usado na saudação do WhatsApp.</span></label><label className="block"><span className="mb-2 block text-sm font-bold text-[#1A1A1F]">Endereço da barbearia</span><input value={address} onChange={(event) => setAddress(event.target.value.slice(0, 160))} maxLength={160} placeholder="Rua, número, bairro e cidade" className="min-h-12 w-full rounded-xl border border-[#D8D4CA] px-4 text-sm text-[#1A1A1F] outline-none transition focus:border-[#C29B2E] focus:ring-4 focus:ring-[#D4AF37]/15" /><span className="mt-1.5 block text-xs text-[#9CA3AF]">A IA informa a localização quando o cliente perguntar.</span></label></div>
          </section>
          <section className="rounded-3xl border border-[#E8E5DD] bg-white p-5 shadow-[0_12px_30px_rgba(26,26,31,0.04)] sm:p-7">
            <div className="mb-6 flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8E7] text-[#9A7417]"><span className="material-symbols-outlined">record_voice_over</span></div><div><h2 className="text-lg font-bold text-[#1A1A1F]">Personalidade da conversa</h2><p className="mt-1 text-sm leading-6 text-[#6B7280]">Escolha um estilo. A IA mantém os limites de agenda e negócio em qualquer opção.</p></div></div>
            <div className="grid gap-3 md:grid-cols-3" role="radiogroup" aria-label="Tom de voz da IA">{TONES.map((option) => <button key={option.value} type="button" role="radio" aria-checked={tone === option.value} onClick={() => setTone(option.value)} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${tone === option.value ? 'border-[#C29B2E] bg-[#FFFAEB] shadow-[0_8px_20px_rgba(212,175,55,0.14)]' : 'border-[#E8E5DD] bg-[#FBFCFD] hover:border-[#D4AF37]/60'}`}><div className="flex items-center justify-between"><span className={`material-symbols-outlined ${tone === option.value ? 'text-[#9A7417]' : 'text-[#9CA3AF]'}`}>{option.icon}</span>{tone === option.value && <span className="material-symbols-outlined text-lg text-[#9A7417]" aria-hidden="true">check_circle</span>}</div><p className="mt-3 font-bold text-[#1A1A1F]">{option.label}</p><p className="mt-1 text-xs leading-5 text-[#6B7280]">{option.description}</p><p className="mt-3 border-t border-current/10 pt-3 text-xs italic leading-5 text-[#8A6A11]">{option.sample}</p></button>)}</div>
          </section>
          <section className="rounded-3xl border border-[#E8E5DD] bg-white p-5 shadow-[0_12px_30px_rgba(26,26,31,0.04)] sm:p-7"><div className="mb-5 flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8E7] text-[#9A7417]"><span className="material-symbols-outlined">psychology</span></div><div><h2 className="text-lg font-bold text-[#1A1A1F]">Regras de atendimento</h2><p className="mt-1 text-sm leading-6 text-[#6B7280]">Registre orientações que a IA deve seguir, sem substituir os dados de serviços e horários.</p></div></div><textarea value={instructions} onChange={(event) => setInstructions(event.target.value.slice(0, 1200))} maxLength={1200} aria-label="Regras de atendimento para a IA" placeholder="Ex.: não prometer descontos; confirmar o serviço antes de agendar; oferecer encaixe somente quando houver disponibilidade." className="min-h-[150px] w-full resize-y rounded-2xl border border-[#D8D4CA] p-4 text-sm leading-6 text-[#1A1A1F] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#C29B2E] focus:ring-4 focus:ring-[#D4AF37]/15" /><p className="mt-2 text-right text-xs text-[#9CA3AF]">{instructions.length}/1200</p></section>
          <section id="horarios" className="scroll-mt-6 rounded-3xl border border-[#E8E5DD] bg-white p-5 shadow-[0_12px_30px_rgba(26,26,31,0.04)] sm:p-7"><div className="mb-6 flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8E7] text-[#9A7417]"><span className="material-symbols-outlined">calendar_month</span></div><div><h2 className="text-lg font-bold text-[#1A1A1F]">Horário de funcionamento</h2><p className="mt-1 text-sm leading-6 text-[#6B7280]">A IA só oferecerá horários dentro destes períodos. Fuso: {config.timezone || 'America/Sao_Paulo'}.</p></div></div><div className="divide-y divide-[#F1EFEA] rounded-2xl border border-[#EEEAE0]">{hours.map((item) => <div key={item.day} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><label className="flex items-center gap-3 text-sm font-bold text-[#1A1A1F]"><input type="checkbox" checked={item.isOpen} onChange={(event) => updateHour(item.day, { isOpen: event.target.checked })} className="h-4 w-4 rounded border-[#C8C4B9] accent-[#B99220]" />{item.label}</label>{item.isOpen ? <div className="flex items-center gap-2 pl-7 sm:pl-0"><input type="time" value={item.open} onChange={(event) => updateHour(item.day, { open: event.target.value })} aria-label={`Abertura ${item.label}`} className="min-h-10 rounded-lg border border-[#D8D4CA] px-2 text-sm" /><span className="text-xs font-semibold text-[#9CA3AF]">até</span><input type="time" value={item.close} onChange={(event) => updateHour(item.day, { close: event.target.value })} aria-label={`Fechamento ${item.label}`} className="min-h-10 rounded-lg border border-[#D8D4CA] px-2 text-sm" /></div> : <span className="pl-7 text-xs font-semibold uppercase tracking-[0.12em] text-[#9CA3AF] sm:pl-0">Fechado</span>}</div>)}</div><div className="mt-5 flex flex-col gap-2 rounded-2xl bg-[#FBFAF7] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-[#1A1A1F]">Intervalo entre agendamentos</p><p className="mt-1 text-xs leading-5 text-[#6B7280]">Usado como grade mínima para os próximos horários.</p></div><select value={interval} onChange={(event) => setInterval(Number(event.target.value))} aria-label="Intervalo entre agendamentos" className="min-h-11 rounded-xl border border-[#D8D4CA] bg-white px-3 text-sm font-bold text-[#1A1A1F]"><option value={5}>5 minutos</option><option value={10}>10 minutos</option><option value={15}>15 minutos</option><option value={20}>20 minutos</option><option value={30}>30 minutos</option><option value={45}>45 minutos</option><option value={60}>1 hora</option><option value={90}>1h30</option><option value={120}>2 horas</option></select></div></section>
        </div>
        <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start"><section className="rounded-3xl border border-[#E8E5DD] bg-[#1A1A1F] p-5 text-white shadow-[0_12px_30px_rgba(26,26,31,0.16)] sm:p-6"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#1A1A1F]"><span className="material-symbols-outlined">verified_user</span></div><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#D4AF37]">Pronto para atender</p><h2 className="mt-1 text-xl font-bold">Checklist da IA</h2></div></div><p className="mt-4 text-sm leading-6 text-[#C7C7CC]">Complete os itens abaixo para que o assistente tenha contexto suficiente antes do primeiro atendimento.</p><div className="mt-5 space-y-2">{checklist.map((item) => <Link key={item.label} to={item.href} className="group flex items-start gap-3 rounded-2xl border border-white/10 p-3 transition hover:border-[#D4AF37]/60 hover:bg-white/5"><span className={`material-symbols-outlined mt-0.5 text-lg ${item.done ? 'text-[#6EE7A0]' : 'text-[#F2C94C]'}`}>{item.done ? 'check_circle' : item.icon}</span><span className="min-w-0"><span className="block text-sm font-bold">{item.label}</span><span className="mt-0.5 block text-xs leading-5 text-[#A7A7AE]">{item.hint}</span></span><span className="material-symbols-outlined ml-auto text-base text-[#777780] transition group-hover:translate-x-0.5" aria-hidden="true">arrow_forward</span></Link>)}</div></section><section className="rounded-3xl border border-[#E8E5DD] bg-white p-5 shadow-[0_12px_30px_rgba(26,26,31,0.04)] sm:p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9A7417]">Prévia</p><h2 className="mt-1 text-lg font-bold text-[#1A1A1F]">Como a IA se apresenta</h2></div><span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8E7] text-[#9A7417]"><span className="material-symbols-outlined">forum</span></span></div><div className="mt-5 rounded-2xl bg-[#F7F6F2] p-4"><p className="text-xs font-semibold text-[#8A6A11]">{assistantName.trim() || 'Sua assistente'}</p><p className="mt-2 rounded-2xl rounded-tl-none border border-[#E5E1D6] bg-white p-3 text-sm leading-6 text-[#34343A]">Olá! Sou {assistantName.trim() || 'a assistente da sua barbearia'}. Posso ajudar a encontrar um horário e tirar suas dúvidas.</p><p className="mt-3 text-xs leading-5 text-[#85858D]">Tom selecionado: <strong className="text-[#5F5F67]">{TONES.find((item) => item.value === tone)?.label}</strong></p></div></section>{loading && <p className="text-center text-xs text-[#9CA3AF]">Atualizando o checklist…</p>}</aside>
      </div>
    </form>
  );
};

export default AIConfig;
