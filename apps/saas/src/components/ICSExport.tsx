import React, { useState, useEffect } from 'react';
import { useICSExport, useAppointments } from '../hooks/useCalendarIntegrations';

// Types
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

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

export interface ICSExportProps {
  clientId: string;
  shopId: string;
}

// Status labels
const STATUS_LABELS: Record<AppointmentStatus, { label: string; color: string }> = {
  scheduled: { label: 'Agendado', color: 'bg-blue-100 text-blue-700' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-700' },
  completed: { label: 'Concluído', color: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
  no_show: { label: 'Não compareceu', color: 'bg-yellow-100 text-yellow-700' },
};

/**
 * ICSExport Component
 * 
 * Interface para exportar agendamentos para arquivo ICS (iCalendar).
 * Permite filtrar por período e status, e fazer download do arquivo.
 * 
 * @example
 * ```tsx
 * <ICSExport 
 *   clientId="client-uuid" 
 *   shopId="shop-uuid" 
 * />
 * ```
 */
export const ICSExport: React.FC<ICSExportProps> = ({
  clientId,
  shopId
}) => {
  // Hooks
  const { appointments, loading: appointmentsLoading, refetch } = useAppointments(clientId, shopId);
  const icsExport = useICSExport();

  // Local state
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([
    'scheduled',
    'confirmed',
    'completed',
  ]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');

  // Initialize dates (last 30 days to next 30 days)
  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    setFromDate(thirtyDaysAgo.toISOString().split('T')[0]);
    setToDate(thirtyDaysAhead.toISOString().split('T')[0]);
  }, []);

  // Toggle status selection
  const toggleStatus = (status: AppointmentStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // Filtered appointments
  const filteredAppointments = React.useMemo(() => {
    if (!appointments) return [];
    
    return appointments.filter(apt => {
      const scheduledDate = new Date(apt.scheduled_at);
      const fromDateObj = fromDate ? new Date(fromDate) : null;
      const toDateObj = toDate ? new Date(toDate) : null;
      
      // Date filter
      if (fromDateObj && scheduledDate < fromDateObj) return false;
      if (toDateObj && scheduledDate > toDateObj) return false;
      
      // Status filter
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(apt.status)) {
        return false;
      }
      
      return true;
    });
  }, [appointments, fromDate, toDate, selectedStatuses]);

  // Select all statuses or none
  const selectAllStatuses = () => {
    setSelectedStatuses(Object.keys(STATUS_LABELS) as AppointmentStatus[]);
  };

  const clearStatuses = () => {
    setSelectedStatuses([]);
  };

  // Preview ICS content
  const handlePreview = async () => {
    setPreviewMode(true);
    setPreviewContent('Carregando preview...');
    
    try {
      const content = await icsExport.generatePreview(filteredAppointments);
      setPreviewContent(content);
    } catch (err) {
      console.error('Error generating preview:', err);
      setPreviewContent('Erro ao gerar preview');
    }
  };

  // Close preview
  const handleClosePreview = () => {
    setPreviewMode(false);
    setPreviewContent('');
  };

  // Export to ICS file
  const handleExport = async () => {
    if (filteredAppointments.length === 0) {
      alert('Nenhum agendamento para exportar');
      return;
    }
    
    setIsExporting(true);
    setExportUrl(null);
    
    try {
      const url = await icsExport.exportToURL(filteredAppointments);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = url;
      const filename = `barberzap-calendar-${new Date().toISOString().split('T')[0]}.ics`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportUrl(url);
      
    } catch (err) {
      console.error('Error exporting ICS:', err);
      alert('Erro ao exportar arquivo ICS');
    } finally {
      setIsExporting(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="ics-export-container">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Exportar Calendário (.ics)</h2>
          <p className="text-gray-600 mt-1">
            Exporte seus agendamentos para importar em outros calendários
          </p>
        </div>

        {/* Filter Section */}
        <div className="p-6 space-y-6 border-b border-gray-200">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">De</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <span className="text-gray-400">até</span>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Até</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={selectAllStatuses}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Todos
                </button>
                <span className="text-gray-300">|</span>
                <button
                  type="button"
                  onClick={clearStatuses}
                  className="text-xs text-gray-600 hover:text-gray-800"
                >
                  Limpar
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([status, info]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => toggleStatus(status as AppointmentStatus)}
                  className={`px-3 py-2 rounded-full text-sm transition-all ${
                    selectedStatuses.includes(status as AppointmentStatus)
                      ? `${info.color} border-current`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {info.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                Prévia ({filteredAppointments.length} agendamentos)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {filteredAppointments.length} agendamentos encontrados
              </p>
            </div>
            <button
              type="button"
              onClick={handlePreview}
              disabled={filteredAppointments.length === 0}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <span>👁️</span>
              <span>Ver prévia</span>
            </button>
          </div>

          {/* Appointment List */}
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              <span className="text-2xl mb-2 block">📋</span>
              <p>Nenhum agendamento encontrado com os filtros atuais</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.slice(0, 10).map((apt) => (
                    <tr key={apt.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {formatDate(apt.scheduled_at)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {apt.client_name}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {apt.service_name}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_LABELS[apt.status]?.color}`}>
                          {STATUS_LABELS[apt.status]?.label || apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredAppointments.length > 10 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-sm text-gray-500 text-center">
                        ... e mais {filteredAppointments.length - 10} agendamentos
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Export Button */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              O arquivo .ics pode ser importado em Google Calendar, Outlook, Apple Calendar e outros.
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={filteredAppointments.length === 0 || isExporting}
              className={`px-6 py-3 text-white rounded-md transition-all flex items-center space-x-2 ${
                isExporting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Gerando...</span>
                </>
              ) : (
                <>
                  <span>📥</span>
                  <span>Download Calendar (.ics)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Prévia do Arquivo ICS</h3>
                <button
                  onClick={handleClosePreview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>

              <div className="mb-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  Este é o conteúdo do arquivo ICS que será exportado:
                </p>
                <p className="text-xs text-gray-500">
                  Total de eventos: {filteredAppointments.length}
                </p>
              </div>

              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {previewContent}
                </pre>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={handleClosePreview}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Fechar
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Exportando...</span>
                    </>
                  ) : (
                    <>
                      <span>Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICSExport;
