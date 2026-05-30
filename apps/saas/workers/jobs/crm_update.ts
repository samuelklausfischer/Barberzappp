/**
 * Job Processor: Update CRM Client Stats
 * 
 * Atualiza estatísticas de clientes no CRM quando há ações em agendamentos
 */

import { Job } from 'bullmq';
import {
  JOBS,
  registerProcessor,
  type UpdateClientStatsData,
  type UpdateClientStatsResult,
} from './types';

// ============================================================================
// CRM DATABASE INTERFACE
// ============================================================================

/**
 * Cliente Supabase para operações de CRM
 * 
 * TODO: Integrar com Supabase real
 */

class CRMDatabase {
  // Mock de dados para demonstração
  private clients: Map<string, any> = new Map();

  /**
   * Obtém estatísticas atuais de um cliente
   */
  async getClientStats(clientId: string): Promise<any> {
    // Mock - buscar do banco de dados
    if (!this.clients.has(clientId)) {
      // Dados iniciais mock
      this.clients.set(clientId, {
        total_visits: 0,
        last_visit_at: null,
        total_spent: 0,
        no_show_count: 0,
        cancelled_count: 0,
        loyalty_points: 0,
        lifetime_value: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    return this.clients.get(clientId);
  }

  /**
   * Atualiza estatísticas de um cliente
   */
  async updateClientStats(
    clientId: string,
    updates: Partial<any>
  ): Promise<UpdateClientStatsResult> {
    try {
      console.log(`[CRM] Updating stats for client ${clientId}:`, updates);

      // Mock - atualizar no banco de dados
      const currentStats = await this.getClientStats(clientId);
      const updatedStats = {
        ...currentStats,
        ...updates,
        updated_at: new Date().toISOString(),
      };

      this.clients.set(clientId, updatedStats);

      // Calcular lifetime_value automaticamente
      if (updatedStats.total_spent !== undefined) {
        updatedStats.lifetime_value = updatedStats.total_spent;
      }

      console.log(`[CRM] Stats updated for client ${clientId}:`, updatedStats);

      // TODO: Integrar com Supabase
      // const { data, error } = await supabase
      //   .from('client_stats')
      //   .update(updatedStats)
      //   .eq('client_id', clientId)
      //   .select()
      //   .single();

      return {
        success: true,
        updatedFields: Object.keys(updates),
      };
    } catch (error) {
      console.error('[CRM] Error updating client stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Registra visita no histórico do cliente
   */
  async recordClientVisit(
    clientId: string,
    appointmentId: string,
    visitData: {
      service?: string;
      price?: number;
      date: string;
      barber?: string;
    }
  ): Promise<boolean> {
    try {
      console.log(`[CRM] Recording visit for client ${clientId}:`, visitData);

      // TODO: Integrar com Supabase
      // const { error } = await supabase
      //   .from('client_history')
      //   .insert({
      //     client_id: clientId,
      //     appointment_id: appointmentId,
      //     ...visitData,
      //     created_at: new Date().toISOString(),
      //   });

      return true;
    } catch (error) {
      console.error('[CRM] Error recording client visit:', error);
      return false;
    }
  }

  /**
   * Calcula pontos de fidelidade
   */
  calculateLoyaltyPoints(
    action: 'created' | 'completed' | 'cancelled' | 'no_show',
    price?: number
  ): number {
    switch (action) {
      case 'completed':
        // 1 ponto a cada R$ 10 gastos
        return price ? Math.floor(price / 10) : 5;
      case 'created':
        // 1 ponto por agendamento
        return 1;
      case 'cancelled':
        // Perda de 2 pontos (mas não negativo)
        return -2;
      case 'no_show':
        // Perda de 5 pontos
        return -5;
      default:
        return 0;
    }
  }

  /**
   * Verifica se cliente atingiu tier de fidelidade
   */
  checkLoyaltyTier(points: number): string {
    if (points >= 100) return 'gold';
    if (points >= 50) return 'silver';
    if (points >= 25) return 'bronze';
    return 'regular';
  }

  /**
   * Obtém resumo do cliente para exibição em dashboard
   */
  async getClientSummary(clientId: string): Promise<any> {
    const stats = await this.getClientStats(clientId);
    const tier = this.checkLoyaltyTier(stats.loyalty_points || 0);

    return {
      ...stats,
      loyalty_tier: tier,
      avg_spent_per_visit:
        stats.total_visits > 0
          ? stats.total_spent / stats.total_visits
          : 0,
    };
  }
}

const crmDatabase = new CRMDatabase();

// ============================================================================
// JOB PROCESSOR
// ============================================================================

/**
 * Processa o job de atualizar estatísticas de CRM
 */
async function processCRMUpdate(
  job: Job<UpdateClientStatsData>
): Promise<UpdateClientStatsResult> {
  const { data } = job;
  const startTime = Date.now();

  console.log(
    `[CRM] Processing CRM update for client ${data.clientId} (${data.action})`
  );

  try {
    // Obtém estatísticas atuais do cliente
    const currentStats = await crmDatabase.getClientStats(data.clientId);
    
    const updates: Partial<any> = {};
    const updatedFields: string[] = [];

    // Processa diferentes tipos de ação
    switch (data.action) {
      case 'created':
        // Agendamento criado - incrementar contagem futura se necessário
        // ou apenas registrar intenção
        const createdPoints = crmDatabase.calculateLoyaltyPoints('created', data.servicePrice);
        updates.loyalty_points = Math.max(0, (currentStats.loyalty_points || 0) + createdPoints);
        updatedFields.push('loyalty_points');
        break;

      case 'completed':
        // Visita completada - atualizar todas as estatísticas
        updates.total_visits = (currentStats.total_visits || 0) + 1;
        updates.last_visit_at = data.appointmentDate || new Date().toISOString();
        
        if (data.servicePrice) {
          updates.total_spent = (currentStats.total_spent || 0) + data.servicePrice;
        }

        // Calcular pontos de fidelidade
        const completedPoints = crmDatabase.calculateLoyaltyPoints('completed', data.servicePrice);
        updates.loyalty_points = Math.max(0, (currentStats.loyalty_points || 0) + completedPoints);

        updatedFields.push('total_visits', 'last_visit_at', 'total_spent', 'loyalty_points');

        // Registrar visita no histórico
        await crmDatabase.recordClientVisit(data.clientId, data.appointmentId, {
          date: data.appointmentDate || new Date().toISOString(),
          price: data.servicePrice,
        });

        // Verificar se atingiu nova tier de fidelidade
        const newPoints = updates.loyalty_points;
        const oldTier = crmDatabase.checkLoyaltyTier(currentStats.loyalty_points || 0);
        const newTier = crmDatabase.checkLoyaltyTier(newPoints || 0);
        
        if (oldTier !== newTier) {
          console.log(
            `[CRM] Client ${data.clientId} reached new loyalty tier: ${oldTier} -> ${newTier}`
          );
          // TODO: Enviar notificação de fidelidade via WhatsApp
        }

        break;

      case 'cancelled':
        // Agendamento cancelado
        updates.cancelled_count = (currentStats.cancelled_count || 0) + 1;
        
        // Deduz pontos de fidelidade (mas não negativo)
        const cancelledPoints = crmDatabase.calculateLoyaltyPoints('cancelled');
        updates.loyalty_points = Math.max(0, (currentStats.loyalty_points || 0) + cancelledPoints);

        updatedFields.push('cancelled_count', 'loyalty_points');
        break;

      case 'no_show':
        // Cliente não compareceu
        updates.no_show_count = (currentStats.no_show_count || 0) + 1;
        
        // Deduz pontos de fidelidade
        const noShowPoints = crmDatabase.calculateLoyaltyPoints('no_show');
        updates.loyalty_points = Math.max(0, (currentStats.loyalty_points || 0) + noShowPoints);

        updatedFields.push('no_show_count', 'loyalty_points');

        // Se muitos no-shows, pode marcar como cliente de risco
        const noShowCount = updates.no_show_count;
        if (noShowCount >= 3) {
          console.log(
            `[CRM] Client ${data.clientId} has high no-show count: ${noShowCount}`
          );
          // TODO: Atualizar flag de risco em client record
        }

        break;

      default:
        console.warn(`[CRM] Unknown action: ${data.action}`);
        return {
          success: false,
          error: `Unknown action: ${data.action}`,
        };
    }

    // Aplica atualizações no banco
    const result = await crmDatabase.updateClientStats(data.clientId, updates);

    if (result.success) {
      console.log(
        `[CRM] CRM update completed for client ${data.clientId} in ${Date.now() - startTime}ms`
      );
    }

    return result;
  } catch (error) {
    console.error('[CRM] Error processing CRM update:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Atualiza múltiplos clientes ao mesmo tempo
 * Útil para jobs noturnos de recálculo
 */
export async function batchUpdateClientStats(
  updates: UpdateClientStatsData[]
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  console.log(`[CRM] Batch updating ${updates.length} clients...`);

  for (const update of updates) {
    try {
      // Importar o scheduler para adicionar jobs
      const { scheduleCRMUpdate } = await import('./index');
      
      // Adicionar job à fila CRM
      await scheduleCRMUpdate(update);
      success++;
    } catch (error) {
      console.error(`[CRM] Failed to batch update client ${update.clientId}:`, error);
      failed++;
    }
  }

  console.log(`[CRM] Batch update completed: ${success} success, ${failed} failed`);

  return { success, failed };
}

// ============================================================================
// REPORTING & ANALYTICS
// ============================================================================

/**
 * Gera relatório de clientes VIP (top spenders)
 */
export async function getTopClients(limit = 10): Promise<any[]> {
  console.log('[CRM] Generating top clients report...');

  // TODO: Implementar query ao banco
  // const { data } = await supabase
  //   .from('client_stats')
  //   .select('*, clients(*)')
  //   .order('total_spent', { ascending: false })
  //   .limit(limit);

  return [];
}

/**
 * Gera relatório de clientes em risco (muitos no-shows)
 */
export async function getAtRiskClients(noShowThreshold = 3): Promise<any[]> {
  console.log('[CRM] Generating at-risk clients report...');

  // TODO: Implementar query ao banco
  // const { data } = await supabase
  //   .from('client_stats')
  //   .select('*, clients(*)')
  //   .gte('no_show_count', noShowThreshold)
  //   .order('no_show_count', { ascending: false });

  return [];
}

/**
 * Gera relatório de clientes por tier de fidelidade
 */
export async function getClientsByTier(): Promise<Record<string, number>> {
  console.log('[CRM] Generating clients by tier report...');

  // TODO: Implementar query ao banco
  // const { data } = await supabase
  //   .from('client_stats')
  //   .select('loyalty_points');

  // Calcular tiers
  return {
    gold: 0,
    silver: 0,
    bronze: 0,
    regular: 0,
  };
}

// ============================================================================
// EXPORT & REGISTRATION
// ============================================================================

/**
 * Registra o processor de CRM no BullMQ
 */
export function registerCRMUpdateProcessor(): void {
  registerProcessor(JOBS.UPDATE_CLIENT_STATS, processCRMUpdate);
}

// Auto-export
export default {
  processCRMUpdate,
  registerCRMUpdateProcessor,
  batchUpdateClientStats,
  getTopClients,
  getAtRiskClients,
  getClientsByTier,
};
