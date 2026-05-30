import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs Component
 * 
 * Navigation breadcrumbs showing current page path.
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items { label, href, icon }
 * @param {Function} props.onItemClick - Click handler for items
 * @param {'sm'|'base'|'lg'} props.size - Breadcrumb size
 * @param {boolean} props.showHome - Show home icon as first item
 * @param {string} props.homeHref - Home breadcrumb href
 * @param {string} props.className - Additional CSS classes
 */
export const Breadcrumbs = ({
  items = [],
  onItemClick,
  size = 'base',
  showHome = true,
  homeHref = '/',
  className = '',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: 'text-xs',
    base: 'text-sm',
    lg: 'text-base',
  };

  const textSize = sizeConfig[size];
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  // All items including home
  const allItems = showHome
    ? [{ label: 'Home', href: homeHref, icon: <Home className={iconSize} strokeWidth={2} /> }, ...items]
    : items;

  return (
    <nav
      className={`flex items-center gap-2 ${textSize} ${className}`}
      aria-label="Breadcrumb"
    >
      {allItems.map((item, index) => {
        const isLast = index === allItems.length - 1;
        const isFirst = index === 0;

        return (
          <React.Fragment key={index}>
            {/* Item */}
            {!isLast ? (
              item.href ? (
                <a
                  href={item.href}
                  onClick={(e) => {
                    e.preventDefault();
                    onItemClick?.(item, index);
                  }}
                  className={`
                    flex items-center gap-2 transition-colors
                    ${isFirst ? 'text-gray-400 hover:text-amber-500' : 'text-gray-400 hover:text-white'}
                  `}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="truncate max-w-[150px]">{item.label}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => onItemClick?.(item, index)}
                  className={`
                    flex items-center gap-2 transition-colors
                    ${isFirst ? 'text-gray-400 hover:text-amber-500' : 'text-gray-400 hover:text-white'}
                  `}
                >
                  {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                  <span className="truncate max-w-[150px]">{item.label}</span>
                </button>
              )
            ) : (
              <span className={`
                flex items-center gap-2 font-medium text-white
                ${item.icon ? '' : ''}
              `} aria-current="page">
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="truncate max-w-[200px]">{item.label}</span>
              </span>
            )}

            {/* Separator */}
            {!isLast && (
              <ChevronRight
                className={`flex-shrink-0 text-gray-600 ${iconSize}`}
                strokeWidth={2}
                aria-hidden="true"
              />
            )}
          </React.Fragment>
        )}
      )}
    </nav>
  );
};

/**
 * BreadcrumbItem - Individual breadcrumb item
 */
export const BreadcrumbItem = ({
  label,
  href,
  icon,
  isActive = false,
  onClick,
  className = '',
}) => {
  const baseClasses = 'flex items-center gap-2 font-medium transition-colors';

  if (isActive) {
    return (
      <span className={`${baseClasses} text-white ${className}`} aria-current="page">
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{label}</span>
      </span>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
        className={`${baseClasses} text-gray-400 hover:text-amber-500 ${className}`}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate max-w-[150px]">{label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} text-gray-400 hover:text-amber-500 ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</icon>}
      <span className="truncate max-w-[150px]">{label}</span>
    </button>
  );
};

/**
 * BreadcrumbSeparator - Custom separator component
 */
export const BreadcrumbSeparator = ({ children, className = '' }) => {
  const iconSize = 'w-4 h-4';

  return (
    <span className={`flex-shrink-0 text-gray-600 ${iconSize} ${className}`} aria-hidden="true">
      {children || <ChevronRight strokeWidth={2} />}
    </span>
  );
};

/**
 * CompactBreadcrumbs - Compact version without home icon
 */
export function CompactBreadcrumbs(props) {
  return <Breadcrumbs showHome={false} size="sm" {...props} />;
}

export default Breadcrumbs;
