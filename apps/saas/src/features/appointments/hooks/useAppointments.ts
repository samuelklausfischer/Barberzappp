import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '@/features/auth/hooks/useTenant';
import { supabase } from '@/infrastructure/supabase/client';
import type { Appointment } from '../types';

type AppointmentRow = {
  id: string | number;
  client_name: string | null;
  service_type: string | null;
  start_time: string | null;
  scheduled_at: string | null;
  end_time: string | null;
  status: string | null;
  price: number | string | null;
};

const formatTime = (value: string | null) => {
  if (!value) return '--:--';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '--:--'
    : date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (start: string | null, end: string | null) => {
  if (!start || !end) return 'Duração não informada';

  const minutes = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60_000);
  return Number.isFinite(minutes) && minutes > 0 ? `${minutes} min` : 'Duração não informada';
};

const mapStatus = (status: string | null): Appointment['status'] => {
  const normalized = status?.toLowerCase();
  if (normalized === 'confirmed') return 'confirmed';
  if (normalized === 'canceled' || normalized === 'cancelled') return 'canceled';
  return 'pending';
};

const mapAppointment = (row: AppointmentRow): Appointment => {
  const start = row.start_time || row.scheduled_at;

  return {
    id: String(row.id),
    clientName: row.client_name || 'Cliente não informado',
    clientAvatar: '',
    service: row.service_type || 'Serviço não informado',
    time: formatTime(start),
    duration: formatDuration(start, row.end_time),
    price: Number(row.price) || 0,
    status: mapStatus(row.status),
  };
};

export const useAppointments = () => {
  const { tenantId } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!tenantId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('appointments')
        .select('id, client_name, service_type, start_time, scheduled_at, end_time, status, price')
        .eq('tenant_id', tenantId)
        .order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;
      setAppointments(((data || []) as AppointmentRow[]).map(mapAppointment));
    } catch (cause) {
      console.error('Erro ao buscar agendamentos:', cause);
      setAppointments([]);
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchAppointments();
  }, [fetchAppointments]);

  return {
    appointments,
    loading,
    error,
    refresh: fetchAppointments,
  };
};
