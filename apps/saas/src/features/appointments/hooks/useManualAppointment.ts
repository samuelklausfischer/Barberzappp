import { useCallback, useEffect, useRef, useState } from 'react';
import { useTenant } from '@/features/auth/hooks/useTenant';
import { supabase } from '@/infrastructure/supabase/client';
import type { AgendaAppointmentStatus } from '../types';
import { getServiceDurationMinutes, type ManualAppointmentService } from '../utils/manualAppointment';

type ClientOption = { id: string; name: string; phone: string | null };
export type BarberOption = { id: string; name: string };
export type ManualAppointmentOptions = {
  clients: ClientOption[];
  services: ManualAppointmentService[];
  barbers: BarberOption[];
};

type ClientRow = { id: string | number; name: string | null; phone: string | null; deleted_at: string | null; status: string | null };
type ServiceRow = { id: string | number; name: string | null; price: number | string | null; duration: number | null; duration_minutes: number | null; active: boolean | null; status: string | null; barber_id: string | number | null };
type BarberRow = { id: string | number; name: string | null; active: boolean | null; status: string | null };

type RpcErrorLike = { message?: unknown; details?: unknown; hint?: unknown; code?: unknown };

const isRpcErrorLike = (value: unknown): value is RpcErrorLike =>
  typeof value === 'object' && value !== null;

const asNumber = (value: number | string | null) => {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const mapManualAppointmentRpcError = (cause: unknown) => {
  const values = cause instanceof Error
    ? [cause.message]
    : isRpcErrorLike(cause)
      ? [cause.message, cause.details, cause.hint, cause.code].filter((value): value is string => typeof value === 'string')
      : [String(cause ?? '')];
  const message = values.join(' ').toUpperCase();
  if (message.includes('PAST_APPOINTMENT')) return 'N\u00e3o \u00e9 poss\u00edvel criar agendamentos no passado.';
  if (message.includes('APPOINTMENT_CONFLICT')) return 'Este barbeiro j\u00e1 possui um agendamento neste hor\u00e1rio.';
  if (message.includes('CLIENT_NOT_FOUND')) return 'O cliente selecionado n\u00e3o est\u00e1 dispon\u00edvel.';
  if (message.includes('BARBER_NOT_FOUND')) return 'O barbeiro selecionado n\u00e3o est\u00e1 dispon\u00edvel.';
  if (message.includes('SERVICE')) return 'Um ou mais servi\u00e7os selecionados n\u00e3o est\u00e3o dispon\u00edveis.';
  return 'N\u00e3o foi poss\u00edvel criar o agendamento. Tente novamente.';
};

export const useManualAppointmentOptions = () => {
  const { tenantId } = useTenant();
  const [options, setOptions] = useState<ManualAppointmentOptions>({ clients: [], services: [], barbers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++requestRef.current;
    if (!tenantId) {
      setOptions({ clients: [], services: [], barbers: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [clientsResult, servicesResult, barbersResult] = await Promise.all([
        supabase.from('clients').select('id, name, phone, deleted_at, status').eq('tenant_id', tenantId).is('deleted_at', null).order('name'),
        supabase.from('services').select('id, name, price, duration, duration_minutes, active, status, barber_id').eq('tenant_id', tenantId).or('active.is.null,active.eq.true').order('name'),
        supabase.from('barbers').select('id, name, active, status').eq('tenant_id', tenantId).or('active.is.null,active.eq.true').order('name'),
      ]);
      if (clientsResult.error) throw clientsResult.error;
      if (servicesResult.error) throw servicesResult.error;
      if (barbersResult.error) throw barbersResult.error;
      if (request !== requestRef.current) return;
      setOptions({
        clients: ((clientsResult.data ?? []) as ClientRow[])
          .filter((row) => row.status === null || row.status === 'active')
          .map((row) => ({ id: String(row.id), name: row.name ?? 'Cliente sem nome', phone: row.phone })),
        services: ((servicesResult.data ?? []) as ServiceRow[])
          .map((row) => ({ row, durationMinutes: getServiceDurationMinutes(row.duration_minutes, row.duration) }))
          .filter(({ row, durationMinutes }) => (row.status === null || row.status === 'active') && asNumber(row.price) >= 0 && durationMinutes !== null)
          .map(({ row, durationMinutes }) => ({ id: String(row.id), name: row.name ?? 'Servi\u00e7o sem nome', price: asNumber(row.price), durationMinutes, barberId: row.barber_id === null ? null : String(row.barber_id) })),
        barbers: ((barbersResult.data ?? []) as BarberRow[])
          .filter((row) => row.status === null || row.status === 'active')
          .map((row) => ({ id: String(row.id), name: row.name ?? 'Barbeiro sem nome' })),
      });
    } catch {
      if (request !== requestRef.current) return;
      setOptions({ clients: [], services: [], barbers: [] });
      setError('N\u00e3o foi poss\u00edvel carregar as op\u00e7\u00f5es do agendamento.');
    } finally {
      if (request === requestRef.current) setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => { void refresh(); }, [refresh]);
  return { ...options, loading, error, refresh };
};

export const useCreateManualAppointment = () => {
  const { tenantId } = useTenant();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const create = useCallback(async ({ clientId, barberId, scheduledAt, serviceIds, observation, status }: {
    clientId: string;
    barberId: string;
    scheduledAt: string;
    serviceIds: string[];
    observation: string | null;
    status: Extract<AgendaAppointmentStatus, 'scheduled' | 'confirmed'>;
  }) => {
    if (!tenantId) throw new Error('Barbearia n\u00e3o identificada.');
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setCreating(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('create_manual_appointment', {
        p_tenant_id: tenantId,
        p_client_id: Number(clientId),
        p_barber_id: Number(barberId),
        p_scheduled_at: scheduledAt,
        p_service_ids: serviceIds.map(Number),
        p_observation: observation,
        p_status: status,
      });
      if (rpcError) throw rpcError;
      const result = data as { success?: boolean; code?: string; message?: string } | null;
      if (!result?.success) throw new Error(result?.code ?? result?.message ?? 'VALIDATION_ERROR');
      return true;
    } catch (cause) {
      const message = mapManualAppointmentRpcError(cause);
      setError(message);
      throw new Error(message);
    } finally {
      submittingRef.current = false;
      setCreating(false);
    }
  }, [tenantId]);

  return { create, creating, error };
};
