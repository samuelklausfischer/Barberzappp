/**
 * Report Scheduler Component
 *
 * Interface para gerenciar reports agendados com envio automático por email.
 * Permite criar, editar, remover e testar schedules.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Mail,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Play,
  Pause,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  UserPlus
} from 'lucide-react';

// Types
interface Recipient {
  id: string;
  email: string;
  name?: string;
  role?: 'owner' | 'manager' | 'barber' | 'admin';
}

interface ScheduleConfig {
  id?: string;
  name: string;
  reportType: string;
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
  cronExpression?: string;
  recipients: Recipient[];
  format: 'json' | 'csv' | 'excel' | 'pdf';
  includeCharts: boolean;
  includeSummary: boolean;
  subject?: string;
  message?: string;
  isActive: boolean;
}

interface ScheduleRun {
  id: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  fileUrl?: string;
  sentStatus?: 'sent' | 'failed' | 'pending';
}

interface ReportSchedulerProps {
  shopId: string;
  onSchedule?: (schedule: ScheduleConfig) => void;
}

const REPORT_TYPES = [
  { value: 'revenue', label: 'Receita' },
  { value: 'appointments', label: 'Agendamentos' },
  { value: 'retention', label: 'Retenção de Clientes' },
  { value: 'service-popularity', label: 'Popularidade de Serviços' },
  { value: 'employee-performance', label: 'Performance de Funcionários' },
  { value: 'no-show', label: 'No-Show Analysis' },
  { value: 'peak-hours', label: 'Horários de Pico' }
];

const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'excel', label: 'Excel' },
  { value: 'csv', label: 'CSV' },
  { value: 'json', label: 'JSON' }
];

const SCHEDULE_TYPES = [
  { value: 'daily', label: 'Diariamente' },
  { value: 'weekly', label: 'Semanalmente' },
  { value: 'monthly', label: 'Mensalmente' },
  { value: 'quarterly', label: 'Trimestralmente' },
  { value: 'custom', label: 'Custom (Cron)' }
];

const WEEKDAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

export const ReportScheduler: React.FC<ReportSchedulerProps> = ({
  shopId,
  onSchedule
}) => {
  // State
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState<ScheduleRun[]>([]);
  const [formData, setFormData] = useState<Partial<ScheduleConfig>>({
    name: '',
    reportType: 'revenue',
    scheduleType: 'daily',
    recipients: [],
    format: 'pdf',
    includeCharts: true,
    includeSummary: true,
    isActive: true
  });

  // API Integration
  const loadSchedules = useCallback(async () => {
    try {
      const response = await fetch(`/api/reports/scheduled?shop_id=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  }, [shopId]);

  const saveSchedule = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validation
    if (!formData.name) {
      alert('Nome do schedule é obrigatório');
      return;
    }
    if (!formData.recipients || formData.recipients.length === 0) {
      alert('Pelo menos um destinatário é obrigratório');
      return;
    }

    setLoading(true);
    try {
      const endpoint = formData.id
        ? `/api/reports/scheduled/${formData.id}`
        : '/api/reports/scheduled';
      
      const method = formData.id ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shopId,
          ...formData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save schedule');
      }

      const savedSchedule = await response.json();
      setShowForm(false);
      setSelectedSchedule(null);
      setFormData({
        name: '',
        reportType: 'revenue',
        scheduleType: 'daily',
        recipients: [],
        format: 'pdf',
        includeCharts: true,
        includeSummary: true,
        isActive: true
      });
      
      await loadSchedules();
      onSchedule?.(savedSchedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Erro ao salvar schedule. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!confirm('Tem certeza que deseja remover este schedule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reports/scheduled/${scheduleId}?shop_id=${shopId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      await loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Erro ao remover schedule. Tente novamente.');
    }
  };

  const toggleScheduleActive = async (scheduleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/reports/scheduled/${scheduleId}?shop_id=${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      await loadSchedules();
    } catch (error) {
      console.error('Error toggling schedule:', error);
      alert('Erro ao atualizar schedule. Tente novamente.');
    }
  };

  const runNow = async (scheduleId: string) => {
    if (!confirm('Deseja executar este schedule agora (test run)?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/reports/scheduled/${scheduleId}/run-now?shop_id=${shopId}`,
        { method: 'POST' }
      );

      if (!response.ok) {
        throw new Error('Failed to run schedule');
      }

      alert('Schedule iniciado em background!');
    } catch (error) {
      console.error('Error running schedule:', error);
      alert('Erro ao executar schedule. Tente novamente.');
    }
  };

  const loadHistory = async (scheduleId: string) => {
    try {
      const response = await fetch(
        `/api/reports/scheduled/${scheduleId}/history?shop_id=${shopId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setHistoryData(data);
        setShowHistory(scheduleId);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const editSchedule = (schedule: ScheduleConfig) => {
    setSelectedSchedule(schedule);
    setFormData({
      ...schedule,
      recipients: schedule.recipients || []
    });
    setShowForm(true);
    setShowHistory(null);
  };

  const addRecipient = () => {
    const email = prompt('Digite o email do destinatário:');
    if (!email) return;

    const name = prompt('Digite o nome do destinatário (opcional):');
    
    setFormData({
      ...formData,
      recipients: [
        ...(formData.recipients || []),
        {
          id: `temp-${Date.now()}`,
          email,
          name: name || undefined,
          role: 'admin'
        }
      ]
    });
  };

  const removeRecipient = (recipientId: string) => {
    setFormData({
      ...formData,
      recipients: (formData.recipients || []).filter(r => r.id !== recipientId)
    });
  };

  // Effects
  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  // Render helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reports Agendados
          </h2>
          <p className="text-gray-600 mt-1">
            Configure envios automáticos de reports por email
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedSchedule(null);
            setFormData({
              name: '',
              reportType: 'revenue',
              scheduleType: 'daily',
              recipients: [],
              format: 'pdf',
              includeCharts: true,
              includeSummary: true,
              isActive: true
            });
            setShowForm(true);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Schedule</span>
        </button>
      </div>

      {/* Schedule Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {formData.id ? 'Editar Schedule' : 'Novo Schedule'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedSchedule(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={saveSchedule} className="p-6 space-y-6">
              {/* Nome do Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Schedule *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Resumo Diário de Receita"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>

              {/* Tipo de Report */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Report
                </label>
                <select
                  value={formData.reportType}
                  onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {REPORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Schedule */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequência
                </label>
                <select
                  value={formData.scheduleType}
                  onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {SCHEDULE_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Cron Expression (se custom) */}
              {formData.scheduleType === 'custom' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expressão Cron
                  </label>
                  <input
                    type="text"
                    value={formData.cronExpression || ''}
                    onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                    placeholder="Ex: 0 9 * * 1-5 (dias úteis às 9h)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use formato Unix cron standard
                  </p>
                </div>
              )}

              {/* Destinatários */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Destinatários *
                  </label>
                  <button
                    type="button"
                    onClick={addRecipient}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Adicionar</span>
                  </button>
                </div>
                {formData.recipients && formData.recipients.length > 0 ? (
                  <div className="space-y-2">
                    {formData.recipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{recipient.email}</p>
                          {recipient.name && (
                            <p className="text-sm text-gray-600">{recipient.name}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeRecipient(recipient.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Nenhum destinatário adicionado
                  </p>
                )}
              </div>

              {/* Formato de Exportação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Formato do Arquivo
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  {EXPORT_FORMATS.map(format => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Opções Adicionais */}
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includeCharts}
                    onChange={(e) => setFormData({ ...formData, includeCharts: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">Incluir gráficos</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includeSummary}
                    onChange={(e) => setFormData({ ...formData, includeSummary: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">Incluir resumo</span>
                </label>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                  />
                  <span className="text-sm text-gray-700">Ativo</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedSchedule(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedules List */}
      {!showForm && (
        <div className="space-y-4">
          {schedules.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum schedule configurado
              </h3>
              <p className="text-gray-500 mb-4">
                Crie seu primeiro schedule para começar a receber reports automaticamente
              </p>
              <button
                onClick={() => {
                  setSelectedSchedule(null);
                  setFormData({
                    name: '',
                    reportType: 'revenue',
                    scheduleType: 'daily',
                    recipients: [],
                    format: 'pdf',
                    includeCharts: true,
                    includeSummary: true,
                    isActive: true
                  });
                  setShowForm(true);
                }}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Criar Primeiro Schedule
              </button>
            </div>
          ) : (
            schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {schedule.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          schedule.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {schedule.scheduleType}
                      </p>
                      <p className="text-sm text-gray-600">
                        <Mail className="w-3 h-3 inline mr-1" />
                        {schedule.recipients?.length} destinatário(s)
                      </p>
                      <p className="text-sm text-gray-600">
                        {schedule.format.toUpperCase()}
                        {schedule.includeCharts && ' · Com gráficos'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleScheduleActive(schedule.id!, !schedule.isActive)}
                        className={`p-2 rounded-lg transition-colors ${
                          schedule.isActive
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={schedule.isActive ? 'Desativar' : 'Ativar'}
                      >
                        {schedule.isActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => runNow(schedule.id!)}
                        className="p-2 rounded-lg bg-yellow-100 text-yellow-600 hover:bg-yellow-200 transition-colors"
                        title="Executar agora"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => editSchedule(schedule)}
                        className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteSchedule(schedule.id!)}
                        className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Recipients Preview */}
                  {schedule.recipients && schedule.recipients.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Destinatários:</p>
                      <div className="flex flex-wrap gap-2">
                        {schedule.recipients.slice(0, 5).map((recipient) => (
                          <span
                            key={recipient.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {recipient.email}
                          </span>
                        ))}
                        {schedule.recipients.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            +{schedule.recipients.length - 5} mais
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* History Toggle */}
                  <button
                    onClick={() => loadHistory(schedule.id!)}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Ver histórico de execuções</span>
                  </button>
                </div>

                {/* History Panel */}
                {showHistory === schedule.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">
                      Histórico de Execuções
                    </h4>
                    {historyData.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        Nenhuma execução registrada
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {historyData.map((run) => (
                          <div
                            key={run.id}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(run.status)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {formatDate(run.scheduledAt)}
                                </p>
                                {run.completedAt && (
                                  <p className="text-xs text-gray-600">
                                    Duração: {Math.floor((new Date(run.completedAt).getTime() - new Date(run.startedAt || run.scheduledAt).getTime()) / 1000)}s
                                  </p>
                                )}
                              </div>
                            </div>
                            {run.fileUrl && (
                              <a
                                href={run.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Abrir arquivo
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => setShowHistory(null)}
                      className="mt-4 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Fechar histórico
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ReportScheduler;
