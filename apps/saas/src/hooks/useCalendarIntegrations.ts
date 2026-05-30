import { useState, useEffect, useCallback, useMemo } from 'react';

// ==================== Types ====================

export type CalendarType = 'google' | 'outlook' | 'apple' | 'other';
export type SyncDirection = 'to_external' | 'from_external' | 'bidirectional';
export type ConflictResolution = 'barber_priority' | 'calendar_priority' | 'ask_user';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface CalendarIntegrationData {
  id: string;
  client_id: string;
  shop_id: string;
  calendar_type: CalendarType;
  calendar_id: string;
  calendar_name: string;
  calendar_color: string;
  enabled: boolean;
  sync_direction: SyncDirection;
  auto_sync: boolean;
  conflict_resolution: ConflictResolution;
  last_synced_at: string;
  last_sync_status: 'success' | 'failed' | 'in_progress';
  last_sync_error: string;
  created_at: string;
  preferences: Record<string, any>;
}

export interface Appointment {
  id: string;
  client_id: string;
  shop_id: string;
  employee_id: string;
  service_id: string;
  scheduled_at: string;
  duration_minutes: number;
  price: number;
  status: AppointmentStatus;
  notes: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  employee_name: string;
  service_name: string;
  shop_name: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ==================== API Client ====================

class CalendarIntegrationsAPI {
  private baseUrl: string;

  constructor() {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    this.baseUrl = `${apiBase}/api/calendar`;
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

  // Calendar Integrations
  async getClientCalendars(
    clientId: string,
    shopId: string
  ): Promise<CalendarIntegrationData[]> {
    return this.request<CalendarIntegrationData[]>(
      `/integrations/${clientId}?shop_id=${shopId}`
    );
  }

  async updateCalendarSettings(
    clientId: string,
    calendarId: string,
    settings: Partial<CalendarIntegrationData>
  ): Promise<CalendarIntegrationData> {
    return this.request<CalendarIntegrationData>(
      `/integrations/${clientId}/${calendarId}`,
      {
        method: 'PUT',
        body: JSON.stringify(settings),
      }
    );
  }

  async disconnectCalendar(
    clientId: string,
    calendarId: string
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(
      `/integrations/${clientId}/${calendarId}`,
      {
        method: 'DELETE',
      }
    );
  }

  async syncCalendar(
    clientId: string,
    calendarId: string
  ): Promise<{ status: string; job_id?: string }> {
    return this.request<{ status: string; job_id?: string }>(
      `/integrations/${clientId}/${calendarId}/sync`,
      {
        method: 'POST',
      }
    );
  }

  // Google Calendar OAuth
  async getGoogleAuthUrl(
    clientId: string,
    shopId: string
  ): Promise<{ auth_url: string; state: string }> {
    return this.request<{ auth_url: string; state: string }>(
      `/google/auth-url?client_id=${clientId}&shop_id=${shopId}`
    );
  }

  async completeGoogleOAuth(
    clientId: string,
    credentials: {
      code: string;
      state: string;
      access_token: string;
      refresh_token?: string;
    }
  ): Promise<{ success: boolean; calendar_id: string }> {
    return this.request<{ success: boolean; calendar_id: string }>(
      `/google/oauth/callback`,
      {
        method: 'POST',
        body: JSON.stringify({
          client_id: clientId,
          ...credentials,
        }),
      }
    );
  }

  // Export
  async exportToICS(
    appointments: Appointment[],
    shopId: string
  ): Promise<{ ics_content: string; filename: string }> {
    return this.request<{ ics_content: string; filename: string }>(
      `/export/ics?shop_id=${shopId}`,
      {
        method: 'POST',
        body: JSON.stringify({ appointments }),
      }
    );
  }

  // Appointments
  async getClientAppointments(
    clientId: string,
    shopId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Appointment[]> {
    const params = new URLSearchParams({ client_id: clientId, shop_id });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    
    return this.request<Appointment[]>(`/appointments?${params.toString()}`);
  }
}

const apiClient = new CalendarIntegrationsAPI();

// ==================== Hook: useCalendarIntegrations ====================

/**
 * Hook para buscar e gerenciar integrações de calendário do cliente
 * 
 * @example
 * ```tsx
 * const { calendars, loading, error, refetch } = useCalendarIntegrations(clientId, shopId);
 * ```
 */
export const useCalendarIntegrations = (
  clientId: string,
  shopId: string
) => {
  const [state, setState] = useState<ApiResponse<CalendarIntegrationData[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!clientId || !shopId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiClient.getClientCalendars(clientId, shopId);
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
  }, [clientId, shopId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    calendars: state.data || [],
    loading: state.loading,
    error: state.error,
    refetch: fetchData,
  };
};

// ==================== Hook: useConnectGoogleCalendar ====================

/**
 * Hook para conectar Google Calendar via OAuth
 * 
 * @example
 * ```tsx
 * const connectGoogle = useConnectGoogleCalendar();
 * 
 * // Get auth URL
 * const { authUrl, state } = await connectGoogle.getAuthUrl(shopId, clientId);
 * 
 * // Open popup...
 * 
 * // Complete OAuth
 * await connectGoogle.complete(shopId, clientId, credentials);
 * ```
 */
export const useConnectGoogleCalendar = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const getAuthUrl = useCallback(async (
    shopId: string,
    clientId: string
  ): Promise<{ authUrl: string; state: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiClient.getGoogleAuthUrl(clientId, shopId);
      setState({ loading: false, error: null });
      return {
        authUrl: result.auth_url,
        state: result.state,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState({ loading: false, error });
      throw new Error(error);
    }
  }, []);

  const complete = useCallback(async (
    shopId: string,
    clientId: string,
    credentials: {
      code: string;
      state: string;
      access_token: string;
      refresh_token?: string;
    }
  ): Promise<{ success: boolean; calendarId: string }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiClient.completeGoogleOAuth(clientId, credentials);
      setState({ loading: false, error: null });
      return {
        success: result.success,
        calendarId: result.calendar_id,
      };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ loading: false, error }));
      throw new Error(error);
    }
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    getAuthUrl,
    complete,
  };
};

// ==================== Hook: useSyncNow ====================

/**
 * Hook para sincronizar calendário manualmente
 * 
 * @example
 * ```tsx
 * const syncNow = useSyncNow();
 * const result = await syncNow(calendarId);
 * ```
 */
export const useSyncNow = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    syncingCalendars: Set<string>;
  }>({
    loading: false,
    error: null,
    syncingCalendars: new Set(),
  });

  const sync = useCallback(async (
    calendarId: string
  ): Promise<{ status: string; jobId?: string }> => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      syncingCalendars: new Set(prev.syncingCalendars).add(calendarId),
    }));

    try {
      // Need to get clientId from somewhere, assume it's available
      const clientId = localStorage.getItem('current_client_id');
      if (!clientId) {
        throw new Error('Client ID not found');
      }

      const result = await apiClient.syncCalendar(clientId, calendarId);
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
        syncingCalendars: new Set(prev.syncingCalendars).delete(calendarId) || prev.syncingCalendars,
      }));
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState({
        loading: false,
        error,
        syncingCalendars: new Set(state.syncingCalendars).delete(calendarId) || state.syncingCalendars,
      });
      throw new Error(error);
    }
  }, [state.syncingCalendars]);

  return {
    loading: state.loading,
    error: state.error,
    syncingCalendars: state.syncingCalendars,
    sync: sync,
  };
};

// ==================== Hook: useDisconnectCalendar ====================

/**
 * Hook para desconectar um calendário
 * 
 * @example
 * ```tsx
 * const disconnect = useDisconnectCalendar();
 * await disconnect(calendarId);
 * ```
 */
export const useDisconnectCalendar = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const disconnect = useCallback(async (
    calendarId: string
  ): Promise<{ success: boolean }> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const clientId = localStorage.getItem('current_client_id');
      if (!clientId) {
        throw new Error('Client ID not found');
      }

      const result = await apiClient.disconnectCalendar(clientId, calendarId);
      setState({ loading: false, error: null });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error }));
      throw new Error(error);
    }
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    disconnect,
  };
};

// ==================== Hook: useICSExport ====================

/**
 * Hook para exportar agendamentos para ICS
 * 
 * @example
 * ```tsx
 * const icsExport = useICSExport();
 * 
 * // Generate preview
 * const content = await icsExport.generatePreview(appointments);
 * 
 * // Export to URL
 * const url = await icsExport.exportToURL(appointments);
 * ```
 */
export const useICSExport = () => {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({
    loading: false,
    error: null,
  });

  const generatePreview = useCallback(async (
    appointments: Appointment[]
  ): Promise<string> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const shopId = localStorage.getItem('current_shop_id');
      if (!shopId) {
        throw new Error('Shop ID not found');
      }

      const result = await apiClient.exportToICS(appointments, shopId);
      setState({ loading: false, error: null });
      return result.ics_content;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error }));
      throw new Error(error);
    }
  }, []);

  const exportToURL = useCallback(async (
    appointments: Appointment[]
  ): Promise<string> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const shopId = localStorage.getItem('current_shop_id');
      if (!shopId) {
        throw new Error('Shop ID not found');
      }

      const result = await apiClient.exportToICS(appointments, shopId);
      
      // Create blob URL
      const blob = new Blob([result.ics_content], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      setState({ loading: false, error: null });
      return url;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setState(prev => ({ ...prev, loading: false, error }));
      throw new Error(error);
    }
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    generatePreview,
    exportToURL,
  };
};

// ==================== Hook: useAppointments ====================

/**
 * Hook para buscar agendamentos do cliente
 * 
 * @example
 * ```tsx
 * const { appointments, loading, error, refetch } = useAppointments(clientId, shopId);
 * ```
 */
export const useAppointments = (
  clientId: string,
  shopId: string,
  startDate?: string,
  endDate?: string
) => {
  const [state, setState] = useState<ApiResponse<Appointment[]>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!clientId || !shopId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiClient.getClientAppointments(
        clientId,
        shopId,
        startDate,
        endDate
      );
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
  }, [clientId, shopId, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    appointments: state.data || [],
    loading: state.loading,
    error: state.error,
    refetch: fetchData,
  };
};

// ==================== Helper Functions ====================

/**
 * Get calendar type label
 */
export const getCalendarTypeLabel = (type: CalendarType): { label: string; icon: string } => {
  const labels: Record<CalendarType, { label: string; icon: string }> = {
    google: { label: 'Google Calendar', icon: '📅' },
    outlook: { label: 'Outlook Calendar', icon: '📆' },
    apple: { label: 'Apple Calendar', icon: '🍎' },
    other: { label: 'Outro', icon: '📋' },
  };
  return labels[type] || labels.other;
};

/**
 * Get sync direction label
 */
export const getSyncDirectionLabel = (direction: SyncDirection): string => {
  const labels: Record<SyncDirection, string> = {
    to_external: 'Apenas para Calendário',
    from_external: 'Apenas do Calendário',
    bidirectional: 'Bidirecional',
  };
  return labels[direction] || direction;
};

/**
 * Get conflict resolution label
 */
export const getConflictResolutionLabel = (resolution: ConflictResolution): string => {
  const labels: Record<ConflictResolution, string> = {
    barber_priority: 'BarberZap tem prioridade',
    calendar_priority: 'Calendário tem prioridade',
    ask_user: 'Perguntar',
  };
  return labels[resolution] || resolution;
};

/**
 * Format appointment status for display
 */
export const formatAppointmentStatus = (status: AppointmentStatus): string => {
  const labels: Record<AppointmentStatus, string> = {
    scheduled: 'Agendado',
    confirmed: 'Confirmado',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    no_show: 'Não compareceu',
  };
  return labels[status] || status;
};

/**
 * Get status color class
 */
export const getStatusColor = (status: AppointmentStatus): string => {
  const colors: Record<AppointmentStatus, string> = {
    scheduled: 'bg-blue-100 text-blue-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
    no_show: 'bg-yellow-100 text-yellow-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

// ==================== Exports ====================

export default {
  useCalendarIntegrations,
  useConnectGoogleCalendar,
  useSyncNow,
  useDisconnectCalendar,
  useICSExport,
  useAppointments,
  getCalendarTypeLabel,
  getSyncDirectionLabel,
  getConflictResolutionLabel,
  formatAppointmentStatus,
  getStatusColor,
};
