import { useState, useEffect, useCallback } from 'react';
import { supabase, Client } from '@/infrastructure/supabase/client';
import { useTenant } from '@/features/auth/hooks/useTenant';

type ClientInput = Pick<Client, 'name' | 'phone' | 'email' | 'avatar_url'>;

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        setClients([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;

      setClients(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createClient = useCallback(
    async (client: ClientInput) => {
      try {
        setError(null);

        if (!tenantId) {
          throw new Error('Barbearia não identificada');
        }

        const clientWithScope = {
          ...client,
          tenant_id: tenantId,
          shop_id: tenantId,
          user_id: tenantId,
        };

        const { data, error: insertError } = await supabase
          .from('clients')
          .insert(clientWithScope)
          .select()
          .single();

        if (insertError) throw insertError;

        if (data) {
          setClients((prev) => [...prev, data]);
        }

        return data;
      } catch (err) {
        console.error('Erro ao criar cliente:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [tenantId]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<ClientInput>) => {
      try {
        setError(null);

        if (!tenantId) {
          throw new Error('Barbearia não identificada');
        }

        const { data, error: updateError } = await supabase
          .from('clients')
          .update(updates)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (updateError) throw updateError;

        if (data) {
          setClients((prev) => prev.map((c) => (c.id === id ? data : c)));
        }

        return data;
      } catch (err) {
        console.error('Erro ao atualizar cliente:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [tenantId]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      try {
        setError(null);

        if (!tenantId) {
          throw new Error('Barbearia não identificada');
        }

        const { error: deleteError } = await supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId);

        if (deleteError) throw deleteError;

        setClients((prev) => prev.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Erro ao excluir cliente:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [tenantId]
  );

  const searchByPhone = useCallback(
    async (phone: string) => {
      try {
        setError(null);

        if (!tenantId) {
          return [];
        }

        const { data, error: searchError } = await supabase
          .from('clients')
          .select('*')
          .ilike('phone', `%${phone}%`)
          .eq('tenant_id', tenantId);

        if (searchError) throw searchError;

        return data || [];
      } catch (err) {
        console.error('Erro ao buscar por telefone:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar cliente';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [tenantId]
  );

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
