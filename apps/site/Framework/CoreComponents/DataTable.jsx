import React, { useState } from 'react';
import { ChevronUp, ChevronDown, MoreVertical, Search, Filter } from 'lucide-react';

/**
 * DataTable Component
 * 
 * Sortable table with pagination for displaying structured data.
 * 
 * @param {Object} props
 * @param {Array} props.columns - Column definitions { key, label, sortable, render }
 * @param {Array} props.data - Data rows
 * @param {boolean} props.loading - Show loading state
 * @param {Object} props.pagination - Pagination config { currentPage, totalPages, pageSize }
 * @param {Function} props.onPageChange - Page change handler
 * @param {Function} props.onSort - Sort change handler { column, direction }
 * @param {Function} props.onRowClick - Row click handler
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showSelection - Show row selection checkboxes
 * @param {Function} props.onSelectionChange - Selection change handler
 * @param {React.ReactNode} props.actions - Custom actions column
 * @param {string} props.emptyMessage - Message for empty state
 */
export const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination = null,
  onPageChange,
  onSort,
  onRowClick,
  className = '',
  showSelection = false,
  onSelectionChange,
  actions = null,
  emptyMessage = 'No data available',
}) => {
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRows, setSelectedRows] = useState([]);

  const handleSort = (column) => {
    if (!column.sortable) return;

    const newDirection = sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column.key);
    setSortDirection(newDirection);
    onSort?.(column.key, newDirection);
  };

  const handleRowSelection = (rowId, checked) => {
    const newSelection = checked
      ? [...selectedRows, rowId]
      : selectedRows.filter(id => id !== rowId);
    setSelectedRows(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = (checked) => {
    const allIds = data.map((row, index) => row.id || index);
    setSelectedRows(checked ? allIds : []);
    onSelectionChange?.(checked ? allIds : []);
  };

  const isAllSelected = data.length > 0 && selectedRows.length === data.length;
  const isSomeSelected = selectedRows.length > 0 && !isAllSelected;

  // Loading skeleton rows
  const renderSkeleton = (count = 5) => (
    Array.from({ length: count }).map((_, i) => (
      <tr key={`skeleton-${i}`}>
        {showSelection && (
          <td className="px-6 py-4">
            <div className="w-4 h-4 rounded bg-slate-700/50 animate-pulse" />
          </td>
        )}
        {columns.map((col, j) => (
          <td key={j} className="px-6 py-4">
            <div className="h-4 rounded bg-slate-700/50 animate-pulse" style={{ width: col.width || '60%' }} />
          </td>
        ))}
      </tr>
    ))
  );

  return (
    <div className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden ${className}`}>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full" role="grid" aria-label="Data table">
          <thead className="bg-slate-900/50">
            <tr>
              {showSelection && (
                <th className="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => el && (el.indeterminate = isSomeSelected)}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/50"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white hover:bg-slate-700/30 transition-colors select-none ${
                    column.sortable ? 'hover:bg-slate-700/30' : ''
                  }`}
                  onClick={() => handleSort(column)}
                  scope="col"
                  aria-sort={
                    sortColumn === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && (
                      <span className="text-gray-500">
                        {sortColumn === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronUp className="w-4 h-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 w-16 text-right" scope="col"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              renderSkeleton()
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (showSelection ? 1 : 0) + (actions ? 1 : 0)} className="px-6 py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
                      <Filter className="w-8 h-8 text-gray-500" strokeWidth={1.5} />
                    </div>
                    <p className="text-gray-400">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  className={`hover:bg-slate-700/30 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${selectedRows.includes(row.id || rowIndex) ? 'bg-amber-500/5' : ''}`}
                  onClick={() => onRowClick?.(row, rowIndex)}
                  role={onRowClick ? 'button' : 'row'}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(row, rowIndex)}
                >
                  {showSelection && (
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(row.id || rowIndex)}
                        onChange={(e) => handleRowSelection(row.id || rowIndex, e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/50"
                        aria-label={`Select row ${rowIndex + 1}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4">
                      {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {typeof actions === 'function' ? actions(row, rowIndex) : actions}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Showing{' '}
            <span className="text-white font-medium">
              {(pagination.currentPage - 1) * pagination.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="text-white font-medium">
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems || data.length)}
            </span>{' '}
            of{' '}
            <span className="text-white font-medium">{pagination.totalItems || data.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              aria-label="Previous page"
            >
              <ChevronUp className="w-4 h-4 -rotate-90" />
              Previous
            </button>
            
            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === pagination.currentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`w-10 h-10 text-sm font-medium rounded-lg transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-900'
                        : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                    aria-label={`Page ${pageNum}`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
              aria-label="Next page"
            >
              Next
              <ChevronUp className="w-4 h-4 rotate-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact DataTable variant for small datasets
 */
export const DataTableCompact = ({ columns, data, className = '', ...props }) => (
  <DataTable
    columns={columns}
    data={data}
    className={`border-none bg-slate-800/30 ${className}`}
    {...props}
  />
);

export default DataTable;
