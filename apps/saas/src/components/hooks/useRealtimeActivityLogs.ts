/**
 * useRealtimeActivityLogs Hook
 *
 * Realtime subscription to activity logs (audit_logs table)
 * Part of FASE 2.6 - Audit Logs UI
 *
 * @example
 * const { data, loading, error } = useRealtimeActivityLogs('shop-123');
 */

import { useEffect, useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseRealtimeManager } from '@/realtime';

interface ActivityLogEntry {
  id: string;
  shop_id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  changed_by?: string;
  changed_at: string;
}

interface UseRealtimeActivityLogsOptions {
  filters?: {
    table_name?: string;
    action?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  };
  page?: number;
  pageSize?: number;
}

interface UseRealtimeActivityLogsResult {
  data: ActivityLogEntry[] | null;
  loading: boolean;
  error: Error | null;
  subscribe: () => void;
  unsubscribe: () => void;
  refetch: () => Promise<void>;
}

export function useRealtimeActivityLogs(
  shopId: string,
  options: UseRealtimeActivityLogsOptions = {}
): UseRealtimeActivityLogsResult {
  const {
    filters = {},
    page = 1,
    pageSize = 20
  } = options;

  const [data, setData] = useState<ActivityLogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [subscription, setSubscription] = useState<any>(null);

  const manager = SupabaseRealtimeManager.getInstance();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase: SupabaseClient = manager.getClient();

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('shop_id', shopId)
        .order('changed_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Apply filters
      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.search) {
        query = query.ilike('record_id', `%${filters.search}%`);
      }
      if (filters.date_from) {
        query = query.gte('changed_at', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('changed_at', filters.date_to);
      }

      const { data: logs, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData(logs);
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeActivityLogs = () => {
    try {
      const supabase: SupabaseClient = manager.getClient();

      const sub = supabase
        .channel('audit_logs_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'audit_logs',
            filter: `shop_id=eq.${shopId}`
          },
          (payload) => {
            // New log entry created
            if (payload.eventType === 'INSERT' && payload.new) {
              setData((prev) => [payload.new as ActivityLogEntry, ...(prev || [])]);
            }

            // Log entry updated (rare)
            if (payload.eventType === 'UPDATE' && payload.new) {
              setData((prev) => {
                if (!prev) return [payload.new as ActivityLogEntry];
                return prev.map((log) =>
                  log.id === payload.new.id ? payload.new as ActivityLogEntry : log
                );
              });
            }

            // Log entry deleted (rare - soft delete preferred)
            if (payload.eventType === 'DELETE') {
              setData((prev) => {
                if (!prev) return null;
                return prev.filter((log) => log.id !== payload.old.id);
              });
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to activity logs realtime');
          } else if (status === 'CLOSED') {
            console.log('❌ Activity logs realtime subscription closed');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('⚠️ Activity logs realtime channel error');
          }
        });

      setSubscription(sub);
    } catch (err) {
      console.error('Error subscribing to activity logs:', err);
    }
  };

  const unsubscribeActivityLogs = () => {
    if (subscription) {
      supabase.removeChannel(subscription);
      setSubscription(null);
    }
  };

  useEffect(() => {
    fetchLogs();
    subscribeActivityLogs();

    return () => {
      unsubscribeActivityLogs();
    };
  }, [shopId, page, pageSize, JSON.stringify(filters)]);

  return {
    data,
    loading,
    error,
    subscribe: subscribeActivityLogs,
    unsubscribe: unsubscribeActivityLogs,
    refetch: fetchLogs
  };
}

/**
 * Helper: Filter logs by time period
 */
export function useRecentActivityLogs(
  shopId: string,
  minutes: number = 30
): UseRealtimeActivityLogsResult {
  const [data, setData] = useState<ActivityLogEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const manager = SupabaseRealtimeManager.getInstance();

  useEffect(() => {
    const fetchRecentLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const supabase: SupabaseClient = manager.getClient();

        const { data: logs, error: fetchError } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('shop_id', shopId)
          .gte('changed_at', new Date(Date.now() - minutes * 60 * 1000).toISOString())
          .order('changed_at', { ascending: false })
          .limit(50);

        if (fetchError) throw fetchError;

        setData(logs);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentLogs();

    // Subscribe to new entries
    const supabase: SupabaseClient = manager.getClient();
    const sub = supabase
      .channel('recent_activity_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'audit_logs',
          filter: `shop_id=eq.${shopId}`
        },
        (payload) => {
          setData((prev) => [payload.new as ActivityLogEntry, ...(prev || [])]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, [shopId, minutes]);

  return {
    data,
    loading,
    error,
    subscribe: () => {},
    unsubscribe: () => {},
    refetch: async () => {}
  };
}
