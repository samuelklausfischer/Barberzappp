/**
 * Cleanup Dashboard Component
 *
 * Admin dashboard for managing data cleanup operations.
 * Part of the cleanup system for BarberZap.
 *
 * Features:
 * - Display cleanup statistics for all tables
 * - Trigger cleanup operations manually
 * - Monitor cleanup job progress
 * - View cleanup history and logs
 * - Configure cleanup schedules
 * - Show active alerts
 * - Safety checks and warning dialogs
 * - Admin-only access control
 */

import React, { useState, useEffect } from 'react';

// Types
interface CleanupStats {
  table_name: string;
  pending_count: number;
  avg_age_hours: number;
  table_size_mb: number;
  total_deleted_24h: number;
  total_deleted_7d: number;
  total_deleted_30d: number;
  avg_daily_deleted: number;
  last_cleanup_at: string | null;
  data_growth_rate_mb_per_day: number;
  cleanup_health_score: number;
  cleanup_errors_24h: number;
  active_alerts: number;
}

interface CleanupAllStats {
  tables: CleanupStats[];
  total_pending: number;
  total_size_mb: number;
  summary: {
    total_tables: number;
    tables_with_pending: number;
    high_priority_tables: number;
    last_full_cleanup: string | null;
  };
}

interface CleanupHistoryItem {
  id: string;
  job_name: string;
  table_name: string;
  count_deleted: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'dry_run';
  performed_by: string | null;
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  dry_run: boolean;
}

interface CleanupAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  table_name: string | null;
  job_name: string | null;
  alert_message: string;
  details: Record<string, any>;
  metric_value: number | null;
  threshold_value: number | null;
  triggered_at: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
}

interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'error' | 'critical';
  metrics: {
    last_successful_cleanup_at: string | null;
    cleanup_errors_last_24h: number;
    last_cleanup_duration_ms: number | null;
    table_metrics: Record<string, {
      size_mb: number;
      pending_count: number;
      health_score: number;
      growth_rate_mb_per_day: number;
    }>;
  };
  alerts: CleanupAlert[];
  alert_counts: {
    critical: number;
    error: number;
    warning: number;
    total: number;
  };
}

interface CleanupDashboardProps {
  shopId?: string;
  adminOnly?: boolean;
}

export const CleanupDashboard: React.FC<CleanupDashboardProps> = ({
  shopId,
  adminOnly = true
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'history' | 'alerts' | 'schedule'>('overview');
  const [stats, setStats] = useState<CleanupAllStats | null>(null);
  const [history, setHistory] = useState<CleanupHistoryItem[]>([]);
  const [alerts, setAlerts] = useState<CleanupAlert[]>([]);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup form state
  const [dryRun, setDryRun] = useState(true);
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [runResult, setRunResult] = useState<any>(null);

  // Permission state
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Dialog state
  const [showForceDeleteDialog, setShowForceDeleteDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [forceDeleteTable, setForceDeleteTable] = useState<string | null>(null);

  // Tabs
  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'stats' as const, label: 'Statistics', icon: '📈' },
    { id: 'history' as const, label: 'History', icon: '📜' },
    { id: 'alerts' as const, label: 'Alerts', icon: '🚨' },
    { id: 'schedule' as const, label: 'Schedule', icon: '⚙️' },
  ];

  // Load data
  useEffect(() => {
    checkAdminPermission();
  }, [shopId]);

  useEffect(() => {
    if (isAdmin) {
      loadStats();
      loadHistory();
      loadAlerts();
      loadHealth();
    }
  }, [isAdmin]);

  const checkAdminPermission = async () => {
    try {
      const response = await fetch('/api/auth/permissions');
      const data = await response.json();
      setIsAdmin(data.is_admin || !adminOnly);
    } catch (err: any) {
      setError('Failed to verify permissions');
    } finally {
      setCheckingAuth(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/cleanup/stats');
      if (!response.ok) throw new Error('Failed to load stats');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (limit = 50) => {
    try {
      const response = await fetch(`/api/cleanup/history?limit=${limit}`);
      const data = await response.json();
      setHistory(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/cleanup/alerts?acknowledged=false');
      const data = await response.json();
      setAlerts(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadHealth = async () => {
    try {
      const response = await fetch('/api/cleanup/health');
      const data = await response.json();
      setHealth(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const runCleanupAll = async () => {
    try {
      setRunningCleanup(true);
      setRunResult(null);

      const response = await fetch('/api/cleanup/run-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dry_run: dryRun }),
      });

      if (!response.ok) throw new Error('Failed to run cleanup');

      const result = await response.json();
      setRunResult(result);

      // Reload stats and history
      await Promise.all([loadStats(), loadHistory()]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRunningCleanup(false);
    }
  };

  const handleForceDelete = async () => {
    if (!forceDeleteTable) return;

    try {
      setLoading(true);

      const response = await fetch(`/api/cleanup/force-table?table=${forceDeleteTable}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count_threshold: 0,  // Need to verify actual count first
          confirmation: 'CONFIRM',
          reason: 'Requested via admin dashboard',
          performed_by: 'admin'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to force delete');
      }

      const result = await response.json();
      alert(`✅ Force delete completed: ${result.deleted} records deleted`);
      setShowForceDeleteDialog(false);
      setForceDeleteTable(null);

      // Reload stats
      loadStats();
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/cleanup/alerts/${alertId}/acknowledge?performed_by=admin`, {
        method: 'POST',
      });

      if (response.ok) {
        loadAlerts();
        loadHealth();
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const refreshStats = async () => {
    const response = await fetch('/api/cleanup/refresh-stats', { method: 'POST' });
    if (response.ok) {
      loadStats();
      loadHealth();
    }
  };

  // Render helpers
  const formatNumber = (n: number) => n.toLocaleString();
  const formatDateTime = (dt: string | null) => {
    if (!dt) return 'N/A';
    return new Date(dt).toLocaleString();
  };
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'error': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      in_progress: 'bg-blue-100 text-blue-800',
      dry_run: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  // Loading / Permission check
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Checking permissions...</div>
      </div>
    );
  }

  if (!isAdmin && adminOnly) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">🚫 Admin access required</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Data Cleanup Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage temporary and expired data cleanup operations
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshStats}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            🔄 Refresh
          </button>
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            🧹 Run Cleanup
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ❌ {error}
        </div>
      )}

      {/* Health status banner */}
      {health && health.status !== 'healthy' && (
        <div className={`p-4 rounded-lg border ${
          health.status === 'critical' ? 'bg-red-50 border-red-300' :
          health.status === 'error' ? 'bg-orange-50 border-orange-300' :
          'bg-yellow-50 border-yellow-300'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {health.status === 'critical' ? '🔴' :
               health.status === 'error' ? '🟠' : '🟡'}
            </span>
            <div>
              <p className="font-semibold">
                {health.status === 'critical' ? 'Critical' :
                 health.status === 'error' ? 'Error' : 'Warning'} Status
              </p>
              <p className="text-sm">
                {health.alert_counts.total} active alert{health.alert_counts.total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'alerts' && alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatNumber(stats.total_pending)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_size_mb.toFixed(2)} MB
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Tables with Pending</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.summary.tables_with_pending} / {stats.summary.total_tables}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600">Last Full Cleanup</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDateTime(stats.summary.last_full_cleanup)}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl">🧹</span>
                <span className="font-medium">Run All Cleanups</span>
              </button>
              <button
                onClick={refreshStats}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl">🔄</span>
                <span className="font-medium">Refresh Stats</span>
              </button>
              <button
                onClick={() => setActiveTab('alerts')}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl">🚨</span>
                <span className="font-medium">View Alerts</span>
                {alerts.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {alerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className="flex flex-col items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <span className="text-2xl">📜</span>
                <span className="font-medium">View History</span>
              </button>
            </div>
          </div>

          {/* Table Stats Overview */}
          {stats && stats.tables.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Table Statistics</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Age (h)</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Size (MB)</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Health</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.tables.map((table) => (
                      <tr key={table.table_name} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap font-medium">
                          {table.table_name}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatNumber(table.pending_count)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {table.avg_age_hours.toFixed(1)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {table.table_size_mb.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-semibold ${getHealthColor(table.cleanup_health_score)}`}>
                            {table.cleanup_health_score}/100
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setForceDeleteTable(table.table_name)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Force Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Cleanup History</h2>
            <span className="text-sm text-gray-600">
              Last {history.length} operations
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deleted</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {formatDateTime(item.started_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.job_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {item.table_name}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {formatNumber(item.count_deleted)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      {item.duration_ms ? formatDuration(item.duration_ms) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.performed_by || 'system'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded-lg text-center">
              ✅ No active alerts - System is healthy!
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold uppercase">{alert.severity}</span>
                      <span className="text-sm">{alert.alert_type}</span>
                      {alert.table_name && <span className="text-sm">• {alert.table_name}</span>}
                    </div>
                    <p className="mt-1">{alert.alert_message}</p>
                    <p className="text-sm mt-1 text-sm opacity-75">
                      Triggered: {formatDateTime(alert.triggered_at)}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="ml-4 px-3 py-1 bg-white border border-current rounded hover:opacity-75"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Cleanup Schedule</h2>
          <p className="text-gray-600 mb-4">
            Configure automatic cleanup schedules (requires pg_cron or application scheduler).
          </p>
          <div className="space-y-4">
            {[
              { name: 'Magic Links', job: 'cleanup_magic_links', default: 'daily' },
              { name: 'Verification Codes', job: 'cleanup_verification_codes', default: 'hourly' },
              { name: 'Notifications', job: 'cleanup_notifications', default: 'daily' },
              { name: 'Activity Logs', job: 'cleanup_activity_logs', default: 'daily' },
              { name: 'Tokens', job: 'cleanup_tokens', default: 'daily' },
              { name: 'Cache', job: 'cleanup_cache', default: 'every 4 hours' },
            ].map((item) => (
              <div key={item.job} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Job: {item.job}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Schedule</p>
                  <p className="font-medium">{item.default}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 class="text-xl font-semibold mb-4">Detailed Statistics</h2>
          <p className="text-gray-600">
            Use the Overview tab for quick stats. Detailed statistics can be viewed table by table.
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">
              {dryRun ? 'Preview Cleanup' : 'Confirm Cleanup'}
            </h3>
            <p className="text-gray-600 mb-4">
              {dryRun
                ? 'This will run cleanup in dry-run mode. No data will be deleted.'
                : 'This will delete expired and temporary data from all cleanup tables.'}
            </p>
            <div className="mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded"
                />
                <span>Dry run (preview only)</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  runCleanupAll();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                disabled={runningCleanup}
              >
                {runningCleanup ? 'Running...' : dryRun ? 'Preview' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Dialog */}
      {runResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">
              Cleanup {dryRun ? 'Preview' : 'Result'}
            </h3>
            <div className="space-y-2 mb-4">
              <p>Total deleted: <strong>{formatNumber(runResult.total_deleted)}</strong></p>
              <p>Duration: <strong>{formatDuration(runResult.total_duration_ms)}</strong></p>
            </div>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg mb-4">
              {Object.entries(runResult.results).map(([key, result]: [string, any]) => (
                <div key={key} className="flex justify-between px-4 py-2 border-b border-gray-100">
                  <span>{result.table_name}</span>
                  <span className="font-medium">{formatNumber(result.deleted)} deleted</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setRunResult(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
};
