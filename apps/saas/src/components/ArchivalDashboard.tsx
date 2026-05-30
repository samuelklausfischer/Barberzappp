/**
 * Archival Dashboard Component
 *
 * Admin dashboard for managing data archival operations.
 * Part of the archival system for BarberZap.
 *
 * Features:
 * - Display table sizes and archival status
 * - Trigger archival operations
 * - Monitor job progress
 * - Search archived records
 * - View audit trail
 * - Emergency restore functionality
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Types
interface ArchivalStats {
  table_name: string;
  total_rows: number;
  table_size: string;
  index_size: string;
  total_size: string;
  percentage_archived?: number;
}

interface ArchivalStatus {
  table_name: string;
  total_archived: number;
  first_archived: string | null;
  last_archived: string | null;
  shops_affected: number;
}

interface ArchiveOperation {
  id: string;
  operation_type: string;
  table_name: string;
  criteria: Record<string, any>;
  records_affected: number;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  performed_by: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled';
  error_message: string | null;
  dry_run: boolean;
}

interface ArchivedClient {
  id: string;
  shop_id: string;
  name: string;
  phone_number: string;
  email: string | null;
  archived_at: string;
  last_visit_at: string | null;
  total_visits: number;
  total_spent: number;
  archive_reason: string;
}

interface ArchivedAppointment {
  id: string;
  shop_id: string;
  client_name: string;
  employee_name: string;
  service_name: string;
  scheduled_at: string;
  status: string;
  price: number;
  archived_at: string;
  archive_reason: string;
}

interface ArchivalDashboardProps {
  shopId?: string;
  adminOnly?: boolean;
}

export const ArchivalDashboard: React.FC<ArchivalDashboardProps> = ({
  shopId,
  adminOnly = true
}) => {
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'operations' | 'archived-clients' | 'archived-appointments'>('overview');
  const [stats, setStats] = useState<ArchivalStats[]>([]);
  const [status, setStatus] = useState<ArchivalStatus[]>([]);
  const [operations, setOperations] = useState<ArchiveOperation[]>([]);
  const [archivedClients, setArchivedClients] = useState<ArchivedClient[]>([]);
  const [archivedAppointments, setArchivedAppointments] = useState<ArchivedAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Archive form state
  const [archiveType, setArchiveType] = useState<'clients' | 'appointments' | 'messages' | 'activity_logs'>('clients');
  const [olderThanMonths, setOlderThanMonths] = useState(12);
  const [dryRun, setDryRun] = useState(true);
  const [archiving, setArchiving] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'name' | 'phone'>('name');
  const [page, setPage] = useState(1);

  // Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );

  // Load data
  useEffect(() => {
    loadStats();
    loadStatus();
    loadOperations();
  }, [shopId]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/archival/stats');
      const data = await response.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await fetch('/api/archival/status');
      const data = await response.json();
      setStatus(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadOperations = async () => {
    try {
      const response = await fetch('/api/archival/operations?page=1&page_size=20');
      const data = await response.json();
      setOperations(data.operations || []);
    } catch (err: any) {
      console.error(err);
    }
  };

  const searchArchivedClients = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: '50',
    });

    if (searchQuery) {
      if (searchType === 'name') {
        params.append('name', searchQuery);
      } else {
        params.append('phone_number', searchQuery);
      }
    }

    if (shopId) {
      params.append('shop_id', shopId);
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/archival/archived-clients?${params}`);
      const data = await response.json();
      setArchivedClients(data.clients || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchArchivedAppointments = async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: '50',
    });

    if (searchQuery) {
      params.append('client_name', searchQuery);
    }

    if (shopId) {
      params.append('shop_id', shopId);
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/archival/archived-appointments?${params}`);
      const data = await response.json();
      setArchivedAppointments(data.appointments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to archive ${archiveType}?`)) {
      return;
    }

    try {
      setArchiving(true);
      setError(null);

      const endpoint = `/api/archival/archive/${archiveType}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shopId,
          older_than_months: olderThanMonths,
          dry_run: dryRun,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to start archival');
      }

      alert(`Archival job queued!\nJob ID: ${data.job_id}\nDry run: ${dryRun}`);
      loadOperations();
      loadStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setArchiving(false);
    }
  };

  const handleRestore = async (recordId: string) => {
    if (!confirm('Are you sure you want to restore this record? This is an emergency operation.')) {
      return;
    }

    try {
      const response = await fetch('/api/archival/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_type: 'appointments',
          record_id: recordId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Record restored successfully!');
        searchArchivedAppointments();
      } else {
        alert(`Failed to restore: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      'in_progress': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800' },
      'failed': { bg: 'bg-red-100', text: 'text-red-800' },
      'cancelled': { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const style = styles[status] || styles['cancelled'];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  // Render functions
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.table_name} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {stat.table_name.replace('_', ' ').toUpperCase()}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Rows:</span>
                <span className="font-semibold">{stat.total_rows.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Size:</span>
                <span className="font-semibold">{stat.total_size}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Index Size:</span>
                <span className="font-semibold">{stat.index_size}</span>
              </div>
              {stat.percentage_archived !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Archived:</span>
                  <span className="font-semibold">{stat.percentage_archived.toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Archival Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Archival Status</h3>
        </div>
        <div className="p-6">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2 text-left">Table</th>
                <th className="px-4 py-2 text-right">Archived</th>
                <th className="px-4 py-2 text-right">Shops</th>
                <th className="px-4 py-2 text-left">Last Archived</th>
              </tr>
            </thead>
            <tbody>
              {status.map((s) => (
                <tr key={s.table_name} className="border-b">
                  <td className="px-4 py-2">{s.table_name}</td>
                  <td className="px-4 py-2 text-right">{s.total_archived.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{s.shops_affected}</td>
                  <td className="px-4 py-2">{formatDate(s.last_archived)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Archive Trigger */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Run Archival Operation</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={archiveType}
              onChange={(e) => setArchiveType(e.target.value as any)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            >
              <option value="clients">Clients (24m)</option>
              <option value="appointments">Appointments (12m)</option>
              <option value="messages">Messages (18m)</option>
              <option value="activity_logs">Activity Logs (6m)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Months</label>
            <input
              type="number"
              value={olderThanMonths}
              onChange={(e) => setOlderThanMonths(Number(e.target.value))}
              min="1"
              max="120"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm"
              />
              <span className="ml-2 text-sm text-gray-700">Dry Run</span>
            </label>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="w-full bg-blue-600 text-white rounded-md py-2 px-4 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {archiving ? 'Archiving...' : 'Start Archive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOperations = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Archival Operations</h2>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Records</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Duration</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {operations.map((op) => (
              <tr key={op.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(op.started_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {op.operation_type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {op.table_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(op.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {op.records_affected?.toLocaleString() || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {op.duration_seconds ? `${op.duration_seconds.toFixed(1)}s` : '---'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderArchivedClients = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search clients..."
          className="flex-1 rounded-md border-gray-300 shadow-sm border p-2"
        />
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value as any)}
          className="rounded-md border-gray-300 shadow-sm border p-2"
        >
          <option value="name">By Name</option>
          <option value="phone">By Phone</option>
        </select>
        <button
          onClick={searchArchivedClients}
          className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {archivedClients.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Visits</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivedClients.map((client) => (
                <tr key={client.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {client.total_visits}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    R$ {client.total_spent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.archive_reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderArchivedAppointments = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by client name..."
          className="flex-1 rounded-md border-gray-300 shadow-sm border p-2"
        />
        <button
          onClick={searchArchivedAppointments}
          className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
        >
          Search
        </button>
      </div>

      {archivedAppointments.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barber</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivedAppointments.map((apt) => (
                <tr key={apt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {apt.client_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apt.service_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {apt.employee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(apt.scheduled_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(apt.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    R$ {apt.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleRestore(apt.id)}
                      className="text-blue-600 hover:text-blue-900 text-xs font-medium"
                    >
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (loading && stats.length === 0) {
    return <div className="p-6">Loading archival dashboard...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Data Archival Dashboard</h1>
        <p className="text-gray-600">Manage and monitor data archival operations</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'operations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => setActiveTab('archived-clients')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'archived-clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Archived Clients
          </button>
          <button
            onClick={() => setActiveTab('archived-appointments')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'archived-appointments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Archived Appointments
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'operations' && renderOperations()}
      {activeTab === 'archived-clients' && renderArchivedClients()}
      {activeTab === 'archived-appointments' && renderArchivedAppointments()}
    </div>
  );
};

export default ArchivalDashboard;
