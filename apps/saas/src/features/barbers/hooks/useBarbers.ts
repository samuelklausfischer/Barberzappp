import { useState, useEffect, useCallback } from 'react';
import { supabase, Barber } from '@/infrastructure/supabase/client';
import { useTenant } from '@/features/auth/hooks/useTenant';

export const useBarbers = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();

  const fetchBarbers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        setBarbers([]);
        setLoading(false);
        return;
      }
       
      const { data, error: fetchError } = await supabase
        .from('barbers')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      setBarbers(data || []);
    } catch (err) {
      console.error('Erro ao buscar barbeiros:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar barbeiros');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createBarber = useCallback(async (barber: Omit<Barber, 'id' | 'created_at'>) => {
    try {
      setError(null);

      if (!tenantId) {
        throw new Error('Tenant não selecionado');
      }

      const barberWithTenant = {
        ...barber,
        tenant_id: barber.tenant_id || tenantId,
      };
       
      const { data, error: insertError } = await supabase
        .from('barbers')
        .insert(barberWithTenant)
        .select()
        .single();

      if (insertError) throw insertError;
      
      if (data) {
        setBarbers(prev => [...prev, data]);
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao criar barbeiro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar barbeiro';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [tenantId]);

  const updateBarber = useCallback(async (id: string, updates: Partial<Barber>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('barbers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      if (data) {
        setBarbers(prev => prev.map(b => b.id === id ? data : b));
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar barbeiro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar barbeiro';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const toggleBarberStatus = useCallback(async (id: string) => {
    try {
      const barber = barbers.find(b => b.id === id);
      if (!barber) return;
      
      const newStatus = barber.active ? 'inactive' : 'active';
      const newActive = !barber.active;
      
      const { data, error: updateError } = await supabase
        .from('barbers')
        .update({ active: newActive, status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      if (data) {
        setBarbers(prev => prev.map(b => b.id === id ? data : b));
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao alterar status do barbeiro:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao alterar status';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [barbers]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  return {
    barbers,
    loading,
    error,
    refresh: fetchBarbers,
    createBarber,
    updateBarber,
    toggleBarberStatus,
  };
};
