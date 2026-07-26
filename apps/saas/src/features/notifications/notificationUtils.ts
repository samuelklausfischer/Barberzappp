export type AppointmentNotification = {
  id: string;
  appointmentId: string | null;
  readAt: string | null;
  createdAt: string;
  clientName: string | null;
  serviceName: string | null;
  scheduledAt: string | null;
};

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as UnknownRecord) : null;

const asString = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value : null);

const firstRelation = (value: unknown): UnknownRecord | null => {
  if (Array.isArray(value)) return asRecord(value[0]);
  return asRecord(value);
};

const asIdentifier = (value: unknown): string | null =>
  typeof value === 'number' || typeof value === 'string' ? String(value) : null;

export const normalizeAppointmentNotification = (value: unknown): AppointmentNotification | null => {
  const row = asRecord(value);
  const id = asIdentifier(row?.id);
  const createdAt = asString(row?.created_at);
  if (!row || !id || !createdAt) return null;

  const appointment = firstRelation(row.appointments);
  return {
    id,
    appointmentId: asIdentifier(row.appointment_id) ?? asIdentifier(appointment?.id),
    readAt: asString(row.read_at),
    createdAt,
    clientName: asString(appointment?.client_name),
    serviceName: asString(appointment?.service_type),
    scheduledAt: asString(appointment?.scheduled_at) ?? asString(appointment?.start_time),
  };
};

export const getUnreadNotificationLabel = (count: number) => {
  if (count <= 0) return 'Nenhuma notificação nova';
  return count === 1 ? '1 notificação nova' : `${count} notificações novas`;
};

export const formatNotificationDateTime = (value: string | null, timeZone: string) => {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Horário a confirmar';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(value));
};
