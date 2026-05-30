/**
 * React Hooks para Supabase Realtime
 * Facilitam o uso de subscriptions em tempo real nos componentes React
 * 
 * Hooks disponíveis:
 * - useRealtimeAppointments(shop_id)
 * - useRealtimeClients(shop_id)
 * - useRealtimeMessages(shop_id)
 * - useRealtimeNotifications(shop_id)
 * 
 * @example
 * import { useRealtimeAppointments } from '@/realtime/hooks';
 * 
 * function AppointmentsPage() {
 *   const { data, loading, error, status } = useRealtimeAppointments('shop-123');
 *   ...
 * }
 */

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  SupabaseRealtimeManager,
  ConnectionStatus,
  ActiveSubscription,
  SubscriptionOptions,
  RealtimeTable
} from './SupabaseRealtimeManager';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Estado dos hooks de realtime
 */
export interface RealtimeDataState<T> {
  /**
   * Dados carregados
   */
  data: T[] | null;
  
  /**
   * Estado de loading inicial
   */
  loading: boolean;
  
  /**
   * Erro, se houver
   */
  error: Error | null;
  
  /**
   * Status da conexão do Manager
   */
  connectionStatus: ConnectionStatus;
  
  /**
   * Se está tentando reconectar
   */
  reconnecting: boolean;
  
  /**
   * Última atualização (timestamp)
   */
  lastUpdate: number | null;
  
  /**
   * Forçar recarregamento dos dados
   */
  refetch: () => Promise<void>;
  
  /**
   * Desconectar hook
   */
  disconnect: () => void;
}

/**
 * Opções para hooks de realtime
 */
export interface UseRealtimeOptions<T> extends SubscriptionOptions {
  /**
   * Dados iniciais (para evitar loading após carregar)
   */
  initialData?: T[];
  
  /**
   * TTL do cache em ms (padrão: 5 minutos)
   */
  cacheTTL?: number;
  
  /**
   * Desabilitar cache
   */
  disableCache?: boolean;
  
  /**
   * Callback quando dados são atualizados
   */
  onDataChange?: (data: T[]) => void;
  
  /**
   * Chave do cache (padrão: 'all')
   */
  cacheKey?: string;
  
  /**
   * Filtragem adicional de dados
   */
  filterFn?: (item: T) => boolean;
}

/**
 * Dados de appointment (extensão para realtime)
 */
export interface RealtimeAppointment {
  id: string;
  shop_id: string;
  client_id?: string;
  clientName: string;
  clientAvatar?: string;
  service: string;
  time: string;
  date: string;
  duration: string;
  price: number;
  status: 'confirmed' | 'pending' | 'canceled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Dados de client (extensão para realtime)
 */
export interface RealtimeClient {
  id: string;
  shop_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Dados de message (extensão para realtime)
 */
export interface RealtimeMessage {
  id: string;
  shop_id: string;
  conversation_id?: string;
  sender_id: string;
  sender_name: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'system';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  updated_at: string;
}

/**
 * Dados de notification (extensão para realtime)
 */
export interface RealtimeNotification {
  id: string;
  shop_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}

// ============================================================================
// BASE HOOK
// ============================================================================

/**
 * Hook base para subscriptions Realtime
 * 
 * @param table - Tabela para observar
 * @param shopId - ID do shop
 * @param fetchData - Função para buscar dados iniciais
 * @param options - Opções adicionais
 * @returns Estado dos dados
 */
function useRealtimeBase<T>(
  table: RealtimeTable,
  shopId: string | null | undefined,
  fetchData: (shopId: string) => Promise<T[]>,
  options: UseRealtimeOptions<T> = {}
): RealtimeDataState<T> {
  const {
    initialData = null,
    cacheTTL = 300000,
    disableCache = false,
    onDataChange,
    cacheKey = 'all',
    filterFn,
    onError,
    onDisconnect,
    onReconnect
  } = options;
  
  // Estado
  const [data, setData] = useState<T[] | null>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<Error | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    SupabaseRealtimeManager.getStatus()
  );
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  
  // Refs para evitar memory leaks
  const mountedRef = useRef(true);
  const subscriptionRef = useRef<ActiveSubscription<T> | null>(null);
  const statusUnsubscribeRef = useRef<(() => void) | null>(null);
  
  // Validar shop ID
  const validShopId = useMemo(() => {
    return shopId && typeof shopId === 'string' && shopId.length > 0 ? shopId : null;
  }, [shopId]);
  
  // Função para buscar dados
  const refetch = useCallback(async () => {
    if (!validShopId || !mountedRef.current) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const cacheData = !disableCache ? SupabaseRealtimeManager.getFromCache<T[]>(
        table,
        cacheKey,
        validShopId
      ) : null;
      
      if (cacheData) {
        setData(cacheData);
        setLastUpdate(Date.now());
      } else {
        const freshData = await fetchData(validShopId);
        
        if (mountedRef.current) {
          const filteredData = filterFn ? freshData.filter(filterFn) : freshData;
          setData(filteredData);
          
          // Cache dos dados
          if (!disableCache) {
            SupabaseRealtimeManager.setToCache(
              table,
              cacheKey,
              validShopId,
              filteredData,
              cacheTTL
            );
          }
          
          setLastUpdate(Date.now());
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [validShopId, table, cacheKey, fetchData, filterFn, disableCache, cacheTTL]);
  
  // Função de desconexão
  const disconnect = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    if (statusUnsubscribeRef.current) {
      statusUnsubscribeRef.current();
      statusUnsubscribeRef.current = null;
    }
  }, []);
  
  // Setup: buscar dados e conectar
  useEffect(() => {
    mountedRef.current = true;
    
    // Não fazer nada se shopId for inválido
    if (!validShopId) {
      setLoading(false);
      return;
    }
    
    // Buscar dados iniciais
    refetch();
    
    // Observar status de conexão
    statusUnsubscribeRef.current = SupabaseRealtimeManager.onStatusChange(() => {
      if (mountedRef.current) {
        setConnectionStatus(SupabaseRealtimeManager.getStatus());
      }
    });
    
    // Criar subscription Realtime
    subscriptionRef.current = SupabaseRealtimeManager.subscribe<T>(
      table,
      validShopId,
      (payload, eventType) => {
        if (!mountedRef.current) return;
        
        setData(prevData => {
          const newData = prevData ? [...prevData] : [];
          
          switch (eventType) {
            case 'INSERT':
              const newRecord = payload.new;
              if (!filterFn || filterFn(newRecord)) {
                newData.push(newRecord);
              }
              setLastUpdate(Date.now());
              break;
              
            case 'UPDATE':
              const index = newData.findIndex(item => (item as any).id === payload.new.id);
              if (index !== -1) {
                const updatedRecord = payload.new;
                if (!filterFn || filterFn(updatedRecord)) {
                  newData[index] = updatedRecord;
                } else {
                  newData.splice(index, 1);
                }
              } else {
                if (!filterFn || filterFn(payload.new)) {
                  newData.push(payload.new);
                }
              }
              setLastUpdate(Date.now());
              break;
              
            case 'DELETE':
              const deletedIndex = newData.findIndex(item => (item as any).id === payload.old.id);
              if (deletedIndex !== -1) {
                newData.splice(deletedIndex, 1);
              }
              setLastUpdate(Date.now());
              break;
          }
          
          // Atualizar cache
          if (!disableCache) {
            SupabaseRealtimeManager.setToCache(
              table,
              cacheKey,
              validShopId,
              newData,
              cacheTTL
            );
          }
          
          return newData;
        });
      },
      {
        onError: (err) => {
          if (mountedRef.current) {
            setError(err);
            if (onError) onError(err);
          }
        },
        onDisconnect,
        onReconnect
      }
    );
    
    // Cleanup
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, [validShopId, table, cacheKey, refetch, filterFn, disableCache, cacheTTL, onError, onDisconnect, onReconnect, disconnect]);
  
  return {
    data,
    loading,
    error,
    connectionStatus,
    reconnecting: connectionStatus === ConnectionStatus.RECONNECTING,
    lastUpdate,
    refetch,
    disconnect
  };
}

// ============================================================================
// SPECIFIC HOOKS
// ============================================================================

/**
 * Hook para appointments em tempo real
 * 
 * @param shopId - ID do shop
 * @param options - Opções adicionais
 * @returns Estado dos appointments
 * 
 * @example
 * function AppointmentsComponent() {
 *   const {
 *     data: appointments,
 *     loading,
 *     error,
 *     refetch
 *   } = useRealtimeAppointments('shop-123', {
 *     filterFn: (app) => app.status !== 'canceled'
 *   });
 *   
 *   if (loading) return <Loading />;
 *   if (error) return <Error>{error.message}</Error>;
 *   
 *   return (
 *     <div>
 *       {appointments?.map(app => <AppointmentCard key={app.id} {...app} />)}
 *     </div>
 *   );
 * }
 */
export function useRealtimeAppointments(
  shopId: string | null | undefined,
  options: UseRealtimeOptions<RealtimeAppointment> = {}
): RealtimeDataState<RealtimeAppointment> {
  // Fetch default - deve ser sobrescrito no componente ou via configuração
  const fetchAppointments = useCallback(async (shopIdParam: string): Promise<RealtimeAppointment[]> => {
    // Aqui você deve importar e usar o seu serviço real de appointments
    // Exemplo:
    // const { getAppointments } = await import('@/features/appointments/services');
    // return getAppointments(shopIdParam);
    
    // Placeholder - retorna array vazio
    console.warn('[useRealtimeAppointments] Fetch function not implemented. Please override.');
    return [];
  }, []);
  
  return useRealtimeBase<RealtimeAppointment>(
    'appointments',
    shopId,
    fetchAppointments,
    options
  );
}

/**
 * Hook para clients em tempo real
 * 
 * @param shopId - ID do shop
 * @param options - Opções adicionais
 * @returns Estado dos clients
 * 
 * @example
 * function ClientsComponent() {
 *   const { data: clients, loading } = useRealtimeClients('shop-123');
 *   
 *   if (loading) return <Loading />;
 *   
 *   return (
 *     <ClientList clients={clients || []} />
 *   );
 * }
 */
export function useRealtimeClients(
  shopId: string | null | undefined,
  options: UseRealtimeOptions<RealtimeClient> = {}
): RealtimeDataState<RealtimeClient> {
  const fetchClients = useCallback(async (shopIdParam: string): Promise<RealtimeClient[]> => {
    // Aqui você deve importar e usar o seu serviço real de clients
    console.warn('[useRealtimeClients] Fetch function not implemented. Please override.');
    return [];
  }, []);
  
  return useRealtimeBase<RealtimeClient>(
    'clients',
    shopId,
    fetchClients,
    options
  );
}

/**
 * Hook para messages em tempo real
 * 
 * @param shopId - ID do shop
 * @param options - Opções adicionais
 * @returns Estado das messages
 * 
 * @example
 * function ChatComponent() {
 *   const { data: messages, loading } = useRealtimeMessages('shop-123', {
 *     cacheKey: 'recent', // Cache separado para mensagens recentes
 *     cacheTTL: 60000 // 1 minuto apenas
 *   });
 *   
 *   return <MessageList messages={messages || []} />;
 * }
 */
export function useRealtimeMessages(
  shopId: string | null | undefined,
  options: UseRealtimeOptions<RealtimeMessage> = {}
): RealtimeDataState<RealtimeMessage> {
  const fetchMessages = useCallback(async (shopIdParam: string): Promise<RealtimeMessage[]> => {
    // Aqui você deve importar e usar o seu serviço real de messages
    console.warn('[useRealtimeMessages] Fetch function not implemented. Please override.');
    return [];
  }, []);
  
  return useRealtimeBase<RealtimeMessage>(
    'messages',
    shopId,
    fetchMessages,
    options
  );
}

/**
 * Hook para notifications em tempo real
 * 
 * @param shopId - ID do shop
 * @param options - Opções adicionais
 * @returns Estado das notifications
 * 
 * @example
 * function NotificationsComponent() {
 *   const { data: notifications, refetch } = useRealtimeNotifications('shop-123', {
 *     filterFn: (notif) => !notif.read // Apenas não lidas
 *   });
 *   
 *   const unreadCount = notifications?.filter(n => !n.read).length || 0;
 *   
 *   return (
 *     <Badge count={unreadCount}>
 *       <BellIcon />
 *     </Badge>
 *   );
 * }
 */
export function useRealtimeNotifications(
  shopId: string | null | undefined,
  options: UseRealtimeOptions<RealtimeNotification> = {}
): RealtimeDataState<RealtimeNotification> {
  const fetchNotifications = useCallback(async (shopIdParam: string): Promise<RealtimeNotification[]> => {
    // Aqui você deve importar e usar o seu serviço real de notifications
    console.warn('[useRealtimeNotifications] Fetch function not implemented. Please override.');
    return [];
  }, []);
  
  return useRealtimeBase<RealtimeNotification>(
    'notifications',
    shopId,
    fetchNotifications,
    options
  );
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook para obter status da conexão Realtime
 * 
 * @returns Status da conexão
 * 
 * @example
 * function ConnectionStatusIndicator() {
 *   const status = useRealtimeConnectionStatus();
 *   
 *   return (
 *     <div className={`status ${status.toLowerCase()}`}>
 *       {status}
 *     </div>
 *   );
 * }
 */
export function useRealtimeConnectionStatus(): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>(
    SupabaseRealtimeManager.getStatus()
  );
  
  useEffect(() => {
    const unsubscribe = SupabaseRealtimeManager.onStatusChange(() => {
      setStatus(SupabaseRealtimeManager.getStatus());
    });
    
    return unsubscribe;
  }, []);
  
  return status;
}

/**
 * Hook para conectar/desconectar manualmente o RealtimeManager
 * 
 * @returns Objeto com métodos de controle
 * 
 * @example
 * function SettingsPage() {
 *   const { connect, disconnect, connected } = useRealtimeControl();
 *   
 *   return (
 *     <Button onClick={connected ? disconnect : connect}>
 *       {connected ? 'Desconectar' : 'Conectar'}
 *     </Button>
 *   );
 * }
 */
export function useRealtimeControl() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const connect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await SupabaseRealtimeManager.connect();
      setConnected(true);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const disconnect = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await SupabaseRealtimeManager.disconnect();
      setConnected(false);
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setError(errorObj);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Monitorar status
  useEffect(() => {
    const unsubscribe = SupabaseRealtimeManager.onStatusChange(() => {
      const status = SupabaseRealtimeManager.getStatus();
      setConnected(status === ConnectionStatus.CONNECTED);
    });
    return unsubscribe;
  }, []);
  
  return {
    connected,
    loading,
    error,
    connect,
    disconnect
  };
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  RealtimeDataState,
  UseRealtimeOptions,
  ActiveSubscription
};
