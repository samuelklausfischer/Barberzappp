import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { EmptyPremium, PageHeader, Panel, SectionTitle, StatusBadge } from '@/components/ui/Premium';

const GeneralSettings: React.FC = () => {
  const { profile, tenant, membership } = useAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Centro de configuração"
        title={<>Configurações <span className="bz-gold-text">Gerais</span></>}
        description="Uma visão organizada dos dados da barbearia, regras operacionais e estado da conta."
        actions={<StatusBadge label={membership?.role === 'owner' ? 'Acesso owner' : 'Leitura da equipe'} tone="gold" />}
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-5 sm:p-6">
          <SectionTitle title="Perfil da barbearia" subtitle="Informações principais que já existem no seu backend." />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Nome da barbearia', tenant?.company_name || profile?.barbershop_name || 'Não definido'],
              ['Responsável', profile?.full_name || 'Não definido'],
              ['Email', tenant?.email || 'Não definido'],
              ['Telefone', tenant?.owner_phone || profile?.phone || 'Não definido'],
              ['Endereço', profile?.business_address || 'Não definido'],
              ['Horário salvo', profile?.business_hours || 'Não definido'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">{label}</p>
                <p className="text-base font-semibold text-[#1A1A1F]">{value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <SectionTitle title="Plano e operação" subtitle="Resumo rápido do estado da conta." />
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#F4D06F] bg-[#FFFAEB] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Assinatura</p>
              <p className="text-xl font-semibold text-[#1A1A1F]">{profile?.subscription_status || 'Status não disponível'}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Papel atual</p>
              <p className="text-base font-semibold capitalize text-[#1A1A1F]">{membership?.role === 'owner' ? 'Proprietário' : 'Equipe'}</p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">Observação</p>
              <p className="text-sm leading-7 text-[#6B7280]">
                Esta área já está preparada visualmente para evoluir depois com edição real de horários, notificações,
                equipe e preferências da agenda.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <EmptyPremium
        icon="tune"
        title="Próxima evolução"
        description="Na próxima etapa, esta tela pode ganhar edição completa de horários, políticas de cancelamento, equipe e plano sem quebrar o backend atual."
      />
    </div>
  );
};

export default GeneralSettings;
