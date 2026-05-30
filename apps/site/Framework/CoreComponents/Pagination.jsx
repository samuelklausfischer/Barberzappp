import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

/**
 * Pagination Component
 * 
 * Table pagination with page navigation.
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.pageSize - Items per page
 * @param {Function} props.onPageChange - Page change handler
 * @param {boolean} props.showFirstLast - Show first/last page buttons
 * @param {boolean} props.showInfo - Show item count info
 * @param {'sm'|'base'|'lg'} props.size - Pagination size
 * @param {'default'|'compact'|'simple'} props.variant - Pagination variant
 * @param {boolean} props.disabled - Disabled state
 * @param {string} props.className - Additional CSS classes
 */
export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize,
  onPageChange,
  showFirstLast = false,
  showInfo = true,
  size = 'base',
  variant = 'default',
  disabled = false,
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'w-8 h-8 text-xs',
      info: 'text-xs',
    },
    base: {
      button: 'w-10 h-10 text-sm',
      info: 'text-sm',
    },
    lg: {
      button: 'w-12 h-12 text-base',
      info: 'text-sm',
    },
  };

  const sizes = sizeConfig[size];

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the start or end
      if (currentPage <= 3) {
        start = 2;
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      // Add ellipsis before range if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add range
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after range if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handlePageChange = (page) => {
    if (disabled || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange?.(page);
  };

  // Calculate item range for display
  const getItemRange = () => {
    if (!totalItems || !pageSize) return null;
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    return { start, end, total: totalItems };
  };

  const itemRange = getItemRange();

  // Simple variant (just prev/next)
  if (variant === 'simple') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className={`inline-flex items-center justify-center rounded-lg border border-slate-600
            text-gray-400 hover:text-white hover:bg-slate-700/50 hover:border-slate-500
            transition-all duration-200 ${sizes.button}
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
          `}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>

        {showInfo && itemRange && (
          <span className={`${sizes.info} text-gray-400`}>
            {itemRange.start}-{itemRange.end} of {itemRange.total}
          </span>
        )}

        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className={`inline-flex items-center justify-center rounded-lg border border-slate-600
            text-gray-400 hover:text-white hover:bg-slate-700/50 hover:border-slate-500
            transition-all duration-200 ${sizes.button}
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent
          `}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    );
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Info */}
      {showInfo && itemRange && (
        <p className={`${sizes.info} text-gray-400`}>
          Showing{' '}
          <span className="text-white font-medium">
            {itemRange.start}-{itemRange.end}
          </span>{' '}
          of{' '}
          <span className="text-white font-medium">{itemRange.total}</span> results
        </p>
      )}

      {/* Pagination */}
      <div className="flex items-center gap-1">
        {/* First page */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={disabled || currentPage === 1}
            className={`inline-flex items-center justify-center rounded-lg
              text-gray-400 hover:text-white hover:bg-slate-700/50
              transition-all duration-200 ${sizes.button}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="First page"
          >
            <ChevronLeft className="w-4 h-4 -ml-0.5" strokeWidth={2} />
            <ChevronLeft className="w-4 h-4 -ml-2.5" strokeWidth={2} />
          </button>
        )}

        {/* Previous */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className={`inline-flex items-center justify-center rounded-lg
            text-gray-400 hover:text-white hover:bg-slate-700/50
            transition-all duration-200 ${sizes.button}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className={`inline-flex items-center justify-center ${sizes.button} text-gray-500`}
                >
                  <MoreHorizontal className="w-4 h-4" strokeWidth={2} />
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => handlePageChange(page)}
                disabled={disabled}
                className={`
                  inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200
                  ${sizes.button}
                  ${isActive
                    ? 'bg-amber-500 text-slate-900 hover:bg-amber-600'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={`Page ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className={`inline-flex items-center justify-center rounded-lg
            text-gray-400 hover:text-white hover:bg-slate-700/50
            transition-all duration-200 ${sizes.button}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>

        {/* Last page */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={disabled || currentPage === totalPages}
            className={`inline-flex items-center justify-center rounded-lg
              text-gray-400 hover:text-white hover:bg-slate-700/50
              transition-all duration-200 ${sizes.button}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label="Last page"
          >
            <ChevronRight className="w-4 h-4 -ml-2.5" strokeWidth={2} />
            <ChevronRight className="w-4 h-4 -ml-0.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * CompactPagination - Smaller, simpler version
 */
export const CompactPagination = (props) => (
  <Pagination variant="compact" size="sm" showFirstLast={false} {...props} />
);

/**
 * SimplePagination - Just prev/next buttons
 */
export const SimplePagination = (props) => (
  <Pagination variant="simple" size="base" {...props} />
);

export default Pagination;
