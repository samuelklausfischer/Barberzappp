import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ADMIN_ROUTES, getBreadcrumbs } from './ROUTES_CONFIG';

/**
 * MainContent Component
 * 
 * Page content wrapper with:
 * - Page header (title, subtitle, actions)
 * - Breadcrumb navigation
 * - Scrollable content area
 * - Page transition animations
 */
export function MainContent({
  title,
  subtitle,
  children,
  actions = null,
  headerActions = null,
  showBreadcrumbs = true,
  customBreadcrumbs = null,
  className = '',
  containerSize = 'default'
}) {
  const location = useLocation();

  // Get route info
  const currentRoute = ADMIN_ROUTES.find(route => 
    route.path === location.pathname || 
    location.pathname.startsWith(route.path)
  );

  // Use provided title or get from route
  const pageTitle = title || currentRoute?.label || 'Página';
  const pageSubtitle = subtitle || currentRoute?.description || '';

  // Get breadcrumbs
  const breadcrumbs = customBreadcrumbs || getBreadcrumbs(location.pathname);

  // Container size classes
  const containerSizeClasses = {
    sm: 'max-w-4xl',
    default: 'max-w-7xl',
    xl: 'max-w-full',
    full: 'w-full'
  };

  return (
    <main 
      className={`
        pt-20 pb-8 min-h-screen
        bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950
        md:pt-20 lg:pt-20 lg:ml-[260px]
        transition-all duration-300
        ${className}
      `}
    >
      <div className={`${containerSizeClasses[containerSize]} mx-auto px-4 sm:px-6 lg:px-8`}>
        
        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs.length > 1 && (
          <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm">
              {breadcrumbs.map((item, index) => (
                <React.Fragment key={index}>
                  {/* Breadcrumb Item */}
                  <li className="flex items-center">
                    {index === 0 ? (
                      <Home className="w-3.5 h-3.5" />
                    ) : (
                      <span className={`
                        transition-colors duration-200
                        ${index === breadcrumbs.length - 1 
                          ? 'text-slate-400 font-medium' 
                          : 'text-slate-500 hover:text-amber-400'
                        }
                      `}>
                        {item.label}
                      </span>
                    )}
                  </li>
                  
                  {/* Separator */}
                  {index < breadcrumbs.length - 1 && (
                    <li>
                      <ChevronRight className="w-4 h-4 text-slate-600" strokeWidth={2} />
                    </li>
                  )}
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}

        {/* Page Header */}
        <header className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between 
                          gap-4">
            
            {/* Title Section */}
            <div className="flex-1">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="text-2xl md:text-3xl lg:text-4xl font-bold 
                           text-white tracking-tight mb-2"
              >
                {pageTitle}
              </motion.h1>
              
              {pageSubtitle && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="text-slate-400 text-sm md:text-base"
                >
                  {pageSubtitle}
                </motion.p>
              )}
            </div>

            {/* Action Buttons */}
            {(actions || headerActions) && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex items-center gap-3"
              >
                {actions}
              </motion.div>
            )}
          </div>
        </header>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="w-full"
        >
          {children}
        </motion.div>

      </div>
    </main>
  );
}

export default MainContent;

/**
 * PageSection Component
 * 
 * Helper component for creating consistent page sections
 */
export function PageSection({
  title,
  description,
  children,
  className = '',
  actions = null,
  card = false,
  collapsed = false
}) {
  return (
    <section className={`
      mb-6 md:mb-8
      ${card ? 'bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6' : ''}
      ${className}
    `}>
      
      {(title || description || actions) && (
        <div className={`
          flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 
          mb-4 ${card ? 'mb-6' : ''}
        `}>
          <div className="flex-1">
            {title && (
              <h2 className="text-xl md:text-2xl font-semibold text-white mb-1">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-slate-400 text-sm">
                {description}
              </p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
}

/**
 * PageCard Component
 * 
 * Reusable card for grouping related content
 */
export function PageCard({
  title,
  children,
  className = '',
  noPadding = false,
  hover = false
}) {
  return (
    <div className={`
      bg-slate-800/50 backdrop-blur-xl 
      border border-slate-700/50 
      rounded-2xl
      transition-all duration-300
      ${hover ? 'hover:bg-slate-700/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5' : ''}
      ${noPadding ? '' : 'p-6'}
      ${className}
    `}>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-4">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/**
 * PageGrid Component
 * 
 * Responsive grid for layout cards and widgets
 */
export function PageGrid({
  children,
  cols = 'default',
  gap = 'default',
  className = ''
}) {
  const colsMap = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    default: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  const gapMap = {
    sm: 'gap-3',
    default: 'gap-4 md:gap-6',
    lg: 'gap-6 md:gap-8'
  };

  return (
    <div className={`
      grid ${colsMap[cols]} ${gapMap[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * PageTransition Component
 * 
 * Wraps page content with transition animation
 */
export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * LoadingState Component
 * 
 skeleton loader for page content
 */
export function LoadingState({ cards = 3, lines = 3 }) {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="animate-pulse space-y-3">
        <div className="h-8 bg-slate-800/50 rounded-lg w-64" />
        <div className="h-4 bg-slate-800/30 rounded w-96" />
      </div>

      {/* Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="animate-pulse bg-slate-800/50 
                              border border-slate-700/50 rounded-2xl p-6">
            <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: lines }, (_, j) => (
                <div 
                  key={`line-${j}`} 
                  className="h-3 bg-slate-700/30 rounded"
                  style={{ width: `${50 + j * 15}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * EmptyState Component
 * 
 * Consistent empty state for pages with no data
 */
export function EmptyState({
  icon: Icon,
  title = 'Nenhum dado encontrado',
  description,
  action,
  illustration
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      {Icon && (
        <div className="w-20 h-20 rounded-2xl bg-slate-800/50 
                        border border-slate-700/50 
                        flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-slate-600" strokeWidth={1.5} />
        </div>
      )}
      
      {illustration && (
        <div className="mb-6 opacity-50">
          {illustration}
        </div>
      )}

      <h3 className="text-xl font-semibold text-white mb-2 text-center">
        {title}
      </h3>
      
      {description && (
        <p className="text-slate-400 text-center max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && action}
    </div>
  );
}
