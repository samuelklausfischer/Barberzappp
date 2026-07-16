import { useState, useEffect, useCallback } from 'react';
import { supabase, Client } from '@/infrastructure/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

type ClientFormData = Pick<Client, 'name' | 'phone' | 'email' | 'avatar_url'>;

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenant } = useAuth();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenant?.id) {
        setClients([]);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null)
        .order('name', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      setClients(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [tenant?.id]);

  const createClient = useCallback(async (client: ClientFormData) => {
    try {
      setError(null);

      if (!tenant?.id) {
        throw new Error('Conta nao encontrada para criar cliente');
      }

      const clientPayload = {
        ...client,
        tenant_id: tenant.id,
        shop_id: tenant.id,
        user_id: tenant.id,
        phone_number: client.phone,
      };

      const { data, error: insertError } = await supabase
        .from('clients')
        .insert(clientPayload)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (data) {
        setClients((prev) => [...prev, data].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      }

      return data;
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [tenant?.id]);

  const updateClient = useCallback(async (id: Client['id'], updates: Partial<Client>) => {
    try {
      setError(null);

      if (!tenant?.id) {
        throw new Error('Conta nao encontrada para atualizar cliente');
      }

      const normalizedUpdates = {
        ...updates,
        phone_number: updates.phone ?? updates.phone_number,
      };

      const { data, error: updateError } = await supabase
        .from('clients')
        .update(normalizedUpdates)
        .eq('id', id)
        .eq('tenant_id', tenant.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (data) {
        setClients((prev) => prev.map((client) => (client.id === id ? data : client)));
      }

      return data;
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [tenant?.id]);

  const deleteClient = useCallback(async (id: Client['id']) => {
    try {
      setError(null);

      if (!tenant?.id) {
        throw new Error('Conta nao encontrada para excluir cliente');
      }

      const { error: deleteError } = await supabase
        .from('clients')
        .update({ deleted_at: new Date().toISOString(), status: 'deleted' })
        .eq('id', id)
        .eq('tenant_id', tenant.id);

      if (deleteError) {
        throw deleteError;
      }

      setClients((prev) => prev.filter((client) => client.id !== id));
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [tenant?.id]);

  const searchByPhone = useCallback(async (phone: string) => {
    try {
      setError(null);

      if (!tenant?.id) {
        return [];
      }

      const { data, error: searchError } = await supabase
        .from('clients')
        .select('*')
        .or(`phone.ilike.%${phone}%,phone_number.ilike.%${phone}%`)
        .eq('tenant_id', tenant.id)
        .is('deleted_at', null);

      if (searchError) {
        throw searchError;
      }

      return data || [];
    } catch (err) {
      console.error('Erro ao buscar por telefone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [tenant?.id]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    refresh: fetchClients,
    createClient,
    updateClient,
    deleteClient,
    searchByPhone,
  };
};
