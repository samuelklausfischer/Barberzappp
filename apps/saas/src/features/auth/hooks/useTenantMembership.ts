import { useState, useCallback } from 'react';
import { supabase } from '@/infrastructure/supabase/client';

interface TenantMembership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'employee';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  updated_at: string;
}

export const useTenantMembership = () => {
  const [membership, setMembership] = useState<TenantMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembership = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tenant_memberships')
        .select(`
          id,
          user_id,
          tenant_id,
          role,
          status,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (fetchError) throw fetchError;

      setMembership(data);
    } catch (err) {
      console.error('Erro ao buscar membership:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar membership');
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMembership = useCallback(async (membership: Omit<TenantMembership, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);

      const { data, error: insertError } = await supabase
        .from('tenant_memberships')
        .insert(membership)
        .select()
        .single();

      if (insertError) throw insertError;

      setMembership(data);
      return data;
    } catch (err) {
      console.error('Erro ao criar membership:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar membership';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateMembership = useCallback(async (id: string, updates: Partial<TenantMembership>) => {
    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from('tenant_memberships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      setMembership(data);
      return data;
    } catch (err) {
      console.error('Erro ao atualizar membership:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar membership';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteMembership = useCallback(async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('tenant_memberships')
        .update({ status: 'inactive' })
        .eq('id', id);

      if (deleteError) throw deleteError;

      setMembership(null);
    } catch (err) {
      console.error('Erro ao excluir membership:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir membership';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    membership,
    loading,
    error,
    refresh: () => fetchMembership(membership?.user_id || ''),
    createMembership,
    updateMembership,
    deleteMembership,
  };
};
