
export interface Appointment {
  id: string;
  clientName: string;
  clientAvatar: string;
  service: string;
  time: string;
  duration: string;
  price: number;
  status: 'confirmed' | 'pending' | 'canceled';
}

export type AgendaAppointmentStatus =
  | 'scheduled'
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'canceled'
  | 'no_show';

export interface AgendaAppointmentClient {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface AgendaAppointmentService {
  id: string;
  name: string | null;
  description: string | null;
  durationMinutes: number | null;
  price: number | null;
}

export interface AgendaAppointmentProfessional {
  id: string;
  name: string | null;
  kind: 'barber' | 'employee';
}

/**
 * Read model used by the daily agenda. Unlike the legacy Appointment type,
 * this preserves the original timestamps needed by timeline positioning.
 */
export interface AgendaAppointment {
  id: string;
  tenantId: string;
  startsAt: string;
  endsAt: string | null;
  durationMinutes: number | null;
  status: AgendaAppointmentStatus;
  price: number | null;
  observation: string | null;
  clientName: string | null;
  serviceName: string | null;
  client: AgendaAppointmentClient | null;
  service: AgendaAppointmentService | null;
  services: AgendaAppointmentService[];
  professional: AgendaAppointmentProfessional | null;
}
