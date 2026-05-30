/**
 * ActivityLog Component
 *
 * Displays audit logs for tracking all system actions
 * Part of FASE 2.6 - Audit Logs UI
 *
 * Features:
 * - Paginated list of audit entries
 * - Filter by table, action, date range
 * - Search by record ID
 * - Show old_data vs new_data diff
 * - Real-time updates via Supabase Realtime
 */

import React, { useState } from 'react';
import { useRealtimeActivityLogs } from '@/realtime/hooks';

interface ActivityLogEntry {
  id: string;
  shop_id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data?: any;
  new_data?: any;
  changed_by?: string;
  changed_at: string;
}

interface ActivityLogProps {
  shop_id: string;
  pageSize?: number;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  shop_id,
  pageSize = 20
}) => {
  const [filters, setFilters] = useState({
    table_name: '',
    action: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  const [page, setPage] = useState(1);

  const {
    data: logs,
    loading,
    error
  } = useRealtimeActivityLogs(shop_id, {
    filters,
    page,
    pageSize
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to page 1 when filters change
  };

  const renderDiff = (oldData: any, newData: any) => {
    if (!oldData && newData) {
      return <span className="text-green-600">CREATED</span>;
    }
    if (oldData && !newData) {
      return <span className="text-red-600">DELETED</span>;
    }
    if (oldData && newData) {
      const changes = Object.keys({ ...oldData, ...newData }).filter(
        key => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])
      );

      return (
        <div className="text-sm">
          <span className="text-blue-600 font-medium">{changes.length} field(s) changed</span>
          <details className="ml-2">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              View changes
            </summary>
            <div className="mt-2 bg-gray-50 p-2 rounded text-xs font-mono">
              {changes.map(key => (
                <div key={key} className="py-1">
                  <span className="text-red-600">{key}: </span>
                  <span className="line-through text-gray-500">
                    {JSON.stringify(oldData[key])}
                  </span>
                  {' → '}
                  <span className="text-green-600">
                    {JSON.stringify(newData[key])}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      );
    }
    return null;
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableNameIcon = (tableName: string) => {
    const icons: Record<string, string> = {
      appointments: '📅',
      clients: '👤',
      employees: '💇',
      services: '✂️',
      working_hours: '⏰'
    };
    return icons[tableName] || '📄';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
        <p className="text-gray-600">Track all system actions and changes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.table_name}
            onChange={(e) => handleFilterChange('table_name', e.target.value)}
            className="form-select"
          >
            <option value="">All Tables</option>
            <option value="appointments">📅 Appointments</option>
            <option value="clients">👤 Clients</option>
            <option value="employees">💇 Employees</option>
            <option value="services">✂️ Services</option>
            <option value="working_hours">⏰ Working Hours</option>
          </select>

          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
            className="form-select"
          >
            <option value="">All Actions</option>
            <option value="INSERT">INSERT (Created)</option>
            <option value="UPDATE">UPDATE (Modified)</option>
            <option value="DELETE">DELETE (Deleted)</option>
          </select>

          <input
            type="text"
            placeholder="Search record ID..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="form-input"
          />

          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="form-input"
            placeholder="From date"
          />

          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="form-input"
            placeholder="To date"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading activity logs...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Error loading logs: {error.message}</div>
        ) : !logs || logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No activity logs found</div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Table
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Record ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Changes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Changed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log: ActivityLogEntry) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getTableNameIcon(log.table_name)} {log.table_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {(log.record_id as string).substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {renderDiff(log.old_data, log.new_data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.changed_by || 'System'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.changed_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t">
              <div className="text-sm text-gray-700">
                {/* Show page info */}
                Page {page}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={logs.length < pageSize}
                  className="px-3 py-1 bg-white border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
