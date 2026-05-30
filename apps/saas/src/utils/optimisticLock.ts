/**
 * BarberZap - Optimistic Locking Utilities
 * 
 * Este arquivo implementa o sistema de optimistic locking para
 * prevenir conflitos de concorrência no frontend.
 * 
 * Funcionalidades:
 * - useOptimisticUpdate: Hook para updates com versionamento
 * - ConflictError: Classe de erro para conflitos
 * - retryWithExponentialBackoff: Retry com backoff exponencial
 * - detectVersionConflict: Detecção de conflitos
 * - useMutationWithOptimisticLock: Hook completo para mutations
 */

import { useCallback, useEffect, useState, useRef } from 'react';
import { supabase } from '@/infrastructure/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface OptimisticLockData {
  version: number;
  updated_at: string;
}

export interface OptimisticUpdateResult<T> {
  success: boolean;
  code: 'success' | 'version_mismatch' | 'slot_not_available' | 'not_found' | 'permission_denied' | 'invalid_data' | 'unknown_error';
  message: string;
  data?: T;
  expected_version?: number;
  current_version?: number;
  old_data?: T;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  retryOnCodes?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface MutationOptions<TInput, TOutput> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: Error) => void;
  onConflict?: (conflict: ConflictError) => void;
  invalidateQueries?: (string | unknown[])[];
  onSuccessMsg?: string;
  errorMsg?: string;
}

// ============================================================================
// CONFLICT ERROR CLASS
// ============================================================================

export class ConflictError extends Error {
  readonly code: string;
  readonly expected_version: number;
  readonly current_version: number;
  readonly old_data?: any;
  readonly timestamp: Date;

  constructor(
    message: string,
    code: string,
    expectedVersion: number,
    currentVersion: number,
    oldData?: any
  ) {
    super(message);
    this.name = 'ConflictError';
    this.code = code;
    this.expected_version = expectedVersion;
    this.current_version = currentVersion;
    this.old_data = oldData;
    this.timestamp = new Date();
  }

  isVersionMismatch(): boolean {
    return this.code === 'version_mismatch';
  }

  isSlotConflict(): boolean {
    return this.code === 'slot_not_available';
  }

  isNotFound(): boolean {
    return this.code === 'not_found';
  }

  getDiff(): any {
    if (!this.old_data) {
      return null;
    }
    return {
      expected: this.expected_version,
      current: this.current_version,
      drift: this.current_version - this.expected_version,
      timeSinceUpdate: new Date(this.timestamp.getTime() - Date.now())
    };
  }
}

// ============================================================================
// DETEÇÃO DE CONFLITOS
// ============================================================================

export function detectVersionConflict(
  result: OptimisticUpdateResult<any>
): result is OptimisticUpdateResult<any> & { expected_version: number; current_version: number } {
  return result.code === 'version_mismatch' && 
         result.expected_version !== undefined && 
         result.current_version !== undefined;
}

export function detectSlotConflict(
  result: OptimisticUpdateResult<any>
): boolean {
  return result.code === 'slot_not_available';
}

export function detectConflict(result: OptimisticUpdateResult<any>): ConflictError | null {
  if (result.code === 'version_mismatch' && result.expected_version && result.current_version) {
    return new ConflictError(
      result.message,
      result.code,
      result.expected_version,
      result.current_version,
      result.old_data
    );
  }

  if (result.code === 'slot_not_available') {
    return new ConflictError(
      result.message,
      result.code,
      0,
      0,
      result.data
    );
  }

  if (result.code === 'not_found') {
    return new ConflictError(
      result.message,
      result.code,
      0,
      0,
      null
    );
  }

  return null;
}

// ============================================================================
// RETRY COM EXPONENTIAL BACKOFF
// ============================================================================

export async function retryWithExponentialBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 500,
    maxDelay = 10000,
    retryOnCodes = ['version_mismatch', 'slot_not_available', 'unknown_error'],
    onRetry
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      // Verificar se resultado indica conflito
      if (result && typeof result === 'object' && 'code' in result) {
        const resultData = result as OptimisticUpdateResult<T>;
        
        // Se for conflito e deve retry
        if (resultData.code !== 'success' && 
            retryOnCodes.includes(resultData.code) &&
            attempt < maxRetries) {
          const error = new Error(resultData.message);
          lastError = error;
          
          if (onRetry) {
            onRetry(attempt + 1, error);
          }
          
          // Calcular delay com exponential backoff + jitter
          const delay = Math.min(
            baseDelay * Math.pow(2, attempt) + Math.random() * 200,
            maxDelay
          );
          
          await sleep(delay);
          continue;
        }
      }
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      
      // Se não for último retry, tentar novamente
      if (attempt < maxRetries) {
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }
        
        const delay = Math.min(
          baseDelay * Math.pow(2, attempt) + Math.random() * 200,
          maxDelay
        );
        
        await sleep(delay);
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// SUPABASE ATOMIC FUNCTION WRAPPERS
// ============================================================================

/**
 * Book appointment atômico via Supabase RPC
 */
export async function bookAppointmentAtomic(params: {
  shop_id: string;
  client_id: string;
  employee_id: string;
  service_id: string;
  scheduled_at: string;
  version?: number;
  notes?: string;
}): Promise<OptimisticUpdateResult<any>> {
  const { data, error } = await supabase.rpc('book_appointment_atomic', {
    p_shop_id: params.shop_id,
    p_client_id: params.client_id,
    p_employee_id: params.employee_id,
    p_service_id: params.service_id,
    p_scheduled_at: params.scheduled_at,
    p_version: params.version || 1,
    p_notes: params.notes || null
  });

  if (error) {
    throw new Error(`Error booking appointment: ${error.message}`);
  }

  return data as OptimisticUpdateResult<any>;
}

/**
 * Update appointment atômico via Supabase RPC
 */
export async function updateAppointmentAtomic(params: {
  appointment_id: string;
  shop_id: string;
  expected_version: number;
  updates: Record<string, any>;
}): Promise<OptimisticUpdateResult<any>> {
  const { data, error } = await supabase.rpc('update_appointment_atomic', {
    p_appointment_id: params.appointment_id,
    p_shop_id: params.shop_id,
    p_expected_version: params.expected_version,
    p_updates: params.updates
  });

  if (error) {
    throw new Error(`Error updating appointment: ${error.message}`);
  }

  return data as OptimisticUpdateResult<any>;
}

/**
 * Cancel appointment atômico via Supabase RPC
 */
export async function cancelAppointmentAtomic(params: {
  appointment_id: string;
  shop_id: string;
  expected_version: number;
  reason?: string;
}): Promise<OptimisticUpdateResult<any>> {
  const { data, error } = await supabase.rpc('cancel_appointment_atomic', {
    p_appointment_id: params.appointment_id,
    p_shop_id: params.shop_id,
    p_expected_version: params.expected_version,
    p_reason: params.reason || null
  });

  if (error) {
    throw new Error(`Error cancelling appointment: ${error.message}`);
  }

  return data as OptimisticUpdateResult<any>;
}

/**
 * Get conflict statistics via Supabase function
 */
export async function getConflictStats(shop_id: string | null = null): Promise<any[]> {
  const { data, error } = await supabase.rpc('get_conflict_stats', {
    p_shop_id: shop_id
  });

  if (error) {
    throw new Error(`Error getting conflict stats: ${error.message}`);
  }

  return data || [];
}

// ============================================================================
// HOOK: USEOPTIMISTIC UPDATE
// ============================================================================

interface UseOptimisticUpdateState<T> {
  isPending: boolean;
  isRetrying: boolean;
  retryCount: number;
  error: Error | null;
  conflict: ConflictError | null;
  lastResult: T | null;
}

export function useOptimisticUpdate<TInput, TOutput>(
  table: string,
  options?: MutationOptions<TInput, TOutput>
) {
  const [state, setState] = useState<UseOptimisticUpdateState<TOutput>>({
    isPending: false,
    isRetrying: false,
    retryCount: 0,
    error: null,
    conflict: null,
    lastResult: null
  });

  const update = useCallback(async (
    id: string,
    updates: Partial<TInput>,
    expectedVersion: number
  ): Promise<OptimisticUpdateResult<TOutput>> => {
    setState(prev => ({ 
      ...prev, 
      isPending: true, 
      error: null, 
      conflict: null 
    }));

    try {
      return await retryWithExponentialBackoff(async () => {
        const result = await supabase
          .from(table)
          .update(updates)
          .eq('id', id)
          .eq('version', expectedVersion)
          .select()
          .single();

        if (result.error) {
          // Detecção de versão mismatch
          if (result.error.message.includes('version')) {
            const conflict = new ConflictError(
              'Record was modified by another user. Please refresh and try again.',
              'version_mismatch',
              expectedVersion,
              0
            );
            throw conflict;
          }
          throw result.error;
        }

        const data = {
          success: true,
          code: 'success' as const,
          message: 'Update successful',
          data: result.data
        };

        setState(prev => ({
          ...prev,
          isPending: false,
          lastResult: result.data
        }));

        if (options?.onSuccess) {
          options.onSuccess(result.data);
        }

        return data;
      }, {
        maxRetries: 3,
        baseDelay: 500,
        maxDelay: 5000,
        retryOnCodes: ['version_mismatch'],
        onRetry: (attempt, error) => {
          setState(prev => ({
            ...prev,
            isRetrying: true,
            retryCount: attempt
          }));

          console.warn(`Optimistic update retry ${attempt}/3:`, error);
        }
      });

    } catch (error) {
      const err = error as Error;
      setState(prev => ({
        ...prev,
        isPending: false,
        isRetrying: false,
        error: err
      }));

      // Verificar se é erro de conflito
      const conflict = detectConflict({
        success: false,
        code: err instanceof ConflictError ? err.code : 'unknown_error',
        message: err.message,
        data: undefined
      });

      if (conflict && options?.onConflict) {
        options.onConflict(conflict);
        setState(prev => ({ ...prev, conflict }));
      } else if (options?.onError) {
        options.onError(err);
      }

      throw error;
    }
  }, [table, options]);

  return {
    update,
    isPending: state.isPending,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    error: state.error,
    conflict: state.conflict,
    reset: () => setState({
      isPending: false,
      isRetrying: false,
      retryCount: 0,
      error: null,
      conflict: null,
      lastResult: null
    })
  };
}

// ============================================================================
// HOOK: USEMUTATION WITH OPTIMISTIC LOCK
// ============================================================================

export function useMutationWithOptimisticLock<TInput, TOutput = any>(
  table: string,
  queryKey: string[],
  options?: MutationOptions<TInput, TOutput>
) {
  const [state, setState] = useState<{
    isPending: boolean;
    isRetrying: boolean;
    retryAttempts: number;
    error: Error | null;
    conflict: ConflictError | null;
  }>({
    isPending: false,
    isRetrying: false,
    retryAttempts: 0,
    error: null,
    conflict: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const mutateAsync = useCallback(async (
    id: string,
    updates: TInput,
    expectedVersion: number
  ): Promise<OptimisticUpdateResult<TOutput>> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      isPending: true,
      error: null,
      conflict: null,
      isRetrying: false,
      retryAttempts: 0
    }));

    try {
      return await retryWithExponentialBackoff(async () => {
        // Executar update atômico
        const { data, error } = await supabase
          .from(table)
          .update({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('version', expectedVersion)
          .select()
          .single();

        if (error) {
          // Verificar se é erro de version
          if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
            // Buscar dados atuais
            const { data: currentData } = await supabase
              .from(table)
              .select('*')
              .eq('id', id)
              .single();

            throw new ConflictError(
              'Record was modified by another user. Please refresh and try again.',
              'version_mismatch',
              expectedVersion,
              currentData?.version || 0,
              currentData
            );
          }
          throw error;
        }

        const result: OptimisticUpdateResult<TOutput> = {
          success: true,
          code: 'success',
          message: options?.onSuccessMsg || 'Operation successful',
          data: data as TOutput
        };

        setState(prev => ({
          ...prev,
          isPending: false,
          isRetrying: false
        }));

        if (options?.onSuccess) {
          options.onSuccess(data as TOutput);
        }

        return result;

      }, {
        maxRetries: 3,
        baseDelay: 500,
        maxDelay: 5000,
        retryOnCodes: ['version_mismatch'],
        onRetry: (attempt) => {
          setState(prev => ({
            ...prev,
            isRetrying: true,
            retryAttempts: attempt
          }));
        }
      });

    } catch (error) {
      const err = error as Error;
      
      setState(prev => ({
        ...prev,
        isPending: false,
        isRetrying: false,
        error: err
      }));

      const conflict = err instanceof ConflictError ? err : null;

      if (conflict) {
        setState(prev => ({ ...prev, conflict }));
        if (options?.onConflict) {
          options.onConflict(conflict);
        }
      } else {
        if (options?.onError) {
          options.onError(err);
        }
      }

      throw error;
    }
  }, [table, options]);

  const mutate = useCallback((
    id: string,
    updates: TInput,
    expectedVersion: number
  ) => {
    return mutateAsync(id, updates, expectedVersion);
  }, [mutateAsync]);

  return {
    mutate,
    mutateAsync,
    isPending: state.isPending,
    isRetrying: state.isRetrying,
    retryAttempts: state.retryAttempts,
    error: state.error,
    conflict: state.conflict,
    reset: () => setState({
      isPending: false,
      isRetrying: false,
      retryAttempts: 0,
      error: null,
      conflict: null
    })
  };
}

// ============================================================================
// HOOK: USEAPPOINTMENT MUTATIONS
// ============================================================================

export function useAppointmentMutations(shopId: string, options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onConflict?: (conflict: ConflictError) => void;
}) {
  const book = useMutationWithOptimisticLock<any, any>(
    'appointments',
    ['appointments'],
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      onConflict: options?.onConflict,
      onSuccessMsg: 'Appointment booked successfully',
      errorMsg: 'Failed to book appointment'
    }
  );

  const update = useMutationWithOptimisticLock<any, any>(
    'appointments',
    ['appointments'],
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      onConflict: options?.onConflict,
      onSuccessMsg: 'Appointment updated successfully',
      errorMsg: 'Failed to update appointment'
    }
  );

  const cancel = useMutationWithOptimisticLock<any, any>(
    'appointments',
    ['appointments'],
    {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
      onConflict: options?.onConflict,
      onSuccessMsg: 'Appointment cancelled successfully',
      errorMsg: 'Failed to cancel appointment'
    }
  );

  const bookAtomic = useCallback(async (
    clientId: string,
    employeeId: string,
    serviceId: string,
    scheduledAt: string,
    notes?: string
  ) => {
    return await bookAppointmentAtomic({
      shop_id: shopId,
      client_id: clientId,
      employee_id: employeeId,
      service_id: serviceId,
      scheduled_at: scheduledAt,
      notes
    });
  }, [shopId]);

  const updateAtomic = useCallback(async (
    appointmentId: string,
    expectedVersion: number,
    updates: Record<string, any>
  ) => {
    return await updateAppointmentAtomic({
      appointment_id: appointmentId,
      shop_id: shopId,
      expected_version: expectedVersion,
      updates
    });
  }, [shopId]);

  const cancelAtomic = useCallback(async (
    appointmentId: string,
    expectedVersion: number,
    reason?: string
  ) => {
    return await cancelAppointmentAtomic({
      appointment_id: appointmentId,
      shop_id: shopId,
      expected_version: expectedVersion,
      reason
    });
  }, [shopId]);

  return {
    book: {
      ...book,
      atomic: bookAtomic
    },
    update: {
      ...update,
      atomic: updateAtomic
    },
    cancel: {
      ...cancel,
      atomic: cancelAtomic
    },
    isBusy: book.isPending || update.isPending || cancel.isPending,
    isRetrying: book.isRetrying || update.isRetrying || cancel.isRetrying,
    resetAll: () => {
      book.reset();
      update.reset();
      cancel.reset();
    }
  };
}

// ============================================================================
// HOOK: USECONFLICT MONITOR
// ============================================================================

export function useConflictMonitor(shopId: string | null, enabled = true) {
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConflicts = useCallback(async () => {
    if (!enabled || !shopId) return;

    setIsLoading(true);
    setError(null);

    try {
      const stats = await getConflictStats(shopId);
      setConflicts(stats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, enabled]);

  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);

  const recentConflicts = conflicts.filter(
    c => c.table_name === 'appointments'
  );

  return {
    conflicts,
    recentConflicts,
    conflictCount: recentConflicts.reduce((sum, c) => sum + c.conflicts, 0),
    isLoading,
    error,
    refetch: fetchConflicts
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Exibe uma notificação de conflito ao usuário
 */
export function showConflictNotification(
  conflict: ConflictError,
  onRefresh?: () => void,
  onOverride?: () => void
) {
  const message = conflict.isVersionMismatch()
    ? `Este registro foi atualizado por outro usuário. 
       Versão esperada: ${conflict.expected_version} 
       Versão atual: ${conflict.current_version}`
    : conflict.message;

  console.warn('Conflict detected:', message);

  // Em uma implementação real, usaria um sistema de UI notifications
  // Exemplo: usar toast alerts (react-toastify, sonner, etc)
  if (typeof window !== 'undefined' && 'alert' in window) {
    const action = confirm(
      `${message}\n\nDeseja atualizar os dados?`
    );
    
    if (action && onRefresh) {
      onRefresh();
    }
  }
}

/**
 * Formata mensagem de erro para exibição ao usuário
 */
export function formatConflictErrorMessage(conflict: ConflictError): string {
  if (conflict.isVersionMismatch()) {
    return 'Os dados foram modificados por outro usuário. Por favor, atualize a página.';
  }

  if (conflict.isSlotConflict()) {
    return 'O horário selecionado já está ocupado. Por favor, escolha outro.';
  }

  if (conflict.isNotFound()) {
    return 'O agendamento não foi encontrado ou foi removido.';
  }

  return conflict.message;
}

/**
 * Valida se os dados stale devem ser atualizados
 */
export function shouldUpdateStaleData(
  localVersion: number,
  remoteVersion: number,
  maxAgeMs: number = 30000 // 30 seconds
): boolean {
  const versionDrift = Math.abs(remoteVersion - localVersion);
  return versionDrift > 0;
}

/**
 * Merge de dados com resolução de conflitos
 */
export function mergeDataWithResolution<T extends { version: number; updated_at: string }>(
  local: T,
  remote: T,
  resolution: 'remote' | 'local' | 'manual' = 'remote'
): T {
  if (resolution === 'remote') {
    return remote;
  }

  if (resolution === 'local') {
    return {
      ...remote,
      ...local,
      version: local.version,
      updated_at: local.updated_at
    };
  }

  // Manual: retorna ambos para UI decidir
  return {
    ...remote,
    _local: local,
    _remote: remote
  } as any;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export {
  ConflictError
};

export type {
  OptimisticUpdateResult,
  RetryOptions,
  MutationOptions,
  UseOptimisticUpdateState
};
