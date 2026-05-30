/**
 * Supabase Realtime Manager
 * Sistema centralizado para gerenciar subscriptions em tempo real do Supabase
 * 
 * Features:
 * - Subscriptions para appointments, clients, messages, notifications
 * - Filtragem por shop_id (multi-tenant)
 * - Auto-reconexão com exponential backoff
 * - Tratamento de erros e desconexões
 * - Cache local para performance
 * - Debug logging opcional
 * 
 * @example
 * const realtimeManager = SupabaseRealtimeManager.getInstance();
 * await realtimeManager.connect();
 * const subscription = realtimeManager.subscribe('appointments', shopId, callback);
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '../infrastructure/supabase/client';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Tabelas disponíveis para subscription
 */
export type RealtimeTable = 
  | 'appointments'
  | 'clients'
  | 'messages'
  | 'notifications';

/**
 * Eventos suportados pelo Realtime
 */
export type RealtimeEvent = 
  | 'INSERT'
  | 'UPDATE'
  | 'DELETE';

/**
 * Payload de mudança do Postgres
 */
export type ChangeEventPayload<T> = RealtimePostgresChangesPayload<T> & {
  table: string;
  schema: string;
};

/**
 * Callback para eventos de mudança
 */
export type ChangeCallback<T = any> = (
  payload: ChangeEventPayload<T>,
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
) => void;

/**
 * Opções para subscription
 */
export interface SubscriptionOptions {
  /**
   * Filtros adicionais para a query
   */
  filter?: string;
  
  /**
   * Eventos específicos a ouvir (padrão: todos)
   */
  events?: RealtimeEvent[];
  
  /**
   * Callback de erro
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback de desconexão
   */
  onDisconnect?: () => void;
  
  /**
   * Callback de reconexão
   */
  onReconnect?: () => void;
}

/**
 * Status da conexão Realtime
 */
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING'
}

/**
 * Configuração do Manager
 */
export interface RealtimeManagerConfig {
  /**
   * Ativar logs de debug
   * @default false
   */
  debug?: boolean;
  
  /**
   * Máximo de tentativas de reconexão
   * @default 10
   */
  maxReconnectAttempts?: number;
  
  /**
   * Delay inicial para exponential backoff (ms)
   * @default 1000
   */
  baseReconnectDelay?: number;
  
  /**
   * Multiplicador para exponential backoff (ex: 2 = dobra cada tentativa)
   * @default 2
   */
  reconnectMultiplier?: number;
  
  /**
   * Máximo de delay entre reconexões (ms)
   * @default 30000
   */
  maxReconnectDelay?: number;
}

/**
 * Subscription ativa
 */
export interface ActiveSubscription<T = any> {
  /**
   * Canal do Supabase Realtime
   */
  channel: RealtimeChannel;
  
  /**
   * Tabela sendo observada
   */
  table: RealtimeTable;
  
  /**
   * ID do shop (filtro multi-tenant)
   */
  shopId: string;
  
  /**
   * Callback de mudança
   */
  callback: ChangeCallback<T>;
  
  /**
   * Opções da subscription
   */
  options: SubscriptionOptions;
  
  /**
   * Timestamp de criação
   */
  createdAt: number;
  
  /**
   * Unsubscribe da subscription
   */
  unsubscribe: () => void;
}

/**
 * Cache item
 */
export interface CacheItem<T = any> {
  /**
   * Dados cacheados
   */
  data: T;
  
  /**
   * Timestamp do cache
   */
  timestamp: number;
  
  /**
   * TTL em milissegundos
   */
  ttl: number;
}

// ============================================================================
// SUPABASE REALTIME MANAGER CLASS
// ============================================================================

/**
 * Gerenciador central de subscriptions Realtime
 * Implementa Singleton Pattern para garantir uma única instância
 */
class SupabaseRealtimeManagerClass {
  // Singleton instance
  private static instance: SupabaseRealtimeManagerClass | null = null;
  
  // Configuração
  private config: Required<RealtimeManagerConfig>;
  
  // Estado da conexão
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private connectionStatusListeners: Set<() => void> = new Set();
  
  // Subscriptions ativas
  private subscriptions: Map<string, ActiveSubscription> = new Map();
  
  // Cache local
  private cache: Map<string, CacheItem> = new Map();
  
  // Reconexão
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  // Identificador único para subscriptions
  private subscriptionCounter: number = 0;
  
  // ============================================================================
  // CONSTRUCTOR & SINGLETON
  // ============================================================================
  
  /**
   * Construtor privado (Singleton)
   */
  private constructor(config: RealtimeManagerConfig = {}) {
    this.config = {
      debug: config.debug ?? false,
      maxReconnectAttempts: config.maxReconnectAttempts ?? 10,
      baseReconnectDelay: config.baseReconnectDelay ?? 1000,
      reconnectMultiplier: config.reconnectMultiplier ?? 2,
      maxReconnectDelay: config.maxReconnectDelay ?? 30000
    };
    
    this.log('SupabaseRealtimeManager initialized', this.config);
  }
  
  /**
   * Obter instância única do Manager (Singleton)
   * 
   * @param config - Configuração opcional (apenas na primeira chamada)
   * @returns Instância do Manager
   * 
   * @example
   * const manager = SupabaseRealtimeManager.getInstance();
   * const manager = SupabaseRealtimeManager.getInstance({ debug: true });
   */
  public static getInstance(config?: RealtimeManagerConfig): SupabaseRealtimeManagerClass {
    if (!SupabaseRealtimeManagerClass.instance) {
      SupabaseRealtimeManagerClass.instance = new SupabaseRealtimeManagerClass(config);
    }
    return SupabaseRealtimeManagerClass.instance;
  }
  
  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================
  
  /**
   * Conectar ao Supabase Realtime
   * 
   * @returns Promise que resolve quando conectado
   * 
   * @example
   * await realtimeManager.connect();
   */
  public async connect(): Promise<void> {
    this.log('Connecting to Supabase Realtime...');
    this.updateStatus(ConnectionStatus.CONNECTING);
    
    try {
      // Verificar se cliente Supabase está disponível
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }
      
      // Testar conexão
      const { error } = await supabase
        .channel('connection-test')
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.log('Connection test successful');
          }
        });
      
      if (error) {
        throw error;
      }
      
      this.updateStatus(ConnectionStatus.CONNECTED);
      this.log('Connected to Supabase Realtime');
      
    } catch (error) {
      this.updateStatus(ConnectionStatus.ERROR);
      this.log('Connection failed:', error);
      throw error;
    }
  }
  
  /**
   * Desconectar do Supabase Realtime
   * Remove todas as subscriptions ativas
   * 
   * @returns Promise que resolve quando desconectado
   * 
   * @example
   * await realtimeManager.disconnect();
   */
  public async disconnect(): Promise<void> {
    this.log('Disconnecting from Supabase Realtime...');
    
    // Limpar timer de reconexão
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Unsubscribe de todas as subscriptions
    const unsubscribes = Array.from(this.subscriptions.values()).map(sub => sub.unsubscribe());
    await Promise.all(unsubscribes);
    
    // Limpar subscriptions
    this.subscriptions.clear();
    this.cache.clear();
    
    this.updateStatus(ConnectionStatus.DISCONNECTED);
    this.log('Disconnected from Supabase Realtime');
  }
  
  /**
   * Obter status atual da conexão
   * 
   * @returns Status da conexão
   * 
   * @example
   * const status = realtimeManager.getStatus();
   * if (status === ConnectionStatus.CONNECTED) { ... }
   */
  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  
  /**
   * Observar mudanças de status da conexão
   * 
   * @param callback - Callback chamado quando status muda
   * @returns Função para parar de observar
   * 
   * @example
   * const stopListening = realtimeManager.onStatusChange((status) => {
   *   console.log('Status changed:', status);
   * });
   * // ...
   * stopListening();
   */
  public onStatusChange(callback: () => void): () => void {
    this.connectionStatusListeners.add(callback);
    return () => {
      this.connectionStatusListeners.delete(callback);
    };
  }
  
  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================
  
  /**
   * Subscribe a uma tabela Realtime
   * 
   * @param table - Tabela para observar
   * @param shopId - ID do shop (filtro multi-tenant)
   * @param callback - Callback para mudanças
   * @param options - Opções adicionais
   * @returns Subscription com método unsubscribe
   * 
   * @example
   * const subscription = realtimeManager.subscribe(
   *   'appointments',
   *   'shop-123',
   *   (payload, eventType) => console.log('Change:', payload),
   *   { events: ['INSERT', 'UPDATE'] }
   * );
   * 
   * // Para ouvir
   * subscription.unsubscribe();
   */
  public subscribe<T = any>(
    table: RealtimeTable,
    shopId: string,
    callback: ChangeCallback<T>,
    options: SubscriptionOptions = {}
  ): ActiveSubscription<T> {
    const subscriptionId = `${table}-${shopId}-${++this.subscriptionCounter}`;
    
    this.log(`Creating subscription: ${subscriptionId}`, { table, shopId, options });
    
    // Verificar se conexão está ativa
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      this.log(`Warning: Not connected. Subscription ${subscriptionId} may not work immediately.`);
    }
    
    const events = options.events || ['INSERT', 'UPDATE', 'DELETE'];
    
    // Criar nome único do canal
    const channelName = `${table}:${shopId}:${subscriptionId}`;
    
    // Criar channel do Supabase
    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: subscriptionId }
      }
    });
    
    // Criar subscription no channel
    const postgresChangeConfig: any = {
      event: events.length === 3 ? '*' : events[0],
      schema: 'public',
      table: table,
      filter: `shop_id=eq.${shopId}`
    };
    
    if (options.filter) {
      postgresChangeConfig.filter = `${postgresChangeConfig.filter}&${options.filter}`;
    }
    
    channel
      .on('postgres_changes', postgresChangeConfig, (payload: ChangeEventPayload<T>) => {
        this.log(`Received ${payload.eventType} on ${subscriptionId}`, payload);
        
        // Atualizar cache
        this.updateCache<T>(table, shopId, payload);
        
        // Chamar callback
        try {
          callback(payload, payload.eventType as any);
        } catch (error) {
          this.log(`Error in callback for ${subscriptionId}:`, error);
          if (options.onError) {
            options.onError(error as Error);
          }
        }
      })
      .subscribe((status) => {
        this.log(`Channel ${subscriptionId} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          this.log(`Subscription ${subscriptionId} active`);
        } else if (status === 'CHANNEL_ERROR') {
          this.log(`Error in channel ${subscriptionId}`);
          if (options.onError) {
            options.onError(new Error(`Channel error: ${subscriptionId}`));
          }
        } else if (status === 'TIMED_OUT') {
          this.log(`Timeout in channel ${subscriptionId}`);
          if (options.onError) {
            options.onError(new Error(`Channel timeout: ${subscriptionId}`));
          }
        } else if (status === 'CLOSED') {
          this.log(`Channel ${subscriptionId} closed`);
          if (options.onDisconnect) {
            options.onDisconnect();
          }
        }
      });
    
    // Criar objeto de subscription
    const subscription: ActiveSubscription<T> = {
      channel,
      table,
      shopId,
      callback,
      options,
      createdAt: Date.now(),
      unsubscribe: () => {
        this.log(`Unsubscribing: ${subscriptionId}`);
        this.subscriptions.delete(subscriptionId);
        this.cache.delete(`${table}:${shopId}`);
        supabase.removeChannel(channel);
      }
    };
    
    this.subscriptions.set(subscriptionId, subscription);
    
    return subscription;
  }
  
  /**
   * Unsubscribe de uma subscription específica
   * 
   * @param subscriptionId - ID da subscription
   * 
   * @example
   * realtimeManager.unsubscribe('appointments-shop-123-1');
   */
  public unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.log(`Unsubscribed: ${subscriptionId}`);
    } else {
      this.log(`Subscription not found: ${subscriptionId}`);
    }
  }
  
  /**
   * Unsubscribe de todas as subscriptions de um shop
   * 
   * @param shopId - ID do shop
   * 
   * @example
   * realtimeManager.unsubscribeAll('shop-123');
   */
  public unsubscribeAll(shopId?: string): void {
    const subscriptionsToRemove: string[] = [];
    
    this.subscriptions.forEach((sub, id) => {
      if (!shopId || sub.shopId === shopId) {
        subscriptionsToRemove.push(id);
      }
    });
    
    subscriptionsToRemove.forEach(id => this.unsubscribe(id));
    
    this.log(`Unsubscribed ${subscriptionsToRemove.length} subscriptions${shopId ? ` for shop ${shopId}` : ''}`);
  }
  
  /**
   * Obter lista de subscriptions ativas
   * 
   * @param shopId - Opcional: filtrar por shop
   * @returns Lista de subscriptions
   * 
   * @example
   * const activeSubs = realtimeManager.getActiveSubscriptions('shop-123');
   */
  public getActiveSubscriptions(shopId?: string): ActiveSubscription[] {
    const subscriptions = Array.from(this.subscriptions.values());
    
    if (shopId) {
      return subscriptions.filter(sub => sub.shopId === shopId);
    }
    
    return subscriptions;
  }
  
  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================
  
  /**
   * Obter dados do cache
   * 
   * @param table - Tabela
   * @param key - Chave do cache
   * @param shopId - ID do shop
   * @returns Dados cacheados ou undefined
   * 
   * @example
   * const cached = realtimeManager.getFromCache('appointments', 'all', 'shop-123');
   */
  public getFromCache<T = any>(
    table: RealtimeTable,
    key: string,
    shopId: string
  ): T | undefined {
    const cacheKey = `${table}:${shopId}:${key}`;
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      return undefined;
    }
    
    // Verificar se cache expirou
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(cacheKey);
      this.log(`Cache expired: ${cacheKey}`);
      return undefined;
    }
    
    this.log(`Cache hit: ${cacheKey}`);
    return item.data as T;
  }
  
  /**
   * Armazenar dados no cache
   * 
   * @param table - Tabela
   * @param key - Chave do cache
   * @param shopId - ID do shop
   * @param data - Dados para cache
   * @param ttl - TTL em ms (padrão: 5 minutos)
   * 
   * @example
   * realtimeManager.setToCache('appointments', 'all', 'shop-123', data, 300000);
   */
  public setToCache<T = any>(
    table: RealtimeTable,
    key: string,
    shopId: string,
    data: T,
    ttl: number = 300000
  ): void {
    const cacheKey = `${table}:${shopId}:${key}`;
    
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    this.cache.set(cacheKey, item as any);
    this.log(`Cached: ${cacheKey}`);
  }
  
  /**
   * Limpar cache de uma tabela/shop
   * 
   * @param table - Tabela ou undefined para todas
   * @param shopId - ID do shop ou undefined para todos
   * 
   * @example
   * realtimeManager.clearCache('appointments', 'shop-123');
   * realtimeManager.clearCache(); // Limpa tudo
   */
  public clearCache(table?: RealtimeTable, shopId?: string): void {
    const keysToRemove: string[] = [];
    
    this.cache.forEach((_, key) => {
      const [tablePart] = key.split(':');
      
      if (table && tablePart !== table) {
        return;
      }
      
      if (shopId && !key.includes(`:${shopId}:`)) {
        return;
      }
      
      keysToRemove.push(key);
    });
    
    keysToRemove.forEach(key => this.cache.delete(key));
    
    this.log(`Cleared ${keysToRemove.length} cache entries`);
  }
  
  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================
  
  /**
   * Atualizar status da conexão e notificar listeners
   */
  private updateStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.log(`Status changed: ${this.connectionStatus} → ${status}`);
      this.connectionStatus = status;
      
      // Notificar listeners
      this.connectionStatusListeners.forEach(cb => {
        try {
          cb();
        } catch (error) {
          this.log('Error in status listener:', error);
        }
      });
    }
  }
  
  /**
   * Atualizar cache baseado em evento realtime
   */
  private updateCache<T>(table: RealtimeTable, shopId: string, payload: ChangeEventPayload<T>): void {
    const cacheKey = `${table}:${shopId}`;
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      return;
    }
    
    let updatedData = item.data as T[];
    
    if (!Array.isArray(updatedData)) {
      updatedData = [];
    }
    
    switch (payload.eventType) {
      case 'INSERT':
        updatedData = [...updatedData, payload.new];
        break;
      case 'UPDATE':
        updatedData = updatedData.map(item =>
          (item as any).id === payload.new.id ? payload.new as T : item
        );
        break;
      case 'DELETE':
        updatedData = updatedData.filter(item =>
          (item as any).id !== payload.old.id
        );
        break;
    }
    
    this.cache.set(cacheKey, {
      data: updatedData,
      timestamp: item.timestamp,
      ttl: item.ttl
    } as any);
    
    this.log(`Updated cache for ${cacheKey}`);
  }
  
  /**
   * Logger interno
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log(`[SupabaseRealtime]`, ...args);
    }
  }
}

// ============================================================================
// EXPORT SINGLTON INSTANCE
// ============================================================================

/**
 * Instância única do Supabase Realtime Manager
 */
export const SupabaseRealtimeManager = SupabaseRealtimeManagerClass.getInstance();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse shop ID de diversas fontes (auth, localStorage, etc.)
 * 
 * @param shopId - Shop ID ou undefined
 * @param fallback - Shop ID para fallback
 * @returns Shop ID válido
 * 
 * @example
 * const shopId = parseShopId(undefined, 'default-shop');
 */
export function parseShopId(shopId?: string | null, fallback?: string): string | null {
  if (shopId) {
    return shopId;
  }
  
  if (fallback) {
    return fallback;
  }
  
  return null;
}

/**
 * Validar shop ID
 * 
 * @param shopId - Shop ID para validar
 * @returns true se válido
 * 
 * @example
 * if (!validateShopId(shopId)) { throw new Error('Invalid shop ID'); }
 */
export function validateShopId(shopId: string | null | undefined): boolean {
  if (!shopId || typeof shopId !== 'string') {
    return false;
  }
  
  return shopId.length > 0;
}
