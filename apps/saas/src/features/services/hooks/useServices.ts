import { useCallback, useEffect, useState } from 'react';
import { useTenant } from '@/features/auth/hooks/useTenant';
import { supabase } from '@/infrastructure/supabase/client';
import type { Service } from '../types';

type ServiceRow = {
  id: string | number;
  name: string | null;
  description: string | null;
  price: number | string | null;
  duration: number | null;
  duration_minutes: number | null;
};

const mapService = (row: ServiceRow): Service => ({
  id: String(row.id),
  name: row.name || 'Serviço sem nome',
  description: row.description || 'Sem descricao',
  price: Number(row.price) || 0,
  duration: row.duration_minutes || row.duration || 0,
  popular: false,
  icon: 'content_cut',
});

export const useServices = () => {
  const { tenantId } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!tenantId) {
      setServices([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('services')
        .select('id, name, description, price, duration, duration_minutes')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      setServices(((data || []) as ServiceRow[]).map(mapService));
    } catch (cause) {
      console.error('Erro ao buscar serviços:', cause);
      setServices([]);
      setError(cause instanceof Error ? cause.message : 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    refresh: fetchServices,
  };
};
