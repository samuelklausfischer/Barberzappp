/**
 * BarberZap Financeiro Page
 * 
 * Complete revenue tracking with statistics, charts, and transaction management
 */

import React, { useState, useEffect } from 'react';
import { DashboardContainer } from '../CoreComponents';
import {
  financeiroService,
  PAYMENT_METHODS,
  PAYMENT_METHOD_CONFIG,
  formatCurrency,
  formatDate,
  formatDateShort,
  getInitials,
  MOCK_BARBERS
} from '../Logic/agendaFinanceiro';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  Download,
  Printer,
  Filter,
  Search,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  PieChart,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Users,
  Scissors
} from 'lucide-react';

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================

const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
  <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-slate-600 transition-all">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3 mb-3">
        {Icon && <Icon className={`w-5 h-5 ${color}`} />}
        <span className="text-sm text-gray-400">{title}</span>
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-medium flex items-center gap-1 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
  </div>
);

// ============================================================================
// CHART COMPONENTS (Simplified - can be replaced with Chart.js)
// ============================================================================

const RevenueLineChart = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="w-full h-64">
      <svg viewBox="0 0 700 250" className="w-full h-full">
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="50"
            y1={50 + i * 40}
            x2="680"
            y2={50 + i * 40}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map((i) => {
          const value = Math.round(maxValue - (maxValue * i / 4));
          return (
            <text
              key={i}
              x="40"
              y={54 + i * 40}
              fill="#94a3b8"
              fontSize="10"
              textAnchor="end"
            >
              {formatCurrency(value)}
            </text>
          );
        })}

        {/* Revenue line */}
        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2"
          points={data.map((d, i) => {
            const x = 70 + (i * (600 / (data.length - 1)));
            const y = 200 - (d.revenue / maxValue) * 150;
            return `${x},${y}`;
          }).join(' ')}
        />

        {/* Area under line */}
        <polygon
          fill="url(#gradient)"
          opacity="0.2"
          points={`
            70,200
            ${data.map((d, i) => {
              const x = 70 + (i * (600 / (data.length - 1)));
              const y = 200 - (d.revenue / maxValue) * 150;
              return `${x},${y}`;
            }).join(' ')}
            ${70 + (600 / (data.length - 1)) * (data.length - 1)},200
          `}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const x = 70 + (i * (600 / (data.length - 1)));
          const y = 200 - (d.revenue / maxValue) * 150;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill="#f59e0b" />
              <text
                x={x}
                y={y - 10}
                fill="#f59e0b"
                fontSize="10"
                textAnchor="middle"
              >
                {d.revenue > 0 ? formatCurrency(d.revenue) : ''}
              </text>
              <text
                x={x}
                y={220}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
              >
                {d.label}
              </text>
            </g>
          );
        })}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const RevenueBarChart = ({ data }) => {
  const maxValue = Math.max(...Object.values(data).map(d => d.amount), 1);

  return (
    <div className="w-full h-96">
      <svg viewBox="0 0 400 350" className="w-full h-full">
        {Object.entries(data).map(([category, info], i) => {
          const barHeight = (info.amount / maxValue) * 250;
          const y = 280 - barHeight;
          const x = 40 + (i * 80);

          return (
            <g key={category}>
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width="50"
                height={barHeight}
                fill="#f59e0b"
                rx="4"
                opacity="0.8"
              />
              {/* Label */}
              <text
                x={x + 25}
                y={300}
                fill="#94a3b8"
                fontSize="10"
                textAnchor="middle"
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </text>
              {/* Value */}
              <text
                x={x + 25}
                y={y - 8}
                fill="#f59e0b"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {formatCurrency(info.amount)}
              </text>
              {/* Count */}
              <text
                x={x + 25}
                y={y + 20}
                fill="#64748b"
                fontSize="10"
                textAnchor="middle"
              >
                {info.count}
              </text>
            </g>
          );
        })}

        {/* X-axis */}
        <line
          x1="20"
          y1="280"
          x2="380"
          y2="280"
          stroke="#475569"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

// ============================================================================
// TRANSACTION TABLE ROW
// ============================================================================

const TransactionRow = ({ transaction, onClick }) => {
  const statusIcon = transaction.status === 'paid' 
    ? <CheckCircle className="w-4 h-4" />
    : transaction.status === 'pending'
      ? <Clock className="w-4 h-4" />
      : <XCircle className="w-4 h-4" />;

  const statusColor = transaction.status === 'paid'
    ? 'text-emerald-400'
    : transaction.status === 'pending'
      ? 'text-yellow-400'
      : 'text-red-400';

  return (
    <tr
      onClick={() => onClick(transaction)}
      className="border-b border-slate-700/50 hover:bg-slate-700/30 cursor-pointer transition-colors"
    >
      <td className="px-4 py-4">
        <div className="flex flex-col">
          <span className="text-white font-medium">{formatDate(transaction.date)}</span>
          <span className="text-sm text-gray-500">{transaction.time}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 font-bold text-xs">
              {getInitials(transaction.clientName)}
            </span>
          </div>
          <span className="text-white">{transaction.clientName}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 text-gray-300">
          <Scissors className="w-4 h-4 text-gray-500" />
          <span>{transaction.serviceName}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-400 font-bold text-xs">
              {getInitials(transaction.barberName)}
            </span>
          </div>
          <span className="text-white text-sm">{transaction.barberName}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-white font-semibold">{formatCurrency(transaction.amount)}</span>
      </td>
      <td className="px-4 py-4">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${PAYMENT_METHOD_CONFIG[transaction.paymentMethod]?.color || 'bg-gray-500/15 text-gray-400'}`}>
          <span>{PAYMENT_METHOD_CONFIG[transaction.paymentMethod]?.icon || '💰'}</span>
          <span>{PAYMENT_METHOD_CONFIG[transaction.paymentMethod]?.label || transaction.paymentMethod}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className={`inline-flex items-center gap-1.5 ${statusColor}`}>
          {statusIcon}
          <span className="text-sm capitalize">
            {transaction.status === 'paid' ? 'Pago' : transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
          </span>
        </div>
      </td>
    </tr>
  );
};

// ============================================================================
// TRANSACTION DETAIL MODAL
// ============================================================================

const TransactionDetailModal = ({ transaction, isOpen, onClose }) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Detalhes da Transação</h3>
            <p className="text-sm text-gray-400 mt-1">{formatDate(transaction.date)} às {transaction.time}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amount */}
        <div className="text-center py-6 bg-slate-900/50 rounded-xl mb-6">
          <p className="text-sm text-gray-500 mb-2">Valor Total</p>
          <p className="text-4xl font-bold text-amber-400">{formatCurrency(transaction.amount)}</p>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-gray-400">Cliente</span>
            <span className="text-white font-medium">{transaction.clientName}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-gray-400">Serviço</span>
            <span className="text-white font-medium">{transaction.serviceName}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-gray-400">Barbeiro</span>
            <span className="text-white font-medium">{transaction.barberName}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-gray-400">Pagamento</span>
            <span className={`font-medium ${PAYMENT_METHOD_CONFIG[transaction.paymentMethod]?.color?.split(' ')[1] || 'text-white'}`}>
              {PAYMENT_METHOD_CONFIG[transaction.paymentMethod]?.label || transaction.paymentMethod}
            </span>
          </div>
          <div className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg">
            <span className="text-gray-400">Status</span>
            <span className={`font-medium ${transaction.status === 'paid' ? 'text-emerald-400' : transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'}`}>
              {transaction.status === 'paid' ? 'Pago' : transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
            </span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-all"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// PAYMENT METHOD BREAKDOWN CARD
// ============================================================================

const PaymentMethodCard = ({ method, data }) => {
  const config = PAYMENT_METHOD_CONFIG[method];
  if (!config) return null;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{config.icon}</span>
        <span className="text-sm text-gray-400">{config.label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{formatCurrency(data.amount)}</p>
      <p className="text-sm text-gray-500">{data.count} transação{data.count !== 1 ? 'ões' : ''}</p>
    </div>
  );
};

// ============================================================================
// MAIN FINANCEIRO PAGE
// ============================================================================

export const FinanceiroPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    totalRevenue: 0,
    totalAppointments: 0,
    monthAppointments: 0,
    averageTicket: 0,
    paymentBreakdown: {},
    revenueByCategory: {},
    revenueByBarber: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [barberFilter, setBarberFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Chart data
  const [revenueChart7Days, setRevenueChart7Days] = useState([]);
  const [revenueChart30Days, setRevenueChart30Days] = useState([]);

  // Load data
  useEffect(() => {
    loadData();
  }, [dateRange, barberFilter, paymentMethodFilter, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load transactions
      const txData = financeiroService.getTransactions({
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        barberId: barberFilter !== 'all' ? barberFilter : undefined,
        paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined
      });
      setTransactions(txData);

      // Load stats
      const statsData = financeiroService.getFinancialStats();
      setStats(statsData);

      // Load chart data
      setRevenueChart7Days(financeiroService.getRevenueChart7Days());
      setRevenueChart30Days(financeiroService.getRevenueChart30Days());
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTransactionClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleExportCSV = () => {
    try {
      const csv = financeiroService.exportToCSV(transactions);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeiro_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Erro ao exportar CSV');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const clearDateRange = () => {
    setDateRange({ start: '', end: '' });
  };

  return (
    <DashboardContainer>
      <div className="p-6 md:p-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-amber-400" />
              Financeiro
            </h1>
            <p className="text-gray-400 mt-1">Acompanhe o faturamento da barbearia</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg font-medium transition-all"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white rounded-lg font-medium transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Faturamento Mês"
            value={formatCurrency(stats.monthRevenue)}
            icon={DollarSign}
            color="text-emerald-400"
            subtitle={`${stats.monthAppointments} agendamentos`}
          />
          <StatCard
            title="Total Agendamentos"
            value={stats.totalAppointments}
            icon={Calendar}
            color="text-blue-400"
            subtitle="No período selecionado"
          />
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(stats.averageTicket)}
            icon={TrendingUp}
            color="text-amber-400"
            subtitle="Por atendimento"
          />
          <StatCard
            title="Hoje"
            value={formatCurrency(stats.todayRevenue)}
            icon={CreditCard}
            color="text-purple-400"
            subtitle="Faturamento do dia"
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            Faturamento - Últimos 7 dias
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : (
            <RevenueLineChart data={revenueChart7Days} />
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <PaymentMethodCard method="cash" data={stats.paymentBreakdown.cash} />
          <PaymentMethodCard method="credit" data={stats.paymentBreakdown.credit} />
          <PaymentMethodCard method="debit" data={stats.paymentBreakdown.debit} />
          <PaymentMethodCard method="pix" data={stats.paymentBreakdown.pix} />
          <PaymentMethodCard method="pending" data={stats.paymentBreakdown.pending} />
        </div>

        {/* Revenue by Service (Bar Chart) */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Faturamento por Categoria de Serviço
          </h3>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : Object.keys(stats.revenueByCategory).length > 0 ? (
            <RevenueBarChart data={stats.revenueByCategory} />
          ) : (
            <div className="flex items-center justify-center h-96 text-gray-500">
              Sem dados para exibir
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome do cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              {dateRange.start && (
                <button
                  onClick={clearDateRange}
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Barber Filter */}
            <select
              value={barberFilter}
              onChange={(e) => setBarberFilter(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[140px]"
            >
              <option value="all">Todos Barbeiros</option>
              {MOCK_BARBERS.map(barber => (
                <option key={barber.id} value={barber.id}>{barber.name}</option>
              ))}
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[140px]"
            >
              <option value="all">Todos Pagamentos</option>
              {Object.entries(PAYMENT_METHOD_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>{config.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 min-w-[120px]"
            >
              <option value="all">Todos Status</option>
              <option value="paid">Pago</option>
              <option value="pending">Pendente</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-900/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Data / Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Barbeiro
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Pagamento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="7" className="px-4 py-8">
                        <div className="flex items-center justify-center">
                          <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12">
                      <div className="flex flex-col items-center justify-center text-center">
                        <DollarSign className="w-16 h-16 text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-white mb-2">Nenhuma transação encontrada</h3>
                        <p className="text-gray-400">
                          {searchQuery || dateRange.start || barberFilter !== 'all' || paymentMethodFilter !== 'all' || statusFilter !== 'all'
                            ? 'Tente ajustar os filtros'
                            : 'As transações aparecerão aqui após os agendamentos serem concluídos'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map(transaction => (
                    <TransactionRow
                      key={transaction.id}
                      transaction={transaction}
                      onClick={handleTransactionClick}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination summary */}
          {!loading && transactions.length > 0 && (
            <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Mostrando {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''}
              </span>
              <span className="text-sm text-gray-400">
                Total: {formatCurrency(transactions.reduce((sum, t) => sum + (t.paymentMethod !== 'pending' ? t.amount : 0), 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      )}
    </DashboardContainer>
  );
};

export default FinanceiroPage;
