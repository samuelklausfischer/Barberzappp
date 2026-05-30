import { useState, useEffect, useCallback } from 'react';
import { supabase, Client } from '@/infrastructure/supabase/client';
import { useAuth } from '@/features/auth/hooks/useAuth';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.id) {
        setClients([]);
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('barber_id', user.id)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      setClients(data || []);
    } catch (err) {
      console.error('Erro ao buscar clientes:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const createClient = useCallback(async (client: Omit<Client, 'id'>) => {
    try {
      setError(null);

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const clientWithOwner = {
        ...client,
        barber_id: client.barber_id || user.id,
      };
       
      const { data, error: insertError } = await supabase
        .from('clients')
        .insert(clientWithOwner)
        .select()
        .single();

      if (insertError) throw insertError;
      
      if (data) {
        setClients(prev => [...prev, data]);
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao criar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id]);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      if (data) {
        setClients(prev => prev.map(c => c.id === id ? data : c));
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const searchByPhone = useCallback(async (phone: string) => {
    try {
      setError(null);

      if (!user?.id) {
        return [];
      }
       
      const { data, error: searchError } = await supabase
        .from('clients')
        .select('*')
        .ilike('phone', `%${phone}%`)
        .eq('barber_id', user.id);

      if (searchError) throw searchError;
      
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar por telefone:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar cliente';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user?.id]);

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
