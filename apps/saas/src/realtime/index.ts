/**
 * Supabase Realtime - Exports Públicos
 * 
 * Este arquivo centraliza todas as exportações do módulo realtime
 * para facilitar as importações nos componentes.
 * 
 * @example
 * // Importar tudo de uma vez
 * import { 
 *   useRealtimeAppointments,
 *   SupabaseRealtimeManager,
 *   ConnectionStatus
 * } from '@/realtime';
 */

// ============================================================================
// EXPORT DO MANAGER
// ============================================================================

export {
  SupabaseRealtimeManager,
  ConnectionStatus,
  type RealtimeTable,
  type RealtimeEvent,
  type ChangeCallback,
  type SubscriptionOptions,
  type RealtimeManagerConfig,
  type ActiveSubscription,
  type CacheItem,
  parseShopId,
  validateShopId
} from './SupabaseRealtimeManager';

export type { ChangeEventPayload };

// ============================================================================
// EXPORT DOS HOOKS
// ============================================================================

export {
  useRealtimeAppointments,
  useRealtimeClients,
  useRealtimeMessages,
  useRealtimeNotifications,
  useRealtimeConnectionStatus,
  useRealtimeControl
} from './hooks';

export type {
  RealtimeDataState,
  UseRealtimeOptions,
  RealtimeAppointment,
  RealtimeClient,
  RealtimeMessage,
  RealtimeNotification
};

// ============================================================================
// EXPORT DO MANAGER INSTANCE
// ============================================================================

export { SupabaseRealtimeManager as realtime } from './SupabaseRealtimeManager';
