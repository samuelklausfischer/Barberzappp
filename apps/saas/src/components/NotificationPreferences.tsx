import React, { useState, useEffect, useMemo } from 'react';
import { useNotificationPreferences, useUpdatePreferences, useNotificationPreview, useTimezones } from '../hooks/useNotificationPreferences';

// Types
export type NotificationType = 
  | 'booking_confirmation'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'cancellation'
  | 'reschedule'
  | 'promotional'
  | 'monthly_report';

export type ChannelType = 'whatsapp' | 'email' | 'sms' | 'in_app' | 'none';

export type TimingType = 
  | 'instant'
  | '1h_before'
  | '24h_before'
  | 'morning'
  | 'afternoon'
  | 'evening';

export interface NotificationPreference {
  notification_type: NotificationType;
  channel: ChannelType;
  enabled: boolean;
  timing: TimingType;
  timezone: string;
  do_not_disturb_start: string | null;
  do_not_disturb_end: string | null;
}

export interface NotificationPreferencesProps {
  shopId: string;
  clientId: string;
}

// Label mappings
const NOTIFICATION_LABELS: Record<NotificationType, { label: string; description: string; icon: string }> = {
  booking_confirmation: {
    label: 'Confirmação de Agendamento',
    description: 'Receba confirmação imediata ao agendar um horário',
    icon: '✅'
  },
  reminder_24h: {
    label: 'Lembrete 24h antes',
    description: 'Lembretes enviados um dia antes do horário',
    icon: '📅'
  },
  reminder_2h: {
    label: 'Lembrete 2h antes',
    description: 'Lembretes enviados duas horas antes',
    icon: '⏰'
  },
  cancellation: {
    label: 'Cancelamento',
    description: 'Notificações sobre cancelamentos',
    icon: '❌'
  },
  reschedule: {
    label: 'Remarcação',
    description: 'Notificações sobre alterações de horário',
    icon: '🔄'
  },
  promotional: {
    label: 'Promoções',
    description: 'Ofertas especiais e promoções sazonais',
    icon: '🎁'
  },
  monthly_report: {
    label: 'Relatório Mensal',
    description: 'Resumo mensal dos seus agendamentos',
    icon: '📊'
  }
};

const CHANNEL_LABELS: Record<ChannelType, { label: string; icon: string; description: string }> = {
  whatsapp: { label: 'WhatsApp', icon: '📱', description: 'Mensagem via WhatsApp' },
  email: { label: 'Email', icon: '📧', description: 'Email detalhado' },
  sms: { label: 'SMS', icon: '💬', description: 'Mensagem de texto' },
  in_app: { label: 'App', icon: '🔔', description: 'Notificação no aplicativo' },
  none: { label: 'Nenhum', icon: '🔕', description: 'Não receber' }
};

const TIMING_LABELS: Record<TimingType, { label: string; description: string }> = {
  instant: { label: 'Imediato', description: 'Enviar imediatamente' },
  '1h_before': { label: '1 hora antes', description: 'Enviar 1 hora antes' },
  '24h_before': { label: '24 horas antes', description: 'Enviar 24 horas antes' },
  morning: { label: 'Manhã', description: 'Enviar entre 8h e 12h' },
  afternoon: { label: 'Tarde', description: 'Enviar entre 12h e 18h' },
  evening: { label: 'Noite', description: 'Enviar entre 18h e 22h' }
};

/**
 * NotificationPreferences Component
 * 
 * Formulário completo para gerenciar preferências de notificação do cliente.
 * Permite configurar canais, timing, timezone e período de silêncio.
 * 
 * @example
 * ```tsx
 * <NotificationPreferences 
 *   shopId="shop-uuid" 
 *   clientId="client-uuid" 
 * />
 * ```
 */
export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  shopId,
  clientId
}) => {
  // Hooks
  const { preferences, loading, error, refetch } = useNotificationPreferences(shopId, clientId);
  const updatePreferences = useUpdatePreferences();
  const preview = useNotificationPreview(shopId, clientId);
  const timezones = useTimezones();

  // Local state
  const [savedPreferences, setSavedPreferences] = useState<NotificationPreference[]>([]);
  const [pendingChanges, setPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewModal, setPreviewModal] = useState<{ type: NotificationType; open: boolean } | null>(null);
  const [globalDoNotDisturb, setGlobalDoNotDisturb] = useState({
    enabled: false,
    start: '22:00',
    end: '08:00'
  });

  // Initialize with fetched data
  useEffect(() => {
    if (preferences) {
      setSavedPreferences(preferences);
      
      // Extract global do not disturb from first pref
      if (preferences.length > 0) {
        const firstPref = preferences[0];
        if (firstPref.do_not_disturb_start || firstPref.do_not_disturb_end) {
          setGlobalDoNotDisturb({
            enabled: true,
            start: firstPref.do_not_disturb_start || '22:00',
            end: firstPref.do_not_disturb_end || '08:00'
          });
        }
      }
    }
  }, [preferences]);

  // Update a single preference
  const updatePreference = (
    type: NotificationType,
    field: keyof NotificationPreference,
    value: any
  ) => {
    setSavedPreferences(prev => {
      const updated = prev.map(pref => 
        pref.notification_type === type 
          ? { ...pref, [field]: value }
          : pref
      );
      setPendingChanges(true);
      return updated;
    });
  };

  // Toggle enabled status
  const toggleEnabled = (type: NotificationType) => {
    updatePreference(type, 'enabled', !getPreference(type).enabled);
  };

  // Get preference by type
  const getPreference = (type: NotificationType): NotificationPreference => {
    return savedPreferences.find(p => p.notification_type === type) || {
      notification_type: type,
      channel: 'whatsapp',
      enabled: true,
      timing: 'instant',
      timezone: 'America/Sao_Paulo',
      do_not_disturb_start: null,
      do_not_disturb_end: null
    };
  };

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      // Apply global do not disturb to all preferences
      const preferencesToSave = savedPreferences.map(pref => ({
        ...pref,
        do_not_disturb_start: globalDoNotDisturb.enabled ? globalDoNotDisturb.start : null,
        do_not_disturb_end: globalDoNotDisturb.enabled ? globalDoNotDisturb.end : null
      }));

      await updatePreferences(shopId, clientId, preferencesToSave);
      setPendingChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      refetch();
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to original preferences
  const handleReset = () => {
    setSavedPreferences(preferences || []);
    setPendingChanges(false);
    
    if (preferences && preferences.length > 0) {
      const firstPref = preferences[0];
      setGlobalDoNotDisturb({
        enabled: !!(firstPref.do_not_disturb_start || firstPref.do_not_disturb_end),
        start: firstPref.do_not_disturb_start || '22:00',
        end: firstPref.do_not_disturb_end || '08:00'
      });
    }
  };

  // Show preview
  const showPreview = (type: NotificationType) => {
    setPreviewModal({ type, open: true });
    preview.loadPreview(type);
  };

  if (loading && !preferences) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="notification-preferences-container">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Preferências de Notificação</h2>
          <p className="text-gray-600 mt-1">
            Configure como e quando quer receber notificações
          </p>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Do Not Disturb Global */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🌙</span>
                <h3 className="font-semibold text-gray-700">Período de Silêncio</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalDoNotDisturb.enabled}
                  onChange={(e) => setGlobalDoNotDisturb(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            
            {globalDoNotDisturb.enabled && (
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Início</label>
                  <input
                    type="time"
                    value={globalDoNotDisturb.start}
                    onChange={(e) => setGlobalDoNotDisturb(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <span className="text-gray-400">até</span>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">Fim</label>
                  <input
                    type="time"
                    value={globalDoNotDisturb.end}
                    onChange={(e) => setGlobalDoNotDisturb(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timezone Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
            <select
              value={savedPreferences[0]?.timezone || 'America/Sao_Paulo'}
              onChange={(e) => savedPreferences.forEach(pref => 
                updatePreference(pref.notification_type, 'timezone', e.target.value)
              )}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um fuso horário</option>
              {timezones.map(tz => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notification Type Preferences */}
          <div className="space-y-4">
            {Object.entries(NOTIFICATION_LABELS).map(([type, info]) => {
              const pref = getPreference(type as NotificationType);
              
              return (
                <div 
                  key={type} 
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    {/* Left: Icon, Label, Description, Toggle */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h4 className="font-semibold text-gray-800">{info.label}</h4>
                          <p className="text-sm text-gray-500">{info.description}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Toggle */}
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={pref.enabled}
                        onChange={() => toggleEnabled(type as NotificationType)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Expanded options when enabled */}
                  {pref.enabled && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                      {/* Channel Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Canal</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {Object.entries(CHANNEL_LABELS).map(([channel, channelInfo]) => (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => updatePreference(type as NotificationType, 'channel', channel)}
                              className={`flex items-center space-x-2 p-3 border rounded-lg transition-all ${
                                pref.channel === channel
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-xl">{channelInfo.icon}</span>
                              <span className="text-sm font-medium">{channelInfo.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Timing Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quando enviar</label>
                        <select
                          value={pref.timing}
                          onChange={(e) => updatePreference(type as NotificationType, 'timing', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Object.entries(TIMING_LABELS).map(([timing, timingInfo]) => (
                            <option key={timing} value={timing}>
                              {timingInfo.label} - {timingInfo.description}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Preview Button */}
                      <button
                        type="button"
                        onClick={() => showPreview(type as NotificationType)}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <span>👁️</span>
                        <span>Ver exemplo de mensagem</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleReset}
              disabled={!pendingChanges}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              Descartar alterações
            </button>
            
            <div className="flex items-center space-x-3">
              {saveSuccess && (
                <span className="text-green-600 text-sm flex items-center">
                  <span className="mr-1">✓</span>
                  Salvo com sucesso!
                </span>
              )}
              
              <button
                type="button"
                onClick={handleSave}
                disabled={!pendingChanges || isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSaving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                <span>{isSaving ? 'Salvando...' : 'Salvar preferências'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewModal && previewModal.open && (
        <PreviewModal
          type={previewModal.type}
          preview={preview.preview}
          loading={preview.loading}
          onClose={() => setPreviewModal(null)}
        />
      )}
    </div>
  );
};

// Preview Modal Component
interface PreviewModalProps {
  type: NotificationType;
  preview: any;
  loading: boolean;
  onClose: () => void;
}

const PreviewModal: React.FC<PreviewModalProps> = ({ type, preview, loading, onClose }) => {
  const info = NOTIFICATION_LABELS[type];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{info.icon}</span>
              <h3 className="text-xl font-bold">{info.label}</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Canal:</p>
            <p className="font-semibold">
              {!loading && preview && CHANNEL_LABELS[preview.channel as ChannelType]?.label}
            </p>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600">Título:</p>
            <p className="font-semibold">
              {!loading && preview && preview.title}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Mensagem:</p>
            <div className="mt-2 p-4 bg-gray-100 rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {preview?.message || 'Carregando...'}
                </pre>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences;
