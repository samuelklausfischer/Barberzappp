import { DEFAULT_AGENDA_TIME_ZONE, getAgendaDateTime } from './agendaDateRange.ts';

export type ManualAppointmentService = {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  barberId?: string | null;
};

export const getServiceDurationMinutes = (
  durationMinutes: number | null,
  duration: number | null
) => {
  const selected = durationMinutes !== null && durationMinutes !== 0
    ? durationMinutes
    : duration !== null && duration !== 0
      ? duration
      : null;
  return selected !== null && selected > 0 ? selected : null;
};

export const getManualAppointmentTotals = (services: ManualAppointmentService[]) =>
  services.reduce(
    (totals, service) => ({
      price: totals.price + service.price,
      durationMinutes: totals.durationMinutes + service.durationMinutes,
    }),
    { price: 0, durationMinutes: 0 }
  );

export const getManualAppointmentEndAt = (
  date: string,
  time: string,
  services: ManualAppointmentService[],
  timeZone = DEFAULT_AGENDA_TIME_ZONE
) => {
  const startsAt = getAgendaDateTime(date, time, timeZone);
  return new Date(
    new Date(startsAt).getTime() + getManualAppointmentTotals(services).durationMinutes * 60_000
  ).toISOString();
};

export const getSafeManualAppointmentEndAt = (
  date: string,
  time: string,
  services: ManualAppointmentService[],
  timeZone = DEFAULT_AGENDA_TIME_ZONE
) => {
  try {
    return getManualAppointmentEndAt(date, time, services, timeZone);
  } catch {
    return null;
  }
};

export const validateManualAppointmentDraft = ({
  clientId,
  barberId,
  serviceIds,
  date,
  time,
  now = new Date(),
  timeZone = DEFAULT_AGENDA_TIME_ZONE,
}: {
  clientId: string;
  barberId: string;
  serviceIds: string[];
  date: string;
  time: string;
  now?: Date;
  timeZone?: string;
}) => {
  if (!clientId) return 'Selecione um cliente.';
  if (serviceIds.length === 0) return 'Selecione pelo menos um servi\u00e7o.';
  if (serviceIds.length > 10) return 'Selecione no m\u00e1ximo 10 servi\u00e7os.';
  if (!barberId) return 'Selecione o barbeiro respons\u00e1vel.';
  if (!date || !time) return 'Informe a data e o hor\u00e1rio do agendamento.';

  try {
    if (new Date(getAgendaDateTime(date, time, timeZone)).getTime() < now.getTime()) {
      return 'Escolha um hor\u00e1rio futuro.';
    }
  } catch (error) {
    return error instanceof Error ? error.message : 'Data ou hor\u00e1rio inv\u00e1lido.';
  }

  return null;
};
