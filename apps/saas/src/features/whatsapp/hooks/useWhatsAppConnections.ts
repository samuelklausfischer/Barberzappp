import { useState, useEffect, useCallback } from 'react';
import { supabase, WhatsAppConnection } from '@/infrastructure/supabase/client';
import { useTenant } from '@/features/auth/hooks/useTenant';
import { evolutionService, generateInstanceName } from '@/infrastructure/evolution/evolutionService';

export const useWhatsAppConnections = () => {
  const { tenantId } = useTenant();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchConnections = useCallback(async () => {
    if (!tenantId) {
      setConnections([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setConnections(data || []);
    } catch (err) {
      console.error('Erro ao buscar conexões:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar conexões');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createConnection = useCallback(async (displayName: string, phoneNumber: string) => {
    if (!tenantId) {
      return { success: false, error: 'Tenant não encontrado' };
    }

    try {
      setError(null);
      
      const instanceName = generateInstanceName(tenantId, displayName);
      
      const result = await evolutionService.createInstance({
        instanceName,
        phoneNumber,
        displayName,
      });

      if (!result.success) {
        return { success: false, error: result.error || 'Erro ao criar instância' };
      }

      const { data, error: insertError } = await supabase
        .from('whatsapp_connections')
        .insert({
          tenant_id: tenantId,
          instance_name: instanceName,
          display_name: displayName,
          phone_number: phoneNumber,
          status: 'DISCONNECTED',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      if (data) {
        setConnections(prev => [data, ...prev]);
      }

      return { success: true, connection: data };
    } catch (err) {
      console.error('Erro ao criar conexão:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conexão';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [tenantId]);

  const deleteConnection = useCallback(async (id: string) => {
    try {
      setError(null);

      const connection = connections.find(c => c.id === id);
      if (connection) {
        const remoteResult = await evolutionService.deleteInstance(connection.instance_name);
        if (!remoteResult.success) {
          return { success: false, error: remoteResult.error || 'Integracao de WhatsApp indisponivel' };
        }
      }

      const { error: deleteError } = await supabase
        .from('whatsapp_connections')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setConnections(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      console.error('Erro ao excluir conexão:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir conexão';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [connections]);

  const syncWithEvolution = useCallback(async () => {
    if (!tenantId) return;

    try {
      setSyncing(true);
      setError(null);

      const evolutionInstances = await evolutionService.listInstances();
      
      const { data: localConnections } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('tenant_id', tenantId);

      for (const localConn of localConnections || []) {
        const evolutionInstance = evolutionInstances.find(
          (ei: any) => ei.instanceName === localConn.instance_name
        );

        if (evolutionInstance) {
          const status = await evolutionService.getInstanceStatus(localConn.instance_name);
          
          await supabase
            .from('whatsapp_connections')
            .update({ 
              status: status,
              updated_at: new Date().toISOString()
            })
            .eq('id', localConn.id);
        }
      }

      await fetchConnections();
    } catch (err) {
      console.error('Erro ao sincronizar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  }, [tenantId, fetchConnections]);

  const getConnectionStatus = useCallback(async (instanceName: string): Promise<string> => {
    return await evolutionService.getInstanceStatus(instanceName);
  }, []);

  const getQrCode = useCallback(async (instanceName: string) => {
    return await evolutionService.getQrCode(instanceName);
  }, []);

  const disconnectInstance = useCallback(async (instanceName: string) => {
    return await evolutionService.disconnectInstance(instanceName);
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  return {
    connections,
    loading,
    error,
    syncing,
    refresh: fetchConnections,
    createConnection,
    deleteConnection,
    syncWithEvolution,
    getConnectionStatus,
    getQrCode,
    disconnectInstance,
  };
};
