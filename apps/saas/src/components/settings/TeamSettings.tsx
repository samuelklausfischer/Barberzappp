import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmModal, Modal } from '@/components/ui/Modal';
import { EmptyPremium, MetricCard, PageHeader, Panel, StatusBadge } from '@/components/ui/Premium';
import { useTeamMembers, type TeamMember } from '@/features/team/hooks/useTeamMembers';
import {
  DAY_LABELS,
  copyMondayToWeekdays,
  emptyTeamMemberDraft,
  getTeamScheduleSummary,
  type TeamMemberDraft,
  type TeamSchedulePeriod,
  validateTeamMemberDraft,
} from '@/features/team/utils/teamSchedule';

const field =
  'min-h-11 w-full rounded-xl border border-[#D1D5DB] bg-white px-3 text-sm text-[#1A1A1F] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20';
const primary =
  'min-h-11 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#1A1A1F] hover:bg-[#B99220] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50';

const draftFor = (member: TeamMember): TeamMemberDraft => ({
  name: member.name,
  specialties: member.specialties.join(', '),
  bio: member.bio,
  active: member.active,
  schedule: member.schedule,
});
const periodsFor = (schedule: TeamSchedulePeriod[], day: number) =>
  schedule.filter((period) => period.day_of_week === day);

const TeamForm: React.FC<{
  member: TeamMember | null;
  busy: boolean;
  onClose: () => void;
  onSave: (draft: TeamMemberDraft) => Promise<void>;
}> = ({ member, busy, onClose, onSave }) => {
  const [draft, setDraft] = useState<TeamMemberDraft>(() =>
    member ? draftFor(member) : emptyTeamMemberDraft()
  );
  const [error, setError] = useState<string | null>(null);
  const updateSchedule = (schedule: TeamSchedulePeriod[]) =>
    setDraft((current) => ({ ...current, schedule }));
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateTeamMemberDraft(draft);
    if (validation) return setError(validation);
    setError(null);
    try {
      await onSave(draft);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
    }
  };
  return (
    <form onSubmit={save} className="space-y-5">
      <div role="alert" aria-live="polite">
        {error ? (
          <p className="rounded-xl bg-[#FEF2F2] p-3 text-sm text-[#B42318]">{error}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="bz-kicker">Nome *</span>
          <input
            className={field}
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            maxLength={80}
            disabled={busy}
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="bz-kicker">Especialidades</span>
          <input
            className={field}
            value={draft.specialties}
            onChange={(e) => setDraft({ ...draft, specialties: e.target.value })}
            placeholder="Corte, barba, visagismo"
            disabled={busy}
          />
        </label>
      </div>
      <label className="block space-y-1.5">
        <span className="bz-kicker">Bio</span>
        <textarea
          className={`${field} min-h-24 py-3`}
          value={draft.bio}
          onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
          maxLength={500}
          disabled={busy}
        />
      </label>
      <label className="flex min-h-11 items-center gap-3 rounded-xl border border-[#E5E7EB] p-3">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
          disabled={busy}
        />
        <span className="text-sm font-semibold text-[#1A1A1F]">
          Profissional ativo para novos agendamentos
        </span>
      </label>
      <fieldset className="space-y-3" disabled={busy}>
        <legend className="bz-kicker">Jornada semanal</legend>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-full border border-[#D1D5DB] px-4 text-sm font-semibold"
            onClick={() => updateSchedule(copyMondayToWeekdays(draft.schedule))}
          >
            Copiar segunda para dias úteis
          </button>
          <button
            type="button"
            className="min-h-11 rounded-full border border-[#D1D5DB] px-4 text-sm font-semibold"
            onClick={() => updateSchedule([])}
          >
            Limpar semana
          </button>
        </div>
        {DAY_LABELS.map((label, day) => (
          <div key={label} className="rounded-xl border border-[#E5E7EB] p-3">
            <div className="mb-2 flex items-center justify-between">
              <strong className="text-sm text-[#1A1A1F]">{label}</strong>
              <button
                type="button"
                className="min-h-11 px-2 text-sm font-semibold text-[#8B6B12]"
                onClick={() =>
                  updateSchedule([
                    ...draft.schedule,
                    { day_of_week: day, start_time: '09:00', end_time: '18:00' },
                  ])
                }
              >
                Adicionar período
              </button>
            </div>
            {periodsFor(draft.schedule, day).map((period, index) => {
              const position = draft.schedule.indexOf(period);
              return (
                <div key={`${day}-${index}`} className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <input
                    aria-label={`${label} início ${index + 1}`}
                    type="time"
                    className={field}
                    value={period.start_time}
                    onChange={(e) =>
                      updateSchedule(
                        draft.schedule.map((item, itemIndex) =>
                          itemIndex === position ? { ...item, start_time: e.target.value } : item
                        )
                      )
                    }
                  />
                  <input
                    aria-label={`${label} fim ${index + 1}`}
                    type="time"
                    className={field}
                    value={period.end_time}
                    onChange={(e) =>
                      updateSchedule(
                        draft.schedule.map((item, itemIndex) =>
                          itemIndex === position ? { ...item, end_time: e.target.value } : item
                        )
                      )
                    }
                  />
                  <button
                    aria-label={`Remover período de ${label}`}
                    type="button"
                    className="col-span-2 min-h-11 rounded-xl border border-[#FECDCA] px-3 text-sm font-semibold text-[#B42318] sm:col-span-1 sm:border-0 sm:px-2 sm:text-base"
                    onClick={() =>
                      updateSchedule(
                        draft.schedule.filter((_, itemIndex) => itemIndex !== position)
                      )
                    }
                  >
                    <span className="material-symbols-outlined align-middle">delete</span>
                    <span className="ml-1 sm:hidden">Remover período</span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </fieldset>
      <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-3 border-t border-[#E5E7EB] bg-white px-1 pb-1 pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:p-0 sm:pt-5">
        <button
          type="button"
          className="min-h-11 w-full rounded-full border border-[#D1D5DB] px-5 py-3 text-sm font-semibold sm:w-auto"
          onClick={onClose}
          disabled={busy}
        >
          Cancelar
        </button>
        <button type="submit" className={`${primary} w-full sm:w-auto`} disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar profissional'}
        </button>
      </div>
    </form>
  );
};

const TeamSettings: React.FC = () => {
  const { members, loading, error, save, setActive, remove } = useTeamMembers();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<TeamMember | null | undefined>(undefined);
  const [confirmInactive, setConfirmInactive] = useState<TeamMember | null>(null);
  const [deleting, setDeleting] = useState<TeamMember | null>(null);
  const [typedName, setTypedName] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const flight = useRef(false);
  const visible = useMemo(
    () =>
      members.filter(
        (member) =>
          (filter === 'all' || member.active === (filter === 'active')) &&
          `${member.name} ${member.specialties.join(' ')}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase())
      ),
    [filter, members, query]
  );
  const active = members.filter((member) => member.active).length;
  const withoutSchedule = members.filter(
    (member) => member.active && member.schedule.length === 0
  ).length;
  const run = async (work: () => Promise<void>, successMessage?: string, rethrow = false) => {
    if (flight.current) return;
    flight.current = true;
    setBusy(true);
    setActionError(null);
    setNotice(null);
    try {
      await work();
      if (successMessage) setNotice(successMessage);
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.'
      );
      if (rethrow) throw cause;
    } finally {
      flight.current = false;
      setBusy(false);
    }
  };
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configurações / Equipe"
        title={
          <>
            Sua <span className="bz-gold-text">equipe</span>
          </>
        }
        description="Cadastre profissionais, defina a jornada semanal e controle quem aparece em novos agendamentos."
        actions={
          <Link
            to="/settings"
            className="min-h-11 w-full rounded-full border border-[#D1D5DB] px-5 py-3 text-center text-sm font-semibold text-[#4B5563] sm:w-auto"
          >
            Voltar aos ajustes
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard icon="groups" label="Ativos" value={active} accent="emerald" />
        <MetricCard
          icon="person_off"
          label="Inativos"
          value={members.length - active}
          accent="neutral"
        />
        <MetricCard
          icon="schedule"
          label="Sem jornada"
          value={withoutSchedule}
          detail="Ativos que ainda precisam de horário"
          accent={withoutSchedule ? 'danger' : 'gold'}
        />
      </div>
      <Panel className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <input
            aria-label="Buscar profissional"
            className={field}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome ou especialidade"
          />
          <select
            aria-label="Filtrar equipe"
            className={`${field} lg:max-w-48`}
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button className={`${primary} w-full lg:w-auto`} onClick={() => setEditing(null)}>
            Adicionar profissional
          </button>
        </div>
      </Panel>
      {error ? (
        <p role="alert" className="rounded-xl bg-[#FEF2F2] p-4 text-sm text-[#B42318]">
          {error}
        </p>
      ) : null}
      {actionError ? (
        <p role="alert" className="rounded-xl bg-[#FEF2F2] p-4 text-sm text-[#B42318]">
          {actionError}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="rounded-xl bg-[#ECFDF3] p-4 text-sm text-[#13795B]">
          {notice}
        </p>
      ) : null}
      {loading ? (
        <Panel className="p-8 text-center text-sm text-[#6B7280]">Carregando equipe…</Panel>
      ) : visible.length === 0 ? (
        <EmptyPremium
          icon="groups"
          title="Nenhum profissional encontrado"
          description="Adicione o primeiro profissional ou ajuste os filtros."
          action={
            <button className={primary} onClick={() => setEditing(null)}>
              Adicionar profissional
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((member) => (
            <Panel key={member.id} className="p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#1A1A1F]">{member.name}</h2>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {member.specialties.length
                      ? member.specialties.join(' · ')
                      : 'Sem especialidades informadas'}
                  </p>
                </div>
                <StatusBadge
                  label={member.active ? 'Ativo' : 'Inativo'}
                  tone={member.active ? 'emerald' : 'neutral'}
                />
              </div>
              <p className="mt-4 min-h-10 text-sm text-[#4B5563]">
                {getTeamScheduleSummary(member.schedule)}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="min-h-11 flex-1 rounded-full border border-[#D1D5DB] px-4 text-sm font-semibold sm:flex-none"
                  disabled={busy}
                  onClick={() => setEditing(member)}
                >
                  Editar
                </button>
                {member.active ? (
                  <button
                    className="min-h-11 flex-1 rounded-full border border-[#D4AF37]/50 px-4 text-sm font-semibold text-[#8B6B12] sm:flex-none"
                    disabled={busy}
                    onClick={() => setConfirmInactive(member)}
                  >
                    Inativar
                  </button>
                ) : (
                  <button
                    className="min-h-11 flex-1 rounded-full border border-[#D1D5DB] px-4 text-sm font-semibold sm:flex-none"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => setActive(member, true), `${member.name} foi reativado.`)
                    }
                  >
                    Reativar
                  </button>
                )}
                <button
                  className="min-h-11 w-full rounded-full border border-[#FECDCA] px-3 text-sm font-semibold text-[#B42318] sm:w-auto sm:border-0"
                  disabled={busy}
                  onClick={() => {
                    setDeleting(member);
                    setTypedName('');
                  }}
                >
                  Excluir
                </button>
              </div>
            </Panel>
          ))}
        </div>
      )}
      <Modal
        isOpen={editing !== undefined}
        onClose={() => !busy && setEditing(undefined)}
        title={editing ? 'Editar profissional' : 'Novo profissional'}
        size="xl"
        eyebrow="Equipe"
      >
        <TeamForm
          member={editing ?? null}
          busy={busy}
          onClose={() => setEditing(undefined)}
          onSave={async (draft) =>
            run(
              async () => {
                await save(editing?.id ?? null, draft, editing?.updatedAt ?? null);
                setEditing(undefined);
              },
              editing ? `${editing.name} foi atualizado.` : 'Profissional adicionado.',
              true
            )
          }
        />
      </Modal>
      <ConfirmModal
        isOpen={Boolean(confirmInactive)}
        onClose={() => !busy && setConfirmInactive(null)}
        title="Inativar profissional?"
        message="Ele deixará de aparecer em novos agendamentos. O histórico será preservado."
        confirmLabel="Inativar"
        variant="warning"
        loading={busy}
        onConfirm={() =>
          void run(
            async () => {
              if (confirmInactive) await setActive(confirmInactive, false);
              setConfirmInactive(null);
            },
            confirmInactive ? `${confirmInactive.name} foi inativado.` : undefined
          )
        }
      />
      <Modal
        isOpen={Boolean(deleting)}
        onClose={() => !busy && setDeleting(null)}
        title="Excluir profissional"
        size="sm"
        eyebrow="Ação excepcional"
      >
        <p className="mb-4 text-sm leading-6 text-[#4B5563]">
          Digite <strong>{deleting?.name}</strong> para confirmar. Se houver histórico, a exclusão
          será bloqueada e você poderá inativar.
        </p>
        <label className="block space-y-2">
          <span className="bz-kicker">Confirmação</span>
          <input
            className={field}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
          />
        </label>
        <div className="sticky bottom-0 -mx-1 mt-5 flex flex-col-reverse gap-3 border-t border-[#E5E7EB] bg-white px-1 pb-1 pt-4 sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-0 sm:p-0 sm:pt-0">
          <button
            className="min-h-11 w-full rounded-full border border-[#D1D5DB] px-5 text-sm font-semibold sm:w-auto"
            disabled={busy}
            onClick={() => setDeleting(null)}
          >
            Cancelar
          </button>
          <button
            className="min-h-11 w-full rounded-full bg-[#B42318] px-5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"
            disabled={busy || typedName !== deleting?.name}
            onClick={() =>
              void run(
                async () => {
                  if (deleting) await remove(deleting);
                  setDeleting(null);
                },
                deleting ? `${deleting.name} foi excluído.` : undefined
              )
            }
          >
            Excluir
          </button>
        </div>
      </Modal>
    </div>
  );
};
export default TeamSettings;
