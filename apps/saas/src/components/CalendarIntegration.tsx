import React, { useState, useEffect, useMemo } from 'react';
import { 
  useCalendarIntegrations, 
  useConnectGoogleCalendar, 
  useSyncNow, 
  useDisconnectCalendar 
} from '../hooks/useCalendarIntegrations';

// Types
export type CalendarType = 'google' | 'outlook' | 'apple' | 'other';

export type SyncDirection = 'to_external' | 'from_external' | 'bidirectional';

export type ConflictResolution = 'barber_priority' | 'calendar_priority' | 'ask_user';

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

export interface CalendarIntegrationProps {
  clientId: string;
  shopId: string;
}

// Label mappings
const CALENDAR_TYPE_LABELS: Record<CalendarType, { label: string; icon: string; color: string }> = {
  google: { label: 'Google Calendar', icon: '📅', color: '#4285F4' },
  outlook: { label: 'Outlook Calendar', icon: '📆', color: '#0078D4' },
  apple: { label: 'Apple Calendar', icon: '🍎', color: '#000000' },
  other: { label: 'Outro Calendário', icon: '📋', color: '#666666' },
};

const SYNC_DIRECTION_LABELS: Record<SyncDirection, { label: string; description: string }> = {
  to_external: { label: 'Apenas para Calendário', description: 'Envia agendamentos do BarberZap para seu calendário' },
  from_external: { label: 'Apenas do Calendário', description: 'Importa eventos do seu calendário para o BarberZap' },
  bidirectional: { label: 'Bidirecional', description: 'Sincroniza em ambas as direções' },
};

const CONFLICT_RESOLUTION_LABELS: Record<ConflictResolution, { label: string; description: string }> = {
  barber_priority: { label: 'BarberZap tem prioridade', description: 'Sempre mantém agendamentos do BarberZap' },
  calendar_priority: { label: 'Calendário tem prioridade', description: 'Sempre mantém eventos do calendário externo' },
  ask_user: { label: 'Perguntar', description: 'Mostra conflitos para você decidir' },
};

// Sync status colors
const SYNC_STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-500',
  failed: 'bg-red-500',
  in_progress: 'bg-yellow-500',
};

/**
 * CalendarIntegration Component
 * 
 * Interface para gerenciar integrações com calendários externos.
 * Permite conectar, desconectar, configurar e sincronizar calendários.
 * 
 * @example
 * ```tsx
 * <CalendarIntegration 
 *   clientId="client-uuid" 
 *   shopId="shop-uuid" 
 * />
 * ```
 */
export const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({
  clientId,
  shopId
}) => {
  // Hooks
  const { 
    calendars, 
    loading, 
    error, 
    refetch 
  } = useCalendarIntegrations(clientId, shopId);
  
  const connectGoogle = useConnectGoogleCalendar();
  const syncNow = useSyncNow();
  const disconnect = useDisconnectCalendar();

  // Local state
  const [isConnecting, setIsConnecting] = useState<CalendarType | null>(null);
  const [syncingCalendarId, setSyncingCalendarId] = useState<string | null>(null);
  const [expandedCalendarId, setExpandedCalendarId] = useState<string | null>(null);
  const [editedCalendar, setEditedCalendar] = useState<Partial<CalendarIntegrationData> | null>(null);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [oauthPopup, setOAuthPopup] = useState<Window | null>(null);

  // Connect to Google Calendar
  const handleConnectGoogle = async () => {
    setIsConnecting('google');
    
    try {
      // Get OAuth URL
      const authUrl = await connectGoogle.getAuthUrl(shopId, clientId);
      
      // Open popup for OAuth flow
      const popup = window.open(
        authUrl,
        'Google Calendar OAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes' +
        ',top=100,left=100'
      );
      
      setOAuthPopup(popup);
      
      // Listen for OAuth callback
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'GOOGLE_OAUTH_CALLBACK') {
          if (event.data.success) {
            handleOAuthSuccess(event.data.credentials);
          } else {
            handleOAuthError(event.data.error);
          }
          
          // Cleanup
          window.removeEventListener('message', handleMessage);
          if (popup) popup.close();
          setOAuthPopup(null);
          setIsConnecting(null);
        }
      };
      
      window.addEventListener('message', handleMessage);
      
    } catch (err) {
      console.error('Error connecting to Google Calendar:', err);
      setIsConnecting(null);
    }
  };

  // Handle OAuth success
  const handleOAuthSuccess = async (credentials: any) => {
    try {
      await connectGoogle.complete(shopId, clientId, credentials);
      refetch();
    } catch (err) {
      console.error('Error completing OAuth:', err);
    }
  };

  // Handle OAuth error
  const handleOAuthError = (error: string) => {
    console.error('OAuth error:', error);
    setIsConnecting(null);
  };

  // Sync calendar now
  const handleSyncNow = async (calendarId: string) => {
    setSyncingCalendarId(calendarId);
    
    try {
      await syncNow(calendarId);
      refetch();
    } catch (err) {
      console.error('Error syncing calendar:', err);
    } finally {
      setSyncingCalendarId(null);
    }
  };

  // Disconnect calendar
  const handleDisconnect = async (calendarId: string) => {
    if (!confirm('Tem certeza que deseja desconectar este calendário?')) {
      return;
    }
    
    try {
      await disconnect(calendarId);
      refetch();
    } catch (err) {
      console.error('Error disconnecting calendar:', err);
    }
  };

  // Update calendar settings
  const updateCalendarSetting = (
    calendarId: string,
    field: keyof CalendarIntegrationData,
    value: any
  ) => {
    setEditedCalendar(prev => ({
      ...prev,
      id: calendarId,
      [field]: value
    }));
    setPendingChanges(true);
  };

  // Save calendar settings
  const handleSaveSettings = async (calendarId: string) => {
    if (!editedCalendar) return;
    
    try {
      // TODO: Implement save settings via API
      // await updateCalendarSettings(shopId, calendarId, editedCalendar);
      
      setPendingChanges(false);
      setEditedCalendar(null);
      refetch();
    } catch (err) {
      console.error('Error saving calendar settings:', err);
    }
  };

  // Format last synced time
  const formatLastSynced = (lastSyncedAt: string | null) => {
    if (!lastSyncedAt) return 'Nunca sincronizado';
    
    const date = new Date(lastSyncedAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="calendar-integration-container">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Integrações de Calendário</h2>
          <p className="text-gray-600 mt-1">
            Conecte seus calendários externos para sincronizar agendamentos
          </p>
        </div>

        {/* Connect Buttons */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Conectar novo calendário
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {Object.entries(CALENDAR_TYPE_LABELS)
              .filter(([type]) => type !== 'other' || false)  // Hide 'other' for now
              .map(([type, info]) => (
                <button
                  key={type}
                  type="button"
                  disabled={isConnecting !== null}
                  onClick={type === 'google' ? handleConnectGoogle : undefined}
                  className={`flex items-center space-x-2 px-4 py-3 border rounded-lg transition-all ${
                    isConnecting === type
                      ? 'border-gray-300 bg-gray-100'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {isConnecting === type ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  ) : (
                    <span className="text-2xl">{info.icon}</span>
                  )}
                  <span className="font-medium">{info.label}</span>
                  {type === 'google' && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      OAuth
                    </span>
                  )}
                </button>
              ))}
          </div>
        </div>

        {/* Connected Calendars */}
        <div className="p-6">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Calendários conectados
          </h3>
          
          {calendars.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">📅</span>
              <p>Nenhum calendário conectado ainda</p>
              <p className="text-sm mt-1">Conecte um calendário acima para começar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {calendars.map((calendar) => {
                const typeInfo = CALENDAR_TYPE_LABELS[calendar.calendar_type];
                const syncStatusColor = SYNC_STATUS_COLORS[calendar.last_sync_status] || 'bg-gray-400';
                const isExpanded = expandedCalendarId === calendar.id;
                const isEditing = editedCalendar?.id === calendar.id;
                const isSyncing = syncingCalendarId === calendar.id;
                
                return (
                  <div 
                    key={calendar.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-50">
                      <div className="flex items-center space-x-4">
                        {/* Status indicator */}
                        <div className={`w-2 h-2 rounded-full ${syncStatusColor}`} title={calendar.last_sync_status} />
                        
                        {/* Calendar icon and name */}
                        <div className="flex items-center space-x-3">
                          <span 
                            className="text-2xl"
                            style={{ color: calendar.calendar_color || typeInfo.color }}
                          >
                            {typeInfo.icon}
                          </span>
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {calendar.calendar_name || typeInfo.label}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {typeInfo.label}
                              {!calendar.enabled && (
                                <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                                  Desativado
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        {/* Enable/Disable toggle */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={calendar.enabled || false}
                            onChange={(e) => updateCalendarSetting(calendar.id, 'enabled', e.target.checked)}
                            className="sr-only peer"
                            disabled={!isEditing}
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        
                        {/* Sync button */}
                        <button
                          type="button"
                          disabled={!calendar.enabled || isSyncing}
                          onClick={() => handleSyncNow(calendar.id)}
                          className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          {isSyncing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Sync...</span>
                            </>
                          ) : (
                            <>
                              <span>↻</span>
                              <span>Sync</span>
                            </>
                          )}
                        </button>
                        
                        {/* Expand settings */}
                        <button
                          type="button"
                          onClick={() => setExpandedCalendarId(isExpanded ? null : calendar.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <span className={isExpanded ? 'rotate-180' : ''}>
                            ▼
                          </span>
                        </button>
                        
                        {/* Disconnect */}
                        <button
                          type="button"
                          onClick={() => handleDisconnect(calendar.id)}
                          className="p-2 text-red-500 hover:text-red-700 transition-colors"
                          title="Desconectar calendário"
                        >
                          ×
                        </button>
                      </div>
                    </div>

                    {/* Last sync info */}
                    <div className="px-4 py-2 text-sm text-gray-600 border-t border-gray-100">
                      <span className="mr-4">
                        Última sync: {formatLastSynced(calendar.last_synced_at)}
                      </span>
                      {calendar.last_sync_error && (
                        <span className="text-red-600 ml-4">
                          Erro: {calendar.last_sync_error}
                        </span>
                      )}
                    </div>

                    {/* Expanded Settings */}
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-200 space-y-4">
                        {/* Sync Direction */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Direção da sincronização
                          </label>
                          <select
                            value={editedCalendar?.sync_direction || calendar.sync_direction}
                            onChange={(e) => updateCalendarSetting(calendar.id, 'sync_direction', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.entries(SYNC_DIRECTION_LABELS).map(([value, info]) => (
                              <option key={value} value={value}>
                                {info.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            {SYNC_DIRECTION_LABELS[editedCalendar?.sync_direction || calendar.sync_direction]?.description}
                          </p>
                        </div>

                        {/* Auto Sync */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700">Sincronização automática</h4>
                            <p className="text-xs text-gray-500">Sincroniza automaticamente após cada alteração</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editedCalendar?.auto_sync ?? calendar.preferences?.auto_sync ?? true}
                              onChange={(e) => updateCalendarSetting(calendar.id, 'auto_sync', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>

                        {/* Conflict Resolution */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Resolução de conflitos
                          </label>
                          <select
                            value={editedCalendar?.conflict_resolution || calendar.conflict_resolution}
                            onChange={(e) => updateCalendarSetting(calendar.id, 'conflict_resolution', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {Object.entries(CONFLICT_RESOLUTION_LABELS).map(([value, info]) => (
                              <option key={value} value={value}>
                                {info.label}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            {CONFLICT_RESOLUTION_LABELS[editedCalendar?.conflict_resolution || calendar.conflict_resolution]?.description}
                          </p>
                        </div>

                        {/* Save button */}
                        {pendingChanges && editedCalendar?.id === calendar.id && (
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleSaveSettings(calendar.id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Salvar configurações
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarIntegration;
