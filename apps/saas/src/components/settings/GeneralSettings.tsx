import React from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PageHeader, Panel, SectionTitle, StatusBadge } from '@/components/ui/Premium';
import { Link } from 'react-router-dom';

const GeneralSettings: React.FC = () => {
  const { profile, tenant, membership } = useAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Centro de configuração"
        title={
          <>
            Configurações <span className="bz-gold-text">Gerais</span>
          </>
        }
        description="Uma visão organizada dos dados da barbearia, regras operacionais e estado da conta."
        actions={
          <StatusBadge
            label={membership?.role === 'owner' ? 'Acesso owner' : 'Leitura da equipe'}
            tone="gold"
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel className="p-5 sm:p-6">
          <SectionTitle
            title="Perfil da barbearia"
            subtitle="Informações principais que já existem no seu backend."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              [
                'Nome da barbearia',
                tenant?.company_name || profile?.barbershop_name || 'Não definido',
              ],
              ['Responsável', profile?.full_name || 'Não definido'],
              ['Email', tenant?.email || 'Não definido'],
              ['Telefone', tenant?.owner_phone || profile?.phone || 'Não definido'],
              ['Endereço', profile?.business_address || 'Não definido'],
              ['Horário salvo', profile?.business_hours || 'Não definido'],
            ].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-4 sm:p-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                  {label}
                </p>
                <p className="break-words text-base font-semibold text-[#1A1A1F]">{value}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5 sm:p-6">
          <SectionTitle title="Plano e operação" subtitle="Resumo rápido do estado da conta." />
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#F4D06F] bg-[#FFFAEB] p-4 sm:p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                Assinatura
              </p>
              <p className="text-xl font-semibold text-[#1A1A1F]">
                {profile?.subscription_status || 'Status não disponível'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-4 sm:p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                Papel atual
              </p>
              <p className="text-base font-semibold capitalize text-[#1A1A1F]">
                {membership?.role === 'owner' ? 'Proprietário' : 'Equipe'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E5E7EB] bg-[#FBFCFD] p-4 sm:p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
                Observação
              </p>
              <p className="text-sm leading-7 text-[#6B7280]">
                A gestão da equipe e das jornadas já está disponível abaixo. Notificações e outras
                preferências operacionais poderão ser centralizadas aqui nas próximas evoluções.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="p-5 sm:p-6">
        <SectionTitle
          title="Equipe e jornada"
          subtitle="Profissionais, status e horários de trabalho."
          action={
            <Link
              to="/settings/team"
              className="min-h-11 w-full rounded-full bg-[#D4AF37] px-5 py-3 text-center text-sm font-semibold text-[#1A1A1F] hover:bg-[#B99220] sm:w-auto"
            >
              Gerenciar equipe
            </Link>
          }
        />
        <p className="text-sm leading-7 text-[#6B7280]">
          Crie e edite profissionais, inative quem não atende no momento e configure a jornada
          semanal de cada pessoa.
        </p>
      </Panel>
    </div>
  );
};

export default GeneralSettings;
