import React from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * StatCard Component
 * 
 * Displays a metric with icon, value, label, and trend indicator.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon component (LucideIcon or similar)
 * @param {string|number} props.value - Main metric value
 * @param {string} props.label - Label/description for the metric
 * @param {'up'|'down'|'neutral'|null} props.trend - Trend direction
 * @param {number} props.trendValue - Numeric trend value (percentage)
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.loading - Show loading skeleton state
 * @param {'default'|'compact'|'large'} props.variant - Display variant
 */
export const StatCard = ({
  icon: Icon,
  value,
  label,
  trend = null,
  trendValue = 0,
  className = '',
  loading = false,
  variant = 'default',
}) => {
  // Variant configurations
  const variantStyles = {
    default: 'p-6',
    compact: 'p-4',
    large: 'p-8',
  };

  // Trend colors
  const getTrendColor = () => {
    if (trend === 'up') return 'text-emerald-400 bg-emerald-500/15';
    if (trend === 'down') return 'text-red-400 bg-red-500/15';
    return 'text-gray-400 bg-slate-700/50';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl ${variantStyles[variant]} ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-700/50 animate-pulse" />
          <div className="w-16 h-6 rounded-full bg-slate-700/50 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="w-24 h-8 rounded bg-slate-700/50 animate-pulse" />
          <div className="w-32 h-4 rounded bg-slate-700/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-slate-600/50 ${variantStyles[variant]} ${className}`}
      role="article"
      aria-label={`Stat card: ${label}`}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Icon className="w-6 h-6 text-amber-500" strokeWidth={2} />
          </div>
        )}
        {trend && (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getTrendColor()} transition-all duration-200`}>
            <span className="mr-1">{getTrendIcon()}</span>
            {trend > 0 && '+'}{Math.abs(trendValue)}%
          </span>
        )}
      </div>
      <div>
        <p className={`font-bold text-white transition-all ${variant === 'large' ? 'text-4xl' : 'text-3xl'}`}>
          {value}
        </p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
      </div>
    </div>
  );
};

/**
 * Inline Stat Card for compact display
 */
export const StatCardInline = ({
  icon: Icon,
  value,
  label,
  className = '',
}) => (
  <div
    className={`bg-slate-800/30 border border-slate-700/30 rounded-lg p-4 hover:bg-slate-800/50 hover:border-slate-700/50 transition-all duration-200 ${className}`}
    role="article"
    aria-label={`Inline stat: ${label}`}
  >
    <div className="flex items-center gap-4">
      {Icon && (
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-amber-500" strokeWidth={2} />
        </div>
      )}
      <div>
        <p className="text-xl font-semibold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  </div>
);

export default StatCard;
