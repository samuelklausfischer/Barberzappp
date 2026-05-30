import React from 'react';

/**
 * CardList Component
 * 
 * Displays a list of cards (horizontal or vertical orientation).
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of card items
 * @param {'horizontal'|'vertical'} props.orientation - List orientation
 * @param {boolean} props.divided - Show dividers between items
 * @param {Function} props.renderItem - Custom item renderer
 * @param {React.ReactNode} props.actions - Actions component
 * @param {string} props.emptyMessage - Empty state message
 * @param {React.ReactNode} props.emptyIcon - Empty state icon
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hoverable - Enable hover effect on items
 * @param {Function} props.onItemClick - Item click handler
 */
export const CardList = ({
  items = [],
  orientation = 'vertical',
  divided = true,
  renderItem,
  actions,
  emptyMessage = 'No items to display',
  emptyIcon = null,
  className = '',
  hoverable = false,
  onItemClick,
}) => {
  const orientationStyles = {
    horizontal: 'flex-row overflow-x-auto gap-4',
    vertical: 'flex-col',
  };

  const itemStyles = {
    horizontal: 'flex-shrink-0 w-72',
    vertical: 'w-full',
  };

  const dividedStyles = divided ? 'divide-y divide-slate-700/50' : 'divide-none';

  if (items.length === 0) {
    return (
      <div className={`bg-slate-800/30 border border-slate-700/30 rounded-xl p-12 text-center ${className}`}>
        {emptyIcon || (
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        )}
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex ${orientationStyles[orientation]} ${orientation === 'vertical' ? dividedStyles : ''} ${className}`}
      role="list"
      aria-label={`Card list with ${items.length} items`}
    >
      {items.map((item, index) => (
        <div
          key={item.id || index}
          className={`${itemStyles[orientation]} ${hoverable ? 'hover:bg-slate-700/30 cursor-pointer transition-colors' : ''}`}
          onClick={() => onItemClick?.(item, index)}
          role="listitem"
          tabIndex={hoverable ? 0 : undefined}
          onKeyDown={(e) => e.key === 'Enter' && onItemClick?.(item, index)}
        >
          {renderItem ? renderItem(item, index) : <DefaultCardItem item={item} />}
        </div>
      ))}
    </div>
  );
};

/**
 * Default card item renderer
 */
const DefaultCardItem = ({ item }) => (
  <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-slate-600/50 transition-all">
    <div className="flex items-center gap-4">
      {item.avatar && (
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-lg font-semibold text-white flex-shrink-0">
          {item.avatar}
        </div>
      )}
      <div className="flex-1 min-w-0">
        {item.title && (
          <p className="font-medium text-white truncate">{item.title}</p>
        )}
        {item.subtitle && (
          <p className="text-sm text-gray-400 truncate">{item.subtitle}</p>
        )}
        {item.description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
        )}
      </div>
      {item.badge && (
        <span className="flex-shrink-0">{item.badge}</span>
      )}
      {item.rightAction && (
        <div className="flex-shrink-0">{item.rightAction}</div>
      )}
    </div>
  </div>
);

/**
 * Horizontal CardList with scrollable items
 */
export const CardListHorizontal = (props) => <CardList orientation="horizontal" {...props} />;

/**
 * Vertical CardList with standard layout
 */
export const CardListVertical = (props) => <CardList orientation="vertical" {...props} />;

/**
 * CardItem - Individual card wrapper for use outside CardList
 */
export const CardItem = ({
  children,
  className = '',
  hoverable = false,
  onClick,
  selected = false,
  ...props
}) => (
  <div
    className={`p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl transition-all ${
      hoverable ? 'hover:bg-slate-700/30 hover:border-slate-600/50 cursor-pointer hover:shadow-md' : ''
    } ${selected ? 'border-amber-500/50 bg-amber-500/5' : ''} ${className}`}
    onClick={onClick}
    role={onClick ? 'button' : 'article'}
    tabIndex={onClick ? 0 : undefined}
    {...props}
  >
    {children}
  </div>
);

/**
 * CardList with grid layout
 */
export const CardListGrid = ({
  items = [],
  columns = { xs: 1, sm: 2, lg: 3, xl: 4 },
  renderItem,
  className = '',
  ...props
}) => {
  const gridCols = columns;
  const gridClasses = [
    'grid',
    `grid-cols-${gridCols.xs}`,
    `sm:grid-cols-${gridCols.sm}`,
    `lg:grid-cols-${gridCols.lg}`,
    gridCols.xl && `xl:grid-cols-${gridCols.xl}`,
    'gap-4',
  ]
    .filter(Boolean)
    .join(' ');

  if (items.length === 0) {
    return <CardList items={[]} emptyMessage={props.emptyMessage} className={className} />;
  }

  return (
    <div className={`${gridClasses} ${className}`} role="list">
      {items.map((item, index) => (
        <div key={item.id || index} role="listitem">
          {renderItem ? renderItem(item, index) : <DefaultCardItem item={item} />}
        </div>
      ))}
    </div>
  );
};

export default CardList;
