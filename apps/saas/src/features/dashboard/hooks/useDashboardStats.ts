import { useEffect, useState } from 'react';
import { Appointment } from '@/domain/types';
import { supabase } from '@/infrastructure/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface AppointmentRow {
  id: string;
  tenant_id: string | null;
  client_name: string | null;
  service_type: string | null;
  start_time: string | null;
  status: string | null;
  price: number | null;
  date: string | null;
}

interface DashboardStats {
  cutsToday: number;
  estimatedRevenue: number;
  nextAppointments: Appointment[];
  loading: boolean;
  error: string | null;
}

const cancelledStatuses = new Set(['canceled', 'cancelled', 'cancelado', 'cancelada']);

const getTodayDateKey = () => {
  const now = new Date();
  const offsetDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
};

const formatAppointmentTime = (startTime: string | null) => {
  if (!startTime) {
    return '--:--';
  }

  const parsed = new Date(startTime);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return startTime.slice(0, 5);
};

const normalizeStatus = (status: string | null): Appointment['status'] => {
  if (status === 'confirmed' || status === 'completed') {
    return 'confirmed';
  }

  if (status && cancelledStatuses.has(status.toLowerCase())) {
    return 'canceled';
  }

  return 'pending';
};

const mapAppointment = (row: AppointmentRow): Appointment => ({
  id: row.id,
  clientName: row.client_name || 'Cliente sem nome',
  clientAvatar: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(row.client_name || row.id)}`,
  service: row.service_type || 'Servico nao informado',
  time: formatAppointmentTime(row.start_time),
  duration: '30min',
  price: Number(row.price || 0),
  status: normalizeStatus(row.status),
});

export const useDashboardStats = (): DashboardStats => {
  const { tenant } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    cutsToday: 0,
    estimatedRevenue: 0,
    nextAppointments: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      if (!tenant?.id) {
        setStats({
          cutsToday: 0,
          estimatedRevenue: 0,
          nextAppointments: [],
          loading: false,
          error: null,
        });
        return;
      }

      setStats((current) => ({ ...current, loading: true, error: null }));

      const today = getTodayDateKey();
      const { data, error } = await supabase
        .from('appointments')
        .select('id, tenant_id, client_name, service_type, start_time, status, price, date')
        .eq('tenant_id', tenant.id)
        .eq('date', today)
        .order('start_time', { ascending: true });

      if (!isMounted) {
        return;
      }

      if (error) {
        setStats({
          cutsToday: 0,
          estimatedRevenue: 0,
          nextAppointments: [],
          loading: false,
          error: error.message,
        });
        return;
      }

      const rows = (data || []) as AppointmentRow[];
      const validRows = rows.filter((row) => !cancelledStatuses.has((row.status || '').toLowerCase()));

      setStats({
        cutsToday: validRows.length,
        estimatedRevenue: validRows.reduce((total, row) => total + Number(row.price || 0), 0),
        nextAppointments: validRows.slice(0, 3).map(mapAppointment),
        loading: false,
        error: null,
      });
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [tenant?.id]);

  return stats;
};
