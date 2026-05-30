/**
 * Exemplo de Componente usando Supabase Realtime Hooks
 * 
 * Este componente demonstra o uso do hook useRealtimeAppointments
 * para obter e exibir uma lista de appointments em tempo real.
 * 
 * Features demonstradas:
 * - Subscrição automática a appointments
 * - Atualizações em tempo real (INSERT, UPDATE, DELETE)
 * - Estados de loading e erro
 * - Filtro local de dados
 * - Cache para performance
 * - Ações (confirmar, cancelar, etc.)
 * - Controle manual de refetch
 * - Indicador de status da conexão
 */

import React from 'react';
import { 
  useRealtimeAppointments, 
  useRealtimeConnectionStatus,
  ConnectionStatus,
  RealtimeAppointment 
} from '../hooks';

// ============================================================================
// UI COMPONENTS
// ============================================================================

interface BadgeProps {
  status: 'confirmed' | 'pending' | 'canceled' | 'completed';
  children: React.ReactNode;
}

function StatusBadge({ status, children }: BadgeProps) {
  const colors = {
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    canceled: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800'
  };
  
  const labels = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    canceled: 'Cancelado',
    completed: 'Concluído'
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {labels[status] || status}
    </span>
  );
}

function ConnectionStatusIndicator() {
  const status = useRealtimeConnectionStatus();
  
  const config: Record<ConnectionStatus, { color: string; label: string }> = {
    [ConnectionStatus.CONNECTED]: { 
      color: 'bg-green-500', 
      label: 'Conectado' 
    },
    [ConnectionStatus.CONNECTING]: { 
      color: 'bg-yellow-500', 
      label: 'Conectando...' 
    },
    [ConnectionStatus.DISCONNECTED]: { 
      color: 'bg-red-500', 
      label: 'Desconectado' 
    },
    [ConnectionStatus.ERROR]: { 
      color: 'bg-red-500', 
      label: 'Erro' 
    },
    [ConnectionStatus.RECONNECTING]: { 
      color: 'bg-orange-500', 
      label: 'Reconectando...' 
    }
  };
  
  const { color, label } = config[status];
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}

// ============================================================================
// APPOINTMENT CARD COMPONENT
// ============================================================================

interface AppointmentCardProps {
  appointment: RealtimeAppointment;
  onConfirm?: (id: string) => void;
  onCancel?: (id: string) => void;
  onComplete?: (id: string) => void;
}

function AppointmentCard({ 
  appointment, 
  onConfirm, 
  onCancel, 
  onComplete 
}: AppointmentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {appointment.clientAvatar && (
            <img 
              src={appointment.clientAvatar} 
              alt={appointment.clientName}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">
              {appointment.clientName}
            </h3>
            <p className="text-sm text-gray-500">{appointment.service}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status}>
          {appointment.status}
        </StatusBadge>
      </div>
      
      {/* Time and Price */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{appointment.time} • {appointment.duration}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>R$ {appointment.price.toFixed(2)}</span>
        </div>
      </div>
      
      {/* Notes */}
      {appointment.notes && (
        <p className="text-sm text-gray-500 mb-3 italic">
          "{appointment.notes}"
        </p>
      )}
      
      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {appointment.status === 'pending' && (
          <>
            <button
              onClick={() => onConfirm?.(appointment.id)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors"
            >
              Confirmar
            </button>
            <button
              onClick={() => onCancel?.(appointment.id)}
              className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
            >
              Cancelar
            </button>
          </>
        )}
        
        {appointment.status === 'confirmed' && (
          <button
            onClick={() => onComplete?.(appointment.id)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
          >
            Concluir
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface AppointmentsListExampleProps {
  /** ID da barbearia/shop */
  shopId: string;
  
  /** Filtrar por data específica (opcional) */
  dateFilter?: string;
  
  /** Mostrar apenas appointments não cancelados */
  excludeCanceled?: boolean;
  
  /** Handler para confirmar appointment */
  onConfirmAppointment?: (id: string) => Promise<void>;
  
  /** Handler para cancelar appointment */
  onCancelAppointment?: (id: string) => Promise<void>;
  
  /** Handler para concluir appointment */
  onCompleteAppointment?: (id: string) => Promise<void>;
}

/**
 * Componente Principal - Lista de Appointments em Tempo Real
 * 
 * @example
 * <AppointmentsListExample 
 *   shopId="shop-123"
 *   excludeCanceled={true}
 *   onConfirmAppointment={handleConfirm}
 * />
 */
export function AppointmentsListExample({
  shopId,
  dateFilter,
  excludeCanceled = true,
  onConfirmAppointment,
  onCancelAppointment,
  onCompleteAppointment
}: AppointmentsListExampleProps) {
  
  // ============================================================================
  // REALTIME HOOK
  // ============================================================================
  
  const {
    data: appointments,
    loading,
    error,
    connectionStatus,
    reconnecting,
    lastUpdate,
    refetch,
    disconnect
  } = useRealtimeAppointments(shopId, {
    // Dados iniciais para evitar loading
    initialData: [],
    
    // Cache de 5 minutos
    cacheTTL: 300000,
    
    // Filtro local para excluir cancelados e filtrar por data
    filterFn: (appointment: RealtimeAppointment) => {
      if (excludeCanceled && appointment.status === 'canceled') {
        return false;
      }
      if (dateFilter && appointment.date !== dateFilter) {
        return false;
      }
      return true;
    },
    
    // Callback quando dados mudam
    onDataChange: (data) => {
      console.log(`[AppointmentsList] Dados atualizados: ${data.length} appointments`);
      
      // Opção: enviar notificação se houve mudanças
      // if (data.length > prevCount) {
      //   sendNotification('Novo agendamento!');
      // }
    },
    
    // Tratamento de erros
    onError: (error) => {
      console.error('[AppointmentsList] Erro Realtime:', error);
      // toast.error('Erro ao carregar appointments');
    },
    
    // Desconexão
    onDisconnect: () => {
      console.warn('[AppointmentsList] Desconectado do Realtime');
    },
    
    // Reconexão
    onReconnect: () => {
      console.log('[AppointmentsList] Reconectado ao Realtime');
    }
  });
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleConfirm = async (id: string) => {
    if (!onConfirmAppointment) return;
    
    try {
      await onConfirmAppointment(id);
      // Não precisa de refetch - atualização vem via Realtime automaticamente!
    } catch (error) {
      console.error('Erro ao confirmar appointment:', error);
    }
  };
  
  const handleCancel = async (id: string) => {
    if (!onCancelAppointment) return;
    
    try {
      await onCancelAppointment(id);
    } catch (error) {
      console.error('Erro ao cancelar appointment:', error);
    }
  };
  
  const handleComplete = async (id: string) => {
    if (!onCompleteAppointment) return;
    
    try {
      await onCompleteAppointment(id);
    } catch (error) {
      console.error('Erro ao concluir appointment:', error);
    }
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  // Estado de loading inicial
  if (loading && !appointments) {
    return (
      <div className="space-y-4 p-4">
        {/* Skeleton loading */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-32" />
        ))}
      </div>
    );
  }
  
  // Estado de erro
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Erro ao Carregar
        </h3>
        <p className="text-red-600 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }
  
  // Lista vazia
  if (!appointments || appointments.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Nenhum Agendamento
        </h3>
        <p className="text-gray-500">
          {dateFilter 
            ? `Não há agendamentos para a data ${dateFilter}`
            : 'Não há agendamentos cadastrados'
          }
        </p>
      </div>
    );
  }
  
  // Lista de appointments
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Agendamentos ({appointments.length})
          </h2>
          <ConnectionStatusIndicator />
        </div>
        
        <div className="flex items-center gap-2">
          {/* Indicador de reconexão */}
          {reconnecting && (
            <span className="text-sm text-orange-600 flex items-center gap-1">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Reconectando...
            </span>
          )}
          
          {/* Last update */}
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Atualizado: {new Date(lastUpdate).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
        
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50 transition-colors"
        >
          Desconectar
        </button>
      </div>
      
      {/* Appointments List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {appointments.map(appointment => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            onComplete={handleComplete}
          />
        ))}
      </div>
      
      {/* Debug Info (opcional) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 p-3 bg-gray-900 text-gray-100 text-xs font-mono rounded">
          <p><strong>Shop ID:</strong> {shopId}</p>
          <p><strong>Total Appointments:</strong> {appointments.length}</p>
          <p><strong>Connection Status:</strong> {connectionStatus}</p>
          <p><strong>Reconnecting:</strong> {reconnecting ? 'Yes' : 'No'}</p>
          <p><strong>Last Update:</strong> {lastUpdate ? new Date(lastUpdate).toLocaleString() : 'Never'}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EXPORT AS DEFAULT
// ============================================================================

export default AppointmentsListExample;

// ============================================================================
// USAGE EXAMPLE (comentado)
// ============================================================================

/**
 * Exemplo de uso:
 * 
 * ```tsx
 * import AppointmentsListExample from '@/realtime/examples/AppointmentsListExample';
 * 
 * function AppointmentsPage() {
 *   const currentShop = useCurrentShop();
 *   
 *   const handleConfirm = async (id: string) => {
 *     await updateAppointment(id, { status: 'confirmed' });
 *   };
 *   
 *   const handleCancel = async (id: string) => {
 *     await updateAppointment(id, { status: 'canceled' });
 *   };
 *   
 *   const handleComplete = async (id: string) => {
 *     await updateAppointment(id, { status: 'completed' });
 *   };
 *   
 *   return (
 *     <main className="container mx-auto px-4 py-8">
 *       <AppointmentsListExample
 *         shopId={currentShop.id}
 *         excludeCanceled={true}
 *         onConfirmAppointment={handleConfirm}
 *         onCancelAppointment={handleCancel}
 *         onCompleteAppointment={handleComplete}
 *       />
 *     </main>
 *   );
 * }
 * ```
 */
