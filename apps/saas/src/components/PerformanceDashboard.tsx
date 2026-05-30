/**
 * BarberZap - Performance Dashboard Component
 * 
 * Dashboard completo para visualização de métricas de performance.
 * 
 * Features:
 * - Latency percentiles (P50, P95, P99)
 * - Top slowest endpoints
 * - Top slowest SQL queries
 * - Cache hit rate
 * - Component render times
 * - Memory usage graphs
 * - CPU usage graphs
 * - Heatmap visualizations
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useAllProfilerData, useProfilerData } from '@/profiler/ReactProfiler';
import { useMeasureRenderTime } from '@/profiler/usePerformance';

interface PerformanceMetrics {
  requestMetrics: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    totalRequests: number;
    slowRequests: number;
  };
  endpoints: Array<{
    endpoint: string;
    requestCount: number;
    avgDuration: number;
    p95Duration: number;
    maxDuration: number;
  }>;
  queries: Array<{
    query: string;
    avgDuration: number;
    maxDuration: number;
    count: number;
    isSlow: boolean;
  }>;
  cacheMetrics: {
    hitRate: number;
    hits: number;
    misses: number;
    patterns: Array<{
      pattern: string;
      hitRate: number;
      total: number;
    }>;
  };
  componentMetrics: Array<{
    componentId: string;
    renderCount: number;
    avgRenderTime: number;
    maxRenderTime: number;
    reRenderRate: number;
  }>;
  systemMetrics: {
    memoryUsageMb: number;
    cpuUsagePercent: number;
    uptime: number;
  };
}

interface HeatmapData {
  timestamp: string;
  endpoint: string;
  duration: number;
  status: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const allProfiles = useAllProfilerData();
  const { measureRender } = useMeasureRenderTime('PerformanceDashboard');
  
  // Fetch metrics from backend
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/profiler/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
      
      // Fetch heatmap data
      const heatmapResponse = await fetch(`/api/profiler/heatmap?range=${timeRange}`);
      if (heatmapResponse.ok) {
        const data = await heatmapResponse.json();
        setHeatmapData(data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);
  
  useEffect(() => {
    fetchMetrics();
    
    // Auto-refresh
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, autoRefresh]);
  
  // Refresh button handler
  const handleRefresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);
  
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4">Loading performance metrics...</span>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Real-time performance monitoring and analysis
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
          
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-lg border ${
              autoRefresh
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-gray-100 text-gray-800 border-gray-300'
            }`}
          >
            Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
          </button>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>
      
      {/* Summary Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* P50 Latency */}
          <MetricCard
            title="P50 Latency"
            value={`${metrics.requestMetrics.p50.toFixed(0)}ms`}
            trend={getTrendLabel(metrics.requestMetrics.p50, 100)}
            color={metrics.requestMetrics.p50 > 200 ? 'red' : 'green'}
          />
          
          {/* P95 Latency */}
          <MetricCard
            title="P95 Latency"
            value={`${metrics.requestMetrics.p95.toFixed(0)}ms`}
            trend={getTrendLabel(metrics.requestMetrics.p95, 500)}
            color={metrics.requestMetrics.p95 > 500 ? 'red' : 'orange'}
          />
          
          {/* P99 Latency */}
          <MetricCard
            title="P99 Latency"
            value={`${metrics.requestMetrics.p99.toFixed(0)}ms`}
            trend={getTrendLabel(metrics.requestMetrics.p99, 1000)}
            color={metrics.requestMetrics.p99 > 1000 ? 'red' : 'orange'}
          />
          
          {/* Cache Hit Rate */}
          <MetricCard
            title="Cache Hit Rate"
            value={`${(metrics.cacheMetrics.hitRate * 100).toFixed(1)}%`}
            subtitle={`${metrics.cacheMetrics.hits.toFixed(0)} hits / ${metrics.cacheMetrics.misses.toFixed(0)} misses`}
            color={metrics.cacheMetrics.hitRate > 0.7 ? 'green' : 'red'}
          />
        </div>
      )}
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Slowest Endpoints */}
        {metrics && (
          <MetricTable
            title="Slowest Endpoints"
            data={metrics.endpoints.slice(0, 10)}
            columns={[
              { key: 'endpoint', label: 'Endpoint', width: '40%' },
              { key: 'requestCount', label: 'Requests', width: '15%' },
              { key: 'avgDuration', label: 'Avg (ms)', width: '15%', format: (v) => `${v.toFixed(1)}` },
              { key: 'p95Duration', label: 'P95 (ms)', width: '15%', format: (v) => `${v.toFixed(1)}` },
              { key: 'maxDuration', label: 'Max (ms)', width: '15%', format: (v) => `${v.toFixed(1)}` }
            ]}
            rowClassName={(row) => row.avgDuration > 500 ? 'bg-red-50' : ''}
          />
        )}
        
        {/* Slowest Queries */}
        {metrics && (
          <MetricTable
            title="Slowest SQL Queries"
            data={metrics.queries.slice(0, 10)}
            columns={[
              { key: 'query', label: 'Query', width: '50%' },
              { key: 'avgDuration', label: 'Avg (ms)', width: '15%', format: (v) => `${v.toFixed(1)}` },
              { key: 'maxDuration', label: 'Max (ms)', width: '15%', format: (v) => `${v.toFixed(1)}` },
              { key: 'count', label: 'Count', width: '10%' },
              { key: 'isSlow', label: 'Slow?', width: '10%', format: (v) => (v ? '⚠️' : '') }
            ]}
            rowClassName={(row) => row.isSlow ? 'bg-red-50' : ''}
          />
        )}
      </div>
      
      {/* Component Render Times */}
      {allProfiles.length > 0 && (
        <MetricTable
          title="Component Render Times"
          data={allProfiles.map((profile) => ({
            componentId: profile.componentId,
            renderCount: profile.renders.length,
            avgRenderTime: profile.avgRenderTime,
            maxRenderTime: profile.maxRenderTime,
            reRenderRate: profile.updateCount / (profile.mountCount + profile.updateCount) || 0
          })).sort((a, b) => b.avgRenderTime - a.avgRenderTime).slice(0, 10)}
          columns={[
            { key: 'componentId', label: 'Component', width: '40%' },
            { key: 'renderCount', label: 'Renders', width: '15%' },
            { key: 'avgRenderTime', label: 'Avg (ms)', width: '15%', format: (v) => `${v.toFixed(2)}` },
            { key: 'maxRenderTime', label: 'Max (ms)', width: '15%', format: (v) => `${v.toFixed(2)}` },
            { key: 'reRenderRate', label: 'Re-Render Rate', width: '15%', format: (v) => `${(v * 100).toFixed(0)}%` }
          ]}
          rowClassName={(row) => row.avgRenderTime > 16 ? 'bg-yellow-50' : ''}
        />
      )}
      
      {/* Heatmap */}
      {heatmapData.length > 0 && (
        <HeatmapSection
          data={heatmapData}
          title="Request Latency Heatmap"
          onEndpointClick={setSelectedEndpoint}
          selectedEndpoint={selectedEndpoint}
        />
      )}
      
      {/* Cache Pattern Analysis */}
      {metrics && (
        <MetricTable
          title="Cache Pattern Analysis"
          data={metrics.cacheMetrics.patterns.slice(0, 10)}
          columns={[
            { key: 'pattern', label: 'Pattern', width: '60%' },
            { key: 'hitRate', label: 'Hit Rate', width: '20%', format: (v) => `${(v * 100).toFixed(1)}%` },
            { key: 'total', label: 'Total', width: '20%' }
          ]}
          rowClassName={(row) => row.hitRate < 0.5 ? 'bg-red-50' : row.hitRate < 0.7 ? 'bg-yellow-50' : ''}
        />
      )}
      
      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SystemMetricCard
            title="Memory Usage"
            value={`${metrics.systemMetrics.memoryUsageMb.toFixed(0)} MB`}
            unit="MB"
            threshold={1024} // 1GB
          />
          
          <SystemMetricCard
            title="CPU Usage"
            value={`${metrics.systemMetrics.cpuUsagePercent.toFixed(1)}%`}
            unit="%"
            threshold={80}
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// Sub-components
// ============================================

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  color?: 'green' | 'yellow' | 'red' | 'orange';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  color = 'blue'
}) => {
  const colorClasses = {
    green: 'bg-green-100 border-green-300 text-green-800',
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    red: 'bg-red-100 border-red-300 text-red-800',
    orange: 'bg-orange-100 border-orange-300 text-orange-800',
    blue: 'bg-blue-100 border-blue-300 text-blue-800'
  };
  
  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-sm font-medium opacity-75">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {subtitle && <div className="text-xs mt-1 opacity-75">{subtitle}</div>}
      {trend && <div className="text-xs mt-2 font-medium">{trend}</div>}
    </div>
  );
};

interface MetricTableProps<T> {
  title: string;
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    width: string;
    format?: (v: any) => string;
  }>;
  rowClassName?: (row: T) => string | undefined;
}

function MetricTable<T>({ title, data, columns, rowClassName }: MetricTableProps<T>) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  style={{ width: col.width }}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, index) => (
              <tr key={index} className={rowClassName?.(row)}>
                {columns.map((col) => (
                  <td
                    key={col.key as string}
                    className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    {col.format ? col.format(row[col.key]) : String(row[col.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface HeatmapSectionProps {
  data: HeatmapData[];
  title: string;
  onEndpointClick: (endpoint: string | null) => void;
  selectedEndpoint: string | null;
}

const HeatmapSection: React.FC<HeatmapSectionProps> = ({
  data,
  title,
  onEndpointClick,
  selectedEndpoint
}) => {
  // Group data by endpoint
  const endpoints = Array.from(new Set(data.map((d) => d.endpoint)));
  const timestamps = Array.from(new Set(data.map((d) => d.timestamp))).sort();
  
  // Get color based on duration and status
  const getColor = (duration: number, status: number): string => {
    if (status >= 500) return '#ef4444'; // Error - red
    if (status >= 400) return '#f59e0b'; // 4xx - orange
    if (duration > 500) return '#dc2626'; // Slow - dark red
    if (duration > 200) return '#f97316'; // Medium slow - orange
    if (duration > 100) return '#eab308'; // Normal-ish - yellow
    return '#22c55e'; // Fast - green
  };
  
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Endpoint Filter */}
      <div className="mb-4">
        <select
          value={selectedEndpoint || 'all'}
          onChange={(e) => onEndpointClick(e.target.value === 'all' ? null : e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Endpoints</option>
          {endpoints.map((ep) => (
            <option key={ep} value={ep}>
              {ep}
            </option>
          ))}
        </select>
      </div>
      
      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header - Timestamps */}
          <div className="flex">
            <div className="w-40 flex-shrink-0"></div>
            <div className="flex">
              {timestamps.slice(0, 20).map((ts) => (
                <div
                  key={ts}
                  className="w-8 h-8 flex-shrink-0 text-xs text-gray-500 flex items-center justify-center text-center leading-tight"
                >
                  {new Date(ts).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Rows - Endpoints */}
          {endpoints.slice(0, 10).map((endpoint) => {
            const endpointData = data.filter((d) => d.endpoint === endpoint);
            
            return (
              <div key={endpoint} className="flex mt-1">
                <div
                  className={`w-40 flex-shrink-0 text-sm font-medium py-1 px-2 truncate cursor-pointer hover:bg-gray-100 ${
                    selectedEndpoint === endpoint ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => onEndpointClick(endpoint === selectedEndpoint ? null : endpoint)}
                >
                  {endpoint}
                </div>
                <div className="flex">
                  {timestamps.slice(0, 20).map((ts) => {
                    const item = endpointData.find((d) => d.timestamp === ts);
                    const color = item ? getColor(item.duration, item.status) : '#f3f4f6';
                    const tooltip = item
                      ? `${endpoint}: ${item.duration.toFixed(0)}ms (${item.status})`
                      : 'No data';
                    
                    return (
                      <div
                        key={ts}
                        className="w-8 h-8 flex-shrink-0"
                        style={{ backgroundColor: color }}
                        title={tooltip}
                      ></div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex mt-4 space-x-4 text-xs text-gray-600">
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1" style={{ backgroundColor: '#22c55e' }}></div>
          Fast (&lt;100ms)
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1" style={{ backgroundColor: '#eab308' }}></div>
          Normal (100-200ms)
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1" style={{ backgroundColor: '#f97316' }}></div>
          Slow (200-500ms)
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1" style={{ backgroundColor: '#dc2626' }}></div>
          Very Slow (&gt;500ms)
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 mr-1" style={{ backgroundColor: '#ef4444' }}></div>
          Error
        </div>
      </div>
    </div>
  );
};

interface SystemMetricCardProps {
  title: string;
  value: string;
  unit: string;
  threshold: number;
}

const SystemMetricCard: React.FC<SystemMetricCardProps> = ({
  title,
  value,
  unit,
  threshold
}) => {
  const numericValue = parseFloat(value);
  const isAboveThreshold = numericValue > threshold;
  
  return (
    <div
      className={`p-4 rounded-lg border ${
        isAboveThreshold
          ? 'bg-red-100 border-red-300 text-red-800'
          : 'bg-green-100 border-green-300 text-green-800'
      }`}
    >
      <div className="text-sm font-medium opacity-75">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
      <div className="text-xs mt-2">
        {isAboveThreshold ? `⚠️ Above threshold (${threshold}${unit})` : `✓ Normal`}
      </div>
    </div>
  );
};

// Helper functions
function getTrendLabel(value: number, threshold: number): string {
  if (value > threshold * 2) {
    return '😱 Critical';
  } else if (value > threshold) {
    return '⚠️ Slow';
  } else if (value > threshold * 0.5) {
    return '✓ Good';
  } else {
    return '🚀 Fast';
  }
}

export default PerformanceDashboard;
