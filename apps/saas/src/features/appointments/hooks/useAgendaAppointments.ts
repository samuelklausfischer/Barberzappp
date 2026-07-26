import { useCallback, useEffect, useRef, useState } from 'react';
import { useTenant } from '@/features/auth/hooks/useTenant';
import { supabase } from '@/infrastructure/supabase/client';
import type {
  AgendaAppointment,
  AgendaAppointmentClient,
  AgendaAppointmentProfessional,
  AgendaAppointmentService,
  AgendaAppointmentStatus,
} from '../types';
import { DEFAULT_AGENDA_TIME_ZONE, getAgendaDayRange } from '../utils/agendaDateRange';

type RelatedRow = Record<string, unknown> | null | Array<Record<string, unknown>>;

type AgendaAppointmentRow = {
  id: string | number;
  tenant_id: string | null;
  client_name: string | null;
  service_type: string | null;
  scheduled_at: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  price: number | string | null;
  observation: string | null;
  clients: RelatedRow;
  services: RelatedRow;
  barbers: RelatedRow;
  employees: RelatedRow;
  appointment_services: RelatedRow;
};

const firstRelation = (value: RelatedRow) => (Array.isArray(value) ? value[0] ?? null : value);

const asString = (value: unknown) => (typeof value === 'string' ? value : null);

const asId = (value: unknown) => (typeof value === 'string' || typeof value === 'number' ? String(value) : null);

const asNumber = (value: unknown) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const asPositiveNumber = (value: unknown) => {
  const number = asNumber(value);
  return number !== null && number > 0 ? number : null;
};

const mapStatus = (value: string | null): AgendaAppointmentStatus => {
  switch (value?.trim().toLowerCase()) {
    case 'pending':
      return 'pending';
    case 'confirmed':
      return 'confirmed';
    case 'completed':
      return 'completed';
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    case 'no_show':
    case 'no-show':
    case 'noshow':
      return 'no_show';
    default:
      return 'scheduled';
  }
};

const mapClient = (relation: RelatedRow): AgendaAppointmentClient | null => {
  const client = firstRelation(relation);
  const id = asId(client?.id);
  if (!client || !id) return null;

  return {
    id,
    name: asString(client.name),
    phone: asString(client.phone) ?? asString(client.phone_number),
    email: asString(client.email),
    avatarUrl: asString(client.avatar_url),
  };
};

const mapService = (relation: RelatedRow): AgendaAppointmentService | null => {
  const service = firstRelation(relation);
  const id = asId(service?.id);
  if (!service || !id) return null;

  return {
    id,
    name: asString(service.name),
    description: asString(service.description),
    durationMinutes: asPositiveNumber(service.duration_minutes) ?? asPositiveNumber(service.duration),
    price: asNumber(service.price),
  };
};

const mapServices = (relation: RelatedRow): AgendaAppointmentService[] => {
  const rows = Array.isArray(relation) ? relation : relation ? [relation] : [];
  return rows
    .map((service) => {
      const id = asId(service.service_id) ?? asId(service.id);
      if (!id) return null;
      return {
        id,
        name: asString(service.service_name) ?? asString(service.name),
        description: asString(service.description),
        durationMinutes: asPositiveNumber(service.duration_minutes) ?? asPositiveNumber(service.duration),
        price: asNumber(service.unit_price) ?? asNumber(service.price),
        position: asNumber(service.position) ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .filter((service): service is AgendaAppointmentService & { position: number } => service !== null)
    .sort((first, second) => first.position - second.position)
    .map(({ position: _position, ...service }) => service);
};

const mapProfessional = (
  barberRelation: RelatedRow,
  employeeRelation: RelatedRow
): AgendaAppointmentProfessional | null => {
  const barber = firstRelation(barberRelation);
  const barberId = asId(barber?.id);
  if (barber && barberId) return { id: barberId, name: asString(barber.name), kind: 'barber' };

  const employee = firstRelation(employeeRelation);
  const employeeId = asId(employee?.id);
  if (!employee || !employeeId) return null;

  return { id: employeeId, name: asString(employee.name), kind: 'employee' };
};

const calculateDurationMinutes = (startsAt: string, endsAt: string | null) => {
  if (!endsAt) return null;
  const duration = (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000;
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
};

export const mapAgendaAppointment = (row: AgendaAppointmentRow): AgendaAppointment | null => {
  const startsAt = row.scheduled_at ?? row.start_time;
  if (!row.tenant_id || !startsAt || Number.isNaN(new Date(startsAt).getTime())) return null;

  const client = mapClient(row.clients);
  const legacyService = mapService(row.services);
  const services = mapServices(row.appointment_services);
  const service = services[0] ?? legacyService;
  const endsAt = row.end_time && !Number.isNaN(new Date(row.end_time).getTime()) ? row.end_time : null;

  return {
    id: String(row.id),
    tenantId: row.tenant_id,
    startsAt,
    endsAt,
    durationMinutes:
      calculateDurationMinutes(startsAt, endsAt) ??
      (services.length > 0
        ? services.reduce((total, serviceItem) => total + (serviceItem.durationMinutes ?? 0), 0) || null
        : service?.durationMinutes ?? null),
    status: mapStatus(row.status),
    price: asNumber(row.price),
    observation: row.observation,
    clientName: client?.name ?? row.client_name ?? null,
    serviceName:
      services.map((serviceItem) => serviceItem.name).filter(Boolean).join(' + ') ||
      service?.name ||
      row.service_type ||
      null,
    client,
    service,
    services,
    professional: mapProfessional(row.barbers, row.employees),
  };
};

export type UseAgendaAppointmentsOptions = {
  date: string;
  timeZone?: string;
};

export const useAgendaAppointments = ({
  date,
  timeZone = DEFAULT_AGENDA_TIME_ZONE,
}: UseAgendaAppointmentsOptions) => {
  const { tenantId } = useTenant();
  const queryKey = `${tenantId ?? 'no-tenant'}:${date}:${timeZone}`;
  const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);
  const requestVersionRef = useRef(0);
  const mountedRef = useRef(true);
  const activeQueryKeyRef = useRef(queryKey);

  activeQueryKeyRef.current = queryKey;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestVersionRef.current += 1;
    };
  }, []);

  const refresh = useCallback(async () => {
    const requestVersion = ++requestVersionRef.current;
    const canUpdate = () =>
      mountedRef.current &&
      requestVersion === requestVersionRef.current &&
      activeQueryKeyRef.current === queryKey;

    if (!tenantId) {
      if (canUpdate()) {
        setAppointments([]);
        setError(null);
        setLoading(false);
        setResolvedQueryKey(queryKey);
      }
      return;
    }

    try {
      const range = getAgendaDayRange(date, timeZone);
      if (canUpdate()) {
        setLoading(true);
        setError(null);
      }

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select(
          'id, tenant_id, client_name, service_type, scheduled_at, start_time, end_time, status, price, observation, clients:clients!appointments_client_id_fkey(id, name, phone, phone_number, email, avatar_url), services:services!appointments_service_id_fkey(id, name, description, duration, duration_minutes, price), appointment_services(id, service_id, service_name, duration_minutes, unit_price, position), barbers:barbers!appointments_barber_id_fkey(id, name), employees:employees!appointments_employee_id_fkey(id, name)'
        )
        .eq('tenant_id', tenantId)
        .gte('scheduled_at', range.startsAt)
        .lt('scheduled_at', range.endsAt)
        .order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (!canUpdate()) return;

      setAppointments(
        ((data ?? []) as AgendaAppointmentRow[])
          .map(mapAgendaAppointment)
          .filter((appointment): appointment is AgendaAppointment => appointment !== null)
      );
      setResolvedQueryKey(queryKey);
    } catch (cause) {
      if (!canUpdate()) return;
      setAppointments([]);
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar a agenda');
      setResolvedQueryKey(queryKey);
    } finally {
      if (canUpdate()) setLoading(false);
    }
  }, [date, queryKey, tenantId, timeZone]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasResolvedCurrentQuery = resolvedQueryKey === queryKey;

  return {
    appointments,
    loading: loading || !hasResolvedCurrentQuery,
    error: hasResolvedCurrentQuery ? error : null,
    refresh,
  };
};
