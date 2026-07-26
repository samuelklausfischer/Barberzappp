import React, { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import {
  useCreateManualAppointment,
  useManualAppointmentOptions,
} from '@/features/appointments/hooks/useManualAppointment';
import type { AgendaAppointmentStatus } from '@/features/appointments/types';
import { getAgendaDateTime } from '@/features/appointments/utils/agendaDateRange';
import {
  getManualAppointmentTotals,
  getSafeManualAppointmentEndAt,
  getWorkingHoursLabelForDate,
  isManualAppointmentWithinWorkingHours,
  validateManualAppointmentDraft,
} from '@/features/appointments/utils/manualAppointment';

type Props = {
  isOpen: boolean;
  date: string;
  timeZone: string;
  onClose: () => void;
  onCreated: (createdDate: string) => Promise<void>;
};
type FormStatus = Extract<AgendaAppointmentStatus, 'scheduled' | 'confirmed'>;

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const duration = (value: number) =>
  value < 60
    ? `${value} min`
    : `${Math.floor(value / 60)}h${value % 60 ? ` ${value % 60} min` : ''}`;

export const NewAppointmentModal: React.FC<Props> = ({
  isOpen,
  date,
  timeZone,
  onClose,
  onCreated,
}) => {
  const {
    clients,
    services,
    barbers,
    loading,
    error: optionsError,
    refresh,
  } = useManualAppointmentOptions();
  const { create, creating, error: createError } = useCreateManualAppointment();
  const [clientQuery, setClientQuery] = useState('');
  const [serviceQuery, setServiceQuery] = useState('');
  const [clientId, setClientId] = useState('');
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [barberId, setBarberId] = useState('');
  const [timeValue, setTimeValue] = useState('09:00');
  const [dateValue, setDateValue] = useState(date);
  const [status, setStatus] = useState<FormStatus>('confirmed');
  const [observation, setObservation] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('pt-BR', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    [timeZone]
  );

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const selectedBarber = barbers.find((barber) => barber.id === barberId) ?? null;
  const selectedServices = services.filter((service) => serviceIds.includes(service.id));
  const totals = getManualAppointmentTotals(selectedServices);
  const filteredClients = clients
    .filter((client) =>
      `${client.name} ${client.phone ?? ''}`
        .toLocaleLowerCase()
        .includes(clientQuery.toLocaleLowerCase())
    )
    .slice(0, 8);
  const filteredServices = services.filter(
    (service) =>
      barberId &&
      (service.barberId === null || service.barberId === barberId) &&
      service.name.toLocaleLowerCase().includes(serviceQuery.toLocaleLowerCase())
  );
  const endAt = useMemo(() => {
    if (!selectedServices.length || !dateValue || !timeValue) return null;
    return getSafeManualAppointmentEndAt(dateValue, timeValue, selectedServices, timeZone);
  }, [dateValue, selectedServices, timeValue, timeZone]);
  const timeValidation =
    dateValue && timeValue
      ? validateManualAppointmentDraft({
          clientId: 'validation',
          barberId: 'validation',
          serviceIds: ['validation'],
          date: dateValue,
          time: timeValue,
          timeZone,
        })
      : null;
  const workingHoursValidation =
    selectedBarber &&
    selectedServices.length &&
    dateValue &&
    timeValue &&
    !isManualAppointmentWithinWorkingHours({
      date: dateValue,
      time: timeValue,
      durationMinutes: totals.durationMinutes,
      workingHours: selectedBarber.workingHours,
    })
      ? 'O profissional não atende neste horário.'
      : null;
  const selectedBarberHours =
    selectedBarber && dateValue
      ? getWorkingHoursLabelForDate(dateValue, selectedBarber.workingHours)
      : null;

  useEffect(() => {
    if (isOpen) setDateValue(date);
  }, [date, isOpen]);

  const toggleService = (id: string) => {
    setFormError(null);
    setServiceIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : current.length >= 10
          ? current
          : [...current, id]
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validation = validateManualAppointmentDraft({
      clientId,
      barberId,
      serviceIds,
      date: dateValue,
      time: timeValue,
      timeZone,
    });
    if (validation) {
      setFormError(validation);
      return;
    }
    if (workingHoursValidation) {
      setFormError(workingHoursValidation);
      return;
    }
    try {
      setFormError(null);
      const created = await create({
        clientId,
        barberId,
        scheduledAt: getAgendaDateTime(dateValue, timeValue, timeZone),
        serviceIds,
        observation: observation.trim() || null,
        status,
      });
      if (!created) return;
      await onCreated(dateValue);
      onClose();
    } catch {
      // The hook stores a safe, user-facing error while preserving the draft.
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-3 text-sm text-[#1A1A1F] placeholder:text-[#9CA3AF] focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20';
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo agendamento"
      eyebrow="Agenda diária"
      size="lg"
    >
      <form onSubmit={submit} className="space-y-5">
        <p className="text-sm leading-6 text-[#6B7280]">
          Selecione os dados salvos da sua barbearia. Valores e duração serão confirmados pelo
          sistema ao salvar.
        </p>
        {optionsError ? (
          <div
            role="alert"
            className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm text-[#B42318]"
          >
            {optionsError}
            <button
              type="button"
              onClick={() => void refresh()}
              className="ml-2 inline-flex min-h-11 items-center font-semibold underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}
        {formError || createError ? (
          <div
            role="alert"
            className="rounded-xl border border-[#FECDCA] bg-[#FEF3F2] p-4 text-sm text-[#B42318]"
          >
            {formError ?? createError}
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2">
          <section className="space-y-3" aria-labelledby="appointment-client">
            <div>
              <p id="appointment-client" className="bz-kicker">
                Cliente *
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">Busque e selecione um cliente da base.</p>
            </div>
            <label htmlFor="appointment-client-search" className="sr-only">
              Buscar cliente por nome ou telefone
            </label>
            <input
              id="appointment-client-search"
              value={clientQuery}
              onChange={(event) => setClientQuery(event.target.value)}
              placeholder="Buscar por nome ou telefone"
              className={fieldClass}
              disabled={loading || creating}
            />
            {selectedClient ? (
              <div className="flex items-center justify-between rounded-xl border border-[#D4AF37]/45 bg-[#FFFAE9] p-3">
                <div>
                  <p className="font-semibold">{selectedClient.name}</p>
                  <p className="text-xs text-[#6B7280]">{selectedClient.phone ?? 'Sem telefone'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setClientId('')}
                  className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-[#7A5E12] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#FCFCFD]">
                {loading ? (
                  <p className="p-3 text-sm text-[#6B7280]">Carregando clientes…</p>
                ) : filteredClients.length ? (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => {
                        setClientId(client.id);
                        setClientQuery('');
                        setFormError(null);
                      }}
                      className="flex w-full flex-col border-b border-[#E5E7EB] px-3 py-2.5 text-left last:border-0 hover:bg-[#FFFAE9]"
                    >
                      <span className="font-medium">{client.name}</span>
                      <span className="text-xs text-[#6B7280]">
                        {client.phone ?? 'Sem telefone'}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="p-3 text-sm text-[#6B7280]">Nenhum cliente encontrado.</p>
                )}
              </div>
            )}
          </section>
          <section className="space-y-3" aria-labelledby="appointment-barber">
            <div>
              <label
                id="appointment-barber"
                htmlFor="appointment-barber-select"
                className="bz-kicker"
              >
                Barbeiro responsável *
              </label>
              <p className="mt-1 text-xs text-[#6B7280]">
                Somente profissionais ativos com jornada configurada aparecem aqui.
              </p>
            </div>
            <select
              id="appointment-barber-select"
              value={barberId}
              onChange={(event) => {
                const nextBarberId = event.target.value;
                setBarberId(nextBarberId);
                setServiceIds((current) =>
                  current.filter((id) => {
                    const service = services.find((candidate) => candidate.id === id);
                    return service?.barberId === null || service?.barberId === nextBarberId;
                  })
                );
                setFormError(null);
              }}
              className={fieldClass}
              disabled={loading || creating}
              required
            >
              <option value="">Selecione o barbeiro</option>
              {barbers.map((barber) => (
                <option key={barber.id} value={barber.id}>
                  {barber.name}
                </option>
              ))}
            </select>
            {selectedBarberHours ? (
              <p role="status" className="text-xs text-[#6B7280]">
                Jornada nesta data:{' '}
                <strong className="font-semibold text-[#4B5563]">{selectedBarberHours}</strong>
              </p>
            ) : null}
            {!loading && barbers.length === 0 ? (
              <p className="text-sm text-[#B42318]">
                Cadastre um profissional ativo e configure sua jornada em Ajustes &gt; Equipe antes
                de criar o agendamento.
              </p>
            ) : null}
          </section>
        </div>
        <section className="space-y-3" aria-labelledby="appointment-services">
          <label htmlFor="appointment-service-search" className="sr-only">
            Buscar servicos disponiveis
          </label>
          {!barberId ? (
            <p className="text-sm text-[#6B7280]">
              Selecione primeiro o barbeiro para ver os servicos disponiveis.
            </p>
          ) : null}
          <fieldset disabled={!barberId || creating} className="space-y-3 disabled:opacity-60">
            <div>
              <p id="appointment-services" className="bz-kicker">
                Serviços *{' '}
                <span className="normal-case tracking-normal text-[#6B7280]">(até 10)</span>
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">
                Você pode combinar mais de um serviço no mesmo horário.
              </p>
            </div>
            <input
              id="appointment-service-search"
              aria-label="Buscar serviços disponíveis"
              value={serviceQuery}
              onChange={(event) => setServiceQuery(event.target.value)}
              placeholder="Buscar serviços"
              className={fieldClass}
              disabled={loading || creating || !barberId}
            />
            <div className="max-h-48 overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#FCFCFD]">
              {loading ? (
                <p className="p-3 text-sm text-[#6B7280]">Carregando serviços…</p>
              ) : filteredServices.length ? (
                filteredServices.map((service) => {
                  const selected = serviceIds.includes(service.id);
                  return (
                    <label
                      key={service.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-[#E5E7EB] px-3 py-3 last:border-0 hover:bg-[#FFFAE9]"
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleService(service.id)}
                        disabled={creating || (!selected && serviceIds.length >= 10)}
                        className="h-4 w-4 accent-[#B38D1C]"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{service.name}</span>
                        <span className="text-xs text-[#6B7280]">
                          {duration(service.durationMinutes)} · {money(service.price)}
                        </span>
                      </span>
                    </label>
                  );
                })
              ) : (
                <p className="p-3 text-sm text-[#6B7280]">Nenhum serviço ativo encontrado.</p>
              )}
            </div>
          </fieldset>
          {selectedServices.length ? (
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className="inline-flex min-h-11 items-center rounded-full bg-[#FFFAE9] px-3 py-1.5 text-xs font-semibold text-[#7A5E12] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
                >
                  {service.name} <span aria-hidden="true">×</span>
                  <span className="sr-only">Remover</span>
                </button>
              ))}
            </div>
          ) : null}
        </section>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="appointment-date" className="bz-kicker mb-2 block">
              Data *
            </label>
            <input
              id="appointment-date"
              type="date"
              value={dateValue}
              onChange={(event) => {
                setDateValue(event.target.value);
                setFormError(null);
              }}
              className={fieldClass}
              disabled={creating}
              required
            />
          </div>
          <div>
            <label htmlFor="appointment-time" className="bz-kicker mb-2 block">
              Horário *
            </label>
            <input
              id="appointment-time"
              type="time"
              value={timeValue}
              onChange={(event) => {
                setTimeValue(event.target.value);
                setFormError(null);
              }}
              className={fieldClass}
              disabled={creating}
              required
            />
          </div>
          <div>
            <label htmlFor="appointment-status" className="bz-kicker mb-2 block">
              Status inicial
            </label>
            <select
              id="appointment-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as FormStatus)}
              className={fieldClass}
              disabled={creating}
            >
              <option value="confirmed">Confirmado</option>
              <option value="scheduled">Agendado</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="appointment-observation" className="bz-kicker mb-2 block">
            Observação{' '}
            <span className="normal-case tracking-normal text-[#6B7280]">(opcional)</span>
          </label>
          <textarea
            id="appointment-observation"
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            maxLength={1000}
            rows={3}
            className={fieldClass}
            disabled={creating}
            placeholder="Preferências, recados ou informações relevantes"
          />
          <p className="mt-1 text-right text-xs text-[#6B7280]">{observation.length}/1000</p>
        </div>
        {timeValidation || workingHoursValidation ? (
          <p role="status" className="text-sm text-[#B42318]">
            {timeValidation ?? workingHoursValidation}
          </p>
        ) : null}
        <aside
          className="rounded-2xl border border-[#F4D06F] bg-[#FFFAE9] p-4"
          aria-label="Resumo do agendamento"
        >
          <p className="bz-kicker text-[#7A5E12]">Resumo estimado</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <p>
              <span className="block text-xs text-[#6B7280]">Serviços</span>
              <strong>{selectedServices.length || '—'}</strong>
            </p>
            <p>
              <span className="block text-xs text-[#6B7280]">Duração</span>
              <strong>{selectedServices.length ? duration(totals.durationMinutes) : '—'}</strong>
            </p>
            <p>
              <span className="block text-xs text-[#6B7280]">Valor</span>
              <strong>{selectedServices.length ? money(totals.price) : '—'}</strong>
            </p>
          </div>
          {endAt ? (
            <p className="mt-3 text-sm text-[#4B5563]">
              Término estimado: <strong>{timeFormatter.format(new Date(endAt))}</strong>
            </p>
          ) : null}
        </aside>
        <div className="sticky bottom-0 z-10 -mx-5 flex flex-col-reverse gap-3 border-t border-[#E5E7EB] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-8px_16px_rgba(26,26,31,0.04)] sm:static sm:mx-0 sm:flex-row sm:justify-end sm:border-t sm:px-0 sm:pb-0 sm:pt-5 sm:shadow-none">
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="min-h-11 rounded-full border border-[#D1D5DB] px-5 py-3 text-sm font-semibold text-[#4B5563] hover:bg-[#F7F8FA] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              loading ||
              creating ||
              Boolean(optionsError) ||
              !clientId ||
              !barberId ||
              serviceIds.length === 0 ||
              Boolean(timeValidation) ||
              Boolean(workingHoursValidation)
            }
            className="min-h-11 rounded-full bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-[#1A1A1F] hover:bg-[#B99220] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
          >
            {creating ? 'Criando agendamento…' : 'Criar agendamento'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
