import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { EmptyPremium, MetricCard, PageHeader, Panel, StatusBadge } from '@/components/ui/Premium';
import { useAgendaAppointments } from '@/features/appointments/hooks/useAgendaAppointments';
import type { AgendaAppointment, AgendaAppointmentStatus } from '@/features/appointments/types';
import { useTenant } from '@/features/auth/hooks/useTenant';
import { addCalendarDays, getAgendaDateTime } from '@/features/appointments/utils/agendaDateRange';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTimelineItems, type TimelineItem } from './agendaTimeline';
import { NewAppointmentModal } from './NewAppointmentModal';

type AgendaView = 'timeline' | 'list' | 'cards';

const agendaFormatterCache = new Map<
  string,
  {
    time: Intl.DateTimeFormat;
    date: Intl.DateTimeFormat;
    inputDate: Intl.DateTimeFormat;
  }
>();

const getAgendaFormatters = (timeZone: string) => {
  const cached = agendaFormatterCache.get(timeZone);
  if (cached) return cached;
  const formatters = {
    time: new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }),
    date: new Intl.DateTimeFormat('pt-BR', {
      timeZone,
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
    inputDate: new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }),
  };
  agendaFormatterCache.set(timeZone, formatters);
  return formatters;
};

const statusMeta: Record<
  AgendaAppointmentStatus,
  { label: string; tone: 'gold' | 'emerald' | 'danger' | 'neutral' }
> = {
  scheduled: { label: 'Agendado', tone: 'neutral' },
  pending: { label: 'Pendente', tone: 'gold' },
  confirmed: { label: 'Confirmado', tone: 'emerald' },
  completed: { label: 'Concluído', tone: 'emerald' },
  canceled: { label: 'Cancelado', tone: 'danger' },
  no_show: { label: 'Não compareceu', tone: 'danger' },
};

const viewOptions: Array<{ id: AgendaView; label: string; icon: string }> = [
  { id: 'timeline', label: 'Grade', icon: 'calendar_view_day' },
  { id: 'list', label: 'Lista', icon: 'format_list_bulleted' },
  { id: 'cards', label: 'Cards', icon: 'view_agenda' },
];

const isAgendaView = (value: string): value is AgendaView =>
  value === 'timeline' || value === 'list' || value === 'cards';

const isCalendarDate = (value: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
};

const formatInputDate = (date: Date, timeZone: string) => {
  const values = Object.fromEntries(
    getAgendaFormatters(timeZone)
      .inputDate.formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );
  return `${values.year}-${values.month}-${values.day}`;
};

const formatCurrency = (price: number | null) =>
  price === null
    ? 'Valor não informado'
    : price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatTime = (timestamp: string, timeZone: string) =>
  getAgendaFormatters(timeZone).time.format(new Date(timestamp));

const durationLabel = (durationMinutes: number | null) => {
  if (!durationMinutes) return 'Duração não informada';
  if (durationMinutes < 60) return `${durationMinutes} min`;

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
};

const statusClass = (status: AgendaAppointmentStatus) =>
  status === 'canceled' || status === 'no_show' ? 'opacity-60' : '';

const Agenda: React.FC = () => {
  const { timeZone } = useTenant();
  const [storedView, setStoredView] = useLocalStorage<AgendaView>(
    'barberzap:agenda-view',
    'timeline'
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const today = formatInputDate(new Date(), timeZone);
  const fallbackView = isAgendaView(storedView) ? storedView : 'timeline';
  const dateParam = searchParams.get('date');
  const viewParam = searchParams.get('view');
  const requestedView = viewParam ?? '';
  const selectedDate = isCalendarDate(dateParam) ? dateParam : today;
  const view = isAgendaView(requestedView) ? requestedView : fallbackView;
  const [selectedAppointment, setSelectedAppointment] = useState<AgendaAppointment | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creationNotice, setCreationNotice] = useState<string | null>(null);
  const { appointments, loading, error, refresh } = useAgendaAppointments({
    date: selectedDate,
    timeZone,
  });

  const visibleAppointments = loading ? [] : appointments;
  const metrics = useMemo(() => {
    const revenue = visibleAppointments
      .filter(
        (appointment) => appointment.status !== 'canceled' && appointment.status !== 'no_show'
      )
      .reduce((total, appointment) => total + (appointment.price ?? 0), 0);
    return {
      total: visibleAppointments.length,
      confirmed: visibleAppointments.filter((appointment) => appointment.status === 'confirmed')
        .length,
      pending: visibleAppointments.filter((appointment) => appointment.status === 'pending').length,
      revenue,
    };
  }, [visibleAppointments]);

  const timelineItems = useMemo(
    () => getTimelineItems(visibleAppointments, timeZone),
    [timeZone, visibleAppointments]
  );
  const selectedDateLabel = getAgendaFormatters(timeZone).date.format(
    new Date(getAgendaDateTime(selectedDate, '12:00', timeZone))
  );

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    let changed = false;
    if (!isCalendarDate(searchParams.get('date'))) {
      nextParams.set('date', today);
      changed = true;
    }
    if (!isAgendaView(searchParams.get('view') ?? '')) {
      nextParams.set('view', fallbackView);
      changed = true;
    }
    if (changed) setSearchParams(nextParams, { replace: true });
  }, [fallbackView, searchParams, setSearchParams, today]);

  useEffect(() => {
    setSelectedAppointment(null);
  }, [selectedDate]);

  const updateDate = (nextDate: string) => {
    if (!isCalendarDate(nextDate)) return;
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('date', nextDate);
    setSearchParams(nextParams, { replace: true });
  };

  const updateView = (nextView: AgendaView) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', nextView);
    setStoredView(nextView);
    setSearchParams(nextParams, { replace: true });
  };

  return (
    <div className="space-y-6 pb-24 text-[#1A1A1F] animate-in slide-in-from-left duration-500">
      <PageHeader
        eyebrow="Agenda diária"
        title={<span className="capitalize">{selectedDateLabel}</span>}
        description="Acompanhe os horários do dia em grade, lista ou cards."
        actions={
          <button
            type="button"
            onClick={() => {
              setCreationNotice(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-[#1A1A1F] shadow-sm transition-colors hover:bg-[#B99220] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
          >
            <span className="material-symbols-outlined text-[19px]">add</span>
            Novo agendamento
          </button>
        }
      />

      <Panel className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid w-full grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
            <button
              type="button"
              aria-label="Dia anterior"
              onClick={() => updateDate(addCalendarDays(selectedDate, -1))}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#4B5563] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <label className="relative flex h-11 min-w-0 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#1A1A1F] focus-within:ring-2 focus-within:ring-[#D4AF37]/50 sm:min-w-[176px]">
              <span className="material-symbols-outlined text-[18px] text-[#9A7417]">
                calendar_today
              </span>
              <span className="sr-only">Escolher data da agenda</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => event.target.value && updateDate(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#1A1A1F] outline-none"
              />
            </label>
            <button
              type="button"
              aria-label="Próximo dia"
              onClick={() => updateDate(addCalendarDays(selectedDate, 1))}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E5E7EB] text-[#4B5563] transition-colors hover:bg-[#F7F8FA] hover:text-[#1A1A1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
            <div className="col-span-3 grid grid-cols-3 gap-2 pt-1 sm:flex sm:w-auto sm:flex-wrap sm:pt-0">
              {[
                { label: 'Ontem', date: addCalendarDays(today, -1) },
                { label: 'Hoje', date: today },
                { label: 'Amanhã', date: addCalendarDays(today, 1) },
              ].map(({ label, date }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => updateDate(date)}
                  aria-pressed={selectedDate === date}
                  className={`min-h-11 rounded-xl px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 ${
                    selectedDate === date
                      ? 'bg-[#1A1A1F] text-white'
                      : 'border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F7F8FA]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="grid w-full grid-cols-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-1 sm:w-auto"
            role="group"
            aria-label="Modo de visualização"
          >
            {viewOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => updateView(option.id)}
                aria-pressed={view === option.id}
                className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors sm:px-3 sm:text-sm ${
                  view === option.id
                    ? 'bg-white text-[#1A1A1F] shadow-sm'
                    : 'text-[#6B7280] hover:text-[#1A1A1F]'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon="calendar_month"
          label="Agendados"
          value={loading ? '—' : metrics.total}
          detail="No dia selecionado"
        />
        <MetricCard
          icon="check_circle"
          label="Confirmados"
          value={loading ? '—' : metrics.confirmed}
          detail="Com presença confirmada"
          accent="emerald"
        />
        <MetricCard
          icon="schedule"
          label="Pendentes"
          value={loading ? '—' : metrics.pending}
          detail="Aguardando confirmação"
        />
        <MetricCard
          icon="payments"
          label="Faturamento"
          value={loading ? '—' : formatCurrency(metrics.revenue)}
          detail="Estimativa sem cancelados e faltas"
          accent="neutral"
        />
      </div>
      {creationNotice ? (
        <div
          role="status"
          className="rounded-xl border border-[#A6F4C5] bg-[#ECFDF3] px-4 py-3 text-sm font-medium text-[#067647]"
        >
          {creationNotice}
        </div>
      ) : null}

      {loading ? (
        <Panel className="px-5 py-12 text-center" aria-live="polite">
          <span className="material-symbols-outlined mb-3 animate-spin text-3xl text-[#B38D1C]">
            progress_activity
          </span>
          <p className="font-semibold text-[#1A1A1F]">Carregando agenda…</p>
          <p className="mt-1 text-sm text-[#6B7280]">
            Buscando os horários de {selectedDateLabel}.
          </p>
        </Panel>
      ) : error ? (
        <EmptyPremium
          icon="error"
          title="Não foi possível carregar a agenda"
          description="Verifique sua conexão e tente novamente."
          action={
            <button
              type="button"
              onClick={() => void refresh()}
              className="min-h-11 rounded-full bg-[#1A1A1F] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#34343A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
            >
              Tentar novamente
            </button>
          }
        />
      ) : visibleAppointments.length === 0 ? (
        <EmptyPremium
          icon="event_busy"
          title="Nenhum agendamento neste dia"
          description={`Não há horários registrados para ${selectedDateLabel}. Escolha outra data para consultar a agenda.`}
        />
      ) : view === 'timeline' ? (
        <TimelineView items={timelineItems} timeZone={timeZone} onSelect={setSelectedAppointment} />
      ) : view === 'list' ? (
        <ListView
          appointments={visibleAppointments}
          timeZone={timeZone}
          onSelect={setSelectedAppointment}
        />
      ) : (
        <CardsView
          appointments={visibleAppointments}
          timeZone={timeZone}
          onSelect={setSelectedAppointment}
        />
      )}

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        timeZone={timeZone}
        onClose={() => setSelectedAppointment(null)}
      />
      {isCreateModalOpen ? (
        <NewAppointmentModal
          isOpen={isCreateModalOpen}
          date={selectedDate}
          timeZone={timeZone}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={async (createdDate) => {
            if (createdDate === selectedDate) {
              await refresh();
            } else {
              updateDate(createdDate);
            }
            setCreationNotice(
              `Agendamento criado para ${createdDate.split('-').reverse().join('/')}.`
            );
          }}
        />
      ) : null}
    </div>
  );
};

const AppointmentIdentity: React.FC<{ appointment: AgendaAppointment; compact?: boolean }> = ({
  appointment,
  compact = false,
}) => {
  const clientName = appointment.clientName ?? 'Cliente não informado';
  const avatarUrl = appointment.client?.avatarUrl;
  return (
    <div className="flex min-w-0 items-center gap-3">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          className={`shrink-0 rounded-full border border-[#D4AF37]/35 object-cover ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
        />
      ) : (
        <div
          className={`flex shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-[#6B7280] ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
        </div>
      )}
      <div className="min-w-0 text-left">
        <p className="truncate font-semibold text-[#1A1A1F]">{clientName}</p>
        <p className="truncate text-xs text-[#6B7280]">
          {appointment.serviceName ?? 'Serviço não informado'}
        </p>
      </div>
    </div>
  );
};

const AppointmentSummary: React.FC<{
  appointment: AgendaAppointment;
  timeZone: string;
  onSelect: (appointment: AgendaAppointment) => void;
}> = ({ appointment, timeZone, onSelect }) => {
  const status = statusMeta[appointment.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      className={`w-full rounded-2xl border border-[#E5E7EB] bg-white p-4 text-left shadow-[0_8px_24px_rgba(26,26,31,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-[0_12px_28px_rgba(26,26,31,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 ${statusClass(appointment.status)}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-[84px] items-baseline gap-2 border-b border-[#E5E7EB] pb-3 sm:block sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
          <p className="text-xl font-bold tabular-nums text-[#1A1A1F]">
            {formatTime(appointment.startsAt, timeZone)}
          </p>
          <p className="text-xs text-[#6B7280]">{durationLabel(appointment.durationMinutes)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <AppointmentIdentity appointment={appointment} />
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <span className="text-sm font-semibold text-[#1A1A1F]">
            {formatCurrency(appointment.price)}
          </span>
          <StatusBadge label={status.label} tone={status.tone} />
          <span className="material-symbols-outlined text-[#9CA3AF]" aria-hidden="true">
            chevron_right
          </span>
        </div>
      </div>
    </button>
  );
};

const ListView: React.FC<{
  appointments: AgendaAppointment[];
  timeZone: string;
  onSelect: (appointment: AgendaAppointment) => void;
}> = ({ appointments, timeZone, onSelect }) => (
  <section aria-label="Agenda em lista" className="space-y-3">
    {appointments.map((appointment) => (
      <AppointmentSummary
        key={appointment.id}
        appointment={appointment}
        timeZone={timeZone}
        onSelect={onSelect}
      />
    ))}
  </section>
);

const CardsView: React.FC<{
  appointments: AgendaAppointment[];
  timeZone: string;
  onSelect: (appointment: AgendaAppointment) => void;
}> = ({ appointments, timeZone, onSelect }) => (
  <section aria-label="Agenda em cards" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
    {appointments.map((appointment) => {
      const status = statusMeta[appointment.status];
      return (
        <button
          key={appointment.id}
          type="button"
          onClick={() => onSelect(appointment)}
          className={`rounded-[20px] border border-[#E5E7EB] bg-white p-4 text-left shadow-[0_8px_24px_rgba(26,26,31,0.04)] transition-all hover:-translate-y-0.5 hover:border-[#D4AF37]/60 hover:shadow-[0_12px_28px_rgba(26,26,31,0.08)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 ${statusClass(appointment.status)}`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-2xl font-bold tabular-nums text-[#1A1A1F]">
                {formatTime(appointment.startsAt, timeZone)}
              </p>
              <p className="mt-0.5 text-xs text-[#6B7280]">
                {durationLabel(appointment.durationMinutes)}
              </p>
            </div>
            <StatusBadge label={status.label} tone={status.tone} />
          </div>
          <AppointmentIdentity appointment={appointment} />
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#E5E7EB] pt-3 text-xs text-[#6B7280]">
            <span className="truncate">
              {appointment.professional?.name ?? 'Profissional não informado'}
            </span>
            <span className="shrink-0 font-semibold text-[#1A1A1F]">
              {formatCurrency(appointment.price)}
            </span>
          </div>
        </button>
      );
    })}
  </section>
);

const TimelineView: React.FC<{
  items: TimelineItem[];
  timeZone: string;
  onSelect: (appointment: AgendaAppointment) => void;
}> = ({ items, timeZone, onSelect }) => {
  const startHour = Math.min(7, ...items.map((item) => Math.floor(item.startMinutes / 60)));
  const endHour = Math.max(20, ...items.map((item) => Math.ceil(item.endMinutes / 60)));
  const hourCount = Math.max(1, endHour - startHour + 1);
  const pixelsPerMinute = 1.15;
  const timelineHeight = hourCount * 60 * pixelsPerMinute;
  const hours = Array.from({ length: hourCount }, (_, index) => startHour + index);

  return (
    <Panel className="overflow-hidden p-0">
      <div className="border-b border-[#E5E7EB] px-4 py-3 sm:px-5">
        <p className="text-sm font-semibold text-[#1A1A1F]">Grade do dia</p>
        <p className="mt-0.5 text-xs text-[#6B7280]">
          Horários que se sobrepõem são exibidos lado a lado.
        </p>
        <p className="mt-2 text-xs font-medium text-[#7A5E12] sm:hidden">
          Deslize para os lados para visualizar toda a grade.
        </p>
      </div>
      <div className="overflow-x-auto overscroll-contain">
        <div className="min-w-[620px] p-3 sm:p-4">
          <div className="grid grid-cols-[52px_minmax(0,1fr)]">
            <div className="relative" style={{ height: timelineHeight }}>
              {hours.map((hour) => (
                <span
                  key={hour}
                  className="absolute right-3 -translate-y-1/2 text-xs font-medium tabular-nums text-[#6B7280]"
                  style={{ top: (hour - startHour) * 60 * pixelsPerMinute }}
                >
                  {String(hour).padStart(2, '0')}:00
                </span>
              ))}
            </div>
            <div
              className="relative border-l border-[#E5E7EB] bg-[linear-gradient(to_bottom,rgba(229,231,235,0.8)_1px,transparent_1px)]"
              style={{ height: timelineHeight, backgroundSize: `100% ${60 * pixelsPerMinute}px` }}
            >
              {items.map((item) => {
                const top = (item.startMinutes - startHour * 60) * pixelsPerMinute;
                const height = Math.max(
                  (item.endMinutes - item.startMinutes) * pixelsPerMinute - 5,
                  48
                );
                return (
                  <button
                    key={item.appointment.id}
                    type="button"
                    onClick={() => onSelect(item.appointment)}
                    aria-label={`${formatTime(item.appointment.startsAt, timeZone)}, ${item.appointment.clientName ?? 'cliente não informado'}, ${item.appointment.serviceName ?? 'serviço não informado'}`}
                    className={`absolute overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-[#FFFAE9] px-3 py-2 text-left shadow-sm transition-all hover:z-10 hover:border-[#B38D1C] hover:shadow-md focus:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] ${statusClass(item.appointment.status)}`}
                    style={{
                      top,
                      height,
                      left: `calc(${(item.lane * 100) / item.laneCount}% + 3px)`,
                      width: `calc(${100 / item.laneCount}% - 6px)`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-bold text-[#1A1A1F]">
                        {item.appointment.clientName ?? 'Cliente não informado'}
                      </span>
                      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-[#7A5E12]">
                        {formatTime(item.appointment.startsAt, timeZone)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[#6B7280]">
                      {item.appointment.serviceName ?? 'Serviço não informado'}
                    </p>
                    <p className="mt-1 truncate text-[11px] text-[#7A5E12]">
                      {durationLabel(item.appointment.durationMinutes)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

const Detail: React.FC<{ icon: string; label: string; children: React.ReactNode }> = ({
  icon,
  label,
  children,
}) => (
  <div className="rounded-2xl border border-[#E5E7EB] bg-[#FCFCFD] p-4">
    <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]">
      <span className="material-symbols-outlined text-[16px] text-[#9A7417]">{icon}</span>
      {label}
    </p>
    <div className="text-sm leading-6 text-[#1A1A1F]">{children}</div>
  </div>
);

const AppointmentDetailsModal: React.FC<{
  appointment: AgendaAppointment | null;
  timeZone: string;
  onClose: () => void;
}> = ({ appointment, timeZone, onClose }) => {
  if (!appointment) return null;
  const status = statusMeta[appointment.status];
  const contact = [appointment.client?.phone, appointment.client?.email]
    .filter(Boolean)
    .join(' · ');
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Detalhes do agendamento"
      eyebrow="Agenda diária"
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-[#E5E7EB] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <AppointmentIdentity appointment={appointment} />
          <StatusBadge label={status.label} tone={status.tone} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Detail icon="person" label="Cliente">
            <p className="font-semibold">{appointment.clientName ?? 'Não informado'}</p>
            <p className="text-[#6B7280]">{contact || 'Contato não informado'}</p>
          </Detail>
          <Detail icon="content_cut" label="Serviços">
            <p className="font-semibold">{appointment.serviceName ?? 'Não informado'}</p>
            <p className="text-[#6B7280]">{formatCurrency(appointment.price)}</p>
          </Detail>
          <Detail icon="schedule" label="Horário">
            <p className="font-semibold">
              {formatTime(appointment.startsAt, timeZone)}
              {appointment.endsAt ? ` às ${formatTime(appointment.endsAt, timeZone)}` : ''}
            </p>
            <p className="text-[#6B7280]">{durationLabel(appointment.durationMinutes)}</p>
          </Detail>
          <Detail icon="badge" label="Profissional">
            <p className="font-semibold">{appointment.professional?.name ?? 'Não informado'}</p>
            <p className="text-[#6B7280]">
              {appointment.professional?.kind === 'barber'
                ? 'Barbeiro'
                : appointment.professional?.kind === 'employee'
                  ? 'Colaborador'
                  : 'Sem vínculo informado'}
            </p>
          </Detail>
        </div>
        {appointment.services.length > 1 ? (
          <Detail icon="format_list_bulleted" label="Composição dos serviços">
            <ul className="space-y-1.5">
              {appointment.services.map((service) => (
                <li key={service.id}>
                  {service.name ?? 'Serviço sem nome'}
                  {service.durationMinutes ? (
                    <span className="text-[#6B7280]">
                      {' '}
                      · {durationLabel(service.durationMinutes)}
                    </span>
                  ) : null}
                  {service.price !== null ? (
                    <span className="text-[#6B7280]"> · {formatCurrency(service.price)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Detail>
        ) : null}
        <Detail icon="notes" label="Observação">
          <p className="whitespace-pre-wrap text-[#4B5563]">
            {appointment.observation?.trim() || 'Nenhuma observação registrada.'}
          </p>
        </Detail>
        <p className="text-center text-xs text-[#6B7280]">Visualização somente leitura.</p>
      </div>
    </Modal>
  );
};

export default Agenda;
