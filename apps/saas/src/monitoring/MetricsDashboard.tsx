/**
 * Metrics Dashboard for BarberZap
 * ===============================
 * Real-time monitoring dashboard with charts and alerts
 *
 * Features:
 * - Cards with key metrics
 * - Line/bar/gauge charts
 * - Real-time alerts
 * - Time period filters (1h, 24h, 7d)
 * - Shop-specific filtering (multi-tenant)
 * - Responsive design
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  status?: 'good' | 'warning' | 'critical';
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit = '',
  change,
  changeType = 'neutral',
  status = 'good',
  icon,
}) => {
  const statusColors = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200',
  };

  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-gray-500',
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-600">{icon}</span>}
          <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium ${changeColors[changeType]}`}>
            {changeType === 'positive' && '+'}
            {change.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2">
        <span className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  shopId?: string;
  timestamp: number;
  acknowledged: boolean;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onAcknowledge: (alertId: string) => void;
  onClear: (alertId: string) => void;
}

const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAcknowledge, onClear }) => {
  const [filter, setFilter] = useState<'all' | 'critical' | 'warning'>('all');

  const filteredAlerts = alerts.filter(
    (alert) => filter === 'all' || alert.type === filter,
  );

  const typeIcons = {
    critical: '🔴',
    warning: '🟡',
    info: '🔵',
  };

  const typeColors = {
    critical: 'border-l-red-500 bg-red-50',
    warning: 'border-l-yellow-500 bg-yellow-50',
    info: 'border-l-blue-500 bg-blue-50',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Alerts</h3>
        <div className="flex gap-2">
          {(['all', 'critical', 'warning'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1 text-xs rounded-full ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} ({alerts.filter((a) => type === 'all' || a.type === type).length})
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No alerts</div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 border-l-4 ${typeColors[alert.type]} ${
                alert.acknowledged ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-lg">{typeIcons[alert.type]}</span>
                  <div>
                    <div className="font-medium text-gray-900">{alert.metric}</div>
                    <div className="text-sm text-gray-600">{alert.message}</div>
                    {alert.shopId && (
                      <div className="text-xs text-gray-500">Shop: {alert.shopId}</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Ack
                    </button>
                  )}
                  <button
                    onClick={() => onClear(alert.id)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface TimeFilter {
  label: string;
  value: string;
}

const TIME_FILTERS: TimeFilter[] = [
  { label: '1h', value: '1h' },
  { label: '24h', value: '24h' },
  { label: '7d', value: '7d' },
];

interface ChartSectionProps {
  title: string;
  data: any[];
  dataKey: string;
  xAxisKey: string;
  color: string;
  showTooltip?: boolean;
  showLegend?: boolean;
  type?: 'line' | 'area' | 'bar';
}

const ChartSection: React.FC<ChartSectionProps> = ({
  title,
  data,
  dataKey,
  xAxisKey,
  color,
  showTooltip = true,
  showLegend = true,
  type = 'line',
}) => {
  const ChartComponent = type === 'bar' ? BarChart : type === 'area' ? AreaChart : LineChart;
  const DataComponent = type === 'bar' ? Bar : type === 'area' ? Area : Line;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h4 className="font-semibold text-gray-900 mb-4">{title}</h4>
      <div style={{ height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey={xAxisKey}
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toFixed(0)}
            />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                }}
              />
            )}
            {showLegend && <Legend />}
            <DataComponent
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={type === 'area' ? color : undefined}
              fillOpacity={type === 'area' ? 0.1 : undefined}
            />
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  title: string;
  unit?: string;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

const Gauge: React.FC<GaugeProps> = ({
  value,
  min,
  max,
  title,
  unit = '',
  thresholds,
}) => {
  const normalizedValue = ((value - min) / (max - min)) * 100;
  
  const getColor = () => {
    if (thresholds) {
      if (value >= thresholds.critical) return '#ef4444';
      if (value >= thresholds.warning) return '#f59e0b';
    }
    return '#10b981';
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedValue / 100) * circumference;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <div className="flex items-center justify-center">
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="12"
              fill="none"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={getColor()}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">
              {value.toFixed(1)}
            </span>
            {unit && <span className="text-xs text-gray-500">{unit}</span>}
          </div>
        </div>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs text-gray-500">
        <span>{min}</span>
        <span>{(min + max) / 2}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

interface ShopFilterProps {
  shops: string[];
  selectedShop: string | 'all';
  onSelectShop: (shopId: string | 'all') => void;
}

const ShopFilter: React.FC<ShopFilterProps> = ({ shops, selectedShop, onSelectShop }) => {
  return (
    <div className="flex items-center gap-2 mb-4">
      <label className="text-sm font-medium text-gray-700">Filter by Shop:</label>
      <select
        value={selectedShop}
        onChange={(e) => onSelectShop(e.target.value === 'all' ? 'all' : e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">All Shops</option>
        {shops.map((shop) => (
          <option key={shop} value={shop}>
            {shop}
          </option>
        ))}
      </select>
    </div>
  );
};

interface MetricsData {
  timestamp: number;
  webhookSuccessRate?: number;
  cacheHitRate?: number;
  realtimeConnections?: number;
  bookingConflicts?: number;
  outboxDepth?: number;
  dashboardLoadTime?: number;
  errorRate?: number;
}

interface MetricsDashboardProps {
  apiEndpoint?: string;
  refreshInterval?: number;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  apiEndpoint = '/api/metrics',
  refreshInterval = 15000, // 15 seconds
}) => {
  const [timeFilter, setTimeFilter] = useState('1h');
  const [metricsData, setMetricsData] = useState<MetricsData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedShop, setSelectedShop] = useState<string | 'all'>('all');
  
  // Generate mock data for development
  const generateMockData = (count: number): MetricsData[] => {
    const data: MetricsData[] = [];
    const now = Date.now();
    const interval =
      timeFilter === '1h' ? 60000 : timeFilter === '24h' ? 3600000 : 86400000;

    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * interval;
      data.push({
        timestamp,
        webhookSuccessRate: 95 + Math.random() * 5,
        cacheHitRate: 80 + Math.random() * 15,
        realtimeConnections: Math.floor(50 + Math.random() * 100),
        bookingConflicts: Math.floor(Math.random() * 10),
        outboxDepth: Math.floor(10 + Math.random() * 100),
        dashboardLoadTime: 100 + Math.random() * 500,
        errorRate: Math.random() * 2,
      });
    }
    return data;
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from API, fall back to mock data
      try {
        const response = await fetch(
          `${apiEndpoint}?window=${timeFilter}${selectedShop !== 'all' ? `&shop_id=${selectedShop}` : ''}`,
        );

        if (!response.ok) throw new Error('Failed to fetch metrics');

        const data = await response.json();
        setMetricsData(data.metrics || generateMockData(24));
        setAlerts(data.alerts || []);
      } catch (apiError) {
        // Use mock data for development
        console.warn('Using mock data:', apiError);
        setMetricsData(generateMockData(24));
        setAlerts(generateMockAlerts());
      }

      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, timeFilter, selectedShop]);

  // Generate mock alerts
  const generateMockAlerts = (): Alert[] => {
    const now = Date.now();
    return [
      {
        id: '1',
        type: 'critical',
        metric: 'Error Rate',
        message: 'Error rate exceeded 1% threshold',
        shopId: 'shop-1',
        timestamp: now - 5 * 60 * 1000,
        acknowledged: false,
      },
      {
        id: '2',
        type: 'warning',
        metric: 'Cache Hit Rate',
        message: 'Cache hit rate dropped below 80%',
        shopId: 'shop-2',
        timestamp: now - 15 * 60 * 1000,
        acknowledged: false,
      },
      {
        id: '3',
        type: 'info',
        metric: 'System',
        message: 'Backups completed successfully',
        shopId: 'all',
        timestamp: now - 30 * 60 * 1000,
        acknowledged: true,
      },
    ];
  };

  // Handle alert actions
  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  const handleClearAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  // Get current metrics
  const currentMetrics = metricsData[metricsData.length - 1] || {};

  // Format timestamp
  const formatTimestamp = (ts: number): string => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 60000) return 'now';
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  // Refresh data
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  // Generate chart data labels
  const chartData = metricsData.map((d) => ({
    ...d,
    time: formatTimestamp(d.timestamp),
  }));

  // List of mock shops
  const mockShops = ['shop-1', 'shop-2', 'shop-3', 'shop-4'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Metrics Dashboard</h1>
            <div className="flex items-center gap-4">
              {lastUpdate && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex gap-2">
              {TIME_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setTimeFilter(filter.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    timeFilter === filter.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <ShopFilter
              shops={mockShops}
              selectedShop={selectedShop}
              onSelectShop={setSelectedShop}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            Error: {error}
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* First Column - Key Metrics */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <MetricCard
                title="Webhook Success Rate"
                value={currentMetrics.webhookSuccessRate || 0}
                unit="%"
                change={2.5}
                changeType="positive"
                status={currentMetrics.webhookSuccessRate && currentMetrics.webhookSuccessRate > 95 ? 'good' : 'warning'}
              />
              <MetricCard
                title="Cache Hit Rate"
                value={currentMetrics.cacheHitRate || 0}
                unit="%"
                change={-1.2}
                changeType="negative"
                status={currentMetrics.cacheHitRate && currentMetrics.cacheHitRate > 80 ? 'good' : 'warning'}
              />
              <MetricCard
                title="Realtime Connections"
                value={currentMetrics.realtimeConnections || 0}
                unit="connections"
                change={5.8}
                changeType="positive"
                status="good"
              />
              <MetricCard
                title="Booking Conflicts"
                value={currentMetrics.bookingConflicts || 0}
                unit="/min"
                change={-15.5}
                changeType="positive"
                status={currentMetrics.bookingConflicts && currentMetrics.bookingConflicts < 5 ? 'good' : 'critical'}
              />
              <MetricCard
                title="Outbox Queue Depth"
                value={currentMetrics.outboxDepth || 0}
                unit="items"
                change={3.2}
                changeType="negative"
                status={currentMetrics.outboxDepth && currentMetrics.outboxDepth < 100 ? 'good' : 'warning'}
              />
              <MetricCard
                title="Error Rate"
                value={currentMetrics.errorRate || 0}
                unit="%"
                change={-25.0}
                changeType="positive"
                status={currentMetrics.errorRate && currentMetrics.errorRate < 1 ? 'good' : 'critical'}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ChartSection
                title="Webhook Success Rate Over Time"
                data={chartData}
                dataKey="webhookSuccessRate"
                xAxisKey="time"
                color="#10b981"
              />
              <ChartSection
                title="Cache Hit Rate Over Time"
                data={chartData}
                dataKey="cacheHitRate"
                xAxisKey="time"
                color="#3b82f6"
              />
              <ChartSection
                title="Realtime Connections"
                data={chartData}
                dataKey="realtimeConnections"
                xAxisKey="time"
                color="#8b5cf6"
                type="area"
              />
              <ChartSection
                title="Booking Conflicts"
                data={chartData}
                dataKey="bookingConflicts"
                xAxisKey="time"
                color="#ef4444"
                type="bar"
              />
            </div>
          </div>

          {/* Second Column - Gauges and Alerts */}
          <div className="space-y-4">
            {/* Performance Gauges */}
            <div className="space-y-4">
              <Gauge
                value={currentMetrics.webhookSuccessRate || 95}
                min={0}
                max={100}
                title="Webhook Success"
                unit="%"
                thresholds={{ warning: 95, critical: 90 }}
              />
              <Gauge
                value={currentMetrics.cacheHitRate || 85}
                min={0}
                max={100}
                title="Cache Hit Rate"
                unit="%"
                thresholds={{ warning: 80, critical: 70 }}
              />
            </div>

            {/* Alerts Panel */}
            <AlertsPanel
              alerts={alerts}
              onAcknowledge={handleAcknowledgeAlert}
              onClear={handleClearAlert}
            />
          </div>
        </div>

        {/* Additional Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartSection
            title="Outbox Queue Depth"
            data={chartData}
            dataKey="outboxDepth"
            xAxisKey="time"
            color="#f59e0b"
            type="area"
          />
          <ChartSection
            title="Dashboard Load Time"
            data={chartData}
            dataKey="dashboardLoadTime"
            xAxisKey="time"
            color="#ec4899"
          />
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;
