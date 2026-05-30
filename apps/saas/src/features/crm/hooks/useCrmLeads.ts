import { useState, useEffect, useCallback } from 'react';
import { supabase, CrmLead } from '@/infrastructure/supabase/client';
import { useTenant } from '@/features/auth/hooks/useTenant';

export type KanbanStage = 'new' | 'interested' | 'scheduled' | 'loyal' | 'lost';

export const useCrmLeads = () => {
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!tenantId) {
        setLeads([]);
        setLoading(false);
        return;
      }
       
      const { data, error: fetchError } = await supabase
        .from('crm_leads')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      setLeads(data || []);
    } catch (err) {
      console.error('Erro ao buscar leads:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar leads');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  const createLead = useCallback(async (lead: Omit<CrmLead, 'id' | 'created_at'>) => {
    try {
      setError(null);

      if (!tenantId) {
        throw new Error('Tenant não selecionado');
      }

      const leadWithTenant = {
        ...lead,
        tenant_id: lead.tenant_id || tenantId,
      };
       
      const { data, error: insertError } = await supabase
        .from('crm_leads')
        .insert(leadWithTenant)
        .select()
        .single();

      if (insertError) throw insertError;
      
      if (data) {
        setLeads(prev => [data, ...prev]);
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao criar lead:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar lead';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [tenantId]);

  const updateLeadStage = useCallback(async (id: string, stage: KanbanStage) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('crm_leads')
        .update({ 
          kanban_stage: stage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      if (data) {
        setLeads(prev => prev.map(l => l.id === id ? data : l));
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar stage do lead:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar lead';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateLeadNotes = useCallback(async (id: string, notes: string) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('crm_leads')
        .update({ notes })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      if (data) {
        setLeads(prev => prev.map(l => l.id === id ? data : l));
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao atualizar notas do lead:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar notas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getLeadsByStage = useCallback((stage: KanbanStage) => {
    return leads.filter(lead => lead.kanban_stage === stage);
  }, [leads]);

  const getLeadCount = useCallback(() => {
    return {
      new: leads.filter(l => l.kanban_stage === 'new').length,
      interested: leads.filter(l => l.kanban_stage === 'interested').length,
      scheduled: leads.filter(l => l.kanban_stage === 'scheduled').length,
      loyal: leads.filter(l => l.kanban_stage === 'loyal').length,
      lost: leads.filter(l => l.kanban_stage === 'lost').length,
    };
  }, [leads]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return {
    leads,
    loading,
    error,
    refresh: fetchLeads,
    createLead,
    updateLeadStage,
    updateLeadNotes,
    getLeadsByStage,
    getLeadCount,
  };
};
