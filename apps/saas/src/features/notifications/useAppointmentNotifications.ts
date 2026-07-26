import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/infrastructure/supabase/client';
import {
  normalizeAppointmentNotification,
  type AppointmentNotification,
} from './notificationUtils';

type UseAppointmentNotificationsParams = {
  tenantId: string | null | undefined;
  userId: string | null | undefined;
};

type FetchMode = 'initial' | 'more' | 'refresh';

const PAGE_SIZE = 20;
const QUERY =
  'id, tenant_id, recipient_user_id, appointment_id, read_at, created_at, appointments:appointments!appointment_notifications_appointment_id_fkey(id, client_name, service_type, scheduled_at, start_time, status)';

export const useAppointmentNotifications = ({ tenantId, userId }: UseAppointmentNotificationsParams) => {
  const [notifications, setNotifications] = useState<AppointmentNotification[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(Boolean(tenantId && userId));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const loadedLimitRef = useRef(PAGE_SIZE);
  const loadingMoreRef = useRef(false);

  const fetchSnapshot = useCallback(
    async (limit: number, mode: FetchMode): Promise<boolean> => {
      const requestId = ++requestIdRef.current;
      const canUpdate = () => mountedRef.current && requestId === requestIdRef.current;

      if (!tenantId || !userId) {
        if (canUpdate()) {
          setNotifications([]);
          setTotalCount(0);
          setUnreadCount(0);
          setError(null);
          setLoading(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
        return false;
      }

      if (mode === 'initial' && canUpdate()) setLoading(true);
      if (mode === 'more' && canUpdate()) setLoadingMore(true);

      try {
        const [listResult, totalResult, unreadResult] = await Promise.all([
          supabase
            .from('appointment_notifications')
            .select(QUERY)
            .eq('tenant_id', tenantId)
            .eq('recipient_user_id', userId)
            .order('created_at', { ascending: false })
            .range(0, Math.max(0, limit - 1)),
          supabase
            .from('appointment_notifications')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('recipient_user_id', userId),
          supabase
            .from('appointment_notifications')
            .select('id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId)
            .eq('recipient_user_id', userId)
            .is('read_at', null),
        ]);

        if (!canUpdate()) return false;

        if (listResult.error || totalResult.error || unreadResult.error) {
          setError('Não foi possível carregar as notificações. Tente novamente.');
          return false;
        }

        setNotifications(
          (listResult.data ?? [])
            .map(normalizeAppointmentNotification)
            .filter((notification): notification is AppointmentNotification => notification !== null)
        );
        setTotalCount(totalResult.count ?? 0);
        setUnreadCount(unreadResult.count ?? 0);
        setError(null);
        loadedLimitRef.current = limit;
        return true;
      } catch {
        if (canUpdate()) setError('Não foi possível carregar as notificações. Tente novamente.');
        return false;
      } finally {
        if (canUpdate()) {
          if (mode === 'initial') setLoading(false);
          if (mode === 'more') {
            setLoadingMore(false);
            loadingMoreRef.current = false;
          }
        }
      }
    },
    [tenantId, userId]
  );

  const refresh = useCallback(async () => {
    loadingMoreRef.current = false;
    setLoadingMore(false);
    return fetchSnapshot(loadedLimitRef.current, 'refresh');
  }, [fetchSnapshot]);

  useEffect(() => {
    mountedRef.current = true;
    loadedLimitRef.current = PAGE_SIZE;
    loadingMoreRef.current = false;
    setNotifications([]);
    setTotalCount(0);
    setUnreadCount(0);
    setError(null);
    void fetchSnapshot(PAGE_SIZE, 'initial');
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [fetchSnapshot]);

  useEffect(() => {
    if (!tenantId || !userId) return;
    const channel = supabase
      .channel(`appointment-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointment_notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        () => void refresh()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, tenantId, userId]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || notifications.length >= totalCount) return false;
    loadingMoreRef.current = true;
    return fetchSnapshot(loadedLimitRef.current + PAGE_SIZE, 'more');
  }, [fetchSnapshot, notifications.length, totalCount]);

  const markOneAsRead = useCallback(
    async (notificationId: string) => {
      if (!tenantId || !userId) return false;
      const { error: updateError } = await supabase
        .from('appointment_notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('tenant_id', tenantId)
        .eq('recipient_user_id', userId)
        .is('read_at', null);

      await refresh();
      return !updateError;
    },
    [refresh, tenantId, userId]
  );

  const markAllAsRead = useCallback(async () => {
    if (!tenantId || !userId) return false;
    const { error: updateError } = await supabase
      .from('appointment_notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('tenant_id', tenantId)
      .eq('recipient_user_id', userId)
      .is('read_at', null);

    await refresh();
    return !updateError;
  }, [refresh, tenantId, userId]);

  return {
    notifications,
    totalCount,
    unreadCount,
    hasMore: notifications.length < totalCount,
    loading,
    loadingMore,
    error,
    refresh,
    loadMore,
    markOneAsRead,
    markAllAsRead,
  };
};
