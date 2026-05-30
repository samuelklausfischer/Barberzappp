import { useState, useEffect, useCallback, useMemo } from 'react';

import { 
  useLocalStorage, 
  useDebounce 
} from './';

// ==================== Types ====================

export type NotificationType = 
  | 'booking_confirmation'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'cancellation'
  | 'reschedule'
  | 'promotional'
  | 'monthly_report';

export type ChannelType = 'whatsapp' | 'email' | 'sms' | 'in_app' | 'none';
export type TimingType = 'instant' | '1h_before' | '24h_before' | 'morning' | 'afternoon' | 'evening';

export interface NotificationPreference {
  shop_id: string;
  client_id: string;
  notification_type: NotificationType;
  channel: ChannelType;
  enabled: boolean;
  timing: TimingType;
  timezone: string;
  do_not_disturb_start: string | null;
  do_not_disturb_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreview {
  notification_type: NotificationType;
  channel: ChannelType;
  title: string;
  message: string;
  variables: Record<string, any>;
}

export interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ==================== API Client ====================

class NotificationPreferencesAPI {
  private baseUrl: string;

  constructor() {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    this.baseUrl = `${apiBase}/api/preferences`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('access_token');
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getClientPreferences(shopId: string, clientId: string): Promise<NotificationPreference[]> {
    return this.request<NotificationPreference[]>(`/${clientId}?shop_id=${shopId}`);
  }

  async updateClientPreferences(
    shopId: string,
    clientId: string,
    preferences: NotificationPreference[]
  ): Promise<NotificationPreference[]> {
    return this.request<NotificationPreference[]>(`/${clientId}?shop_id=${shopId}`, {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async setShopDefaults(
    shopId: string,
    defaults: Record<string, any>
  ): Promise<Record<string, any>> {
    return this.request<Record<string, any>>(`/default?shop_id=${shopId}`, {
      method: 'POST',
      body: JSON.stringify(defaults),
    });
  }

  async getNotificationPreview(
    shopId: string,
    clientId: string,
    notificationType: NotificationType
  ): Promise<NotificationPreview> {
    return this.request<NotificationPreview>(
      `/${clientId}/preview/${notificationType}?shop_id=${shopId}`
    );
  }

  async queueNotification(
    shopId: string,
    appointmentId: string,
    notificationType: NotificationType,
    scheduledAt?: string
  ): Promise<{ status: string; queue_id?: string; channel?: string; reason?: string }> {
    return this.request(`/queue?shop_id=${shopId}`, {
      method: 'POST',
      body: JSON.stringify({
        appointment_id: appointmentId,
        notification_type: notificationType,
        scheduled_at: scheduledAt,
      }),
    });
  }
}

const apiClient = new NotificationPreferencesAPI();

// ==================== Hook: useNotificationPreferences ====================

/**
 * Hook para buscar e gerenciar preferências de notificação de um cliente.
 * 
 * @example
 * ```tsx
 * const { preferences, loading, error, refetch } = useNotificationPreferences(shopId, clientId);
 * ```
 */
export const useNotificationPreferences = (
  shopId: string,
  clientId?: string
) => {
  const [state, setState] = useState<ApiResponse<NotificationPreference[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!clientId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiClient.getClientPreferences(shopId, clientId);
      setState({
        data,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [shopId, clientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    preferences: state.data,
    loading: state.loading,
    error: state.error,
    refetch: fetchData,
  };
};

// ==================== Hook: useUpdatePreferences ====================

/**
 * Hook para atualizar preferências de notificação.
 * 
 * @example
 * ```tsx
 * const updatePreferences = useUpdatePreferences();
 * await updatePreferences(shopId, clientId, newPreferences);
 * ```
 */
export const useUpdatePreferences = () => {
  const [state, setState] = useState<ApiResponse<NotificationPreference[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const update = useCallback(async (
    shopId: string,
    clientId: string,
    preferences: NotificationPreference[]
  ): Promise<NotificationPreference[]> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiClient.updateClientPreferences(shopId, clientId, preferences);
      setState({
        data,
        loading: false,
        error: null,
      });
      return data;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error,
      }));
      throw new Error(error);
    }
  }, []);

  return update;
};

// ==================== Hook: useNotificationPreview ====================

/**
 * Hook para gerar preview de notificações.
 * 
 * @example
 * ```tsx
 * const preview = useNotificationPreview(shopId, clientId);
 * const loadPreview = (type: NotificationType) => preview.loadPreview(type);
 * ```
 */
export const useNotificationPreview = (shopId: string, clientId?: string) => {
  const [state, setState] = useState<{
    preview: NotificationPreview | null;
    loading: boolean;
    error: string | null;
    activeType: NotificationType | null;
  }>({
    preview: null,
    loading: false,
    error: null,
    activeType: null,
  });

  const loadPreview = useCallback(async (notificationType: NotificationType) => {
    if (!clientId) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      activeType: notificationType,
    }));

    try {
      const preview = await apiClient.getNotificationPreview(shopId, clientId, notificationType);
      setState({
        preview,
        loading: false,
        error: null,
        activeType: notificationType,
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        activeType: notificationType,
      }));
    }
  }, [shopId, clientId]);

  const clearPreview = useCallback(() => {
    setState({
      preview: null,
      loading: false,
      error: null,
      activeType: null,
    });
  }, []);

  return {
    preview: state.preview,
    loading: state.loading,
    error: state.error,
    activeType: state.activeType,
    loadPreview,
    clearPreview,
  };
};

// ==================== Hook: useTimezones ====================

/**
 * Hook para listar timezones disponíveis.
 * 
 * @example
 * ```tsx
 * const timezones = useTimezones();
 * <select>
 *   {timezones.map(tz => <option value={tz.value}>{tz.label}</option>)}
 * </select>
 * ```
 */
export const useTimezones = () => {
  const timezones = useMemo(() => [
    { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)', offset: -3 },
    { value: 'America/New_York', label: 'New York (UTC-5)', offset: -5 },
    { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)', offset: -8 },
    { value: 'Europe/London', label: 'London (UTC+0)', offset: 0 },
    { value: 'Europe/Paris', label: 'Paris (UTC+1)', offset: 1 },
    { value: 'Europe/Berlin', label: 'Berlin (UTC+1)', offset: 1 },
    { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)', offset: 9 },
    { value: 'Australia/Sydney', label: 'Sydney (UTC+11)', offset: 11 },
    { value: 'UTC', label: 'UTC (Universal)', offset: 0 },
  ], []);

  return timezones;
};

// ==================== Hook: useQueueNotification ====================

/**
 * Hook para enfileirar notificações com base em preferências.
 * 
 * @example
 * ```tsx
 * const queueNotification = useQueueNotification();
 * await queueNotification(shopId, appointmentId, 'reminder_24h');
 * ```
 */
export const useQueueNotification = () => {
  const [state, setState] = useState<{
    result: any;
    loading: boolean;
    error: string | null;
  }>({
    result: null,
    loading: false,
    error: null,
  });

  const queue = useCallback(async (
    shopId: string,
    appointmentId: string,
    notificationType: NotificationType,
    scheduledAt?: string
  ): Promise<any> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiClient.queueNotification(
        shopId,
        appointmentId,
        notificationType,
        scheduledAt
      );
      setState({
        result,
        loading: false,
        error: null,
      });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        loading: false,
        error,
      }));
      throw new Error(error);
    }
  }, []);

  return {
    queue,
    result: state.result,
    loading: state.loading,
    error: state.error,
    clear: () => setState({ result: null, loading: false, error: null }),
  };
};

// ==================== Hook: useShopDefaults ====================

/**
 * Hook para gerenciar configurações padrão da barbearia.
 * 
 * @example
 * ```tsx
 * const { defaults, loading, error, setDefaults } = useShopDefaults(shopId);
 * ```
 */
export const useShopDefaults = (shopId: string) => {
  const [defaults, setDefaults] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDefaults = useCallback(async (newDefaults: Record<string, any>) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.setShopDefaults(shopId, newDefaults);
      setDefaults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  return {
    defaults,
    setDefaults: updateDefaults,
    loading,
    error,
  };
};

// ==================== Hook: useDebouncedPreferences ====================

/**
 * Hook para atualizar preferências com debounce (evita requisições excessivas).
 * 
 * @example
 * ```tsx
 * const { preferences, debouncedUpdate, isSaving } = useDebouncedPreferences(shopId, clientId);
 * // preferences já são debounced ao atualizar
 * ```
 */
export const useDebouncedPreferences = (
  shopId: string,
  clientId: string,
  delayMs: number = 1000
) => {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreference[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const debouncedPreferences = useDebounce(localPreferences, delayMs);
  const updatePreferences = useUpdatePreferences();

  // Trigger update when debounce triggers
  useEffect(() => {
    if (debouncedPreferences.length > 0) {
      setIsSaving(true);
      updatePreferences(shopId, clientId, debouncedPreferences)
        .finally(() => setIsSaving(false));
    }
  }, [debouncedPreferences, shopId, clientId, updatePreferences]);

  const updatePreference = useCallback((
    index: number,
    updates: Partial<NotificationPreference>
  ) => {
    setLocalPreferences(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], ...updates };
      }
      return updated;
    });
  }, []);

  return {
    preferences: localPreferences,
    debouncedUpdate: updatePreference,
    isSaving,
    setPreferences: setLocalPreferences,
  };
};

// ==================== Helper Functions ====================

/**
 * Verifica se está em período de não perturbar
 */
export const isSilentPeriod = (
  startTime: string | null,
  endTime: string | null,
  scheduledDate: Date,
  timezone: string = 'America/Sao_Paulo'
): boolean => {
  if (!startTime || !endTime) return false;

  try {
    // Converte para timezone do cliente
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const scheduledLocal = new Date(scheduledDate.toLocaleString('en-US', { timeZone: timezone }));
    const scheduledTime = scheduledLocal.toTimeString().slice(0, 5);

    return scheduledTime >= startTime && scheduledTime <= endTime;
  } catch {
    return false;
  }
};

/**
 * Obtém label amigável para tipo de notificação
 */
export const getNotificationTypeLabel = (type: NotificationType): string => {
  const labels: Record<NotificationType, string> = {
    booking_confirmation: 'Confirmação de Agendamento',
    reminder_24h: 'Lembrete 24h antes',
    reminder_2h: 'Lembrete 2h antes',
    cancellation: 'Cancelamento',
    reschedule: 'Remarcação',
    promotional: 'Promoções',
    monthly_report: 'Relatório Mensal',
  };
  return labels[type] || type;
};

/**
 * Obtém ícone para canal de notificação
 */
export const getChannelIcon = (channel: ChannelType): string => {
  const icons: Record<ChannelType, string> = {
    whatsapp: '📱',
    email: '📧',
    sms: '💬',
    in_app: '🔔',
    none: '🔕',
  };
  return icons[channel];
};

/**
 * Obtém label amigável para timing
 */
export const getTimingLabel = (timing: TimingType): string => {
  const labels: Record<TimingType, string> = {
    instant: 'Imediato',
    '1h_before': '1 hora antes',
    '24h_before': '24 horas antes',
    morning: 'Manhã (8h-12h)',
    afternoon: 'Tarde (12h-18h)',
    evening: 'Noite (18h-22h)',
  };
  return labels[timing];
};

/**
 * Valida formato de hora (HH:MM)
 */
export const isValidTimeFormat = (time: string): boolean => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

/**
 * Formata hora para display
 */
export const formatTimeForDisplay = (time: string | null): string => {
  if (!time) return '--:--';
  
  try {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
};

// ==================== Defaults ====================

export const DEFAULT_PREFERENCES: Omit<NotificationPreference, 'shop_id' | 'client_id' | 'created_at' | 'updated_at'>[] = [
  {
    notification_type: 'booking_confirmation',
    channel: 'whatsapp',
    enabled: true,
    timing: 'instant',
    timezone: 'America/Sao_Paulo',
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
  {
    notification_type: 'reminder_24h',
    channel: 'whatsapp',
    enabled: true,
    timing: '24h_before',
    timezone: 'America/Sao_Paulo',
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
  {
    notification_type: 'reminder_2h',
    channel: 'whatsapp',
    enabled: true,
    timing: '2h_before' as TimingType,
    timezone: 'America/Sao_Paulo',
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
  {
    notification_type: 'cancellation',
    channel: 'whatsapp',
    enabled: true,
    timing: 'instant',
    timezone: 'America/Sao_Paulo',
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
  {
    notification_type: 'reschedule',
    channel: 'whatsapp',
    enabled: true,
    timing: 'instant',
    timezone: 'America/Sao_Paulo',
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
  {
    notification_type: 'promotional',
    channel: 'whatsapp',
    enabled: false,
    timing: 'morning',
    timezone: 'America/Sao_Paulo',
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
  {
    notification_type: 'monthly_report',
    channel: 'email',
    enabled: false,
    timing: 'morning',
    timezone: 'America/Sao_Paulo',
    do_not_disturb_start: null,
    do_not_disturb_end: null,
  },
];

// ==================== Exports ====================

export default {
  useNotificationPreferences,
  useUpdatePreferences,
  useNotificationPreview,
  useTimezones,
  useQueueNotification,
  useShopDefaults,
  useDebouncedPreferences,
  isSilentPeriod,
  getNotificationTypeLabel,
  getChannelIcon,
  getTimingLabel,
  isValidTimeFormat,
  formatTimeForDisplay,
  DEFAULT_PREFERENCES,
};
