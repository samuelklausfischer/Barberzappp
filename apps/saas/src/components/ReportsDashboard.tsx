/**
 * Reports Dashboard Component
 *
 * Dashboard completo para geração e visualização de reports de negócio.
 * Inclui templates, filtros, preview, export e scheduling.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  Mail, 
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  FileText,
  X,
  Check,
  AlertCircle
} from 'lucide-react';

// Types
interface ReportConfig {
  id: string;
  name: string;
  type: 'revenue' | 'appointments' | 'retention' | 'service-popularity' | 
         'employee-performance' | 'no-show' | 'peak-hours';
  description: string;
  icon: React.ReactNode;
}

interface DateRange {
  from: Date;
  to: Date;
}

interface ReportFilters {
  employeeId?: string;
  serviceId?: string;
  status?: string;
  groupBy?: 'day' | 'week' | 'month';
  sortBy?: string;
}

interface ReportData {
  data: any[];
  metrics: {
    totalRevenue: number;
    totalAppointments: number;
    completionRate: number;
    noShowRate: number;
  };
  comparisons?: {
    revenueGrowthRate: number;
    appointmentsGrowthRate: number;
  };
}

interface ScheduledReport {
  id: string;
  name: string;
  scheduleType: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  nextRunAt: string;
  isActive: boolean;
  lastRunAt?: string;
}

// Report Templates
const REPORT_TEMPLATES: ReportConfig[] = [
  {
    id: 'revenue',
    name: 'Receita',
    type: 'revenue',
    description: 'Análise de faturamento com comparação de períodos',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    id: 'appointments',
    name: 'Agendamentos',
    type: 'appointments',
    description: 'Detalhamento de agendamentos por período',
    icon: <FileText className="w-5 h-5" />
  },
  {
    id: 'retention',
    name: 'Retenção de Clientes',
    type: 'retention',
    description: 'Métricas de fidelidade e retenção',
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    id: 'service-popularity',
    name: 'Popularidade de Serviços',
    type: 'service-popularity',
    description: 'Serviços mais populares e rentáveis',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    id: 'employee-performance',
    name: 'Performance de Funcionários',
    type: 'employee-performance',
    description: 'Desempenho individual por barbeiro',
    icon: <BarChart3 className="w-5 h-5" />
  },
  {
    id: 'no-show',
    name: 'No-Show Analysis',
    type: 'no-show',
    description: 'Análise de ausências e cancelamentos',
    icon: <AlertCircle className="w-5 h-5" />
  },
  {
    id: 'peak-hours',
    name: 'Horários de Pico',
    type: 'peak-hours',
    description: 'Identificação de horários de maior demanda',
    icon: <Clock className="w-5 h-5" />
  }
];

// Export Formats
const EXPORT_FORMATS = [
  { id: 'json', label: 'JSON', extension: 'json' },
  { id: 'csv', label: 'CSV', extension: 'csv' },
  { id: 'excel', label: 'Excel', extension: 'xlsx' },
  { id: 'pdf', label: 'PDF', extension: 'pdf' }
];

interface ReportsDashboardProps {
  shopId: string;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ shopId }) => {
  // State
  const [selectedTemplate, setSelectedTemplate] = useState<ReportConfig | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [filters, setFilters] = useState<ReportFilters>({});
  const [comparePrevious, setComparePrevious] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [showScheduler, setShowScheduler] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'scheduled' | 'history'>('generate');

  // API Integration
  const generateReport = async () => {
    if (!selectedTemplate) {
      alert('Selecione um template de report');
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(
        `/api/reports/${selectedTemplate.type}?shop_id=${shopId}&from_date=${dateRange.from.toISOString().split('T')[0]}&to_date=${dateRange.to.toISOString().split('T')[0]}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Erro ao gerar report. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: string) => {
    if (!reportData) {
      alert('Gere um report antes de exportar');
      return;
    }

    try {
      const response = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: reportData.data,
          format,
          filename: `report_${selectedTemplate?.type}_${Date.now()}`,
          includeHeaders: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const result = await response.json();
      
      // Download file
      const link = document.createElement('a');
      link.href = result.file_url;
      link.download = `${result.filename}.${format}`;
      link.click();
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Erro ao exportar report. Tente novamente.');
    }
  };

  const emailReport = async () => {
    if (!reportData) {
      alert('Gere um report antes de enviar por email');
      return;
    }

    const email = prompt('Digite o email destinatário:'); // TODO: Use proper modal
    if (!email) return;

    try {
      // TODO: Replace with actual API call
      await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          reportType: selectedTemplate?.type,
          recipient: email,
          data: reportData
        })
      });

      alert('Report enviado com sucesso!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Erro ao enviar email. Tente novamente.');
    }
  };

  const loadScheduledReports = async () => {
    try {
      const response = await fetch(`/api/reports/scheduled?shop_id=${shopId}`);
      if (response.ok) {
        const data = await response.json();
        setScheduledReports(data);
      }
    } catch (error) {
      console.error('Error loading scheduled reports:', error);
    }
  };

  // Effects
  useEffect(() => {
    loadScheduledReports();
  }, [shopId]);

  // Render helpers
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (rate: number | undefined) => {
    if (!rate) return null;
    if (rate > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (rate < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return null;
  };

  const getGrowthColor = (rate: number | undefined): string => {
    if (!rate) return 'text-gray-500';
    if (rate > 0) return 'text-green-500';
    if (rate < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Reports
          </h1>
          <p className="text-gray-600">
            Gerencie relatórios de negócio da sua barbearia
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Gerar Report
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'scheduled'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Reports Agendados
              {scheduledReports.some(r => r.isActive) && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {scheduledReports.filter(r => r.isActive).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Histórico
            </button>
          </nav>
        </div>

        {/* Generate Report Tab */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            {/* Report Template Selection */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Selecione o Tipo de Report
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        selectedTemplate?.id === template.id
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {template.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Selection */}
            {selectedTemplate && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Período do Report
                  </h2>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Filter className="w-4 h-4" />
                    <span>{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Inicial
                    </label>
                    <input
                      type="date"
                      value={dateRange.from.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        from: new Date(e.target.value)
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Data Final
                    </label>
                    <input
                      type="date"
                      value={dateRange.to.toISOString().split('T')[0]}
                      onChange={(e) => setDateRange({
                        ...dateRange,
                        to: new Date(e.target.value)
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={generateReport}
                      disabled={loading}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Gerando...</span>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          <span>Gerar Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Additional Filters */}
                {showFilters && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Agrupar por
                        </label>
                        <select
                          value={filters.groupBy || 'day'}
                          onChange={(e) => setFilters({
                            ...filters,
                            groupBy: e.target.value as 'day' | 'week' | 'month'
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        >
                          <option value="day">Dia</option>
                          <option value="week">Semana</option>
                          <option value="month">Mês</option>
                        </select>
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={comparePrevious}
                            onChange={(e) => setComparePrevious(e.target.checked)}
                            className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <span className="text-sm text-gray-700">
                            Comparar com período anterior
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Report Results */}
            {reportData && (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Summary Metrics */}
                <div className="p-6 border-b border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Receita Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(reportData.metrics.totalRevenue)}
                      </p>
                      {reportData.comparisons && (
                        <div className="flex items-center space-x-1 mt-1">
                          {getGrowthIcon(reportData.comparisons.revenueGrowthRate)}
                          <span className={`text-sm ${getGrowthColor(reportData.comparisons.revenueGrowthRate)}`}>
                            {Math.abs(reportData.comparisons.revenueGrowthRate).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total de Agendamentos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.metrics.totalAppointments}
                      </p>
                      {reportData.comparisons && (
                        <div className="flex items-center space-x-1 mt-1">
                          {getGrowthIcon(reportData.comparisons.appointmentsGrowthRate)}
                          <span className={`text-sm ${getGrowthColor(reportData.comparisons.appointmentsGrowthRate)}`}>
                            {Math.abs(reportData.comparisons.appointmentsGrowthRate).toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Taxa de Conclusão</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(reportData.metrics.completionRate)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Agendamentos completados
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Taxa de No-Show</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(reportData.metrics.noShowRate)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Ausências registradas
                      </p>
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Exportar:</span>
                      {EXPORT_FORMATS.map((format) => (
                        <button
                          key={format.id}
                          onClick={() => exportReport(format.id)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                        >
                          {format.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={emailReport}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Enviar por Email</span>
                      </button>
                      <button
                        onClick={() => setShowScheduler(true)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Agendar Report</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Data Table/Charts */}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Detalhes do Report
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(reportData.data[0] || {}).slice(0, 6).map((key) => (
                            <th
                              key={key}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.data.slice(0, 10).map((row, index) => (
                          <tr key={index}>
                            {Object.values(row).slice(0, 6).map((value: any, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {typeof value === 'number' && value > 1000
                                  ? formatCurrency(value)
                                  : value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reportData.data.length > 10 && (
                      <div className="text-center py-4 text-sm text-gray-500">
                        Mostrando primeiros 10 de {reportData.data.length} registros
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scheduled Reports Tab */}
        {activeTab === 'scheduled' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Reports Agendados
              </h2>
              <button
                onClick={() => setShowScheduler(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-colors"
              >
                + Novo Schedule
              </button>
            </div>

            {scheduledReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg">Nenhum report agendado</p>
                <p className="text-sm mt-2">
                  Crie um schedule para receber reports automaticamente por email
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-lg ${
                        report.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{report.name}</h3>
                        <p className="text-sm text-gray-600">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {report.scheduleType}
                          {report.nextRunAt && (
                            <>
                              · Próxima execução: {new Date(report.nextRunAt).toLocaleString('pt-BR')}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        report.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {report.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab (Placeholder) */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Histórico de Reports
            </h3>
            <p className="text-gray-500">
              Funcionalidade em desenvolvimento...
            </p>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Agendar Report
                </h2>
                <button
                  onClick={() => setShowScheduler(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                O agendamento de reports está em desenvolvimento. Em breve você poderá configurar envios automáticos.
              </p>
              <p className="text-sm text-gray-500">
                Recursos planejados:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-500 space-y-1 mt-2">
                <li>Schedules diários, semanais, mensais e trimestrais</li>
                <li>Envio automático por email</li>
                <li>Múltiplos recipientes</li>
                <li>Templates customizáveis</li>
                <li>Histórico de execuções</li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowScheduler(false)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsDashboard;
